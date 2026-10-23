import { HiArrowPath, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { Button } from "@/components/base/buttons/button";
import { Flag } from "@/components/ui/flag";
import { BASE_CURRENCY, currencies, useCurrency } from "@/providers/currency-provider";
import { cx } from "@/utils/cx";

const relative = (date: Date) => {
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

export const CurrencySettings = () => {
    const { currency, setCurrency, rates, status, lastUpdated, refresh } = useCurrency();

    return (
        <div className="flex flex-col gap-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-md font-semibold text-primary">Currency</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        Balances are held in {BASE_CURRENCY} and converted for display.{" "}
                        {lastUpdated ? `Rates updated ${relative(lastUpdated)}.` : "Rates not loaded yet."}
                    </p>
                </div>

                <Button color="secondary" size="sm" iconLeading={HiArrowPath} onClick={() => void refresh()} isDisabled={status === "loading"} className="h-9 rounded-full">
                    {status === "loading" ? "Refreshing…" : "Refresh rates"}
                </Button>
            </header>

            {status === "error" && (
                <p className="flex items-center gap-2 rounded-2xl bg-warning-primary px-4 py-3 text-sm text-warning-primary">
                    <HiOutlineExclamationTriangle className="size-5 shrink-0" />
                    Couldn't reach the rate service. Amounts stay in {BASE_CURRENCY} until it's back.
                </p>
            )}

            <ul className="flex flex-col gap-1">
                {currencies.map((item) => {
                    const isActive = item.code === currency.code;
                    const rate = item.code === BASE_CURRENCY ? 1 : rates[item.code];

                    return (
                        <li key={item.code}>
                            <button
                                type="button"
                                onClick={() => setCurrency(item.code)}
                                aria-pressed={isActive}
                                className={cx(
                                    "no-press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition duration-100 ease-linear",
                                    isActive ? "bg-brand-primary" : "hover:bg-secondary",
                                )}
                            >
                                <Flag country={item.country} className="size-7" />

                                <span className="min-w-0 flex-1">
                                    <span className={cx("block text-sm font-medium", isActive ? "text-brand-secondary" : "text-primary")}>{item.code}</span>
                                    <span className="block truncate text-xs text-tertiary">{item.name}</span>
                                </span>

                                <span className="shrink-0 text-right text-xs tabular-nums text-tertiary">
                                    {rate === undefined ? (
                                        <span className="inline-block h-3 w-16 animate-pulse rounded-full bg-tertiary" />
                                    ) : (
                                        <>
                                            1 {BASE_CURRENCY} = {rate.toLocaleString(undefined, { maximumSignificantDigits: 4 })} {item.code}
                                        </>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <p className="text-xs text-quaternary">Rates from exchangerate-api.com, cached locally and refreshed every 6 hours.</p>
        </div>
    );
};
