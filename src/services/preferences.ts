/**
 * Settings, stored as one jsonb blob.
 *
 * The shape is owned by `Preferences` in providers.tsx and merged over the
 * defaults on read, exactly as the localStorage version did — which is why a
 * build that adds a setting needs no migration.
 */

import { supabase } from "@/lib/supabase";

export const getPreferences = async (): Promise<Record<string, unknown>> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return {};

    const { data, error } = await supabase.from("preferences").select("data").eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    return data?.data ?? {};
};

/**
 * Writes the whole record rather than one key. Settings changes are rare and a
 * whole-blob write is immune to two toggles in the same tick clobbering each
 * other, which a per-key json patch is not.
 */
export const savePreferences = async (preferences: object): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { error } = await supabase
        .from("preferences")
        .upsert({ user_id: auth.user.id, data: preferences as Record<string, unknown> }, { onConflict: "user_id" });

    if (error) throw error;
};
