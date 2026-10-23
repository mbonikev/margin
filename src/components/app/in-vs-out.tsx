import { useState } from "react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface MonthFlow {
    /** First of the month — the label is derived, never stored. */
    month: Date;
    /** Both in the base currency. */
    in: number;
    out: number;
}

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short" });

export const InVsOut = ({ months, className }: { months: MonthFlow[]; className?: string }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const peak = Math.max(...months.flatMap((entry) => [entry.in, entry.out]), 1);
    const net = months.reduce((total, entry) => total + entry.in - entry.out, 0);
    const active = hovered === null ? null : months[hovered];

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">In vs out</h2>
                <p className="text-xs text-tertiary">
                    Net{" "}
                    <span className={cx("font-semibold", net >= 0 ? "text-tile-aqua-ink" : "text-tile-magenta-ink")}>
                        {net >= 0 ? "+" : "−"}
                        <Amount value={Math.abs(net)} hideSymbol />
                    </span>{" "}
                    over {months.length} months
                </p>
            </div>

            {/* Two series, so a legend is always present — identity is never colour alone. */}
            <div className="flex items-center gap-4 text-xs text-tertiary">
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-tile-aqua" />
                    Money in
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-tile-yellow" />
                    Money out
                </span>
            </div>

            <div className="relative min-h-0 flex-1">
                {active && (
                    <div
                        style={{ left: `${((hovered! + 0.5) / months.length) * 100}%` }}
                        className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-2xl bg-primary-solid px-3 py-2 text-[11px] leading-tight whitespace-nowrap text-white shadow-lg"
                    >
                        <p className="font-semibold">{monthFormat.format(active.month)}</p>
                        <p className="mt-1 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-tile-aqua" />
                            <Amount value={active.in} hideSymbol />
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-tile-yellow" />
                            <Amount value={active.out} hideSymbol />
                        </p>
                    </div>
                )}

                <div className="flex h-full min-h-32 items-end gap-1" onMouseLeave={() => setHovered(null)}>
                    {months.map((entry, index) => (
                        <div
                            key={entry.month.toISOString()}
                            onMouseEnter={() => setHovered(index)}
                            className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center gap-0.5"
                        >
                            {/* 4px rounded cap, square at the baseline, capped width so
                                wide cards get air rather than fat bars. */}
                            <div
                                style={{ height: `${Math.max(2, (entry.in / peak) * 100)}%` }}
                                className={cx("w-full max-w-5 rounded-t-md bg-tile-aqua transition-opacity duration-100", hovered !== null && hovered !== index && "opacity-40")}
                            />
                            <div
                                style={{ height: `${Math.max(2, (entry.out / peak) * 100)}%` }}
                                className={cx("w-full max-w-5 rounded-t-md bg-tile-yellow transition-opacity duration-100", hovered !== null && hovered !== index && "opacity-40")}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-1">
                {months.map((entry, index) => (
                    <span
                        key={entry.month.toISOString()}
                        className={cx("min-w-0 flex-1 truncate text-center text-[11px]", index === hovered ? "font-medium text-tertiary" : "text-quaternary")}
                    >
                        {monthFormat.format(entry.month)}
                    </span>
                ))}
            </div>
        </Card>
    );
};
