-- Remove the demo-data feature.
--
-- The setting is gone from the app, which leaves `seed_demo_data()` reachable
-- by anyone holding a session and able to POST to /rpc — it would insert four
-- accounts and eight entries into a real person's books, and it clears first,
-- so it would also delete anything already flagged `is_demo`. Dropping it is
-- the point: a new account should see genuine empty states.

drop function if exists public.seed_demo_data();
drop function if exists public.clear_demo_data();

-- The partial indexes go with the column they index.
drop index if exists public.accounts_demo_idx;
drop index if exists public.entries_demo_idx;
drop index if exists public.goals_demo_idx;
drop index if exists public.commitments_demo_idx;

alter table public.accounts    drop column if exists is_demo;
alter table public.entries     drop column if exists is_demo;
alter table public.goals       drop column if exists is_demo;
alter table public.commitments drop column if exists is_demo;
