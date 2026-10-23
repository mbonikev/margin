import { useMemo } from "react";
import type { StatTileProps } from "@/components/application/dashboard/stat-tile";
import { StatTile } from "@/components/application/dashboard/stat-tile";
import { Amount } from "@/components/base/amount/amount";
import { Card } from "@/components/base/card/card";
import { useCurrency } from "@/providers/currency-provider";
import { usePrivacy } from "@/providers/privacy-provider";

/** Placeholder figures — swap for real data once the backend exists. */
const safeToSpend = [32000, 28400, 41200, 36800, 44100, 39500, 48200];
const spentThisWeek = [5200, 6400, 3900, 4800, 3100, 4600, 3400];
const daysOfRunway = [18, 17, 15, 16, 14, 12, 11];
const savedPerMonth = [7420000, 8150000, 9030000, 8640000, 10310000, 11470000, 12480000];

const last = (series: number[]) => series[series.length - 1];

export const DashboardPage = () => {
    const { formatWithCode } = useCurrency();
    const { mask } = usePrivacy();
    const formatBarAmount = (amount: number) => mask(formatWithCode(amount));

    const statTiles = useMemo<StatTileProps[]>(
        () => [
            {
                label: "Safe to spend",
                value: <Amount value={last(safeToSpend)} />,
                delta: 12,
                deltaSuffix: "%",
                tone: "aqua",
                period: "days",
                bars: safeToSpend,
                formatBar: formatBarAmount,
            },
            {
                label: "Spent this week",
                value: <Amount value={spentThisWeek.reduce((total, day) => total + day, 0)} />,
                delta: -8,
                deltaSuffix: "%",
                tone: "blue",
                period: "days",
                bars: spentThisWeek,
                formatBar: formatBarAmount,
            },
            {
                label: "Days of runway",
                value: String(last(daysOfRunway)),
                delta: -3,
                tone: "yellow",
                period: "days",
                bars: daysOfRunway,
                formatBar: (value) => `${value} days`,
            },
            {
                label: "Saved this month",
                value: <Amount value={last(savedPerMonth)} />,
                delta: 6,
                deltaSuffix: "%",
                tone: "magenta",
                period: "months",
                bars: savedPerMonth,
                formatBar: formatBarAmount,
            },
        ],
        [formatBarAmount],
    );

    return (
        <section
            aria-label="Overview"
            className="grid gap-1.5 md:grid-cols-2 md:gap-2 lg:min-h-[26rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]"
        >
            {/* Left — four stat tiles in a 2x2 */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {statTiles.map((tile) => (
                    <StatTile key={tile.label} {...tile} className="min-h-36 md:min-h-40" />
                ))}
            </div>

            {/* Middle — the hero, stretches to the full height of the section */}
            <Card className="min-h-80 lg:min-h-0" />

            {/* Right — same width as the left column, full height */}
            <Card className="min-h-80 md:col-span-2 lg:col-span-1 lg:min-h-0" />
        </section>
    );
};
