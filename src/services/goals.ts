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

/**
 * Moves money between an account and a goal, both sides in one call.
 *
 * A single RPC rather than two writes: the account and the goal have to move
 * together, and a dropped connection between two client writes would leave the
 * money in neither place or both.
 */
export const moveGoalMoney = async (input: { goalId: string; accountId: string; amount: number; direction: "deposit" | "withdraw" }): Promise<void> => {
    const { error } = await supabase.rpc("move_goal_money", {
        p_goal_id: input.goalId,
        p_account_id: input.accountId,
        p_amount: input.amount,
        p_direction: input.direction,
    });
    if (error) throw error;
};
