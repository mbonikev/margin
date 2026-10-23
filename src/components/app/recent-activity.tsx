import type { FC } from "react";
import { HiOutlineArrowRight, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineScale } from "react-icons/hi2";
import { ActionButton } from "@/components/ui/action-button";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export type ActivityKind = "balance" | "expense" | "income";

const kinds: Record<ActivityKind, { icon: FC<{ className?: string }>; chip: string; sign: string; amount: string; label: string }> = {
    balance: { icon: HiOutlineScale, chip: "bg-secondary text-tertiary", sign: "", amount: "text-primary", label: "Balance" },
    expense: { icon: HiOutlineArrowTrendingDown, chip: "bg-tile-magenta-tint text-tile-magenta-ink", sign: "−", amount: "text-tile-magenta-ink", label: "Expense" },
    income: { icon: HiOutlineArrowTrendingUp, chip: "bg-tile-aqua-tint text-tile-aqua-ink", sign: "+", amount: "text-tile-aqua-ink", label: "Income" },
};

export interface Activity {
    id: string;
    kind: ActivityKind;
    name: string;
    account: string;
    /** Free note the user attached when recording it. */
    note?: string;
    /** That account's balance immediately after this entry, in the base currency. */
    balanceAfter?: number;
    /** A real timestamp — every column below is derived from it. */
    at: Date;
    /** Amount in the base currency. */
    amount: number;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const whenLabel = (date: Date) => {
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return dateFormat.format(date);
};

export const RecentActivity = ({ items, className }: { items: Activity[]; className?: string }) => {
    const rows = [...items].sort((a, b) => b.at.getTime() - a.at.getTime());

    return (
        <Card className={cx("flex flex-col gap-3", className)}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Recent</h2>
                <ActionButton icon={HiOutlineArrowRight}>View all</ActionButton>
            </div>

            <div className="-mx-2 overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-left">
                    <thead>
                        <tr className="text-xs font-medium text-quaternary">
                            <th scope="col" className="px-2.5 pb-2.5 font-medium">
                                Activity
                            </th>
                            <th scope="col" className="hidden px-2.5 pb-2.5 font-medium sm:table-cell">
                                Type
                            </th>
                            <th scope="col" className="hidden px-2.5 pb-2.5 font-medium md:table-cell">
                                Account
                            </th>
                            <th scope="col" className="hidden px-2.5 pb-2.5 font-medium xl:table-cell">
                                Note
                            </th>
                            <th scope="col" className="px-2.5 pb-2.5 font-medium">
                                When
                            </th>
                            <th scope="col" className="hidden px-2.5 pb-2.5 text-right font-medium lg:table-cell">
                                Balance after
                            </th>
                            <th scope="col" className="px-2.5 pb-2.5 text-right font-medium">
                                Amount
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((item) => {
                            const kind = kinds[item.kind];
                            const Icon = kind.icon;

                            return (
                                <tr key={item.id} className="group cursor-default">
                                    <td className="rounded-l-xl px-2.5 py-2.5 transition duration-100 ease-linear group-hover:bg-secondary">
                                        <div className="flex items-center gap-3">
                                            <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-full", kind.chip)}>
                                                <Icon className="size-4.5" />
                                            </span>
                                            <span className="truncate text-sm font-medium text-primary">{item.name}</span>
                                        </div>
                                    </td>

                                    <td className="hidden px-2.5 py-2.5 text-sm text-tertiary transition duration-100 ease-linear group-hover:bg-secondary sm:table-cell">
                                        {kind.label}
                                    </td>

                                    <td className="hidden px-2.5 py-2.5 text-sm text-tertiary transition duration-100 ease-linear group-hover:bg-secondary md:table-cell">
                                        {item.account}
                                    </td>

                                    <td className="hidden max-w-48 truncate px-2.5 py-2.5 text-sm text-quaternary transition duration-100 ease-linear group-hover:bg-secondary xl:table-cell">
                                        {item.note ?? "—"}
                                    </td>

                                    <td className="px-2.5 py-2.5 text-sm whitespace-nowrap text-tertiary transition duration-100 ease-linear group-hover:bg-secondary">
                                        {whenLabel(item.at)} · {timeFormat.format(item.at)}
                                    </td>

                                    <td className="hidden px-2.5 py-2.5 text-right text-sm whitespace-nowrap text-tertiary transition duration-100 ease-linear group-hover:bg-secondary lg:table-cell">
                                        {item.balanceAfter === undefined ? "—" : <Amount value={item.balanceAfter} hideSymbol />}
                                    </td>

                                    <td className={cx("rounded-r-xl px-2.5 py-2.5 text-right text-sm font-semibold whitespace-nowrap transition duration-100 ease-linear group-hover:bg-secondary", kind.amount)}>
                                        {kind.sign}
                                        <Amount value={item.amount} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
