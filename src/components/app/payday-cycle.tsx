import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface PaydayCycleProps {
    /** Start of the current pay cycle, and the next payday. */
    cycleStart: Date;
    nextPayday: Date;
    /** Both in the base currency. */
    available: number;
    spent: number;
    className?: string;
}

const DAY = 86_400_000;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export const PaydayCycle = ({ cycleStart, nextPayday, available, spent, className }: PaydayCycleProps) => {
    const span = Math.max(1, nextPayday.getTime() - cycleStart.getTime());
    const elapsed = clamp(((Date.now() - cycleStart.getTime()) / span) * 100);
    const burned = clamp((spent / Math.max(1, available)) * 100);
    const daysLeft = Math.max(0, Math.ceil((nextPayday.getTime() - Date.now()) / DAY));

    // Spending ahead of time is the whole point of the card.
    const drift = Math.round(burned - elapsed);
    const hot = drift > 5;

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Payday cycle</h2>
                <p className="text-xs text-tertiary">
                    <span className="font-semibold text-primary">{daysLeft}</span> {daysLeft === 1 ? "day" : "days"} to go
                </p>
            </div>

            <div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-tertiary">
                    <div
                        style={{ width: `${burned}%` }}
                        className={cx("h-full rounded-full transition-[width] duration-500 ease-out", hot ? "bg-chart-compare" : "bg-brand")}
                    />

                    {/* Where the month actually is — the fill should not be past it. */}
                    <span style={{ left: `${elapsed}%` }} className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-primary-solid" />
                </div>

                <div className="mt-2 flex items-start justify-between gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-tertiary">
                        <span className={cx("size-2 rounded-full", hot ? "bg-chart-compare" : "bg-brand")} />
                        Spent <Amount value={spent} className="font-semibold text-secondary" /> of <Amount value={available} hideSymbol />
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5 text-tertiary">
                        <span className="h-2.5 w-0.5 rounded-full bg-primary-solid" />
                        {Math.round(elapsed)}% through
                    </span>
                </div>
            </div>

            <p className="mt-auto text-sm text-secondary">
                {hot ? (
                    <>
                        You're <span className="font-semibold text-primary">{drift}% ahead</span> of where the month is. Easing off now keeps payday comfortable.
                    </>
                ) : drift < -5 ? (
                    <>
                        You're <span className="font-semibold text-primary">{Math.abs(drift)}% behind</span> the month — comfortably on track.
                    </>
                ) : (
                    <>
                        You're spending <span className="font-semibold text-primary">right on pace</span> for this cycle.
                    </>
                )}
            </p>
        </Card>
    );
};
