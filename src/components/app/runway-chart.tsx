import { useMemo, useState } from "react";
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
const HEIGHT = 170;
const PAD = { top: 12, right: 8, bottom: 20, left: 8 };

export const RunwayChart = ({ points, className }: { points: RunwayPoint[]; className?: string }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const geometry = useMemo(() => {
        const days = points.map((point) => point.day);
        const minDay = Math.min(...days);
        const maxDay = Math.max(...days);
        const peak = Math.max(...points.map((point) => point.balance), 1);

        const x = (day: number) => PAD.left + ((day - minDay) / (maxDay - minDay)) * (WIDTH - PAD.left - PAD.right);
        const y = (balance: number) => PAD.top + (1 - balance / peak) * (HEIGHT - PAD.top - PAD.bottom);

        const coords = points.map((point) => ({ ...point, x: x(point.day), y: y(point.balance) }));
        const history = coords.filter((point) => point.day <= 0);
        const future = coords.filter((point) => point.day >= 0);
        const line = (set: typeof coords) => set.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");

        const baseline = HEIGHT - PAD.bottom;
        const area = `${line(history)} L${history[history.length - 1].x},${baseline} L${history[0].x},${baseline} Z`;

        // The first projected day the balance runs out — the whole point of the chart.
        const empty = future.find((point) => point.balance <= 0) ?? null;

        return { coords, history, future, line, area, today: coords.find((point) => point.day === 0)!, empty, baseline };
    }, [points]);

    const active = hovered === null ? null : geometry.coords[hovered];

    return (
        <Card className={cx("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Projection</h2>
                <p className="text-xs text-tertiary">
                    {geometry.empty ? `At this pace you run out in ${geometry.empty.day} days` : "You stay in the black for the next 30 days"}
                </p>
            </div>

            <div className="relative min-h-0 flex-1">
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-full max-h-56 w-full" role="img" aria-label="Balance projection">
                    {/* Recessive baseline — the zero line is the thing worth seeing. */}
                    <line x1={PAD.left} x2={WIDTH - PAD.right} y1={geometry.baseline} y2={geometry.baseline} className="stroke-border-secondary" strokeWidth={1} />

                    <path d={geometry.area} className="fill-brand-solid/10" />
                    <path d={geometry.line(geometry.history)} className="stroke-brand-solid" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={geometry.line(geometry.future)} className="stroke-brand-solid" strokeWidth={2} strokeDasharray="5 5" fill="none" strokeLinecap="round" opacity={0.55} />

                    <circle cx={geometry.today.x} cy={geometry.today.y} r={4} className="fill-brand-solid stroke-primary" strokeWidth={2} />
                    {geometry.empty && <circle cx={geometry.empty.x} cy={geometry.empty.y} r={4} className="fill-tile-magenta stroke-primary" strokeWidth={2} />}

                    {/* Hit targets wider than the marks, per column. */}
                    {geometry.coords.map((point, index) => (
                        <rect
                            key={point.day}
                            x={point.x - (WIDTH - PAD.left - PAD.right) / (points.length * 2)}
                            y={0}
                            width={(WIDTH - PAD.left - PAD.right) / points.length}
                            height={HEIGHT}
                            fill="transparent"
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    ))}

                    {active && <line x1={active.x} x2={active.x} y1={PAD.top} y2={geometry.baseline} className="stroke-border-secondary" strokeWidth={1} />}
                </svg>

                {active && (
                    <span
                        style={{ left: `${(active.x / WIDTH) * 100}%` }}
                        className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-full bg-primary-solid px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white shadow-lg"
                    >
                        <Amount value={Math.max(0, active.balance)} hideSymbol />
                        {active.day === 0 ? " today" : active.day > 0 ? ` in ${active.day}d` : ` ${-active.day}d ago`}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-tertiary">
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-brand-solid" />
                    Actual
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-brand-solid/55" />
                    Projected
                </span>
            </div>
        </Card>
    );
};
