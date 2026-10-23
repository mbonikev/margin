import type { FC } from "react";
import { useMemo } from "react";
import { HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineScale } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export type ActivityKind = "balance" | "expense" | "income";

const kinds: Record<ActivityKind, { icon: FC<{ className?: string }>; chip: string; sign: string; amount: string }> = {
    balance: { icon: HiOutlineScale, chip: "bg-secondary text-tertiary", sign: "", amount: "text-primary" },
    expense: { icon: HiOutlineArrowTrendingDown, chip: "bg-tile-magenta-tint text-tile-magenta-ink", sign: "−", amount: "text-tile-magenta-ink" },
    income: { icon: HiOutlineArrowTrendingUp, chip: "bg-tile-aqua-tint text-tile-aqua-ink", sign: "+", amount: "text-tile-aqua-ink" },
};

export interface Activity {
    id: string;
    kind: ActivityKind;
    name: string;
    account: string;
    /** A real timestamp — the day heading and the time are both derived from it. */
    at: Date;
    /** Amount in the base currency. */
    amount: number;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "short" });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const dayLabel = (date: Date) => {
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return dayFormat.format(date);
};

export const RecentActivity = ({ items, className }: { items: Activity[]; className?: string }) => {
    // Grouped by day: four rows of "2h ago / Yesterday / 2d ago" are harder to
    // place than a heading that says the day once.
    const groups = useMemo(() => {
        const byDay = new Map<string, Activity[]>();

        for (const item of [...items].sort((a, b) => b.at.getTime() - a.at.getTime())) {
            const label = dayLabel(item.at);
            byDay.set(label, [...(byDay.get(label) ?? []), item]);
        }

        return [...byDay.entries()];
    }, [items]);

    return (
        <Card className={cx("flex flex-col gap-3", className)}>
            <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Recent</h2>

            <div className="flex flex-col gap-4">
                {groups.map(([label, entries]) => (
                    <section key={label}>
                        <h3 className="px-2 text-xs font-medium text-quaternary">{label}</h3>

                        <ul className="-mx-2 mt-1 flex flex-col gap-0.5">
                            {entries.map((item) => {
                                const kind = kinds[item.kind];
                                const Icon = kind.icon;

                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className="no-press flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition duration-100 ease-linear hover:bg-secondary"
                                        >
                                            <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-full", kind.chip)}>
                                                <Icon className="size-4.5" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-primary">{item.name}</span>
                                                <span className="block truncate text-xs text-tertiary">
                                                    {item.account} · {timeFormat.format(item.at)}
                                                </span>
                                            </span>

                                            <span className={cx("shrink-0 text-sm font-semibold", kind.amount)}>
                                                {kind.sign}
                                                <Amount value={item.amount} />
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </Card>
    );
};
