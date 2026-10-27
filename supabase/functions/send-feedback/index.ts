/**
 * Feedback from inside the app.
 *
 * The recipient is a server-side secret, never a constant in the bundle: a
 * mailto link or a hard-coded address would publish a personal inbox to
 * everyone who opens devtools, and to every scraper that reads the JS.
 *
 * Unlike the scheduled functions this one is called by a person, so it keeps
 * the platform's JWT check (no `verify_jwt = false`) and additionally resolves
 * the caller. Only a signed-in user can send, which is what stops the endpoint
 * becoming an open relay into that inbox.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

/** Feedback is pasted straight into an email body, so it is escaped first. */
const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

const MAX_LENGTH = 4000;

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization) return json({ error: "Not signed in." }, 401);

    // The anon key plus the caller's own token: this client acts as them, so
    // getUser() resolves who is actually sending rather than trusting the body.
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false },
    });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return json({ error: "Not signed in." }, 401);

    let message = "";
    try {
        ({ message } = await request.json());
    } catch {
        return json({ error: "Expected JSON." }, 400);
    }

    message = (message ?? "").trim();
    if (!message) return json({ error: "Say something first." }, 400);
    if (message.length > MAX_LENGTH) return json({ error: "That's too long." }, 400);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const to = Deno.env.get("FEEDBACK_TO");
    const from = Deno.env.get("MORNING_MAIL_FROM") ?? "Margin <onboarding@resend.dev>";
    if (!apiKey || !to) return json({ error: "Feedback isn't set up yet." }, 500);

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
            from,
            to,
            // Replying goes straight back to whoever wrote it.
            reply_to: user.email,
            subject: `Margin feedback from ${user.email}`,
            html: `<p style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(message)}</p>
                   <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
                   <p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#888">
                     ${escapeHtml(user.email ?? "")} · ${user.id}
                   </p>`,
        }),
    });

    if (!response.ok) {
        console.error("resend refused:", response.status, await response.text());
        return json({ error: "Couldn't send that. Try again shortly." }, 502);
    }

    return json({ ok: true });
});
