import { HiOutlinePlus } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { ActionButton } from "@/components/ui/action-button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface Goal {
    id: string;
    name: string;
    /** Both in the base currency. */
    saved: number;
    target: number;
    /** When the goal was opened — "how long have I been at this?". */
    startedAt: Date;
}

const sinceFormat = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });

const elapsed = (from: Date) => {
    const months = Math.max(0, (new Date().getFullYear() - from.getFullYear()) * 12 + new Date().getMonth() - from.getMonth());
    if (months < 1) return "this month";
    if (months === 1) return "1 month in";
    if (months < 12) return `${months} months in`;
    return `${Math.floor(months / 12)}y ${months % 12}m in`;
};

export const SavingsGoals = ({ goals, className }: { goals: Goal[]; className?: string }) => (
    <Card className={cx("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Goals</h2>

<ActionButton icon={HiOutlinePlus}>New goal</ActionButton>
        </div>

        <ul className="flex flex-col gap-4">
            {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));

                return (
                    <li key={goal.id}>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-sm font-medium text-primary">{goal.name}</p>

                            {/* Saved leads, target recedes — they are not equal facts. */}
                            <p className="shrink-0 text-xs text-quaternary">
                                <Amount value={goal.saved} className="font-semibold text-secondary" />
                                <span className="mx-1">of</span>
                                <Amount value={goal.target} hideSymbol />
                            </p>
                        </div>

                        {/* The percentage sits outside the bar: inside, it lands on the
                            fill or the track depending on the value, which reads as a bug. */}
                        <div className="mt-2 flex items-center gap-3">
                            <Progress value={percent} className="min-w-0 flex-1" />
                            <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-primary">{percent}%</span>
                        </div>

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-tertiary">
                            <span>
                                <Amount value={Math.max(0, goal.target - goal.saved)} /> to go
                            </span>
                            <span className="text-quaternary">·</span>
                            <span className="text-quaternary" title={`Started ${sinceFormat.format(goal.startedAt)}`}>
                                {elapsed(goal.startedAt)}
                            </span>
                        </p>
                    </li>
                );
            })}
        </ul>
    </Card>
);
