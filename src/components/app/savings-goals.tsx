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
}

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
                            <p className="shrink-0 text-xs text-tertiary">
                                <Amount value={goal.saved} hideSymbol /> / <Amount value={goal.target} hideSymbol />
                            </p>
                        </div>

                        <Progress value={percent} label={`${percent}%`} className="mt-2" />
                    </li>
                );
            })}
        </ul>
    </Card>
);
