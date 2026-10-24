/**
 * Every piece of app-wide state, in one file: theme, preferences, privacy,
 * currency and accounts. They are small, they all follow the same
 * context-plus-localStorage shape, and several read each other.
 */

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Account } from "@/components/accounts";

/* ── theme-provider.tsx ── */

export type ThemeMode = "light" | "dark" | "system";

export interface AccentColor {
    id: string;
    label: string;
    hex: string;
}

/** Accent options. Each one re-derives the whole brand ramp via color-mix. */
export const accentColors: AccentColor[] = [
    { id: "green", label: "Green", hex: "#449c63" },
    { id: "teal", label: "Teal", hex: "#0f9b8e" },
    { id: "sky", label: "Sky", hex: "#2f8fd6" },
    { id: "indigo", label: "Indigo", hex: "#5a6ee0" },
    { id: "violet", label: "Violet", hex: "#8158d6" },
    { id: "plum", label: "Plum", hex: "#a84fc4" },
    { id: "rose", label: "Rose", hex: "#d6457e" },
    { id: "coral", label: "Coral", hex: "#e0613f" },
    { id: "slate", label: "Slate", hex: "#5b6670" },
];

const MODE_KEY = "margin:theme-mode";
const ACCENT_KEY = "margin:accent";

interface ThemeContextValue {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    accent: AccentColor;
    setAccent: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readSetting = (key: string, fallback: string) => {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
};

const writeSetting = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* private mode, blocked storage — ignore */
    }
};

/**
 * Flipping the theme repaints hundreds of colours at once. Anything carrying a
 * CSS transition would animate that repaint and visibly lag behind the rest of
 * the page, so transitions are suppressed for one frame while it happens.
 */
const withoutTransitions = (mutate: () => void) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    mutate();
    // Two frames: one to flush the style change, one to let it paint.
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setModeState] = useState<ThemeMode>(() => readSetting(MODE_KEY, "system") as ThemeMode);
    const [accentId, setAccentId] = useState<string>(() => readSetting(ACCENT_KEY, "green"));

    const accent = useMemo(() => accentColors.find((c) => c.id === accentId) ?? accentColors[0], [accentId]);

    // Apply light/dark, following the OS when mode is "system".
    useEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            const isDark = mode === "dark" || (mode === "system" && query.matches);
            // `color-scheme` rides on the class via CSS — see globals.css.
            withoutTransitions(() => document.documentElement.classList.toggle("dark-mode", isDark));
        };

        apply();
        query.addEventListener("change", apply);
        return () => query.removeEventListener("change", apply);
    }, [mode]);

    // One variable drives every brand tint, hover and border in the app.
    useEffect(() => {
        withoutTransitions(() => {
            document.documentElement.style.setProperty("--color-brand", accent.hex);
            document.documentElement.style.setProperty("--color-focus", accent.hex);
        });
    }, [accent]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        writeSetting(MODE_KEY, next);
    }, []);

    const setAccent = useCallback((id: string) => {
        setAccentId(id);
        writeSetting(ACCENT_KEY, id);
    }, []);

    const value = useMemo(() => ({ mode, setMode, accent, setAccent }), [mode, setMode, accent, setAccent]);

    return <ThemeContext value={value}>{children}</ThemeContext>;
};

