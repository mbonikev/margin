/**
 * Server-side Supabase client, shared by the scheduled functions.
 *
 * Uses the service-role key, which bypasses RLS — necessary, because these jobs
 * run for every user at once and there is no `auth.uid()` to be. Nothing here
 * ever takes a user-supplied id: the jobs iterate the table themselves.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

export const serviceClient = () => {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");

    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

/**
 * Scheduled functions are reachable over HTTP, so they check a shared secret.
 * Without it anyone who learns the URL could trigger a send to every user.
 *
 * The secret travels in its own header, not in `Authorization`. Supabase's
 * gateway parses `Authorization` as a JWT before a function ever runs, so a
 * raw secret there is rejected upstream with "Invalid JWT" and the check below
 * never executes. These two functions therefore set `verify_jwt = false` in
 * config.toml, which makes this the only thing guarding them.
 */
export const authorized = (request: Request): boolean => {
    const expected = Deno.env.get("CRON_SECRET");
    if (!expected) return false;

    const token = request.headers.get("x-cron-secret") ?? "";

    // Length check first so the comparison below never short-circuits on an
    // obviously wrong length; a cron token does not need more than this.
    return token.length === expected.length && token === expected;
};

export const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
