import { useCurrency } from "@/providers/currency-provider";
import { usePrivacy } from "@/providers/privacy-provider";
import { cx } from "@/utils/cx";

interface AmountProps {
    /** Amount in the base currency. Converted to the display currency here. */
    value: number;
    /** Append the currency code after the number. */
    withCode?: boolean;
    className?: string;
}

/**
 * Every money figure in the app goes through this, so a rate fetch shows a
 * skeleton rather than a wrong number that silently corrects itself.
 */
export const Amount = ({ value, withCode, className }: AmountProps) => {
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
            {!withCode && <span className="mr-0.5 align-baseline text-[0.68em] font-medium text-tertiary">{currency.symbol}</span>}
            {mask(text)}
        </span>
    );
};
