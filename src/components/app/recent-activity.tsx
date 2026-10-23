import type { FC } from "react";
import { HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineScale } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export type ActivityKind = "balance" | "expense" | "income";

const kinds: Record<ActivityKind, { icon: FC<{ className?: string }>; tone: string; sign: string }> = {
    balance: { icon: HiOutlineScale, tone: "bg-secondary text-tertiary", sign: "" },
    expense: { icon: HiOutlineArrowTrendingDown, tone: "bg-tile-magenta-tint text-tile-magenta-ink", sign: "−" },
    income: { icon: HiOutlineArrowTrendingUp, tone: "bg-tile-aqua-tint text-tile-aqua-ink", sign: "+" },
};

export interface Activity {
    id: string;
    kind: ActivityKind;
    name: string;
    account: string;
    when: string;
    /** Amount in the base currency. */
    amount: number;
}

export const RecentActivity = ({ items, className }: { items: Activity[]; className?: string }) => (
    <Card className={cx("flex flex-col gap-3", className)}>
        <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Recent</h2>

        <ul className="-mx-2 flex flex-col gap-0.5">
            {items.map((item) => {
                const kind = kinds[item.kind];
                const Icon = kind.icon;

                return (
                    <li key={item.id}>
                        <button
                            type="button"
                            className="no-press flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-full", kind.tone)}>
                                <Icon className="size-4.5" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-primary">{item.name}</span>
                                <span className="block truncate text-xs text-tertiary">
                                    {item.account} · {item.when}
                                </span>
                            </span>

                            <span className="shrink-0 text-sm font-semibold text-primary">
                                {kind.sign}
                                <Amount value={item.amount} hideSymbol />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    </Card>
);
