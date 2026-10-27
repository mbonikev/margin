-- Margin: core schema.
--
-- Money: every amount is a whole number of the base currency (RWF, which has no
-- sub-unit) held in `bigint`. This matches `BASE_CURRENCY` in src/providers.tsx
-- and the plain `number` the UI already passes around, so display conversion
-- stays entirely in the client where the FX rates live.
--
-- Ownership: every table carries `user_id` and is sealed by RLS against
-- `auth.uid()`. Isolation is enforced here rather than in application code, so
-- a mistake in a client query cannot reach another person's balances.

create extension if not exists "pgcrypto" with schema extensions;

-- ── enums ────────────────────────────────────────────────────────────────────

-- Mirrors CardTheme in src/components/accounts.tsx.
create type public.card_theme as enum (
    'blue', 'indigo', 'violet', 'plum', 'rose', 'crimson',
    'amber', 'emerald', 'teal', 'slate', 'graphite'
);

-- Mirrors ActivityKind in src/components/dashboard.tsx. "balance" is a reading
-- the user took rather than money moving, so it carries no signed amount.
create type public.entry_kind as enum ('income', 'expense', 'balance');

-- Mirrors Pressure in src/components/dashboard.tsx. Stored rather than derived:
-- it is a judgement about the moment the commitment was recorded.
create type public.pressure as enum ('ok', 'tight', 'over');

create type public.notification_kind as enum ('stale_balance', 'bill_due', 'goal_milestone', 'morning_mail');

-- ── profiles ─────────────────────────────────────────────────────────────────

-- One row per auth user. Holds what the app shows that auth.users does not:
-- display name, avatar, and the morning-mail streak.
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    name text not null default '',
    avatar_url text,
    -- Consecutive days the morning mail has been opened. Issue #12's Duolingo
    -- feel needs a number that can break, so it lives beside the send job.
    email_streak integer not null default 0 check (email_streak >= 0),
    -- Local hour the morning mail should land. The cron fires hourly and picks
    -- whoever matches, which is how one job serves every timezone.
    morning_mail_hour smallint not null default 6 check (morning_mail_hour between 0 and 23),
    morning_mail_enabled boolean not null default true,
    timezone text not null default 'Africa/Kigali',
    created_at timestamptz not null default now()
);

-- ── accounts ─────────────────────────────────────────────────────────────────

create table public.accounts (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null check (length(trim(name)) > 0),
    -- Free text, not an enum: `preferences.accountKinds` is user-editable and an
    -- account keeps whatever kind it was given even after that list changes.
    kind text not null,
    -- Margin's own reference. Generated client-side from the id when absent.
    ref text,
    balance bigint not null default 0,
    theme public.card_theme not null default 'blue',
    -- When the *balance* was last confirmed, not when the row was touched. This
    -- is what the staleness rule and the "Updated 2d ago" label read, so renaming
    -- an account must not make its balance look fresh.
    balance_updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    -- Soft delete, replacing the client-side trash map. Restore is a null-out.
    deleted_at timestamptz
);

create index accounts_user_idx on public.accounts (user_id) where deleted_at is null;
create index accounts_user_trash_idx on public.accounts (user_id, deleted_at) where deleted_at is not null;

-- ── entries (the activity feed) ──────────────────────────────────────────────

create table public.entries (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    -- Deleting an account keeps its history: the feed still reads, with the
    -- account name preserved below.
    account_id uuid references public.accounts (id) on delete set null,
    -- Denormalised so a purged account does not blank out past rows.
    account_name text not null,
    kind public.entry_kind not null,
    name text not null,
    note text,
    amount bigint not null check (amount >= 0),
    -- That account's balance immediately after this entry.
    balance_after bigint,
    occurred_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- The feed is always "this user, newest first", and the flow aggregates scan a
-- date range within one user. One composite index serves both.
create index entries_user_time_idx on public.entries (user_id, occurred_at desc);

-- ── goals ────────────────────────────────────────────────────────────────────

create table public.goals (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null check (length(trim(name)) > 0),
    saved bigint not null default 0 check (saved >= 0),
    target bigint not null check (target > 0),
    started_at timestamptz not null default now(),
    -- Set when saved first reaches target, so the milestone notification fires
    -- once rather than on every read.
    reached_at timestamptz,
    deleted_at timestamptz
);

create index goals_user_idx on public.goals (user_id) where deleted_at is null;

-- ── commitments (upcoming bills) ─────────────────────────────────────────────

create table public.commitments (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null check (length(trim(name)) > 0),
    amount bigint not null check (amount >= 0),
    -- A calendar day, not an instant: "rent is due the 1st" has no meaningful
    -- time-of-day and must not shift across timezones.
    due_on date not null,
    pressure public.pressure not null default 'ok',
    -- Monthly bills regenerate; a one-off does not.
    recurs_monthly boolean not null default true,
    deleted_at timestamptz
);

create index commitments_user_due_idx on public.commitments (user_id, due_on) where deleted_at is null;

-- ── preferences ──────────────────────────────────────────────────────────────

-- One jsonb blob per user, mirroring the flat `Preferences` record. Flat and
-- schemaless for the same reason it is in localStorage today: adding a setting
-- must not need a migration, and the client already merges over its defaults.
create table public.preferences (
    user_id uuid primary key references auth.users (id) on delete cascade,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

-- ── notifications ────────────────────────────────────────────────────────────

create table public.notifications (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    kind public.notification_kind not null,
    title text not null,
    body text,
    -- Null until read. A timestamp rather than a boolean so "mark all read" is
    -- one update and the bell can still show when each was cleared.
    read_at timestamptz,
    created_at timestamptz not null default now(),
    -- What the notification is about, so tapping it can navigate and so the
    -- generator can avoid re-raising the same alert.
    subject_id uuid,
    -- Dedupe key: one alert per subject per rule per day.
    dedupe_key text not null
);

create unique index notifications_dedupe_idx on public.notifications (user_id, dedupe_key);
create index notifications_user_time_idx on public.notifications (user_id, created_at desc);
