import { HiOutlineArrowRight } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

/** How comfortably the balance covers this one. */
export type Pressure = "ok" | "tight" | "over";

export interface Commitment {
    id: string;
    name: string;
    /** A real date, so the tile can render it and the list can sort by it. */
    due: Date;
    /** Amount in the base currency. */
    amount: number;
    pressure: Pressure;
}

const dayFormat = new Intl.DateTimeFormat(undefined, { day: "numeric" });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short" });

export const UpcomingList = ({ items, className }: { items: Commitment[]; className?: string }) => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card className={cx("flex flex-col gap-3", className)}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Upcoming</h2>

                <button
                    type="button"
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-brand-primary"
                >
                    View all
                    <HiOutlineArrowRight className="size-4" />
                </button>
            </div>

            <ul className="-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                {items.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className="no-press flex w-full items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left transition duration-100 ease-linear hover:bg-secondary"
                        >
                            {/* A calendar tile reads faster down a column than a row of pills. */}
                            <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-primary leading-none text-brand-secondary">
                                <span className="text-sm font-semibold">{dayFormat.format(item.due)}</span>
                                <span className="mt-0.5 text-[9px] font-medium uppercase opacity-70">{monthFormat.format(item.due)}</span>
                            </span>

                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{item.name}</span>

                            <Amount value={item.amount} className="shrink-0 text-sm font-semibold text-primary" />
                        </button>
                    </li>
                ))}
            </ul>

            <div className="flex items-baseline justify-between gap-2 pt-1">
                <p className="text-xs text-tertiary">Next 30 days</p>
<Amount value={total} className="text-base font-semibold text-primary" />
            </div>
        </Card>
    );
};
