/** Savings goals. */

import { supabase } from "@/lib/supabase";
import type { GoalRow } from "@/lib/database.types";
import type { Goal } from "@/components/dashboard";

const toGoal = (row: GoalRow): Goal => ({
    id: row.id,
    name: row.name,
    saved: row.saved,
    target: row.target,
    startedAt: new Date(row.started_at),
});

export const listGoals = async (): Promise<Goal[]> => {
    const { data, error } = await supabase
        .from("goals")
        .select("*")
        .is("deleted_at", null)
        .order("started_at", { ascending: true });

    if (error) throw error;
    return data.map(toGoal);
};

export const createGoal = async (input: { name: string; target: number; saved?: number }): Promise<Goal> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { data, error } = await supabase
        .from("goals")
        .insert({ user_id: auth.user.id, name: input.name, target: input.target, saved: input.saved ?? 0 })
        .select()
        .single();

    if (error) throw error;
    return toGoal(data);
};

export const updateGoal = async (id: string, patch: Partial<Pick<Goal, "name" | "saved" | "target">>): Promise<Goal> => {
    const { data, error } = await supabase.from("goals").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return toGoal(data);
};

export const trashGoal = async (id: string): Promise<void> => {
    const { error } = await supabase.from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
};
