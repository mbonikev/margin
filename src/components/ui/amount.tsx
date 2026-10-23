import { useCurrency } from "@/providers/currency-provider";
import { usePrivacy } from "@/providers/privacy-provider";
import { cx } from "@/utils/cx";

interface AmountProps {
    /** Amount in the base currency. Converted to the display currency here. */
    value: number;
    /** Append the currency code after the number. */
    withCode?: boolean;
    /** Hide the leading symbol — for lists where the currency is already stated. */
    hideSymbol?: boolean;
    /** Shrink the symbol relative to the figure. Only worth it on display sizes —
     *  at body size a 0.8em symbol is just small and hard to read. */
    compactSymbol?: boolean;
    className?: string;
}

/**
 * Every money figure in the app goes through this, so a rate fetch shows a
 * skeleton rather than a wrong number that silently corrects itself.
 */
export const Amount = ({ value, withCode, hideSymbol, compactSymbol, className }: AmountProps) => {
    const { currency, formatAmount, formatWithCode, formatExact, isLoading } = useCurrency();
    const { hidden, mask } = usePrivacy();

    if (isLoading) {
        // Roughly as wide as the figure will be, so the layout doesn't jump.
        const characters = Math.max(4, String(Math.round(value)).length + (withCode ? 4 : 0));

        return (
            <span
                role="status"
                aria-label="Converting"
                style={{ width: `${characters}ch` }}
                className={cx("inline-block h-[0.8em] animate-pulse rounded-full bg-tertiary align-middle", className)}
            />
        );
    }

    const text = withCode ? formatWithCode(value) : formatAmount(value);

    // Abbreviated figures keep the exact value one hover away — unless hidden.
    return (
        <span title={hidden ? undefined : formatExact(value)} className={cx("tabular-nums", className)}>
            {/* `em` so the symbol scales with whatever size the figure is set at. */}
            {!withCode && !hideSymbol && <span className={cx("mr-[0.22em] align-baseline font-medium opacity-70", compactSymbol && "text-[0.8em]")}>{currency.symbol}</span>}
            {mask(text)}
        </span>
    );
};
