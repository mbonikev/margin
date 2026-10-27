/**
 * The activity feed, plus the aggregates the dashboard charts read.
 *
 * Posting an entry does not touch `accounts` here: the `entries_sync_balance`
 * trigger re-derives the account balance from the newest entry, so the two can
 * never drift apart and an edit or delete self-heals.
 */

import { supabase } from "@/lib/supabase";
import type { EntryRow } from "@/lib/database.types";
import type { Activity, ActivityKind, MonthFlow } from "@/components/dashboard";
import type { SpendPeriod } from "@/providers";

const toActivity = (row: EntryRow): Activity => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    account: row.account_name,
    note: row.note ?? undefined,
    balanceAfter: row.balance_after ?? undefined,
    at: new Date(row.occurred_at),
    amount: row.amount,
});

export const listActivity = async (limit = 50): Promise<Activity[]> => {
    const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data.map(toActivity);
};

export interface NewEntry {
    accountId: string;
    accountName: string;
    kind: ActivityKind;
    name: string;
    amount: number;
    note?: string;
    /** The account's balance after this entry; drives the balance sync trigger. */
    balanceAfter?: number;
    at?: Date;
}

export const createEntry = async (input: NewEntry): Promise<Activity> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { data, error } = await supabase
        .from("entries")
        .insert({
            user_id: auth.user.id,
            account_id: input.accountId,
            account_name: input.accountName,
            kind: input.kind,
            name: input.name,
            note: input.note ?? null,
            amount: input.amount,
            balance_after: input.balanceAfter ?? null,
            occurred_at: (input.at ?? new Date()).toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return toActivity(data);
};

export const deleteEntry = async (id: string): Promise<void> => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) throw error;
};

/** Six months of in-vs-out, gaps already filled by the database function. */
export const listMonthFlows = async (months = 6): Promise<MonthFlow[]> => {
    const { data, error } = await supabase.rpc("month_flows", { n_months: months });
    if (error) throw error;

    return data.map((row) => ({
        // `month` is a bare date; parsing it as UTC keeps it on the 1st
        // regardless of which side of the date line the reader sits on.
        month: new Date(`${row.month}T00:00:00Z`),
        in: row.total_in,
        out: row.total_out,
    }));
};

/** Defined in SQL so the dashboard tile and the morning mail agree. */
export const getSafeToSpend = async (period: SpendPeriod = "daily"): Promise<number> => {
    const { data, error } = await supabase.rpc("safe_to_spend", { period });
    if (error) throw error;
    return data ?? 0;
};

export interface DashboardSeries {
    /** Oldest first — the sparklines draw left to right. */
    totalBalance: number[];
    safeToSpend: number[];
    savedPerMonth: number[];
    spentThisWeek: number[];
}

/**
 * The four stat-tile series. Empty on a new account and filling in daily, since
 * the snapshot job can only record what it was running for.
 */
export const getDashboardSeries = async (period: SpendPeriod = "daily", points = 7): Promise<DashboardSeries> => {
    const { data, error } = await supabase.rpc("dashboard_series", { period, points });
    if (error) throw error;

    return {
        totalBalance: data.map((row) => row.total_balance),
        safeToSpend: data.map((row) => row.safe_to_spend),
        savedPerMonth: data.map((row) => row.total_saved),
        spentThisWeek: data.map((row) => row.spent),
    };
};

export interface BalanceReading {
    id: string;
    at: Date;
    amount: number;
    /**
     * "Today" / "3 days ago", resolved here rather than in the component.
     * Reading the clock during render is impure, and this is the only place
     * with a clock reading that is already happening outside one.
     */
    label: string;
}

/** How old a reading reads as. Ages, not dates — recency is the point. */
const age = (at: Date): string => {
    const days = Math.floor((Date.now() - at.getTime()) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "Last week";
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return at.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Balance readings for one account, newest first.
 *
 * Only entries that recorded a balance count: an expense that never stated what
 * was left afterwards says nothing about what the account held.
 */
export const listAccountHistory = async (accountId: string, limit = 200): Promise<BalanceReading[]> => {
    const { data, error } = await supabase
        .from("entries")
        .select("id, occurred_at, balance_after")
        .eq("account_id", accountId)
        .not("balance_after", "is", null)
        .order("occurred_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data.map((row) => {
        const at = new Date(row.occurred_at);
        return { id: row.id, at, amount: row.balance_after!, label: age(at) };
    });
};
