import { HiOutlineArrowRight } from "react-icons/hi2";
import { Amount } from "@/components/base/amount/amount";
import { Card } from "@/components/base/card/card";
import { cx } from "@/utils/cx";

/** How comfortably the balance covers this one. */
export type Pressure = "ok" | "tight" | "over";

const pressureDot: Record<Pressure, string> = {
    ok: "bg-tile-aqua",
    tight: "bg-tile-yellow",
    over: "bg-tile-magenta",
};

export interface Commitment {
    id: string;
    name: string;
    /** "Today", "Tomorrow", "Fri 31" — already humanised. */
    due: string;
    /** Amount in the base currency. */
    amount: number;
    pressure: Pressure;
}

export const UpcomingList = ({ items, className }: { items: Commitment[]; className?: string }) => (
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

        <ul className="-mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto">
            {items.map((item) => (
                <li key={item.id}>
                    <button
                        type="button"
                        className="no-press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", pressureDot[item.pressure])} />

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-primary">{item.name}</span>
                            <span className="block truncate text-xs text-tertiary">{item.due}</span>
                        </span>

                        <Amount value={item.amount} className="shrink-0 text-sm font-semibold text-primary" />
                    </button>
                </li>
            ))}
        </ul>

        <p className="text-xs text-quaternary">
            <span className="font-medium text-tertiary">
                <Amount value={items.reduce((total, item) => total + item.amount, 0)} />
            </span>{" "}
            due in the next 30 days
        </p>
    </Card>
);