export const useTheme = () => {
    const ctx = use(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
    return ctx;
};

/* ── preferences-provider.tsx ── */

const PREFERENCES_KEY = "margin:preferences";

export type Density = "compact" | "comfortable" | "roomy";
export type TextSize = "small" | "default" | "large";
export type Rounding = "exact" | "hundred" | "thousand";
export type WeekStart = "monday" | "sunday";

/**
 * Every tweak the app offers, in one flat record. Flat because it serialises to
 * a single localStorage entry and merges cleanly over the defaults — a nested
 * shape would need a migration the first time a section gains a key.
 */
export interface Preferences {
    // Appearance
    density: Density;
    textSize: TextSize;
    reduceMotion: boolean;
    cardSheen: boolean;
    showCardRef: boolean;

    // Money
    rounding: Rounding;
    showCurrencyCode: boolean;
    weekStart: WeekStart;
    payday: number;
    lowBalance: number;
    staleAfterDays: number;

    // Dashboard sections
    showStatTiles: boolean;
    showAccountHero: boolean;
    showUpcoming: boolean;
    showInVsOut: boolean;
    showGoals: boolean;
    showActivity: boolean;

    // Privacy
    privateByDefault: boolean;
    hideOnBlur: boolean;
    confirmDelete: boolean;

    // Notifications
    notifyStale: boolean;
    notifyBills: boolean;
    notifyGoals: boolean;
    showUnreadBadge: boolean;
}

export const defaultPreferences: Preferences = {
    density: "comfortable",
    textSize: "default",
    reduceMotion: false,
    cardSheen: true,
    showCardRef: true,

    rounding: "exact",
    showCurrencyCode: false,
    weekStart: "monday",
    payday: 28,
    lowBalance: 20000,
    staleAfterDays: 3,

    showStatTiles: true,
    showAccountHero: true,
    showUpcoming: true,
    showInVsOut: true,
    showGoals: true,
    showActivity: true,

    privateByDefault: false,
    hideOnBlur: false,
    confirmDelete: true,

    notifyStale: true,
    notifyBills: true,
    notifyGoals: true,
    showUnreadBadge: true,
};

interface PreferencesContextValue {
    preferences: Preferences;
    /** Writes one key. Typed so a bad value can't reach storage. */
    set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
    reset: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const readPreferences = (): Preferences => {
    try {
        const raw = localStorage.getItem(PREFERENCES_KEY);
        // Spread over the defaults: a stored record written by an older build is
        // missing whatever keys have been added since.
        return raw ? { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) } : defaultPreferences;
    } catch {
        return defaultPreferences;
    }
};

const rootFontSize: Record<TextSize, string> = {
    small: "15px",
    default: "16px",
    large: "17.5px",
};

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
    const [preferences, setPreferences] = useState<Preferences>(readPreferences);

    // Scaling the root size scales the whole layout with it — every size in the
    // app is rem-derived, so this is the one honest "make it bigger" control.
    useEffect(() => {
        document.documentElement.style.fontSize = rootFontSize[preferences.textSize];
    }, [preferences.textSize]);

    const set = useCallback<PreferencesContextValue["set"]>((key, value) => {
        setPreferences((previous) => {
            const next = { ...previous, [key]: value };
            try {
                localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
            } catch {
                /* blocked storage — the choice just won't persist */
            }
            return next;
        });
    }, []);

    const reset = useCallback(() => {
        setPreferences(defaultPreferences);
        try {
            localStorage.removeItem(PREFERENCES_KEY);
        } catch {
            /* nothing to clear */
        }
    }, []);

    const value = useMemo(() => ({ preferences, set, reset }), [preferences, set, reset]);

    return <PreferencesContext value={value}>{children}</PreferencesContext>;
};

export const usePreferences = () => {
    const ctx = use(PreferencesContext);
    if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
    return ctx;
};

/* ── privacy-provider.tsx ── */

const PRIVACY_KEY = "margin:privacy";

interface PrivacyContextValue {
    hidden: boolean;
    toggle: () => void;
    /** Replaces a figure with stars of the same length, so nothing reflows. */
    mask: (text: string) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

/** Read straight from storage: the provider needs it before its first render. */
const readStartHidden = () => {
    try {
        return JSON.parse(localStorage.getItem("margin:preferences") ?? "{}").privateByDefault === true;
    } catch {
        return false;
    }
};

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
    const { preferences } = usePreferences();

    const [hidden, setHidden] = useState(() => {
        try {
            // "Start hidden" wins on first paint; after that the session's own
            // choice is what the stored flag records.
            return readStartHidden() || localStorage.getItem(PRIVACY_KEY) === "1";
        } catch {
            return false;
        }
    });

    // Masking on blur is the point of the setting — it has to happen while the
    // tab is already in the background, so it listens rather than reacts.
    useEffect(() => {
        if (!preferences.hideOnBlur) return;

        const hide = () => setHidden(true);
        const onVisibility = () => {
            if (document.visibilityState === "hidden") hide();
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("blur", hide);
        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("blur", hide);
        };
    }, [preferences.hideOnBlur]);

    const toggle = useCallback(() => {
        setHidden((previous) => {
            const next = !previous;
            try {
                localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
            } catch {
                /* blocked storage — the choice just won't persist */
            }
            return next;
        });
    }, []);

    const value = useMemo<PrivacyContextValue>(
        () => ({
            hidden,
            toggle,
            mask: (text: string) => (hidden ? "*".repeat(Math.min(text.length, 12)) : text),
        }),
        [hidden, toggle],
    );

