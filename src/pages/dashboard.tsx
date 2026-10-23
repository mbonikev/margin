import { useMemo } from "react";
import type { Account } from "@/components/app/account-card";
import { AccountHero } from "@/components/app/account-hero";
import type { Commitment } from "@/components/app/upcoming-list";
import { UpcomingList } from "@/components/app/upcoming-list";
import type { Activity } from "@/components/app/recent-activity";
import { RecentActivity } from "@/components/app/recent-activity";
import type { Goal } from "@/components/app/savings-goals";
import { SavingsGoals } from "@/components/app/savings-goals";
import type { RunwayPoint } from "@/components/app/runway-chart";
import { RunwayChart } from "@/components/app/runway-chart";
import { MorningEmail } from "@/components/app/morning-email";
import type { StatTileProps } from "@/components/app/stat-tile";
import { StatTile } from "@/components/app/stat-tile";
import { Amount } from "@/components/ui/amount";
import { useCurrency } from "@/providers/currency-provider";
import { usePrivacy } from "@/providers/privacy-provider";

/** Placeholder figures — swap for real data once the backend exists. */
const safeToSpend = [32000, 28400, 41200, 36800, 44100, 39500, 48200];
const spentThisWeek = [5200, 6400, 3900, 4800, 3100, 4600, 3400];
const totalBalance = [1520000, 1495000, 1610000, 1575000, 1540000, 1505000, 1468000];
const savedPerMonth = [7420000, 8150000, 9030000, 8640000, 10310000, 11470000, 12480000];

const last = (series: number[]) => series[series.length - 1];

const accounts: Account[] = [
    { id: "momo", name: "MTN MoMo", kind: "Mobile money", balance: 684000, updated: "Updated today", theme: "blue" },
    { id: "equity", name: "Equity Bank", kind: "Current", balance: 612000, updated: "Updated 2d ago", theme: "graphite" },
    { id: "savings", name: "Laptop fund", kind: "Savings", balance: 168000, updated: "Updated 5d ago", theme: "emerald" },
    { id: "cash", name: "Cash", kind: "Wallet", balance: 4000, updated: "Updated today", theme: "plum" },
];

/** Relative to today so the list never goes stale while this is placeholder data. */
const inDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const upcoming: Commitment[] = [
    { id: "netflix", name: "Netflix", due: inDays(0), amount: 18000, pressure: "ok" },
    { id: "rent", name: "Rent", due: inDays(1), amount: 450000, pressure: "over" },
    { id: "data", name: "Phone bundle", due: inDays(8), amount: 25000, pressure: "ok" },
    { id: "school", name: "School fees", due: inDays(11), amount: 180000, pressure: "tight" },
    { id: "gym", name: "Gym", due: inDays(13), amount: 30000, pressure: "ok" },
    { id: "insurance", name: "Insurance", due: inDays(20), amount: 64000, pressure: "ok" },
];

const goals: Goal[] = [
    { id: "laptop", name: "Laptop", saved: 168000, target: 420000 },
    { id: "emergency", name: "Emergency fund", saved: 744000, target: 1200000 },
    { id: "trip", name: "Trip home", saved: 62000, target: 400000 },
];

const activity: Activity[] = [
    { id: "a1", kind: "balance", name: "Balance updated", account: "MTN MoMo", when: "2h ago", amount: 684000 },
    { id: "a2", kind: "expense", name: "Groceries", account: "Cash", when: "Yesterday", amount: 12400 },
    { id: "a3", kind: "income", name: "Client payment", account: "Equity Bank", when: "2d ago", amount: 320000 },
    { id: "a4", kind: "expense", name: "Transport", account: "MTN MoMo", when: "3d ago", amount: 4500 },
];

/** 14 days behind, 16 projected — the crossing is what the card is for. */
const projection: RunwayPoint[] = Array.from({ length: 31 }, (_, index) => {
    const day = index - 14;
    const balance = day <= 0 ? 1_468_000 + day * 9_000 + (index % 3) * 14_000 : Math.max(0, 1_468_000 - day * 92_000);
    return { day, balance };
});

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
                label: "Total balance",
                value: <Amount value={last(totalBalance)} />,
                delta: -4,
                deltaSuffix: "%",
                tone: "yellow",
                period: "days",
                bars: totalBalance,
                formatBar: formatBarAmount,
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
        <div className="flex flex-col gap-1.5 md:gap-2">
            <section
            aria-label="Overview"
            className="grid gap-1.5 md:grid-cols-2 md:gap-2 lg:min-h-[27rem] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]"
        >
            {/* Left — four stat tiles in a 2x2 */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {statTiles.map((tile) => (
                    <StatTile key={tile.label} {...tile} className="min-h-36 md:min-h-40" />
                ))}
            </div>

            {/* Middle — the hero, stretches to the full height of the section */}
            <AccountHero accounts={accounts} className="min-h-80 lg:min-h-0" />

            {/* Right — same width as the left column, full height */}
            <UpcomingList items={upcoming} className="min-h-80 md:col-span-2 lg:col-span-1 lg:min-h-0" />
            </section>

            <section aria-label="Outlook" className="grid gap-1.5 md:gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <RunwayChart points={projection} className="min-h-72" />
                <SavingsGoals goals={goals} />
            </section>

            <section aria-label="Activity" className="grid gap-1.5 md:grid-cols-2 md:gap-2">
                <MorningEmail streak={14} sendsAt="7:00" preview="You've got 48,200 spare. Eight days till payday, eleven days of pace. You're good." />
                <RecentActivity items={activity} />
            </section>
        </div>
    );
};
