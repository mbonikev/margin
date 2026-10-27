# Margin backend

Supabase: Postgres for the data, Supabase Auth for email + password sign-in, and two
Edge Functions on a cron for the morning mail and the notification rules.

The browser talks to Postgres directly through `supabase-js`. There is no API
server, so **row-level security is the whole security model** — every table is
sealed against `auth.uid()` in `supabase/migrations/20261027090100_rls.sql`, and
a new table is not finished until it has policies there.

## Layout

| Path | What |
|---|---|
| `supabase/migrations/` | Schema, RLS, triggers, aggregates, cron. Applied in filename order. |
| `supabase/functions/morning-mail/` | Daily email. Hourly tick; picks whoever's local hour it is. |
| `supabase/functions/build-notifications/` | The three bell rules, deduped. |
| `src/lib/supabase.ts` | The one client. Module singleton, owns the session. |
| `src/lib/database.types.ts` | The schema as TypeScript. Regenerate; don't hand-edit. |
| `src/services/` | Typed data access. Maps DB rows to the UI's own interfaces. |
| `src/hooks/use-data.ts` | TanStack Query wrappers over the services. |
| `src/auth-provider.tsx` | Session state, one `onAuthStateChange` subscription. |

## Data model

Seven tables, all keyed by `user_id`:

- **`profiles`** — name, avatar, timezone, morning-mail hour and streak.
- **`accounts`** — balance plus `balance_updated_at`, which is what staleness reads.
- **`entries`** — the activity feed. Posting one moves its account's balance via
  the `entries_sync_balance` trigger, so the two can never disagree.
- **`goals`**, **`commitments`** — savings targets and upcoming bills.
- **`preferences`** — one jsonb blob, merged over the defaults in `providers.tsx`.
- **`notifications`** — raised by the generator, never by the client.
- **`daily_snapshots`** — one row per user per day, for the stat-tile sparklines.

**Money** is a whole number of RWF in a `bigint`. RWF has no sub-unit, so there
are no minor units to track, and display conversion stays in the client where
the FX rates already live.

**Soft deletes** are a `deleted_at` column; restore is a null-out.

## Setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Copy the env file and fill it from Project Settings → API:
   ```bash
   cp .env.example .env.local
   ```
3. Link and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npm run db:push
   ```
4. Add `http://localhost:5173` under Authentication → URL Configuration, and
   anywhere else the app is served from. A redirect target that is not listed
   is dropped and the link lands on the project's Site URL instead.

### Email delivery

Auth mail (the sign-in link) and the morning mail travel by **different paths**,
which is easy to trip over:

| Mail | Sent by | Configured at |
|---|---|---|
| Confirmation + reset links | Supabase Auth's own SMTP | Authentication → Settings → SMTP |
| Morning mail | The `morning-mail` function, via Resend | `npx supabase secrets set` |

Setting `RESEND_API_KEY` therefore does nothing for sign-in. Supabase's built-in
auth SMTP is development-only — about two messages an hour, a sender address you
cannot change, and no deliverability guarantee.

To route auth mail through Resend too, fill in Authentication → Settings → SMTP
**in the dashboard**:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` (the literal word) |
| Password | your Resend API key |
| Sender email | `margin@line35.site` — must be on a *verified* Resend domain |
| Sender name | `Margin` |

Do this in the dashboard rather than via `supabase config push`: the push sends
every other local/remote config difference along with it, which is a wide blast
radius for one block. `supabase/config.toml` carries the same block, commented,
for the local stack.

Until a domain is verified in Resend, SMTP will only deliver to the Resend
account owner's own address — every other recipient is rejected, so sign-in
would silently break for real users. Verify the domain first, then switch.

Both the sign-in link and the morning mail send as `margin@line35.site`, so the
app only ever appears in an inbox under one name.

Neither needs a mailbox to *send* — Resend authenticates by DNS. Replies are
what need somewhere real to land, which is what `MORNING_MAIL_REPLY_TO` is for.

### Scheduled jobs

The cron migration creates the schedule but deliberately leaves the secrets
unset, so pushing the schema never arms a job that would mail your users.

```sql
-- In the SQL editor. The secret can be anything long and random.
insert into public.job_config (key, value) values
  ('functions_url', 'https://<your-ref>.supabase.co/functions/v1'),
  ('cron_secret',   '<a-long-random-string>');
```

```bash
npx supabase secrets set CRON_SECRET='<the same string>'
npx supabase secrets set RESEND_API_KEY='re_...'
npx supabase secrets set MORNING_MAIL_FROM='Margin <hello@yourdomain>'
npm run fn:deploy
```

Without `RESEND_API_KEY` the mail job runs and reports `skipped` rather than
failing, so the rest of the schedule still works.

### Sending domain

Resend needs a **domain**, not a mailbox. You add its DKIM, SPF and DMARC `TXT`
records at your registrar and that is the whole requirement — no MX record, no
Google Workspace, nothing to log into.

Send from a subdomain (`mail.yourdomain`, not the root). Sending reputation is
tracked per domain, so a bad run of app mail stays off the domain you use for
everything else.

What a domain alone does *not* give you is somewhere for replies to land. A
daily note about someone's money gets replied to, and a reply to an address with
no mailbox behind it bounces. Set `MORNING_MAIL_REPLY_TO` to an inbox you
actually read, or put a real mailbox on the domain (Zoho's free tier does one).

## Local development

Needs Docker running.

```bash
npm run db:start     # Postgres, Auth, Studio, Inbucket
npm run db:reset     # re-apply every migration from scratch
npm run db:types     # regenerate src/lib/database.types.ts
npm run fn:serve     # Edge Functions locally
```

Mail sent locally lands in Inbucket (the URL is printed by `db:start`), so you
can click confirmation and reset links without sending real email.

## Things worth knowing

**Sign-in is email + password.** Signup mails a confirmation link and grants no
session until it is clicked — an unconfirmed address would mean the morning
mail, the entire point of Margin, quietly goes nowhere.

Recovery is a reset link to `/reset-password`. That route sits outside both
normal guards: the link creates a *real* session, so without `recovering` in
`auth-provider.tsx` it would drop the person on the dashboard still holding the
password they forgot.

**Sparklines start empty.** Total balance, safe-to-spend and total saved are
*states*, not sums — last Tuesday's balance cannot be reconstructed from today's
rows. The snapshot job records them daily, so a new account's tiles fill in over
the following week. This is honest rather than broken: the app genuinely does
not know what it was not running for.

**`safe_to_spend` is defined once, in SQL.** Both the dashboard tile and the
morning mail call it, so they cannot quote different numbers.
