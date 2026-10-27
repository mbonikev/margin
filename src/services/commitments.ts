/** Upcoming bills. */

import { supabase } from "@/lib/supabase";
import type { CommitmentRow } from "@/lib/database.types";
import type { Commitment, Pressure } from "@/components/dashboard";

const toCommitment = (row: CommitmentRow): Commitment => ({
    id: row.id,
    name: row.name,
    // A bare date parsed as UTC, so a bill due the 1st never renders as the 31st.
    due: new Date(`${row.due_on}T00:00:00Z`),
    amount: row.amount,
    pressure: row.pressure,
});

/** Only what is still ahead — the dashboard tile is about what is coming. */
export const listCommitments = async (): Promise<Commitment[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
        .from("commitments")
        .select("*")
        .is("deleted_at", null)
        .gte("due_on", today)
        .order("due_on", { ascending: true });

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
            due_on: input.due.toISOString().slice(0, 10),
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
            ...(patch.due !== undefined && { due_on: patch.due.toISOString().slice(0, 10) }),
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
