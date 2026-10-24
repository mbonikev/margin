/** The dashboard's widgets. Each one takes its data as props — none fetch. */

import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import type { FC, ReactNode } from "react";
import { HiArrowDown, HiArrowUp, HiOutlineArrowRight, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlinePlus, HiOutlineScale } from "react-icons/hi2";
import { RecordModal } from "@/components/accounts";
import { NoActivityArt, NoFlowArt, NoGoalsArt, NoUpcomingArt } from "@/components/illustrations";
import { ActionButton } from "@/components/ui";
import { Amount } from "@/components/ui";
import { Card } from "@/components/ui";
import { Progress } from "@/components/ui";
import { useAccounts } from "@/providers";
import { cx } from "@/utils";

/* ── stat-tile.tsx ── */

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

/** A chart's silhouette at rest. Deliberately flat-ish and very faint: it should
 *  read as the shape a chart will take, never as seven real readings. */
const ghostBars = [38, 52, 44, 60, 48, 66, 54];

/** What a widget shows before anything has been recorded: a drawing of the
 *  thing that's missing, then one line saying how to get it. */
export const Blank = ({ art, children }: { art?: ReactNode; children: ReactNode }) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
        {art}
        <p className="max-w-64 text-sm text-quaternary">{children}</p>
    </div>
);

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
                        {bars.length === 0 &&
                            ghostBars.map((height, index) => (
                                <span key={index} style={{ height: `${height}%` }} className="w-full flex-1 rounded-t-full bg-tertiary opacity-25" />
                            ))}

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

                {ticks && bars.length > 0 && (
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

/* ── upcoming-list.tsx ── */

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

<ActionButton icon={HiOutlineArrowRight}>View all</ActionButton>
            </div>

            {items.length === 0 && <Blank art={<NoUpcomingArt />}>Nothing due yet. Add a recurring bill and it shows up here.</Blank>}

            <ul className={cx("-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto", items.length === 0 && "hidden")}>
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

/* ── in-vs-out.tsx ── */

export interface MonthFlow {
    /** First of the month — the label is derived, never stored. */
    month: Date;
    /** Both in the base currency. */
    in: number;
    out: number;
}

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

    // Before the geometry: a path built from no points is invalid SVG, which the
    // browser rejects outright rather than drawing nothing.
    if (months.length === 0) {
        return (
            <Card className={cx("flex flex-col gap-4", className)}>
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">In vs out</h2>
                <Blank art={<NoFlowArt />}>No months to compare yet. Record income and expenses and the lines appear.</Blank>
            </Card>
        );
    }

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
                    <span className="h-0.5 w-4 rounded-full bg-chart-compare" />
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
                            <stop offset="0%" className="text-chart-compare" stopColor="currentColor" stopOpacity="0.14" />
                            <stop offset="100%" className="text-chart-compare" stopColor="currentColor" stopOpacity="0" />
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
                    <path d={geo.outPath} className="stroke-chart-compare" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={geo.inPath} className="stroke-brand" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

                    {months.map((entry, index) => (
                        <g key={entry.month.toISOString()}>
                            {/* Surface ring so the dots stay legible where the lines cross. */}
                            <circle cx={geo.toX(index)} cy={geo.toY(entry.out)} r={index === hovered ? 5 : 3.5} className="fill-chart-compare stroke-bg-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
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
                            <span className="size-1.5 rounded-full bg-chart-compare" />
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

/* ── savings-goals.tsx ── */

export interface Goal {
    id: string;
    name: string;
    /** Both in the base currency. */
    saved: number;
    target: number;
    /** When the goal was opened — "how long have I been at this?". */
    startedAt: Date;
}

const sinceFormat = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });

const elapsed = (from: Date) => {
    const months = Math.max(0, (new Date().getFullYear() - from.getFullYear()) * 12 + new Date().getMonth() - from.getMonth());
    if (months < 1) return "this month";
    if (months === 1) return "1 month in";
    if (months < 12) return `${months} months in`;
    return `${Math.floor(months / 12)}y ${months % 12}m in`;
};

export const SavingsGoals = ({ goals, className }: { goals: Goal[]; className?: string }) => {
    const { accounts } = useAccounts();
    const [creating, setCreating] = useState(false);

    return (
    <Card className={cx("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Goals</h2>

<ActionButton icon={HiOutlinePlus} onClick={() => setCreating(true)}>New goal</ActionButton>
        </div>

        {goals.length === 0 && <Blank art={<NoGoalsArt />}>No goals yet. Name one thing you're saving for.</Blank>}

        <ul className="flex flex-col gap-4">
            {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));

                return (
                    <li key={goal.id}>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-sm font-medium text-primary">{goal.name}</p>

                            {/* Saved leads, target recedes — they are not equal facts. */}
                            <p className="shrink-0 text-xs text-quaternary">
                                <Amount value={goal.saved} className="font-semibold text-secondary" />
                                <span className="mx-1">of</span>
                                <Amount value={goal.target} hideSymbol />
                            </p>
                        </div>

                        {/* The percentage sits outside the bar: inside, it lands on the
                            fill or the track depending on the value, which reads as a bug. */}
                        <div className="mt-2 flex items-center gap-3">
                            <Progress value={percent} className="min-w-0 flex-1" />
                            <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-primary">{percent}%</span>
                        </div>

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-tertiary">
                            <span>
                                <Amount value={Math.max(0, goal.target - goal.saved)} /> to go
                            </span>
                            <span className="text-quaternary">·</span>
                            <span className="text-quaternary" title={`Started ${sinceFormat.format(goal.startedAt)}`}>
                                {elapsed(goal.startedAt)}
                            </span>
                        </p>
                    </li>
                );
            })}
        </ul>
        <RecordModal kind="goal" isOpen={creating} onOpenChange={setCreating} accounts={accounts} />
    </Card>
    );
};

/* ── recent-activity.tsx ── */

export type ActivityKind = "balance" | "expense" | "income";

/* Solid chips carry the vibrancy; the amount text stays at a step that clears
   4.5:1, since a vivid green or red is unreadable at 14px on white. */
const kinds: Record<ActivityKind, { icon: FC<{ className?: string }>; chip: string; sign: string; amount: string; label: string }> = {
    balance: { icon: HiOutlineScale, chip: "bg-tile-blue text-white", sign: "", amount: "text-tile-blue-ink", label: "Balance" },
    expense: { icon: HiOutlineArrowTrendingDown, chip: "bg-negative text-white", sign: "−", amount: "text-negative-ink", label: "Expense" },
    income: { icon: HiOutlineArrowTrendingUp, chip: "bg-positive text-white", sign: "+", amount: "text-positive-ink", label: "Income" },
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

            {items.length === 0 && <Blank art={<NoActivityArt />}>Nothing recorded yet. Your first expense or balance update lands here.</Blank>}

            <div className={cx("-mx-2 overflow-x-auto", items.length === 0 && "hidden")}>
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
                                    <td className="rounded-l-full px-4 py-2.5 transition duration-100 ease-linear group-hover:bg-secondary">
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

                                    <td className={cx("rounded-r-full px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap transition duration-100 ease-linear group-hover:bg-secondary", kind.amount)}>
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
