-- Entries follow their account into the trash, and out of existence.
--
-- Trashing an account left its entries in the activity feed and in every
-- aggregate, so the money vanished from the totals while the transactions that
-- produced it stayed on screen. Deleting an account is meant to remove it from
-- view, not split it in half.
--
-- Trash is reversible, so entries are *filtered* rather than marked: restoring
-- the account brings them back with no second piece of state to keep in step.
-- Purging is not reversible, so the rows go with it.

alter table public.entries drop constraint if exists entries_account_id_fkey;

alter table public.entries
    add constraint entries_account_id_fkey
    foreign key (account_id) references public.accounts (id) on delete cascade;

-- ── aggregates skip trashed accounts ─────────────────────────────────────────

create or replace function public.month_flows(n_months integer default 6)
returns table (month date, total_in bigint, total_out bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    with span as (
        select generate_series(
            date_trunc('month', now()) - make_interval(months => n_months - 1),
            date_trunc('month', now()),
            interval '1 month'
        )::date as month
    )
    select
        span.month,
        coalesce(sum(e.amount) filter (where e.kind = 'income'), 0)::bigint,
        coalesce(sum(e.amount) filter (where e.kind = 'expense'), 0)::bigint
    from span
    left join public.entries e
           on date_trunc('month', e.occurred_at)::date = span.month
          and e.user_id = (select auth.uid())
    left join public.accounts a on a.id = e.account_id
    where e.id is null or a.deleted_at is null
    group by span.month
    order by span.month;
$$;

create or replace function public.dashboard_series(period text default 'daily', points integer default 7)
returns table (bucket date, total_balance bigint, safe_to_spend bigint, total_saved bigint, spent bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    with span as (
        select case period
                   when 'weekly'  then (points * 7)
                   when 'monthly' then (points * 31)
                   else points
               end as days
    ),
    bucketed as (
        select
            case period
                when 'weekly'  then date_trunc('week', s.day)::date
                when 'monthly' then date_trunc('month', s.day)::date
                else s.day
            end as bucket,
            s.day,
            s.total_balance,
            s.safe_to_spend,
            s.total_saved
        from public.daily_snapshots s
        where s.user_id = (select auth.uid())
          and s.day > current_date - (select days from span)
    ),
    latest as (
        select distinct on (bucket) bucket, total_balance, safe_to_spend, total_saved
          from bucketed
         order by bucket, day desc
    )
    select
        l.bucket,
        l.total_balance,
        l.safe_to_spend,
        l.total_saved,
        coalesce((
            select sum(e.amount)
              from public.entries e
              join public.accounts a on a.id = e.account_id and a.deleted_at is null
             where e.user_id = (select auth.uid())
               and e.kind = 'expense'
               and e.occurred_at >= l.bucket
               and e.occurred_at < (
                   case period
                       when 'weekly'  then l.bucket + 7
                       when 'monthly' then (l.bucket + interval '1 month')::date
                       else l.bucket + 1
                   end
               )
        ), 0)::bigint as spent
    from latest l
    order by l.bucket;
$$;
