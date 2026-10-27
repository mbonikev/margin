-- The stat-tile chart follows the chosen period.
--
-- Snapshots are stored once a day; weekly and monthly views bucket those same
-- rows rather than being recorded separately. Balances and safe-to-spend are
-- *states*, so each bucket takes its newest reading — averaging a balance
-- across a week would invent a figure that was never true. Spending is a
-- *flow*, so it sums.

drop function if exists public.dashboard_series(integer);

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
    -- The newest reading in each bucket is what that bucket was worth.
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
            select sum(e.amount) from public.entries e
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
