-- ============================================================================
-- HUNKAR 24 — AUTOMATIC NEWS NETWORK DATABASE MIGRATION
-- Migration: 20261107000001_auto_news_network.sql
-- Tables for 7 providers, deduplication, AI processing & editorial review
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NEWS PROVIDER CONFIGS
CREATE TABLE IF NOT EXISTS public.news_provider_configs (
  id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('api', 'rss', 'custom')),
  endpoint TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_day INT DEFAULT 500,
  requests_today INT DEFAULT 0,
  last_fetched_at TIMESTAMPTZ,
  last_status TEXT DEFAULT 'idle',
  last_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial providers
INSERT INTO public.news_provider_configs (id, provider_name, provider_type, endpoint, is_enabled, rate_limit_per_day)
VALUES
  ('newsapi', 'NewsAPI.org', 'api', 'https://newsapi.org/v2', true, 100),
  ('newsdata', 'NewsData.io', 'api', 'https://newsdata.io/api/1/latest', true, 200),
  ('gnews', 'GNews.io', 'api', 'https://gnews.io/api/v4', true, 100),
  ('google_news_rss', 'Google News RSS (Rajasthan & Hindi)', 'rss', 'https://news.google.com/rss', true, 1000),
  ('provider_5', 'Additional News API 1 (Custom)', 'custom', '', false, 500),
  ('provider_6', 'Additional News API 2 (Custom)', 'custom', '', false, 500),
  ('provider_7', 'Additional News API 3 (Custom)', 'custom', '', false, 500)
ON CONFLICT (id) DO NOTHING;

-- 2. NEWS SOURCES
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id TEXT REFERENCES public.news_provider_configs(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT,
  language TEXT DEFAULT 'hi',
  country TEXT DEFAULT 'in',
  reliability_score NUMERIC(3, 2) DEFAULT 0.90,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. NEWS FETCH JOBS
CREATE TABLE IF NOT EXISTS public.news_fetch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL DEFAULT 'scheduled',
  provider_id TEXT REFERENCES public.news_provider_configs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  articles_fetched INT DEFAULT 0,
  articles_imported INT DEFAULT 0,
  duplicates_detected INT DEFAULT 0,
  error_log TEXT
);

-- 4. NEWS IMPORTED ARTICLES (RAW & DEDUPLICATED)
CREATE TABLE IF NOT EXISTS public.news_imported_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_url TEXT NOT NULL UNIQUE,
  original_title TEXT NOT NULL,
  original_language TEXT DEFAULT 'hi',
  title_hindi TEXT NOT NULL,
  summary_hindi TEXT NOT NULL,
  content_hindi TEXT,
  category TEXT DEFAULT 'national',
  district TEXT,
  tehsil TEXT,
  primary_source_name TEXT NOT NULL,
  primary_source_url TEXT NOT NULL,
  image_url TEXT,
  image_source TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_level TEXT NOT NULL DEFAULT 'single_source',
  sensitive_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  duplicate_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'archived')),
  approved_article_id UUID,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 5. DUPLICATE GROUPS
CREATE TABLE IF NOT EXISTS public.news_duplicate_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_imported_id UUID REFERENCES public.news_imported_articles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. EDITORIAL REVIEWS & AUDIT
CREATE TABLE IF NOT EXISTS public.news_editorial_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imported_article_id UUID NOT NULL REFERENCES public.news_imported_articles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'edited_and_approved')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. NEWS SCHEDULES
CREATE TABLE IF NOT EXISTS public.news_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interval_minutes INT NOT NULL DEFAULT 30,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  publishing_mode TEXT NOT NULL DEFAULT 'manual' CHECK (publishing_mode IN ('manual', 'auto_safe')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. API USAGE LOGS
CREATE TABLE IF NOT EXISTS public.news_api_usage (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT REFERENCES public.news_provider_configs(id) ON DELETE CASCADE,
  endpoint_called TEXT NOT NULL,
  response_status INT,
  latency_ms INT,
  quota_remaining INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_imported_canonical_url ON public.news_imported_articles(canonical_url);
CREATE INDEX IF NOT EXISTS idx_imported_status ON public.news_imported_articles(status, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_imported_district ON public.news_imported_articles(district);
CREATE INDEX IF NOT EXISTS idx_imported_category ON public.news_imported_articles(category);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_started ON public.news_fetch_jobs(started_at DESC);

-- 10. RLS POLICIES
ALTER TABLE public.news_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_imported_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_editorial_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_duplicate_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved imported news"
  ON public.news_imported_articles FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Staff can manage all imported articles"
  ON public.news_imported_articles FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Staff can view and update provider configs"
  ON public.news_provider_configs FOR ALL
  TO authenticated
  USING (true);
