import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useReveal } from "@/hooks/use-reveal";
import { cx } from "@/utils";
import { AccountHero } from "@/components/accounts";
import { InVsOut, RecentActivity, SavingsGoals, StatTile, UpcomingList } from "@/components/dashboard";
import type { StatTileProps } from "@/components/dashboard";
import { Amount } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { useAccounts, useCurrency, usePreferences, usePrivacy } from "@/providers";
import { useActivity, useCommitments, useDashboardSeries, useGoals, useMonthFlows, useSafeToSpend } from "@/hooks/use-data";

/**
 * Percentage change across the series, first reading to last.
 *
 * `undefined` whenever there is nothing honest to say — fewer than two
 * readings, or a first reading of zero, where "up from nothing" is a division
 * by zero rather than an infinite rise. The tile hides the delta entirely in
 * that case, which is the truthful answer for an account that has only just
 * started recording.
 */
const change = (series: number[]): number | undefined => {
    if (series.length < 2) return undefined;
    const first = series[0];
    const latest = series[series.length - 1];
    if (first === 0) return undefined;
    return Math.round(((latest - first) / Math.abs(first)) * 100);
};

/** Same, for the tiles that read as a total rather than a level. */
const totalChange = (series: number[]): number | undefined => {
    if (series.length < 2) return undefined;
    const half = Math.floor(series.length / 2);
    const earlier = series.slice(0, half).reduce((sum, n) => sum + n, 0);
    const later = series.slice(half).reduce((sum, n) => sum + n, 0);
    if (earlier === 0) return undefined;
    return Math.round(((later - earlier) / earlier) * 100);
};

