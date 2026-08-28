-- Scheduled invocation template for notification-worker.
-- Apply only after storing a secret named notification_worker_secret in Supabase Vault
-- and adding the same value as NOTIFICATION_WORKER_SECRET to Edge Function secrets.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invoke_notification_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $fn$
DECLARE
  worker_secret text;
BEGIN
  SELECT decrypted_secret INTO worker_secret
  FROM vault.decrypted_secrets
  WHERE name = 'notification_worker_secret'
  LIMIT 1;

  IF worker_secret IS NULL OR worker_secret = '' THEN
    RAISE WARNING 'notification_worker_secret is not configured; worker was not invoked';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://aewcdaooguwzieehtkbz.supabase.co/functions/v1/notification-worker',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-worker-secret', worker_secret),
    body := '{}'::jsonb
  );
END;
$fn$;

-- Replace an existing job without creating duplicates.
DO $job$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'asateer-notification-worker') THEN
    PERFORM cron.unschedule('asateer-notification-worker');
  END IF;
  PERFORM cron.schedule('asateer-notification-worker', '*/5 * * * *', $cron$SELECT public.invoke_notification_worker();$cron$);
END
$job$;
