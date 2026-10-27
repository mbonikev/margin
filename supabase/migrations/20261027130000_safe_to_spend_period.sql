-- "Safe to spend" becomes an allowance, not a leftover.
--
-- It used to be balance minus the next 30 days of bills: a stock figure that
-- answered "what is uncommitted", not "what can I spend". It also ignored the
-- payday the app already collects, and counted goal savings as spare — money
-- the person had explicitly set aside.
--
-- Now: what is left after bills due before the next payday and after goal
-- savings, divided across the periods remaining until that payday. The period
-- is the person's choice (daily, weekly, monthly) and also decides what the
-- tile's chart plots along the x-axis.

/** The next occurrence of the person's payday. */
create or replace function public.next_payday(uid uuid)
returns date
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    with setting as (
        select coalesce(nullif(p.data ->> 'payday', '')::int, 28) as day
          from public.preferences p where p.user_id = uid
    ),
    -- Clamped to the month's length, so a payday of 31 still lands in February.
    this_month as (
        select make_date(
            extract(year from current_date)::int,
            extract(month from current_date)::int,
            least((select day from setting), extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int)
        ) as d
    )
    select case
        when (select d from this_month) > current_date then (select d from this_month)
        -- Already past this month's payday: the horizon is next month's.
        else (
            select make_date(
                extract(year from n)::int,
                extract(month from n)::int,
                least((select day from setting), extract(day from (date_trunc('month', n) + interval '1 month - 1 day'))::int)
            )
            from (select current_date + interval '1 month' as n) next_month
        )
    end;
$$;

revoke all on function public.next_payday(uuid) from public, anon, authenticated;

/**
 * Spendable per period.
 *
 * `period` is 'daily' | 'weekly' | 'monthly'. Monthly is the whole remaining
 * pay cycle as one figure, which is why it divides by one.
 */
create or replace function public.safe_to_spend_for(uid uuid, period text default 'daily')
returns bigint
language sql
stable
-- `definer` because the snapshot job and the mail run for every user and have
-- no auth.uid() of their own. That makes `uid` a way to read across users, so
-- execute is revoked from the client roles below.
security definer
set search_path = public, pg_temp
as $$
    with horizon as (
        select greatest((public.next_payday(uid) - current_date), 1) as days_left
    ),
    available as (
        select greatest(
            coalesce((select sum(balance) from public.accounts
                       where user_id = uid and deleted_at is null), 0)
            - coalesce((select sum(amount) from public.commitments
                         where user_id = uid and deleted_at is null
                           and due_on between current_date and public.next_payday(uid)), 0)
            -- Money promised to a goal is not spare.
            - coalesce((select sum(saved) from public.goals
                         where user_id = uid and deleted_at is null), 0),
            0
        ) as total
    )
    select floor(
        (select total from available)::numeric
        / case period
              when 'weekly'  then greatest(ceil((select days_left from horizon)::numeric / 7), 1)
              when 'monthly' then 1
              else (select days_left from horizon)
          end
    )::bigint;
$$;

revoke all on function public.safe_to_spend_for(uuid, text) from public, anon, authenticated;
drop function if exists public.safe_to_spend_for(uuid, integer);

/** What the client calls — invoker rights, hard-wired to the caller. */
create or replace function public.safe_to_spend(period text default 'daily')
returns bigint
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    select public.safe_to_spend_for((select auth.uid()), period);
$$;

drop function if exists public.safe_to_spend(integer);

-- The snapshot job records the daily figure; weekly and monthly views are
-- derived from those daily rows rather than stored three times over.
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
        public.safe_to_spend_for(p.id, 'daily'),
        coalesce(saved.total, 0)
    from public.profiles p
    left join lateral (
        select sum(a.balance) as total from public.accounts a
         where a.user_id = p.id and a.deleted_at is null
    ) balances on true
    left join lateral (
        select sum(g.saved) as total from public.goals g
         where g.user_id = p.id and g.deleted_at is null
    ) saved on true
    on conflict (user_id, day) do update
        set total_balance = excluded.total_balance,
            safe_to_spend = excluded.safe_to_spend,
            total_saved   = excluded.total_saved;

    get diagnostics affected = row_count;
    return affected;
end;
$$;