    return <PrivacyContext value={value}>{children}</PrivacyContext>;
};

export const usePrivacy = () => {
    const ctx = use(PrivacyContext);
    if (!ctx) throw new Error("usePrivacy must be used inside <PrivacyProvider>");
    return ctx;
};

/* ── currency-provider.tsx ── */

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
    formatAmount: (baseAmount: number, compactFrom?: number) => string;
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

        // Past 7 digits a grouped figure is wider than the page; abbreviate. Tight
        // spots — stat tiles, list rows — pass a lower bar of their own.
        const COMPACT_FROM = 10_000_000;
        const display = (amount: number, compactFrom = COMPACT_FROM) => (Math.abs(amount) >= compactFrom ? compact.format(amount) : plain.format(amount));

        return {
            currency,
            setCurrency,
            rates,
            status,
            isLoading,
            lastUpdated: cache ? new Date(cache.fetchedAt) : null,
            refresh,
            convert,
            formatAmount: (baseAmount, compactFrom) => display(convert(baseAmount), compactFrom),
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

/* ── accounts-provider.tsx ── */

const TRASH_KEY = "margin:trash";

/** Account id → when it went to the trash, as epoch ms. */
type Trash = Record<string, number>;

export interface TrashedAccount extends Account {
    deletedAt: number;
}

interface AccountsContextValue {
    /** Everything not in the trash — what totals and the card grid are built from. */
    accounts: Account[];
    /** Most recently deleted first, so the thing you just removed is at the top. */
    trashed: TrashedAccount[];
    remove: (id: string) => void;
    restore: (id: string) => void;
    /** Permanent. Only reachable from the trash, behind a confirm. */
    purge: (id: string) => void;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

const readTrash = (): Trash => {
    try {
        const raw = localStorage.getItem(TRASH_KEY);
        return raw ? (JSON.parse(raw) as Trash) : {};
    } catch {
        return {};
    }
};

const writeTrash = (trash: Trash) => {
    try {
        localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    } catch {
        /* blocked storage — the trash just won't survive a reload */
    }
};

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
    const [all, setAll] = useState<Account[]>(seedAccounts);
    const [trash, setTrash] = useState<Trash>(readTrash);

    const update = useCallback((next: (previous: Trash) => Trash) => {
        setTrash((previous) => {
            const value = next(previous);
            writeTrash(value);
            return value;
        });
    }, []);

    const remove = useCallback((id: string) => update((previous) => ({ ...previous, [id]: Date.now() })), [update]);

    const restore = useCallback(
        (id: string) =>
            update((previous) => {
                const rest = { ...previous };
                delete rest[id];
                return rest;
            }),
        [update],
    );

    const purge = useCallback(
        (id: string) => {
            setAll((previous) => previous.filter((account) => account.id !== id));
            restore(id); // drop the tombstone too, or it would outlive the account
        },
        [restore],
    );

    const value = useMemo<AccountsContextValue>(
        () => ({
            accounts: all.filter((account) => !(account.id in trash)),
            trashed: all
                .filter((account) => account.id in trash)
                .map((account) => ({ ...account, deletedAt: trash[account.id] }))
                .sort((a, b) => b.deletedAt - a.deletedAt),
            remove,
            restore,
            purge,
        }),
        [all, trash, remove, restore, purge],
    );

    return <AccountsContext value={value}>{children}</AccountsContext>;
};

export const useAccounts = () => {
    const ctx = use(AccountsContext);
    if (!ctx) throw new Error("useAccounts must be used inside <AccountsProvider>");
    return ctx;
};

/* ── accounts.ts ── */

/** Placeholder accounts — the starting point the accounts provider loads. */
export const seedAccounts: Account[] = [
    { id: "momo", name: "MTN MoMo", kind: "Mobile money", balance: 684000, updated: "Updated today", theme: "blue" },
    { id: "equity", name: "Equity Bank", kind: "Current", balance: 612000, updated: "Updated 2d ago", theme: "graphite" },
    { id: "savings", name: "Laptop fund", kind: "Savings", balance: 168000, updated: "Updated 5d ago", theme: "emerald" },
    { id: "cash", name: "Cash", kind: "Wallet", balance: 4000, updated: "Updated today", theme: "plum" },
];
