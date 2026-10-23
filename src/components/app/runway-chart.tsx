import { useId, useMemo, useState } from "react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export interface RunwayPoint {
    /** Days from today. Negative is history, positive is projected. */
    day: number;
    /** Balance in the base currency. */
    balance: number;
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 16, right: 10, bottom: 18, left: 10 };

export const RunwayChart = ({ points, className }: { points: RunwayPoint[]; className?: string }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const gradientId = useId();

    const geo = useMemo(() => {
        const days = points.map((point) => point.day);
        const minDay = Math.min(...days);
        const maxDay = Math.max(...days);
        // Headroom above the peak so the line never touches the top edge.
        const peak = Math.max(...points.map((point) => point.balance), 1) * 1.12;
        const baseline = HEIGHT - PAD.bottom;

        const toX = (day: number) => PAD.left + ((day - minDay) / (maxDay - minDay)) * (WIDTH - PAD.left - PAD.right);
        const toY = (balance: number) => PAD.top + (1 - balance / peak) * (baseline - PAD.top);

        const coords = points.map((point) => ({ ...point, x: toX(point.day), y: toY(point.balance) }));
        const history = coords.filter((point) => point.day <= 0);
        const future = coords.filter((point) => point.day >= 0);
        const path = (set: typeof coords) => set.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

        return {
            coords,
            baseline,
            band: (WIDTH - PAD.left - PAD.right) / points.length,
            historyPath: path(history),
            futurePath: path(future),
            areaPath: `${path(history)} L${history.at(-1)!.x.toFixed(1)},${baseline} L${history[0].x.toFixed(1)},${baseline} Z`,
            today: coords.find((point) => point.day === 0)!,
            empty: future.find((point) => point.balance <= 0) ?? null,
        };
    }, [points]);

    const active = hovered === null ? null : geo.coords[hovered];

    return (
        <Card className={cx("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Projection</h2>
                <p className="text-xs text-tertiary">
                    {geo.empty ? (
                        <>
                            Empty in <span className="font-semibold text-primary">{geo.empty.day} days</span> at this pace
                        </>
                    ) : (
                        "You stay in the black for the next 30 days"
                    )}
                </p>
            </div>

            <div className="relative min-h-0 flex-1">
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-full max-h-52 w-full overflow-visible" role="img" aria-label="Balance projection">
                    <defs>
                        {/* A fade, not a block — a flat line over a tall domain fills
                            almost the whole frame if the area is a solid wash. */}
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="text-brand" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" className="text-brand" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <line x1={PAD.left} x2={WIDTH - PAD.right} y1={geo.baseline} y2={geo.baseline} className="stroke-border-secondary" strokeWidth={1} vectorEffect="non-scaling-stroke" />

                    <path d={geo.areaPath} fill={`url(#${gradientId})`} />

                    {/* non-scaling-stroke keeps the line even under a stretched viewBox. */}
                    <path d={geo.historyPath} className="stroke-brand" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={geo.futurePath} className="stroke-brand" strokeWidth={2} strokeDasharray="4 5" strokeOpacity={0.45} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

                    <circle cx={geo.today.x} cy={geo.today.y} r={4} className="fill-brand stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    {geo.empty && <circle cx={geo.empty.x} cy={geo.empty.y} r={4} className="fill-tile-magenta stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />}

                    {active && <line x1={active.x} x2={active.x} y1={PAD.top} y2={geo.baseline} className="stroke-border-secondary" strokeWidth={1} vectorEffect="non-scaling-stroke" />}

                    {geo.coords.map((point, index) => (
                        <rect
                            key={point.day}
                            x={point.x - geo.band / 2}
                            y={0}
                            width={geo.band}
                            height={HEIGHT}
                            fill="transparent"
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    ))}
                </svg>

                {active && (
                    <span
                        style={{ left: `${(active.x / WIDTH) * 100}%` }}
                        className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-full bg-primary-solid px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white shadow-lg"
                    >
                        <Amount value={Math.max(0, active.balance)} hideSymbol />
                        {active.day === 0 ? " · today" : active.day > 0 ? ` · in ${active.day}d` : ` · ${-active.day}d ago`}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-tertiary">
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-brand" />
                    Actual
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-brand opacity-45" />
                    Projected
                </span>
            </div>
        </Card>
    );
};
