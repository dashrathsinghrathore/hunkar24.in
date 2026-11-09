-- Hunkar 24: Scheduled Cron Setup for Supabase Edge Function
-- Enables pg_cron and pg_net to invoke auto-news-fetch every 30 minutes

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule edge function execution every 30 minutes
-- Note: Replace [YOUR_PROJECT_REF] with your Supabase project reference if using pg_cron directly
-- Or trigger via Supabase Dashboard > Edge Functions > Cron triggers

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('hunkar24-auto-news-30m');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Scheduled job configuration (Idempotent)
SELECT
  cron.schedule(
    'hunkar24-auto-news-30m',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
      url := 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/auto-news-fetch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
    $$
  );
