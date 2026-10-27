/**
 * The three notification rules behind the bell.
 *
 * Raised server-side rather than derived in the client so they fire whether or
 * not the app is open, and so the morning mail and the bell agree. Each row
 * carries a `dedupe_key` that a unique index enforces, which is what stops an
 * hourly run from re-raising the same alert all day.
 */

import { authorized, json, serviceClient } from "../_shared/client.ts";

const formatRwf = (amount: number) => `${new Intl.NumberFormat("en-RW").format(amount)} RWF`;

interface NewNotification {
    user_id: string;
    kind: "stale_balance" | "bill_due" | "goal_milestone";
    title: string;
    body: string;
    subject_id: string;
    dedupe_key: string;
}

Deno.serve(async (request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    const supabase = serviceClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: profiles, error } = await supabase.from("profiles").select("id");
    if (error) return json({ error: error.message }, 500);

    const pending: NewNotification[] = [];

    for (const profile of profiles ?? []) {
        // Each user's own thresholds, falling back to the app defaults.
        const { data: prefs } = await supabase.from("preferences").select("data").eq("user_id", profile.id).maybeSingle();
        const settings = (prefs?.data ?? {}) as Record<string, unknown>;
        const staleAfterDays = typeof settings.staleAfterDays === "number" ? settings.staleAfterDays : 3;

        // ── stale balances ───────────────────────────────────────────────────
        if (settings.notifyStale !== false) {
            const cutoff = new Date(Date.now() - staleAfterDays * 86_400_000).toISOString();
            const { data: stale } = await supabase
                .from("accounts")
                .select("id, name, balance_updated_at")
                .eq("user_id", profile.id)
                .is("deleted_at", null)
                .lt("balance_updated_at", cutoff);

            for (const account of stale ?? []) {
                const days = Math.floor((Date.now() - new Date(account.balance_updated_at).getTime()) / 86_400_000);
                pending.push({
                    user_id: profile.id,
                    kind: "stale_balance",
                    title: `Your balance is ${days} days stale`,
                    body: `${account.name}, last seen ${new Date(account.balance_updated_at).toDateString()}.`,
                    subject_id: account.id,
                    // Once per account per day, not once per account ever — a
                    // balance left stale is worth a nudge again tomorrow.
                    dedupe_key: `stale:${account.id}:${today}`,
                });
            }
        }

        // ── bills landing soon ───────────────────────────────────────────────
        if (settings.notifyBills !== false) {
            const horizon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
            const { data: due } = await supabase
                .from("commitments")
                .select("id, name, amount, due_on")
                .eq("user_id", profile.id)
                .is("deleted_at", null)
                .gte("due_on", today)
                .lte("due_on", horizon);

            const { data: accounts } = await supabase.from("accounts").select("balance").eq("user_id", profile.id).is("deleted_at", null);
            const balance = (accounts ?? []).reduce((total, row) => total + Number(row.balance), 0);

            for (const bill of due ?? []) {
                const days = Math.round((new Date(`${bill.due_on}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
                pending.push({
                    user_id: profile.id,
                    kind: "bill_due",
                    title: days === 0 ? `${bill.name} is due today` : `${bill.name} is due in ${days} day${days === 1 ? "" : "s"}`,
                    body: `${formatRwf(Number(bill.amount))} leaves you ${formatRwf(Math.max(balance - Number(bill.amount), 0))}.`,
                    subject_id: bill.id,
                    dedupe_key: `bill:${bill.id}:${bill.due_on}`,
                });
            }
        }

        // ── goal milestones ──────────────────────────────────────────────────
        if (settings.notifyGoals !== false) {
            const { data: goals } = await supabase
                .from("goals")
                .select("id, name, saved, target")
                .eq("user_id", profile.id)
                .is("deleted_at", null);

            for (const goal of goals ?? []) {
                const percent = Math.floor((Number(goal.saved) / Number(goal.target)) * 100);
                // Quarter marks only. Every percent would be a stream of noise,
                // and the interesting moments are the round ones.
                const milestone = [100, 75, 50, 25].find((mark) => percent >= mark);
                if (!milestone) continue;

                pending.push({
                    user_id: profile.id,
                    kind: "goal_milestone",
                    title: milestone === 100 ? `${goal.name} is fully funded` : `${goal.name} passed ${milestone}%`,
                    body: `${formatRwf(Number(goal.saved))} of ${formatRwf(Number(goal.target))}.`,
                    subject_id: goal.id,
                    // Keyed by milestone, not by day: crossing 50% is news once.
                    dedupe_key: `goal:${goal.id}:${milestone}`,
                });
            }
        }
    }

    if (pending.length === 0) return json({ raised: 0 });

    // `ignoreDuplicates` turns the unique index into the dedupe mechanism, so
    // re-running the job is free rather than an error.
    const { error: insertError, count } = await supabase
        .from("notifications")
        .upsert(pending, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true, count: "exact" });

    if (insertError) return json({ error: insertError.message }, 500);
    return json({ raised: count ?? 0, considered: pending.length });
});
