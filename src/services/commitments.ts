/** Upcoming bills. */

import { supabase } from "@/lib/supabase";
import type { CommitmentRow } from "@/lib/database.types";
import type { Commitment, Pressure } from "@/components/dashboard";

/**
 * A calendar date as the person sees it on their own clock.
 *
 * `toISOString()` converts to UTC first, so local midnight in Kigali (UTC+2)
 * becomes 22:00 the previous day and the date slices off one day early — a
 * bill picked for the 27th was stored as the 26th and then filtered out of
 * "upcoming" for being in the past.
 */
const toDateOnly = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

/** The inverse of toDateOnly: a local midnight on that calendar day. */
const fromDateOnly = (value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const toCommitment = (row: CommitmentRow): Commitment => ({
    id: row.id,
    name: row.name,
    // Built from the parts rather than parsed: `new Date("2026-10-27T00:00:00Z")`
    // is 19:00 on the 26th for anyone west of UTC, so the bill would render a
    // day early there in exactly the way it was being stored a day early here.
    due: fromDateOnly(row.due_on),
    amount: row.amount,
    pressure: row.pressure,
});

/** Only what is still ahead — the dashboard tile is about what is coming. */
export const listCommitments = async (): Promise<Commitment[]> => {
    const today = toDateOnly(new Date());
    const { data, error } = await supabase
        .from("commitments")
        .select("*")
        .is("deleted_at", null)
        .gte("due_on", today)
        .order("due_on", { ascending: true })
        // Tie-break, or two bills on the same day come back in whatever order
        // Postgres happens to produce and can swap between refetches. Biggest
        // first: on the day rent and a 3,000 subscription both land, rent is
        // the one that decides whether the day is affordable.
        .order("amount", { ascending: false });

    if (error) throw error;
    return data.map(toCommitment);
};

export const createCommitment = async (input: { name: string; amount: number; due: Date; pressure?: Pressure; recursMonthly?: boolean }): Promise<Commitment> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { data, error } = await supabase
        .from("commitments")
        .insert({
            user_id: auth.user.id,
            name: input.name,
            amount: input.amount,
            due_on: toDateOnly(input.due),
            pressure: input.pressure ?? "ok",
            recurs_monthly: input.recursMonthly ?? true,
        })
        .select()
        .single();

    if (error) throw error;
    return toCommitment(data);
};

export const updateCommitment = async (id: string, patch: Partial<{ name: string; amount: number; due: Date; pressure: Pressure }>): Promise<Commitment> => {
    const { data, error } = await supabase
        .from("commitments")
        .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.amount !== undefined && { amount: patch.amount }),
            ...(patch.pressure !== undefined && { pressure: patch.pressure }),
            ...(patch.due !== undefined && { due_on: toDateOnly(patch.due) }),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return toCommitment(data);
};

export const trashCommitment = async (id: string): Promise<void> => {
    const { error } = await supabase.from("commitments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
};