/** Nothing is recorded yet, so every series is flat and every list is empty. */
const emptySeries = { safeToSpend: [], spentThisWeek: [], totalBalance: [], savedPerMonth: [] };

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const { preferences } = usePreferences();
    const { formatWithCode } = useCurrency();
    const { mask } = usePrivacy();
    const formatBarAmount = (amount: number) => mask(formatWithCode(amount));

    // Everything below comes from the database. A new account sees genuine
    // empty states rather than a sample standing in for them.
    // One choice drives three things: how the figure is divided, how many
    // points the chart plots, and what its x-axis is labelled with.
    const period = preferences.spendPeriod;
    const points = period === "daily" ? 7 : period === "weekly" ? 8 : 6;
    const tilePeriod = period === "daily" ? "days" : period === "weekly" ? "weeks" : "months";
    // The labels have to follow too — "Spent this week" beside a daily chart
    // describes neither the number above it nor the bars below.
    const spanLabel = period === "daily" ? "today" : period === "weekly" ? "this week" : "this month";
    const perLabel = period === "daily" ? "day" : period === "weekly" ? "week" : "month";

    const series = useDashboardSeries(period, points);
    const commitments = useCommitments();
    const goalsQuery = useGoals();
    const activityQuery = useActivity();
    const flowsQuery = useMonthFlows();

    const { safeToSpend, spentThisWeek, totalBalance, savedPerMonth } = series.data ?? emptySeries;

    // The headline figures are read live, not from the series. Snapshots are
    // taken once a day, so the newest one is up to 24h old — and on a fresh
    // account there are none at all, which showed as a confident zero next to
    // an account holding money. The series is only ever the sparkline.
    const liveSafeToSpend = useSafeToSpend(period).data ?? 0;
    const upcoming = commitments.data ?? [];
    const goals = goalsQuery.data ?? [];
    const activity = activityQuery.data ?? [];
    const flows = flowsQuery.data ?? [];

    const liveTotalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const liveTotalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);

    // One flag for the whole page. These six resolve within a few ms of each
    // other, so showing them as they land means six separate reflows — and the
    // account hero, which has no loading state of its own, would flash its
    // empty art in the middle of it. The page waits, then appears at once.
    const isLoading =
        accountsLoading || series.isPending || commitments.isPending || goalsQuery.isPending || activityQuery.isPending || flowsQuery.isPending;

    const reveal = useReveal(isLoading);

    const statTiles = useMemo<StatTileProps[]>(
        () => [
            {
                label: "Safe to spend",
                formula: `what you have, minus bills before payday, split over the ${perLabel}s left`,
                value: <Amount value={liveSafeToSpend} compactSymbol compact />,
                delta: change(safeToSpend),
                deltaSuffix: "%",
                tone: "aqua",
                period: tilePeriod,
                bars: safeToSpend,
                formatBar: formatBarAmount,
            },
            {
                label: `Spent ${spanLabel}`,
                formula: `every expense ${spanLabel}`,
                value: <Amount value={spentThisWeek.reduce((total, day) => total + day, 0)} compactSymbol compact />,
                delta: totalChange(spentThisWeek),
                deltaSuffix: "%",
                tone: "blue",
                period: tilePeriod,
                bars: spentThisWeek,
                formatBar: formatBarAmount,
            },
            {
                label: "Total balance",
                formula: "all your accounts added up",
                value: <Amount value={liveTotalBalance} compactSymbol compact />,
                delta: change(totalBalance),
                deltaSuffix: "%",
                tone: "yellow",
                period: tilePeriod,
                bars: totalBalance,
                formatBar: formatBarAmount,
            },
            {
                label: "Total saved",
                formula: "all your goals added up",
                value: <Amount value={liveTotalSaved} compactSymbol compact />,
                delta: change(savedPerMonth),
                deltaSuffix: "%",
                tone: "magenta",
                period: tilePeriod,
                bars: savedPerMonth,
                formatBar: formatBarAmount,
            },
        ],
        [formatBarAmount, tilePeriod, spanLabel, perLabel, liveSafeToSpend, liveTotalBalance, liveTotalSaved, safeToSpend, spentThisWeek, totalBalance, savedPerMonth],
    );

    // Held back deliberately: a half-built dashboard of empty states says "you
    // have nothing" to someone who has plenty, and only corrects itself a
    // moment later.
    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Spinner className="size-6 text-quaternary" />
                <p className="text-sm text-tertiary">Loading your dashboard…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <section
            aria-label="Overview"
            className="grid gap-1.5 md:grid-cols-2 md:gap-2 lg:min-h-[27rem] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]"
        >
            {/* Left — four stat tiles in a 2x2 */}
            {preferences.showStatTiles && (
                <div className={cx("grid min-w-0 grid-cols-2 gap-1.5 md:gap-2", reveal(0))}>
                    {statTiles.map((tile) => (
                        <StatTile key={tile.label} {...tile} className="min-h-36 md:min-h-40" />
                    ))}
                </div>
            )}

            {/* Middle — the hero, stretches to the full height of the section */}
            {preferences.showAccountHero && <AccountHero accounts={accounts} className={cx("min-w-0 min-h-80 lg:min-h-0", reveal(1))} />}

            {/* Right — same width as the left column, full height */}
            {preferences.showUpcoming && <UpcomingList items={upcoming} onViewAll={() => void navigate("/upcoming")} className={cx("min-w-0 min-h-80 md:col-span-2 lg:col-span-1 lg:min-h-0", reveal(2))} />}
            </section>

            {(preferences.showInVsOut || preferences.showGoals) && (
                <section aria-label="Outlook" className="grid gap-1.5 md:gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    {preferences.showInVsOut && <InVsOut months={flows} className={cx("min-w-0 min-h-72", reveal(3))} />}
                    {preferences.showGoals && <SavingsGoals goals={goals} onViewAll={() => void navigate("/goals")} className={cx("min-w-0", reveal(4))} />}
                </section>
            )}

            {preferences.showActivity && (
                <section aria-label="Activity">
                    <RecentActivity items={activity} onViewAll={() => void navigate("/activity")} className={reveal(5)} />
                </section>
            )}
        </div>
    );
};
