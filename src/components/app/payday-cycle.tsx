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
const SIZE = 120;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** Circumference and dash offset for a ring at the given radius. */
const ring = (radius: number, percent: number) => {
    const circumference = 2 * Math.PI * radius;
    return { r: radius, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - percent / 100) };
};

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

            <div className="flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6">
                <div className="relative shrink-0">
                    {/* Two concentric rings: money inside, time outside. Which one
                        reaches further around is the entire reading. */}
                    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-34 -rotate-90" role="img" aria-label={`${Math.round(burned)}% spent, ${Math.round(elapsed)}% through the cycle`}>
                        <circle cx={SIZE / 2} cy={SIZE / 2} {...ring(52, 100)} className="stroke-bg-tertiary" strokeWidth={10} fill="none" />
                        <circle cx={SIZE / 2} cy={SIZE / 2} {...ring(52, elapsed)} className="stroke-chart-third" strokeWidth={10} fill="none" strokeLinecap="round" />

                        <circle cx={SIZE / 2} cy={SIZE / 2} {...ring(37, 100)} className="stroke-bg-tertiary" strokeWidth={10} fill="none" />
                        <circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            {...ring(37, burned)}
                            className={cx(hot ? "stroke-chart-compare" : "stroke-brand")}
                            strokeWidth={10}
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold tracking-tight tabular-nums text-primary">{daysLeft}</span>
                        <span className="text-[11px] text-tertiary">days left</span>
                    </div>
                </div>

                <ul className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-1">
                    <li className="flex items-center gap-2.5">
                        <span className={cx("size-2.5 shrink-0 rounded-full", hot ? "bg-chart-compare" : "bg-brand")} />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-primary">Spent</span>
                            <span className="block truncate text-[11px] text-tertiary">
                                <Amount value={spent} /> of <Amount value={available} hideSymbol />
                            </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{Math.round(burned)}%</span>
                    </li>

                    <li className="flex items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full bg-chart-third" />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-primary">Cycle elapsed</span>
                            <span className="block truncate text-[11px] text-tertiary">{daysLeft} of {Math.round(span / DAY)} days remain</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{Math.round(elapsed)}%</span>
                    </li>
                </ul>
            </div>

            <p className="text-sm text-secondary">
                {hot ? (
                    <>
                        You're <span className="font-semibold text-primary">{drift}% ahead</span> of where the cycle is. Easing off now keeps payday comfortable.
                    </>
                ) : drift < -5 ? (
                    <>
                        You're <span className="font-semibold text-primary">{Math.abs(drift)}% behind</span> the cycle — comfortably on track.
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
