import { useMemo } from "react";
import type { Account } from "@/components/application/accounts/account-card";
import { AccountHero } from "@/components/application/dashboard/account-hero";
import type { StatTileProps } from "@/components/application/dashboard/stat-tile";
import { StatTile } from "@/components/application/dashboard/stat-tile";
import { Amount } from "@/components/base/amount/amount";
import { Card } from "@/components/base/card/card";
import { useCurrency } from "@/providers/currency-provider";
import { usePrivacy } from "@/providers/privacy-provider";

/** Placeholder figures — swap for real data once the backend exists. */
const safeToSpend = [32000, 28400, 41200, 36800, 44100, 39500, 48200];
const spentThisWeek = [5200, 6400, 3900, 4800, 3100, 4600, 3400];
const totalBalance = [1520000, 1495000, 1610000, 1575000, 1540000, 1505000, 1468000];
const savedPerMonth = [7420000, 8150000, 9030000, 8640000, 10310000, 11470000, 12480000];

const last = (series: number[]) => series[series.length - 1];

const accounts: Account[] = [
    // Mobile money is a phone number, a bank account is a card number, and cash
    // has no identifier at all — the mask has to match what the account really is.
    { id: "momo", name: "MTN MoMo", kind: "Mobile money", mask: "phone", tail: "640", balance: 684000, updated: "Updated today", theme: "blue" },
    { id: "equity", name: "Equity Bank", kind: "Current", mask: "card", tail: "9152", balance: 612000, updated: "Updated 2d ago", theme: "graphite" },
    { id: "savings", name: "Laptop fund", kind: "Savings", mask: "card", tail: "0471", balance: 168000, updated: "Updated 5d ago", theme: "emerald" },
    { id: "cash", name: "Cash", kind: "Wallet", mask: "none", balance: 4000, updated: "Updated today", theme: "plum" },
];

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
        <section
            aria-label="Overview"
            className="grid gap-1.5 md:grid-cols-2 md:gap-2 lg:min-h-[23rem] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]"
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
            <Card className="min-h-80 md:col-span-2 lg:col-span-1 lg:min-h-0" />
        </section>
    );
};
