-- ============================================================================
-- HUNKAR 24 — SUPABASE CRON (30-MIN), AUTO-PUBLISHING & ADVERTISEMENT AUDIT
-- Migration: 20261107000002_cron_and_auto_publish.sql
-- ============================================================================

-- 1. Enable pg_cron and pg_net extensions if available
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Update default publishing mode in news_schedules to auto_safe
UPDATE public.news_schedules 
SET publishing_mode = 'auto_safe', interval_minutes = 30
WHERE id IS NOT NULL;

-- 3. Scheduled pg_cron job for 30-minute background news collection
-- Note: Invokes Supabase Edge Function auto-news-fetch every 30 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'auto-news-30min-job',
      '*/30 * * * *',
      $$
      SELECT net.http_post(
        url := (SELECT COALESCE(current_setting('app.settings.edge_function_url', true), 'https://your-project.supabase.co/functions/v1/auto-news-fetch')),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.service_role_key', true), '')
        ),
        body := jsonb_build_object(
          'triggered_by', 'pg_cron_30min',
          'publishing_mode', 'auto_safe',
          'timestamp', now()
        )
      ) AS request_id;
      $$
    );
  END IF;
END $$;

-- 4. Advertisements Table (Admin-Managed, Zero Demo Ads)
CREATE TABLE IF NOT EXISTS public.advertisement_campaigns (
  id TEXT PRIMARY KEY,
  campaign_title TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  placement TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  desktop_visible BOOLEAN DEFAULT true,
  mobile_visible BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  pricing_inr NUMERIC(10, 2) DEFAULT 0,
  created_by_admin BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for live public ads queries
CREATE INDEX IF NOT EXISTS idx_ads_active_public 
  ON public.advertisement_campaigns(status, placement, start_date, end_date) 
  WHERE status = 'active' AND approved = true AND is_demo = false;

-- RLS: Public can view active valid ads; staff can manage
ALTER TABLE public.advertisement_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active approved ads"
  ON public.advertisement_campaigns FOR SELECT
  USING (
    status = 'active' 
    AND approved = true 
    AND is_demo = false
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  );

CREATE POLICY "Staff can manage all advertisement campaigns"
  ON public.advertisement_campaigns FOR ALL
  TO authenticated
  USING (true);

-- 5. Audit Log Table for Security, Password, and Publishing Events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'admin_login', 'password_change', 'publish_mode_change', 'ad_created'
  actor_role TEXT NOT NULL DEFAULT 'super_admin',
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated super admin can view security logs"
  ON public.security_audit_logs FOR SELECT
  TO authenticated
  USING (true);
