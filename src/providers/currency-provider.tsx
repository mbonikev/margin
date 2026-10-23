import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    /** ISO country for the flag. XOF is multi-country, so it borrows Senegal's. */
    country: string;
}

/** Display currencies. Majors plus the East/West African set this launches into. */
export const currencies: Currency[] = [
    { code: "RWF", name: "Rwandan Franc", symbol: "FRw", country: "RW" },
    { code: "USD", name: "US Dollar", symbol: "$", country: "US" },
    { code: "EUR", name: "Euro", symbol: "€", country: "EU" },
    { code: "GBP", name: "British Pound", symbol: "£", country: "GB" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", country: "KE" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "USh", country: "UG" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", country: "TZ" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "NG" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", country: "GH" },
    { code: "ZAR", name: "South African Rand", symbol: "R", country: "ZA" },
    { code: "XOF", name: "West African CFA", symbol: "CFA", country: "SN" },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$", country: "CA" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "AU" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", country: "IN" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", country: "JP" },
];

/** Every amount in the app is stored in this currency and converted for display. */
export const BASE_CURRENCY = "RWF";

const RATES_ENDPOINT = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;
const CODE_KEY = "margin:currency";
const RATES_KEY = "margin:rates";
const STALE_AFTER = 6 * 60 * 60 * 1000;

type RateStatus = "loading" | "ready" | "error";

interface CachedRates {
    rates: Record<string, number>;
    fetchedAt: number;
}

interface CurrencyContextValue {
    currency: Currency;
    setCurrency: (code: string) => void;
    /** Rates expressed as "1 BASE = n <code>". */
    rates: Record<string, number>;
    status: RateStatus;
    /** True until rates are usable — drives the number skeletons. */
    isLoading: boolean;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
    /** Base-currency amount -> display currency. */
    convert: (baseAmount: number) => number;
    /** Converted and grouped. Switches to 1.2M / 3.4B past 7 digits. */
    formatAmount: (baseAmount: number) => string;
    /** Converted, with the currency code appended. */
    formatWithCode: (baseAmount: number) => string;
    /** Always the full figure, never abbreviated — for tooltips and inputs. */
    formatExact: (baseAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const readCache = (): CachedRates | null => {
    try {
        const raw = localStorage.getItem(RATES_KEY);
        return raw ? (JSON.parse(raw) as CachedRates) : null;
    } catch {
        return null;
    }
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [code, setCode] = useState(() => {
        try {
            return localStorage.getItem(CODE_KEY) ?? BASE_CURRENCY;
        } catch {
            return BASE_CURRENCY;
        }
    });

    const [cache, setCache] = useState<CachedRates | null>(readCache);
    const [status, setStatus] = useState<RateStatus>(() => (readCache() ? "ready" : "loading"));

    const currency = useMemo(() => currencies.find((item) => item.code === code) ?? currencies[0], [code]);

    const setCurrency = useCallback((next: string) => {
        setCode(next);
        try {
            localStorage.setItem(CODE_KEY, next);
        } catch {
            /* blocked storage — the choice just won't persist */
        }
    }, []);

    const refresh = useCallback(async () => {
        setStatus("loading");
        try {
            const response = await fetch(RATES_ENDPOINT);
            const payload = await response.json();
            if (payload.result !== "success" || !payload.rates) throw new Error("bad payload");

            const next: CachedRates = { rates: payload.rates, fetchedAt: Date.now() };
            setCache(next);
            setStatus("ready");
            try {
                localStorage.setItem(RATES_KEY, JSON.stringify(next));
            } catch {
                /* over quota — rates just won't survive a reload */
            }
        } catch {
            // Keep showing cached rates if we have them; they beat nothing.
            setStatus(readCache() ? "ready" : "error");
        }
    }, []);

    useEffect(() => {
        const cached = readCache();
        if (!cached || Date.now() - cached.fetchedAt > STALE_AFTER) void refresh();
    }, [refresh]);

    const value = useMemo<CurrencyContextValue>(() => {
        const rates = cache?.rates ?? {};
        const rate = currency.code === BASE_CURRENCY ? 1 : rates[currency.code];
        // The base currency never needs a rate, so it is never in a loading state.
        const isLoading = currency.code !== BASE_CURRENCY && rate === undefined;

        const convert = (baseAmount: number) => baseAmount * (rate ?? 1);
        // Sub-unit currencies get 2 decimals; RWF/UGX and friends get none.
        const fraction = ["USD", "EUR", "GBP", "CAD", "AUD", "GHS", "ZAR"].includes(currency.code) ? 2 : 0;
        const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: fraction });
        const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

        // Past 7 digits a grouped figure is wider than any tile; abbreviate.
        const COMPACT_FROM = 10_000_000;
        const display = (amount: number) => (Math.abs(amount) >= COMPACT_FROM ? compact.format(amount) : plain.format(amount));

        return {
            currency,
            setCurrency,
            rates,
            status,
            isLoading,
            lastUpdated: cache ? new Date(cache.fetchedAt) : null,
            refresh,
            convert,
            formatAmount: (baseAmount) => display(convert(baseAmount)),
            formatWithCode: (baseAmount) => `${display(convert(baseAmount))} ${currency.code}`,
            formatExact: (baseAmount) => `${plain.format(convert(baseAmount))} ${currency.code}`,
        };
    }, [cache, currency, setCurrency, status, refresh]);

    return <CurrencyContext value={value}>{children}</CurrencyContext>;
};

export const useCurrency = () => {
    const ctx = use(CurrencyContext);
    if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
    return ctx;
};
