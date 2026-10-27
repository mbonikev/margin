/** The signed-in person: name, avatar, morning-mail settings, streak. */

import { supabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/database.types";

export interface Profile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    emailStreak: number;
    /** ISO timestamp — absolute, so rendering it stays a pure function. */
    joinedAt: string;
    morningMailHour: number;
    morningMailEnabled: boolean;
    timezone: string;
}

const toProfile = (row: ProfileRow, email: string): Profile => ({
    id: row.id,
    name: row.name,
    email,
    avatarUrl: row.avatar_url ?? undefined,
    emailStreak: row.email_streak,
    joinedAt: row.created_at,
    morningMailHour: row.morning_mail_hour,
    morningMailEnabled: row.morning_mail_enabled,
    timezone: row.timezone,
});

export const getProfile = async (): Promise<Profile | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
    if (error) throw error;

    // The email lives on the auth user, not the profile — changing it is an
    // auth operation with its own confirmation mail, so it is never duplicated.
    return toProfile(data, auth.user.email ?? "");
};

export const updateProfile = async (patch: Partial<Pick<Profile, "name" | "avatarUrl" | "morningMailHour" | "morningMailEnabled" | "timezone">>): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { error } = await supabase
        .from("profiles")
        .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.avatarUrl !== undefined && { avatar_url: patch.avatarUrl }),
            ...(patch.morningMailHour !== undefined && { morning_mail_hour: patch.morningMailHour }),
            ...(patch.morningMailEnabled !== undefined && { morning_mail_enabled: patch.morningMailEnabled }),
            ...(patch.timezone !== undefined && { timezone: patch.timezone }),
        })
        .eq("id", auth.user.id);

    if (error) throw error;
};
