-- One definition of "safe to spend".
--
-- There were three: this function, an inlined copy in take_daily_snapshots(),
-- and a third written in TypeScript inside the morning-mail function — which
-- subtracted whatever five commitments it had fetched, with no horizon at all.
-- So the mail could and did quote a different number from the dashboard.
--
-- The formula now lives in safe_to_spend_for(uid), and every caller delegates
-- to it: the per-user function below, the snapshot job, and the mail.

create or replace function public.safe_to_spend_for(uid uuid, horizon_days integer default 30)
returns bigint
language sql
stable
-- `definer` because the snapshot job and the mail run for every user and have
-- no auth.uid() of their own. That makes the uid argument a way to read across
-- users, so execute is revoked from the client roles below.
security definer
set search_path = public, pg_temp
as $$
    select greatest(
        coalesce((
            select sum(balance) from public.accounts
             where user_id = uid and deleted_at is null
        ), 0)
        - coalesce((
            select sum(amount) from public.commitments
             where user_id = uid
               and deleted_at is null
               and due_on between current_date and current_date + horizon_days
        ), 0),
        0
    )::bigint;
$$;

revoke all on function public.safe_to_spend_for(uuid, integer) from public, anon, authenticated;

-- What the client calls. Invoker rights plus a hard-wired auth.uid(), so it can
-- only ever answer for the caller.
create or replace function public.safe_to_spend(horizon_days integer default 30)
returns bigint
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    select public.safe_to_spend_for((select auth.uid()), horizon_days);
$$;

-- The snapshot job stops carrying its own copy.
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
        public.safe_to_spend_for(p.id),
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

-- Give a new account a snapshot immediately rather than making it wait for the
-- nightly run. Without this the sparklines have nothing to draw on day one,
-- which is the common case for anyone just signing up.
create or replace function public.snapshot_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.daily_snapshots (user_id, day) values (new.id, current_date)
    on conflict (user_id, day) do nothing;
    return new;
end;
$$;

create trigger profiles_first_snapshot
    after insert on public.profiles
    for each row execute function public.snapshot_on_signup();
