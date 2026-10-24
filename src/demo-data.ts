/**
 * Every made-up figure in the app, in one place. Nothing here is imported for
 * its own sake — each screen reads it only when the "Demo data" setting is on,
 * so a fresh install shows the empty states a new account would really see.
 */

import { HiOutlineBanknotes, HiOutlineBell, HiOutlineEnvelope, HiOutlineFlag } from "react-icons/hi2";
import type { Account } from "@/components/accounts";
import type { Activity, Commitment, Goal, MonthFlow } from "@/components/dashboard";
import type { NotificationItem } from "@/components/shell";

export const demoAccounts: Account[] = [
    { id: "momo", name: "MTN MoMo", kind: "Mobile money", balance: 684000, updated: "Updated today", theme: "blue" },
    { id: "equity", name: "Equity Bank", kind: "Bank account", balance: 612000, updated: "Updated 2d ago", theme: "graphite" },
    { id: "savings", name: "Laptop fund", kind: "Savings", balance: 168000, updated: "Updated 5d ago", theme: "emerald" },
    { id: "cash", name: "Cash", kind: "Cash", balance: 4000, updated: "Updated today", theme: "plum" },
];

/** The person the demo screens belong to. */
export const demoProfile = {
    name: "Kevin",
    email: "kevin@example.com",
    joinedDaysAgo: 214,
    emailStreak: 14,
};

/** The seven-day and six-month series behind the stat tiles. */
const safeToSpend = [32000, 28400, 41200, 36800, 44100, 39500, 48200];
const spentThisWeek = [5200, 6400, 3900, 4800, 3100, 4600, 3400];
const totalBalance = [1520000, 1495000, 1610000, 1575000, 1540000, 1505000, 1468000];
const savedPerMonth = [7420000, 8150000, 9030000, 8640000, 10310000, 11470000, 12480000];


/** Relative to today so the list never goes stale while this is placeholder data. */
const inDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

export const demoUpcoming: Commitment[] = [
    { id: "netflix", name: "Netflix", due: inDays(0), amount: 18000, pressure: "ok" },
    { id: "rent", name: "Rent", due: inDays(1), amount: 450000, pressure: "over" },
    { id: "data", name: "Phone bundle", due: inDays(8), amount: 25000, pressure: "ok" },
    { id: "school", name: "School fees", due: inDays(11), amount: 180000, pressure: "tight" },
    { id: "gym", name: "Gym", due: inDays(13), amount: 30000, pressure: "ok" },
    { id: "insurance", name: "Insurance", due: inDays(20), amount: 64000, pressure: "ok" },
];

/** Six months back, so the labels stay correct whenever this is viewed. */
const monthsAgo = (count: number) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - count);
    return date;
};

export const demoGoals: Goal[] = [
    { id: "laptop", name: "Laptop", saved: 168000, target: 420000, startedAt: monthsAgo(4) },
    { id: "emergency", name: "Emergency fund", saved: 744000, target: 1200000, startedAt: monthsAgo(14) },
    { id: "trip", name: "Trip home", saved: 62000, target: 400000, startedAt: monthsAgo(1) },
];

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000);

export const demoActivity: Activity[] = [
    { id: "a1", kind: "balance", name: "Balance updated", account: "MTN MoMo", note: "Checked after lunch", at: hoursAgo(2), amount: 684000, balanceAfter: 684000 },
    { id: "a2", kind: "expense", name: "Groceries", account: "Cash", note: "Weekly shop", at: hoursAgo(20), amount: 12400, balanceAfter: 4000 },
    { id: "a3", kind: "expense", name: "Airtime", account: "MTN MoMo", at: hoursAgo(26), amount: 2000, balanceAfter: 696400 },
    { id: "a4", kind: "income", name: "Client payment", account: "Equity Bank", note: "Invoice #114", at: hoursAgo(50), amount: 320000, balanceAfter: 612000 },
    { id: "a5", kind: "expense", name: "Transport", account: "MTN MoMo", at: hoursAgo(74), amount: 4500, balanceAfter: 698400 },
    { id: "a6", kind: "balance", name: "Balance updated", account: "Equity Bank", at: hoursAgo(96), amount: 612000, balanceAfter: 612000 },
    { id: "a7", kind: "expense", name: "Rent", account: "Equity Bank", note: "October", at: hoursAgo(120), amount: 450000, balanceAfter: 292000 },
    { id: "a8", kind: "income", name: "Refund", account: "Cash", note: "Returned headphones", at: hoursAgo(144), amount: 18000, balanceAfter: 16400 },
];

export const demoFlows: MonthFlow[] = [
    { month: monthsAgo(5), in: 980000, out: 812000 },
    { month: monthsAgo(4), in: 1040000, out: 1105000 },
    { month: monthsAgo(3), in: 960000, out: 744000 },
    { month: monthsAgo(2), in: 1180000, out: 905000 },
    { month: monthsAgo(1), in: 1020000, out: 1240000 },
    { month: monthsAgo(0), in: 1310000, out: 868000 },
];

export const demoSeries = {
    safeToSpend,
    spentThisWeek,
    totalBalance,
    savedPerMonth,
};

/** What the bell shows in demo mode. */
export const demoNotifications: NotificationItem[] = [
    {
        id: "1",
        title: "Your balance is 3 days stale",
        body: "MTN MoMo, last seen Friday.",
        time: "2h ago",
        unread: true,
        icon: HiOutlineBanknotes,
        tone: "caution",
    },
    {
        id: "2",
        title: "Rent is due in 2 days",
        body: "450,000 leaves you 184,000.",
        time: "5h ago",
        unread: true,
        icon: HiOutlineBell,
        tone: "brand",
    },
    {
        id: "3",
        title: "Laptop fund passed 40%",
        body: "168,000 of 420,000.",
        time: "1d ago",
        icon: HiOutlineFlag,
        tone: "info",
    },
    {
        id: "4",
        title: "Your morning email went out",
        body: "14 mornings in a row.",
        time: "1d ago",
        icon: HiOutlineEnvelope,
        tone: "info",
    },
];
