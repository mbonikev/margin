/**
 * The one Supabase client the app uses.
 *
 * It is a module singleton on purpose: the client owns the auth session and its
 * refresh timer, and a second instance would race the first for the refresh
 * token and intermittently sign people out.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    // Failing loudly at boot beats every query failing later with a 401 that
    // looks like an auth bug. See .env.example.
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill it in.");
}

export const supabase = createClient<Database>(url, anonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The recovery and confirmation links land back on the app as a URL
        // fragment; this is what turns one into a session.
        detectSessionInUrl: true,
        flowType: "pkce",
    },
});

/** Narrow a PostgREST error into something worth showing a person. */
export const describeError = (error: unknown): string => {
    if (!error) return "Something went wrong.";
    const message = (error as { message?: string }).message ?? String(error);
    const code = (error as { code?: string }).code;

    // The handful of codes a user can actually act on.
    if (code === "23505") return "That already exists.";
    if (code === "23514") return "Those numbers don't look right.";
    if (code === "42501" || code === "PGRST301") return "You don't have access to that.";
    if (message.includes("Failed to fetch")) return "Can't reach the server — check your connection.";
    return message;
};
