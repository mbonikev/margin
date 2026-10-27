/**
 * The morning email.
 *
 * Invoked hourly by pg_cron. Each run picks the users whose chosen local hour
 * has just arrived, which is how one schedule serves every timezone without a
 * job per zone.
 *
 * Tone (Issues.txt #12): warm, specific, and never scolding. The streak line is
 * the Duolingo part — it is the only place the mail asks for anything, and it
 * asks by showing what you would be breaking, not by nagging.
 */

import { authorized, json, serviceClient } from "../_shared/client.ts";
import { escapeHtml, formatRwf } from "../_shared/money.ts";

interface Recipient {
    id: string;
    name: string;
    email: string;
    email_streak: number;
    last_mail_on: string | null;
    timezone: string;
}

/** The local hour right now in a given IANA zone. */
const localHour = (timezone: string): number => {
    try {
        return Number(new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()));
    } catch {
        // An unknown zone must not stop the whole run for everyone else.
        return -1;
    }
};

/** The local calendar day, used to decide whether a streak survived. */
const localDay = (timezone: string): string => {
    try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
};

const dayBefore = (isoDay: string): string => {
    const date = new Date(`${isoDay}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
};

const greeting = (name: string): string => {
    const first = name.trim().split(/\s+/)[0];
    return first ? `Morning, ${escapeHtml(first)}` : "Morning";
};

const body = (recipient: Recipient, safeToSpend: number, dueSoon: { name: string; amount: number; due_on: string }[], streak: number) => {
    const bills = dueSoon
        .slice(0, 3)
        .map((bill) => `<li style="margin:0 0 4px">${escapeHtml(bill.name)} — <strong>${formatRwf(bill.amount)}</strong>, ${bill.due_on}</li>`)
        .join("");

    // Plain tables and inline styles: mail clients are not browsers.
    return `<!doctype html>
<html><body style="margin:0;background:#f6f7f6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:20px;padding:28px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111">${greeting(recipient.name)}.</p>
          <p style="margin:0 0 20px;font-size:14px;color:#666">Here's where you stand today.</p>

          <div style="background:#f6f7f6;border-radius:14px;padding:16px;margin:0 0 16px">
            <p style="margin:0;font-size:12px;color:#666">Safe to spend</p>
            <p style="margin:2px 0 0;font-size:26px;font-weight:700;color:#111">${formatRwf(safeToSpend)}</p>
          </div>

          ${bills ? `<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#111">Coming up</p><ul style="margin:0 0 16px;padding-left:18px;font-size:13px;color:#444">${bills}</ul>` : ""}

          ${
              streak > 1
                  ? `<p style="margin:0;font-size:13px;color:#444">That's <strong>${streak} mornings in a row</strong>. Nice run — keep it going.</p>`
                  : `<p style="margin:0;font-size:13px;color:#444">That's a start. See you tomorrow.</p>`
          }
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#999">Margin · you can turn this off in Settings</p>
    </td></tr>
  </table>
</body></html>`;
};

const send = async (to: string, subject: string, html: string): Promise<boolean> => {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("MORNING_MAIL_FROM") ?? "Margin <onboarding@resend.dev>";
    // Sending needs only DNS; *receiving* needs a mailbox. Without one, a reply
    // to the From address bounces — and a daily note about someone's money gets
    // replied to. This points replies at an inbox that actually exists.
    const replyTo = Deno.env.get("MORNING_MAIL_REPLY_TO");
    if (!apiKey) return false;

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to, subject, html, ...(replyTo && { reply_to: replyTo }) }),
    });

    if (!response.ok) {
        // Resend explains refusals in the body — an unverified domain and a bad
        // key look identical from the status code alone.
        console.error("resend refused:", response.status, await response.text());
    }
    return response.ok;
};

Deno.serve(async (request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    const supabase = serviceClient();
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, email_streak, last_mail_on, timezone, morning_mail_hour")
        .eq("morning_mail_enabled", true);

    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    let skipped = 0;

    for (const profile of profiles ?? []) {
        if (localHour(profile.timezone) !== profile.morning_mail_hour) continue;

        const today = localDay(profile.timezone);
        // Already mailed today: the hourly tick must not double-send if a run
        // is retried or overlaps.
        if (profile.last_mail_on === today) continue;

        // The email lives on the auth user, not the profile.
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) {
            skipped += 1;
            continue;
        }

        const [{ data: accounts }, { data: commitments }] = await Promise.all([
            supabase.from("accounts").select("balance").eq("user_id", profile.id).is("deleted_at", null),
            supabase
                .from("commitments")
                .select("name, amount, due_on")
                .eq("user_id", profile.id)
                .is("deleted_at", null)
                .gte("due_on", today)
                .order("due_on", { ascending: true })
                .limit(5),
        ]);

        const balance = (accounts ?? []).reduce((total, row) => total + Number(row.balance), 0);
        const committed = (commitments ?? []).reduce((total, row) => total + Number(row.amount), 0);
        const safeToSpend = Math.max(balance - committed, 0);

        // Nothing recorded at all — mailing a row of zeroes would be noise.
        if ((accounts ?? []).length === 0) {
            skipped += 1;
            continue;
        }

        // The streak continues only if yesterday's mail went out; otherwise it
        // restarts at one rather than breaking to zero.
        const streak = profile.last_mail_on === dayBefore(today) ? profile.email_streak + 1 : 1;

        const ok = await send(email, `Safe to spend: ${formatRwf(safeToSpend)}`, body({ ...profile, email } as Recipient, safeToSpend, commitments ?? [], streak));
        if (!ok) {
            skipped += 1;
            continue;
        }

        await supabase.from("profiles").update({ email_streak: streak, last_mail_on: today }).eq("id", profile.id);
        sent += 1;
    }

    return json({ sent, skipped, considered: profiles?.length ?? 0 });
});
