import { HiOutlineArrowRight } from "react-icons/hi2";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

/** How comfortably the balance covers this one. */
export type Pressure = "ok" | "tight" | "over";

/** Most rows stay neutral on purpose — only the ones that need attention carry colour. */
const pressureChip: Record<Pressure, string> = {
    ok: "bg-brand-primary text-brand-secondary",
    tight: "bg-tile-yellow-tint text-tile-yellow-ink",
    over: "bg-tile-magenta-tint text-tile-magenta-ink",
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
                            className="no-press flex w-full items-center gap-2.5 rounded-full px-2 py-2 text-left transition duration-100 ease-linear hover:bg-secondary"
                        >
                            {/* Fixed width so the dates form a clean column. */}
                            <span className={cx("w-16 shrink-0 rounded-full py-1 text-center text-[11px] font-medium", pressureChip[item.pressure])}>{item.due}</span>

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
