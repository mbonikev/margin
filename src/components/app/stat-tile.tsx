import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HiArrowDown, HiArrowUp } from "react-icons/hi2";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export type TileTone = "aqua" | "blue" | "yellow" | "magenta";

const tones: Record<TileTone, { bar: string; soft: string; pill: string }> = {
    aqua: { bar: "bg-tile-aqua", soft: "bg-tile-aqua-soft", pill: "bg-tile-aqua-tint text-tile-aqua-ink" },
    blue: { bar: "bg-tile-blue", soft: "bg-tile-blue-soft", pill: "bg-tile-blue-tint text-tile-blue-ink" },
    yellow: { bar: "bg-tile-yellow", soft: "bg-tile-yellow-soft", pill: "bg-tile-yellow-tint text-tile-yellow-ink" },
    magenta: { bar: "bg-tile-magenta", soft: "bg-tile-magenta-soft", pill: "bg-tile-magenta-tint text-tile-magenta-ink" },
};

export type TilePeriod = "days" | "months";

/** Short names for the last `count` periods, ending today, in the viewer's locale. */
const recentLabels = (count: number, period: TilePeriod) => {
    const format = new Intl.DateTimeFormat(undefined, period === "days" ? { weekday: "short" } : { month: "short" });

    return Array.from({ length: count }, (_, index) => {
        const date = new Date();
        const stepsBack = count - 1 - index;

        if (period === "days") {
            date.setDate(date.getDate() - stepsBack);
        } else {
            // Pin to the 1st first, or stepping back from a 31st skips short months.
            date.setDate(1);
            date.setMonth(date.getMonth() - stepsBack);
        }

        return format.format(date);
    });
};

export interface StatTileProps {
    label: string;
    value: ReactNode;
    /** Signed change. The arrow carries the direction, so no "up"/"down" wording. */
    delta?: number;
    /** Appended to the delta, e.g. "%". */
    deltaSuffix?: string;
    tone: TileTone;
    /** One value per bar, any scale — normalised internally. */
    bars: number[];
    /** Which bar is "now". Defaults to the last. */
    activeIndex?: number;
    /** Adds Mon/Tue… or Jan/Feb… under each bar. Omit for a bare sparkline. */
    period?: TilePeriod;
    /** How a bar's value reads in the tooltip. Defaults to a grouped number. */
    formatBar?: (value: number) => string;
    className?: string;
}

export const StatTile = ({ label, value, delta, deltaSuffix = "", tone, bars, activeIndex, period, formatBar, className }: StatTileProps) => {
    const palette = tones[tone];
    const active = activeIndex ?? bars.length - 1;
    const peak = Math.max(...bars, 1);
    const isUp = (delta ?? 0) >= 0;
    const ticks = useMemo(() => (period ? recentLabels(bars.length, period) : null), [period, bars.length]);
    const Arrow = isUp ? HiArrowUp : HiArrowDown;
    const [hovered, setHovered] = useState<number | null>(null);
    const format = formatBar ?? ((value: number) => value.toLocaleString());

    return (
        <Card className={cx("flex flex-col justify-between gap-3", className)}>
            <div>
                {/* The delta rides the label row, not the figure's. Beside the
                    number it wraps on long values — and a masked figure is a
                    different width again — which changed the card's height. */}
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-tertiary md:text-sm">{label}</p>

                    {delta !== undefined && (
                        <span className={cx("flex h-5 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-xs font-semibold tabular-nums", palette.pill)}>
                            <Arrow className="size-3 shrink-0" aria-hidden="true" />
                            {Math.abs(delta)}
                            {deltaSuffix}
                            <span className="sr-only">{isUp ? "up" : "down"} from last period</span>
                        </span>
                    )}
                </div>

                <div className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">{value}</div>
            </div>

            <div>
                <div className="relative">
                    <AnimatePresence>
                        {hovered !== null && (
                            <motion.span
                                key="tip"
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 3 }}
                                transition={{ duration: 0.12, ease: "easeOut" }}
                                style={{ left: `${((hovered + 0.5) / bars.length) * 100}%` }}
                                className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded-full bg-primary-solid px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white shadow-lg"
                            >
                                {format(bars[hovered])}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    <div className="flex h-10 items-end gap-1 md:h-12" onMouseLeave={() => setHovered(null)}>
                        {bars.map((bar, index) => (
                            /* The whole column is the hit target, not just the bar. */
                            <div
                                key={index}
                                onMouseEnter={() => setHovered(index)}
                                className="flex h-full min-w-0 flex-1 cursor-default items-end"
                            >
                                <div
                                    style={{ height: `${Math.max(12, (bar / peak) * 100)}%` }}
                                    className={cx(
                                        "w-full rounded-t-full transition-colors duration-100 ease-linear",
                                        index === active ? palette.bar : index === hovered ? palette.soft : "bg-tertiary",
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {ticks && (
                    <div className="mt-1.5 flex gap-1">
                        {ticks.map((tick, index) => (
                            <span
                                key={tick + index}
                                className={cx(
                                    "min-w-0 flex-1 truncate text-center text-[10px] leading-none",
                                    index === active ? "font-medium text-tertiary" : "text-quaternary",
                                )}
                            >
                                {tick}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};
