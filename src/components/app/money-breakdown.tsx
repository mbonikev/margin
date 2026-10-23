import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface Slice {
    id: string;
    label: string;
    note: string;
    /** Amount in the base currency. */
    amount: number;
    /** Bar colour and matching legend dot. */
    tone: "spendable" | "committed" | "goals";
}

const tones = {
    spendable: { bar: "bg-brand", dot: "bg-brand" },
    committed: { bar: "bg-chart-compare", dot: "bg-chart-compare" },
    goals: { bar: "bg-chart-third", dot: "bg-chart-third" },
};

export const MoneyBreakdown = ({ slices, className }: { slices: Slice[]; className?: string }) => {
    const total = slices.reduce((sum, slice) => sum + slice.amount, 0) || 1;

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Where it sits</h2>
                <p className="text-xs text-tertiary">
                    of <Amount value={total} className="font-semibold text-secondary" />
                </p>
            </div>

            {/* 2px surface gaps do the separating between segments — no strokes. */}
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
                {slices.map((slice) => (
                    <div key={slice.id} style={{ width: `${(slice.amount / total) * 100}%` }} className={cx("h-full first:rounded-l-full last:rounded-r-full", tones[slice.tone].bar)} />
                ))}
            </div>

            <ul className="flex flex-col gap-2.5">
                {slices.map((slice) => (
                    <li key={slice.id} className="flex items-center gap-2.5">
                        <span className={cx("size-2.5 shrink-0 rounded-full", tones[slice.tone].dot)} />

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-primary">{slice.label}</span>
                            <span className="block truncate text-[11px] text-tertiary">{slice.note}</span>
                        </span>

                        <span className="shrink-0 text-right">
                            <Amount value={slice.amount} className="block text-sm font-semibold text-primary" />
                            <span className="block text-[11px] tabular-nums text-quaternary">{Math.round((slice.amount / total) * 100)}%</span>
                        </span>
                    </li>
                ))}
            </ul>
        </Card>
    );
};
