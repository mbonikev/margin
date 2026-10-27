-- safe_to_spend() could not call the function it delegates to.
--
-- It was SECURITY INVOKER, so it ran as `authenticated` — the very role that
-- has EXECUTE revoked on safe_to_spend_for() and next_payday(). Every call
-- from the browser failed with permission denied, the query errored, and the
-- dashboard fell back to its `?? 0`. The tile read "0" beside an account
-- holding 309,349.
--
-- DEFINER here is safe in a way it is not on safe_to_spend_for: this one takes
-- no uid. It hard-wires auth.uid(), so it can only ever answer for whoever is
-- calling, and auth.uid() reads the request's JWT claim, which is session
-- state and survives the change in execution rights.

create or replace function public.safe_to_spend(period text default 'daily')
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select public.safe_to_spend_for((select auth.uid()), period);
$$;

-- Anonymous callers have no auth.uid(), so this would return nothing useful;
-- only a signed-in session should reach it at all.
revoke all on function public.safe_to_spend(text) from public, anon;
grant execute on function public.safe_to_spend(text) to authenticated;
