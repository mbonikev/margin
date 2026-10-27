-- One call moves both sides of a goal transfer.
--
-- A function rather than two client writes: the account and the goal have to
-- move together, and a browser that loses connection between the two would
-- leave money in neither place or both.

create or replace function public.move_goal_money(
    p_goal_id uuid,
    p_account_id uuid,
    p_amount bigint,
    p_direction text default 'deposit'
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    uid uuid := (select auth.uid());
    account_balance bigint;
    goal_saved bigint;
    goal_name text;
    account_name text;
    new_balance bigint;
begin
    if uid is null then
        raise exception 'Not signed in.';
    end if;

    if p_amount <= 0 then
        raise exception 'Enter an amount first.';
    end if;

    -- RLS still applies (invoker rights), but the explicit user_id check turns
    -- "no such row" into a clear error rather than a silent no-op.
    select balance, name into account_balance, account_name
      from public.accounts
     where id = p_account_id and user_id = uid and deleted_at is null;
    if not found then
        raise exception 'That account is not available.';
    end if;

    select saved, name into goal_saved, goal_name
      from public.goals
     where id = p_goal_id and user_id = uid and deleted_at is null;
    if not found then
        raise exception 'That goal is not available.';
    end if;

    if p_direction = 'deposit' then
        if p_amount > account_balance then
            raise exception 'That is more than % holds.', account_name;
        end if;
        new_balance := account_balance - p_amount;
        goal_saved := goal_saved + p_amount;
    else
        if p_amount > goal_saved then
            raise exception 'That is more than % holds.', goal_name;
        end if;
        new_balance := account_balance + p_amount;
        goal_saved := goal_saved - p_amount;
    end if;

    -- The entry is what moves the account: the balance-sync trigger reads
    -- balance_after, so the account is never written directly.
    insert into public.entries (user_id, account_id, account_name, goal_id, kind, name, amount, balance_after, occurred_at)
    values (
        uid,
        p_account_id,
        account_name,
        p_goal_id,
        (case when p_direction = 'deposit' then 'goal_deposit' else 'goal_withdrawal' end)::public.entry_kind,
        (case when p_direction = 'deposit' then 'Into ' else 'Out of ' end) || goal_name,
        p_amount,
        new_balance,
        now()
    );

    update public.goals set saved = goal_saved where id = p_goal_id;
end;
$$;

-- Goal money now genuinely leaves the account, so the balance already reflects
-- it. Subtracting goals.saved as well would count the same money as gone twice
-- and under-report what is spendable.
create or replace function public.safe_to_spend_for(uid uuid, period text default 'daily')
returns bigint
language sql
stable
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
                           and due_on between current_date and public.next_payday(uid)), 0),
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
