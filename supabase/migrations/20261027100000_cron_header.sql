-- Send the cron secret in its own header.
--
-- The first version put it in `Authorization: Bearer <secret>`. Supabase's
-- function gateway parses that header as a JWT before the function runs, so
-- every scheduled call was rejected upstream with "Invalid JWT" and the
-- function's own check never ran — the jobs fired hourly and did nothing.
--
-- The secret now travels as `x-cron-secret`, which the gateway ignores, and the
-- two functions set `verify_jwt = false` so they are reachable at all.

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
        headers := jsonb_build_object('x-cron-secret', secret, 'Content-Type', 'application/json'),
        body := '{}'::jsonb
    );
end;
$$;

revoke all on function public.invoke_job(text) from public, anon, authenticated;
