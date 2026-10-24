import { useMemo } from "react";
import { AccountHero } from "@/components/accounts";
import { InVsOut, RecentActivity, SavingsGoals, StatTile, UpcomingList } from "@/components/dashboard";
import type { StatTileProps } from "@/components/dashboard";
import { Amount } from "@/components/ui";
import { demoActivity, demoFlows, demoGoals, demoSeries, demoUpcoming } from "@/demo-data";
import { useAccounts, useCurrency, usePreferences, usePrivacy } from "@/providers";

const last = (series: number[]) => series[series.length - 1] ?? 0;

/** Nothing is recorded yet, so every series is flat and every list is empty. */
const emptySeries = { safeToSpend: [], spentThisWeek: [], totalBalance: [], savedPerMonth: [] };

export const DashboardPage = () => {
    const { accounts } = useAccounts();
    const { preferences } = usePreferences();
    const { formatWithCode } = useCurrency();
    const { mask } = usePrivacy();
    const formatBarAmount = (amount: number) => mask(formatWithCode(amount));

    const demo = preferences.demoData;
    const { safeToSpend, spentThisWeek, totalBalance, savedPerMonth } = demo ? demoSeries : emptySeries;
    const upcoming = demo ? demoUpcoming : [];
    const goals = demo ? demoGoals : [];
    const activity = demo ? demoActivity : [];
    const flows = demo ? demoFlows : [];

    const statTiles = useMemo<StatTileProps[]>(
        () => [
            {
                label: "Safe to spend",
                value: <Amount value={last(safeToSpend)} compactSymbol compact />,
                delta: safeToSpend.length ? 12 : undefined,
                deltaSuffix: "%",
                tone: "aqua",
                period: "days",
                bars: safeToSpend,
                formatBar: formatBarAmount,
            },
            {
                label: "Spent this week",
                value: <Amount value={spentThisWeek.reduce((total, day) => total + day, 0)} compactSymbol compact />,
                delta: spentThisWeek.length ? -8 : undefined,
                deltaSuffix: "%",
                tone: "blue",
                period: "days",
                bars: spentThisWeek,
                formatBar: formatBarAmount,
            },
            {
                label: "Total balance",
                value: <Amount value={last(totalBalance)} compactSymbol compact />,
                delta: totalBalance.length ? -4 : undefined,
                deltaSuffix: "%",
                tone: "yellow",
                period: "days",
                bars: totalBalance,
                formatBar: formatBarAmount,
            },
            {
                label: "Saved this month",
                value: <Amount value={last(savedPerMonth)} compactSymbol compact />,
                delta: savedPerMonth.length ? 6 : undefined,
                deltaSuffix: "%",
                tone: "magenta",
                period: "months",
                bars: savedPerMonth,
                formatBar: formatBarAmount,
            },
        ],
        [formatBarAmount, safeToSpend, spentThisWeek, totalBalance, savedPerMonth],
    );

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <section
            aria-label="Overview"
            className="grid gap-1.5 md:grid-cols-2 md:gap-2 lg:min-h-[27rem] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]"
        >
            {/* Left — four stat tiles in a 2x2 */}
            {preferences.showStatTiles && (
                <div className="grid min-w-0 grid-cols-2 gap-1.5 md:gap-2">
                    {statTiles.map((tile) => (
                        <StatTile key={tile.label} {...tile} className="min-h-36 md:min-h-40" />
                    ))}
                </div>
            )}

            {/* Middle — the hero, stretches to the full height of the section */}
            {preferences.showAccountHero && <AccountHero accounts={accounts} className="min-w-0 min-h-80 lg:min-h-0" />}

            {/* Right — same width as the left column, full height */}
            {preferences.showUpcoming && <UpcomingList items={upcoming} className="min-w-0 min-h-80 md:col-span-2 lg:col-span-1 lg:min-h-0" />}
            </section>

            {(preferences.showInVsOut || preferences.showGoals) && (
                <section aria-label="Outlook" className="grid gap-1.5 md:gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    {preferences.showInVsOut && <InVsOut months={flows} className="min-w-0 min-h-72" />}
                    {preferences.showGoals && <SavingsGoals goals={goals} className="min-w-0" />}
                </section>
            )}

            {preferences.showActivity && (
                <section aria-label="Activity">
                    <RecentActivity items={activity} />
                </section>
            )}
        </div>
    );
};
