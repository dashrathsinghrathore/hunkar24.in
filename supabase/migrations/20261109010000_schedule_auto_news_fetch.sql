-- ============================================================================
-- HUNKAR 24 (हुंकार 24) — 180-MINUTE SCHEDULED CRON & PRODUCTION DATABASE HARMONIZATION
-- Migration: 20261109010000_schedule_auto_news_fetch.sql
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Ensure public.articles has all required columns safely without changing UUID or ENUM types
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_name TEXT DEFAULT 'हुंकार 24 ग्राउंड नेटवर्क';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS original_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'hi';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;

-- Ensure default UUID generation is active on id column if not already set
ALTER TABLE public.articles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_slug ON public.articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_original_url ON public.articles(original_url);

-- 3. Automation Logs Table (For real-time admin monitoring of auto-news jobs)
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT,
  action TEXT NOT NULL,
  articles_fetched INT DEFAULT 0,
  articles_published INT DEFAULT 0,
  duplicates_filtered INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'warning', 'error')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON public.automation_logs(created_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view automation logs" ON public.automation_logs;
DROP POLICY IF EXISTS "Staff can view automation logs" ON public.automation_logs;
CREATE POLICY "Staff can view automation logs"
  ON public.automation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Service role can insert automation logs" ON public.automation_logs;
DROP POLICY IF EXISTS "Service role can manage automation logs" ON public.automation_logs;
CREATE POLICY "Service role can manage automation logs"
  ON public.automation_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Enable Realtime Replication for instant multi-device sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 5. Unschedule old 30-minute cron jobs idempotently
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('hunkar24-auto-news-30m');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('auto-news-30min-job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('hunkar24-auto-news-180m');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 6. Schedule 180-Minute (3-Hour) Supabase Cron Job
-- Schedule expression: '0 */3 * * *' (At minute 0 past every 3rd hour)
-- Uses Supabase project URL and service-role key or CRON_SECRET
SELECT
  cron.schedule(
    'hunkar24-auto-news-180m',
    '0 */3 * * *',
    $$
    SELECT net.http_post(
      url := COALESCE(
        current_setting('app.settings.edge_function_url', true),
        'https://your-project-ref.supabase.co/functions/v1/auto-news-fetch'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.cron_secret', true), current_setting('app.settings.service_role_key', true), '')
      ),
      body := jsonb_build_object(
        'triggered_by', 'pg_cron_180m',
        'timestamp', now()
      )
    ) AS request_id;
    $$
  );
