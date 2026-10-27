-- Row-level security.
--
-- The client talks to Postgres directly with the anon key, so these policies
-- are the only thing standing between one person's money and another's. Every
-- table is locked by default and opened only for rows the caller owns.
--
-- `(select auth.uid())` rather than a bare `auth.uid()`: wrapping it in a
-- scalar subquery lets the planner evaluate it once per statement instead of
-- once per row, which matters on the activity feed.

alter table public.profiles       enable row level security;
alter table public.accounts       enable row level security;
alter table public.entries        enable row level security;
alter table public.goals          enable row level security;
alter table public.commitments    enable row level security;
alter table public.preferences    enable row level security;
alter table public.notifications  enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- No insert policy: the signup trigger creates the row, and nothing else should.
-- No delete policy: profiles go when the auth user goes, via cascade.

create policy "read own profile" on public.profiles
    for select using ((select auth.uid()) = id);

create policy "update own profile" on public.profiles
    for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ── the owned tables ─────────────────────────────────────────────────────────
-- Identical shape for each: `user_id` must be the caller, on the way in and on
-- the way out. The `with check` on update is what stops a row being reassigned
-- to somebody else.

create policy "read own accounts" on public.accounts
    for select using ((select auth.uid()) = user_id);
create policy "insert own accounts" on public.accounts
    for insert with check ((select auth.uid()) = user_id);
create policy "update own accounts" on public.accounts
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own accounts" on public.accounts
    for delete using ((select auth.uid()) = user_id);

create policy "read own entries" on public.entries
    for select using ((select auth.uid()) = user_id);
create policy "insert own entries" on public.entries
    for insert with check ((select auth.uid()) = user_id);
create policy "update own entries" on public.entries
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own entries" on public.entries
    for delete using ((select auth.uid()) = user_id);

create policy "read own goals" on public.goals
    for select using ((select auth.uid()) = user_id);
create policy "insert own goals" on public.goals
    for insert with check ((select auth.uid()) = user_id);
create policy "update own goals" on public.goals
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own goals" on public.goals
    for delete using ((select auth.uid()) = user_id);

create policy "read own commitments" on public.commitments
    for select using ((select auth.uid()) = user_id);
create policy "insert own commitments" on public.commitments
    for insert with check ((select auth.uid()) = user_id);
create policy "update own commitments" on public.commitments
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own commitments" on public.commitments
    for delete using ((select auth.uid()) = user_id);

create policy "read own preferences" on public.preferences
    for select using ((select auth.uid()) = user_id);
create policy "insert own preferences" on public.preferences
    for insert with check ((select auth.uid()) = user_id);
create policy "update own preferences" on public.preferences
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── notifications ────────────────────────────────────────────────────────────
-- Read, dismiss and mark-read only. Notifications are raised by the generator
-- running as the service role, which bypasses RLS; letting the client insert
-- them would let it fake its own alerts.

create policy "read own notifications" on public.notifications
    for select using ((select auth.uid()) = user_id);
create policy "update own notifications" on public.notifications
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own notifications" on public.notifications
    for delete using ((select auth.uid()) = user_id);
