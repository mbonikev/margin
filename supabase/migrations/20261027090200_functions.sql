-- Triggers and aggregates.
--
-- Everything here is `security definer` with a pinned `search_path`: these run
-- with owner rights, so an unpinned path would let a caller shadow `public`
-- with their own schema and have us call their function instead.

-- ── new user ─────────────────────────────────────────────────────────────────

-- Signup must leave a usable account behind: a profile to show a name, and a
-- preferences row so the first settings write is an update, not a race between
-- two tabs both trying to insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.profiles (id, name)
    values (
        new.id,
        -- Whatever signup collected, else the local part of the email.
        coalesce(
            nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            ''
        )
    )
    on conflict (id) do nothing;

    insert into public.preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ── entries keep account balances honest ─────────────────────────────────────

-- The balance shown on a card is the balance the newest entry left behind. Doing
-- this in a trigger means the client cannot post an entry and forget to move the
-- account, and the two can never disagree.
create or replace function public.sync_account_balance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    -- Both are needed: moving an entry between accounts leaves the old account
    -- holding a balance that no entry backs any more.
    touched uuid[];
    target uuid;
    latest record;
begin
    -- NEW is unassigned during DELETE and OLD during INSERT, so each is read
    -- only where it exists. Touching the other raises "record is not assigned".
    if tg_op = 'DELETE' then
        touched := array[old.account_id];
    elsif tg_op = 'INSERT' then
        touched := array[new.account_id];
    else
        touched := array[new.account_id, old.account_id];
    end if;

    foreach target in array touched loop
        continue when target is null;

        -- Re-derive from the surviving newest entry rather than adding or
        -- subtracting a delta, so an edited or deleted entry self-heals.
        select e.balance_after, e.occurred_at
          into latest
          from public.entries e
         where e.account_id = target
           and e.balance_after is not null
         order by e.occurred_at desc, e.created_at desc
         limit 1;

        if found then
            update public.accounts
               set balance = latest.balance_after,
                   balance_updated_at = latest.occurred_at
             where id = target;
        end if;
    end loop;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger entries_sync_balance
    after insert or update or delete on public.entries
    for each row execute function public.sync_account_balance();

-- ── goals ────────────────────────────────────────────────────────────────────

-- Stamp the moment a goal is first met, so the milestone alert fires once and
-- topping it up further does not re-raise it.
create or replace function public.stamp_goal_reached()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if new.saved >= new.target and new.reached_at is null then
        new.reached_at := now();
    elsif new.saved < new.target then
        -- Spending back out of a goal re-arms the milestone.
        new.reached_at := null;
    end if;
    return new;
end;
$$;

create trigger goals_stamp_reached
    before insert or update of saved, target on public.goals
    for each row execute function public.stamp_goal_reached();

-- ── preferences ──────────────────────────────────────────────────────────────

create or replace function public.touch_preferences()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger preferences_touch
    before update on public.preferences
    for each row execute function public.touch_preferences();

-- ── aggregates the dashboard reads ───────────────────────────────────────────

-- Six months of in-vs-out, one row per month including months with no activity
-- — the chart's spline needs an unbroken series, and filling gaps client-side
-- means shipping the calendar logic twice.
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
    group by span.month
    order by span.month;
$$;

-- Balance across live accounts, minus what is already committed before the next
-- payday. This is the "safe to spend" figure (Issues.txt #11) — defined once,
-- here, so the dashboard tile and the morning mail can never quote different
-- numbers.
create or replace function public.safe_to_spend(horizon_days integer default 30)
returns bigint
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
    select greatest(
        coalesce((
            select sum(balance) from public.accounts
             where user_id = (select auth.uid()) and deleted_at is null
        ), 0)
        - coalesce((
            select sum(amount) from public.commitments
             where user_id = (select auth.uid())
               and deleted_at is null
               and due_on between current_date and current_date + horizon_days
        ), 0),
        0
    )::bigint;
$$;
