-- Demo data as real rows.
--
-- The localStorage build layered a fake account list over the real one and kept
-- user edits in a separate "overrides" map, because the demo set was a
-- constant it could not write to. With a database there is no reason for that:
-- seeding inserts ordinary rows the person can rename, delete and post entries
-- against, and turning the setting off deletes exactly those rows again.

alter table public.accounts     add column is_demo boolean not null default false;
alter table public.entries      add column is_demo boolean not null default false;
alter table public.goals        add column is_demo boolean not null default false;
alter table public.commitments  add column is_demo boolean not null default false;

-- Partial indexes: the only question ever asked of this column is "which rows
-- are demo rows", and they are a minority.
create index accounts_demo_idx    on public.accounts (user_id)    where is_demo;
create index entries_demo_idx     on public.entries (user_id)     where is_demo;
create index goals_demo_idx       on public.goals (user_id)       where is_demo;
create index commitments_demo_idx on public.commitments (user_id) where is_demo;

-- ── seeding ──────────────────────────────────────────────────────────────────

-- Figures mirror src/demo-data.ts. Dates are relative to the call, so the
-- sample never looks abandoned no matter when the setting is switched on.
create or replace function public.seed_demo_data()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    uid uuid := (select auth.uid());
    momo uuid;
    equity uuid;
    savings uuid;
    cash uuid;
begin
    if uid is null then
        raise exception 'Not signed in.';
    end if;

    -- Idempotent: switching the setting on twice must not double the sample.
    perform public.clear_demo_data();

    insert into public.accounts (user_id, name, kind, balance, theme, balance_updated_at, is_demo)
    values
        (uid, 'MTN MoMo',    'Mobile money', 684000, 'blue',     now(),                  true),
        (uid, 'Equity Bank', 'Bank account', 612000, 'graphite', now() - interval '2 days', true),
        (uid, 'Laptop fund', 'Savings',      168000, 'emerald',  now() - interval '5 days', true),
        (uid, 'Cash',        'Cash',           4000, 'plum',     now(),                  true);

    select id into momo    from public.accounts where user_id = uid and is_demo and name = 'MTN MoMo';
    select id into equity  from public.accounts where user_id = uid and is_demo and name = 'Equity Bank';
    select id into savings from public.accounts where user_id = uid and is_demo and name = 'Laptop fund';
    select id into cash    from public.accounts where user_id = uid and is_demo and name = 'Cash';

    insert into public.entries (user_id, account_id, account_name, kind, name, note, amount, balance_after, occurred_at, is_demo)
    values
        (uid, momo,   'MTN MoMo',    'balance', 'Balance updated', 'Checked after lunch', 684000, 684000, now() - interval '2 hours',   true),
        (uid, cash,   'Cash',        'expense', 'Groceries',       'Weekly shop',          12400,   4000, now() - interval '20 hours',  true),
        (uid, momo,   'MTN MoMo',    'expense', 'Airtime',          null,                   2000, 696400, now() - interval '26 hours',  true),
        (uid, equity, 'Equity Bank', 'income',  'Client payment',  'Invoice #114',        320000, 612000, now() - interval '50 hours',  true),
        (uid, momo,   'MTN MoMo',    'expense', 'Transport',        null,                   4500, 698400, now() - interval '74 hours',  true),
        (uid, equity, 'Equity Bank', 'balance', 'Balance updated',  null,                 612000, 612000, now() - interval '96 hours',  true),
        (uid, equity, 'Equity Bank', 'expense', 'Rent',            'October',             450000, 292000, now() - interval '120 hours', true),
        (uid, cash,   'Cash',        'income',  'Refund',          'Returned headphones',  18000,  16400, now() - interval '144 hours', true);

    insert into public.goals (user_id, name, saved, target, started_at, is_demo)
    values
        (uid, 'Laptop',         168000,  420000, now() - interval '4 months',  true),
        (uid, 'Emergency fund', 744000, 1200000, now() - interval '14 months', true),
        (uid, 'Trip home',       62000,  400000, now() - interval '1 month',   true);

    insert into public.commitments (user_id, name, amount, due_on, pressure, is_demo)
    values
        (uid, 'Netflix',      18000, current_date,            'ok',    true),
        (uid, 'Rent',        450000, current_date + 1,        'over',  true),
        (uid, 'Phone bundle', 25000, current_date + 8,        'ok',    true),
        (uid, 'School fees', 180000, current_date + 11,       'tight', true),
        (uid, 'Gym',          30000, current_date + 13,       'ok',    true),
        (uid, 'Insurance',    64000, current_date + 20,       'ok',    true);
end;
$$;

-- Deletes only seeded rows, so switching the setting off never touches anything
-- the person entered themselves.
create or replace function public.clear_demo_data()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    uid uuid := (select auth.uid());
begin
    if uid is null then
        raise exception 'Not signed in.';
    end if;

    -- Entries first: the balance-sync trigger reads the account they point at.
    delete from public.entries     where user_id = uid and is_demo;
    delete from public.commitments where user_id = uid and is_demo;
    delete from public.goals       where user_id = uid and is_demo;
    delete from public.accounts    where user_id = uid and is_demo;
end;
$$;
