import { useId, useMemo, useState } from "react";
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

/**
 * Catmull-Rom control points converted to cubic Béziers. Tension is kept low so
 * the curve stays close to the data — a looser spline overshoots and invents
 * peaks between months that never happened.
 */
const smooth = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    const tension = 0.18;
    let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

    for (let index = 0; index < points.length - 1; index++) {
        const previous = points[index - 1] ?? points[index];
        const start = points[index];
        const end = points[index + 1];
        const next = points[index + 2] ?? end;

        const c1x = start.x + (end.x - previous.x) * tension;
        const c1y = start.y + (end.y - previous.y) * tension;
        const c2x = end.x - (next.x - start.x) * tension;
        const c2y = end.y - (next.y - start.y) * tension;

        path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}`;
    }

    return path;
};

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 18, right: 14, bottom: 14, left: 14 };

export const InVsOut = ({ months, className }: { months: MonthFlow[]; className?: string }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const gradientId = useId();

    const geo = useMemo(() => {
        // 10% headroom so neither line grazes the top edge.
        const peak = Math.max(...months.flatMap((entry) => [entry.in, entry.out]), 1) * 1.1;
        const step = (WIDTH - PAD.left - PAD.right) / Math.max(1, months.length - 1);

        const toX = (index: number) => PAD.left + index * step;
        const toY = (value: number) => PAD.top + (1 - value / peak) * (HEIGHT - PAD.top - PAD.bottom);
        const path = (pick: (entry: MonthFlow) => number) => smooth(months.map((entry, index) => ({ x: toX(index), y: toY(pick(entry)) })));

        const baseline = HEIGHT - PAD.bottom;
        const area = (line: string) => `${line} L${toX(months.length - 1).toFixed(1)},${baseline} L${toX(0).toFixed(1)},${baseline} Z`;
        const inPath = path((entry) => entry.in);
        const outPath = path((entry) => entry.out);

        return { toX, toY, step, inPath, outPath, inArea: area(inPath), outArea: area(outPath) };
    }, [months]);

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
                    <span className="h-0.5 w-4 rounded-full bg-brand" />
                    Money in
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-ink-muted" />
                    Money out
                </span>
            </div>

            <div className="relative min-h-0 flex-1">
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-full max-h-44 w-full overflow-visible" role="img" aria-label="Money in versus money out">
                    <defs>
                        {/* Kept low — two overlapping washes muddy fast. */}
                        <linearGradient id={`${gradientId}-in`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="text-brand" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" className="text-brand" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id={`${gradientId}-out`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="text-ink-muted" stopColor="currentColor" stopOpacity="0.14" />
                            <stop offset="100%" className="text-ink-muted" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <path d={geo.outArea} fill={`url(#${gradientId}-out)`} />
                    <path d={geo.inArea} fill={`url(#${gradientId}-in)`} />

                    {active && (
                        <line
                            x1={geo.toX(hovered!)}
                            x2={geo.toX(hovered!)}
                            y1={PAD.top}
                            y2={HEIGHT - PAD.bottom}
                            className="stroke-border-secondary"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    )}

                    {/* non-scaling-stroke keeps 2px true under a stretched viewBox. */}
                    <path d={geo.outPath} className="stroke-ink-muted" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={geo.inPath} className="stroke-brand" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

                    {months.map((entry, index) => (
                        <g key={entry.month.toISOString()}>
                            {/* Surface ring so the dots stay legible where the lines cross. */}
                            <circle cx={geo.toX(index)} cy={geo.toY(entry.out)} r={index === hovered ? 5 : 3.5} className="fill-ink-muted stroke-bg-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                            <circle cx={geo.toX(index)} cy={geo.toY(entry.in)} r={index === hovered ? 5 : 3.5} className="fill-brand stroke-bg-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />

                            <rect
                                x={geo.toX(index) - geo.step / 2}
                                y={0}
                                width={geo.step}
                                height={HEIGHT}
                                fill="transparent"
                                onMouseEnter={() => setHovered(index)}
                                onMouseLeave={() => setHovered(null)}
                            />
                        </g>
                    ))}
                </svg>

                {active && (
                    <div
                        style={{ left: `${(geo.toX(hovered!) / WIDTH) * 100}%` }}
                        className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-2xl bg-primary-solid px-3 py-2 text-[11px] leading-tight whitespace-nowrap text-white shadow-lg"
                    >
                        <p className="font-semibold">{monthFormat.format(active.month)}</p>
                        <p className="mt-1 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-brand" />
                            <Amount value={active.in} hideSymbol />
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-ink-muted" />
                            <Amount value={active.out} hideSymbol />
                        </p>
                    </div>
                )}
            </div>

            <div className="flex">
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
