-- Scheduled work.
--
-- Three jobs: take a snapshot once a day, raise notifications hourly, and let
-- the morning mail decide hourly whose local 07:00 has just arrived.

-- Tracks the last morning mail so the streak can tell "yesterday" from "a week
-- ago", and so a retried run does not mail twice in one day.
alter table public.profiles add column last_mail_on date;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ── where the functions live ─────────────────────────────────────────────────
--
-- Kept in a table rather than hard-coded into each job, so the project ref and
-- the cron secret are set once. This holds a secret, so it is owner-only: no
-- RLS policy is granted to anyone, and RLS is on to make that explicit.

create table public.job_config (
    key text primary key,
    value text not null
);

alter table public.job_config enable row level security;
-- Deliberately no policies: only the service role and SECURITY DEFINER
-- functions ever read this.

comment on table public.job_config is
    'Edge function base URL and cron secret. Never exposed to the client — set with: '
    'insert into job_config values (''functions_url'', ''https://<ref>.supabase.co/functions/v1''), (''cron_secret'', ''<secret>'');';

-- Calls one Edge Function. SECURITY DEFINER so the cron job (which runs as the
-- table owner) can read the secret without that secret being readable anywhere
-- else.
create or replace function public.invoke_job(job_name text)
returns bigint
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
    base_url text;
    secret text;
begin
    select value into base_url from public.job_config where key = 'functions_url';
    select value into secret   from public.job_config where key = 'cron_secret';

    if base_url is null or secret is null then
        raise notice 'job_config is not set; skipping %', job_name;
        return null;
    end if;

    -- Asynchronous: pg_net queues the request and returns immediately, so a
    -- slow function never holds the cron worker open.
    return net.http_post(
        url := base_url || '/' || job_name,
        headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
        body := '{}'::jsonb
    );
end;
$$;

revoke all on function public.invoke_job(text) from public, anon, authenticated;

-- ── the schedule ─────────────────────────────────────────────────────────────

-- Snapshots at 23:50 UTC: late enough to capture the day almost everywhere,
-- before the date rolls over on the server.
select cron.schedule('margin-daily-snapshots', '50 23 * * *', $$select public.take_daily_snapshots()$$);

-- Hourly, a few minutes past, so it never races the snapshot job.
select cron.schedule('margin-notifications', '5 * * * *', $$select public.invoke_job('build-notifications')$$);

-- Hourly on the hour. The function itself picks whose local hour it now is.
select cron.schedule('margin-morning-mail', '0 * * * *', $$select public.invoke_job('morning-mail')$$);
