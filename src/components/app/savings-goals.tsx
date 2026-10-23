import { HiOutlinePlus } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface Goal {
    id: string;
    name: string;
    /** Both in the base currency. */
    saved: number;
    target: number;
}

export const SavingsGoals = ({ goals, className }: { goals: Goal[]; className?: string }) => (
    <Card className={cx("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Goals</h2>

            <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-brand-primary"
            >
                <HiOutlinePlus className="size-4" />
                New goal
            </button>
        </div>

        <ul className="flex flex-col gap-4">
            {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));

                return (
                    <li key={goal.id}>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-sm font-medium text-primary">{goal.name}</p>
                            <p className="shrink-0 text-xs text-tertiary">
                                <Amount value={goal.saved} hideSymbol /> / <Amount value={goal.target} hideSymbol />
                            </p>
                        </div>

                        <div className="mt-2 flex items-center gap-2.5">
                            {/* The track is the only "bar"; the fill carries the value. */}
                            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-tertiary">
                                <div style={{ width: `${percent}%` }} className="h-full rounded-full bg-brand-solid" />
                            </div>
                            <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-tertiary">{percent}%</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    </Card>
);
