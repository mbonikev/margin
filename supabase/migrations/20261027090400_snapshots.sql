-- Daily snapshots.
--
-- The stat tiles draw a week of history. "Spent this week" can be summed from
-- entries on demand, but total balance, safe-to-spend and total saved are all
-- *states* rather than sums — there is no way to reconstruct what a balance was
-- last Tuesday from the rows that exist today. So a job records them once a day
-- and the tiles read that.
--
-- This means the sparklines start empty on a new account and fill in over the
-- following week, which is the honest behaviour: the app genuinely does not
-- know what it was not there to see.

create table public.daily_snapshots (
    user_id uuid not null references auth.users (id) on delete cascade,
    day date not null,
    total_balance bigint not null default 0,
    safe_to_spend bigint not null default 0,
    total_saved bigint not null default 0,
    primary key (user_id, day)
);

alter table public.daily_snapshots enable row level security;

create policy "read own snapshots" on public.daily_snapshots
    for select using ((select auth.uid()) = user_id);

-- Written only by the snapshot job running as the service role, which bypasses
-- RLS. There is deliberately no client-side insert or update policy: a person
-- being able to rewrite their own history would make the charts meaningless.

-- ── taking a snapshot ────────────────────────────────────────────────────────

-- Runs for every user at once rather than one at a time, because it is driven
-- by a single cron tick. `security definer` so it can see across users; nothing
-- here takes a caller-supplied argument.
create or replace function public.take_daily_snapshots()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    affected integer;
begin
    insert into public.daily_snapshots (user_id, day, total_balance, safe_to_spend, total_saved)
    select
        p.id,
        current_date,
        coalesce(balances.total, 0),
        -- Same definition as public.safe_to_spend(), inlined because that one
        -- reads auth.uid() and this runs for everybody.
        greatest(coalesce(balances.total, 0) - coalesce(due.total, 0), 0),
        coalesce(saved.total, 0)
    from public.profiles p
    left join lateral (
        select sum(a.balance) as total from public.accounts a
         where a.user_id = p.id and a.deleted_at is null
    ) balances on true
    left join lateral (
        select sum(c.amount) as total from public.commitments c
         where c.user_id = p.id and c.deleted_at is null
           and c.due_on between current_date and current_date + 30
    ) due on true
    left join lateral (
        select sum(g.saved) as total from public.goals g
         where g.user_id = p.id and g.deleted_at is null
    ) saved on true
    -- Re-running the job the same day corrects that day rather than failing.
    on conflict (user_id, day) do update
        set total_balance = excluded.total_balance,
            safe_to_spend = excluded.safe_to_spend,
            total_saved   = excluded.total_saved;

    get diagnostics affected = row_count;
    return affected;
end;
$$;

-- ── what the tiles read ──────────────────────────────────────────────────────

-- The four series behind the stat tiles, in one round trip. Days with no
-- snapshot are omitted rather than zero-filled: a flat line at zero would read
-- as "you had nothing", when the truth is "we weren't watching yet".
create or replace function public.dashboard_series(days integer default 7)
returns table (day date, total_balance bigint, safe_to_spend bigint, total_saved bigint, spent bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    select
        s.day,
        s.total_balance,
        s.safe_to_spend,
        s.total_saved,
        coalesce((
            select sum(e.amount) from public.entries e
             where e.user_id = s.user_id
               and e.kind = 'expense'
               and e.occurred_at >= s.day
               and e.occurred_at < s.day + 1
        ), 0)::bigint as spent
    from public.daily_snapshots s
    where s.user_id = (select auth.uid())
      and s.day > current_date - days
    order by s.day;
$$;
