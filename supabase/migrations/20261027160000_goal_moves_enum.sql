-- Moving money in and out of a goal.
--
-- Deliberately not recorded as expense/income: a deposit is not spending, and
-- counting it as such would inflate "Spent today" and the in-vs-out chart every
-- time someone saved. New kinds keep those aggregates honest, since they filter
-- on 'expense' and 'income' explicitly.
--
-- Separate migration from the function that uses them: Postgres refuses to use
-- a new enum value in the same transaction that added it.

alter type public.entry_kind add value if not exists 'goal_deposit';
alter type public.entry_kind add value if not exists 'goal_withdrawal';

-- Which goal the money moved to or from. Null for every other kind.
alter table public.entries add column if not exists goal_id uuid references public.goals (id) on delete set null;

create index if not exists entries_goal_idx on public.entries (goal_id) where goal_id is not null;
