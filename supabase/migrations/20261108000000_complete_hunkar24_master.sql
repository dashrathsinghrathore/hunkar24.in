-- ============================================================================
-- HUNKAR 24 (हुंकार 24) – COMPLETE MASTER DATABASE CONSOLIDATED MIGRATION
-- Migration: 20261108000000_complete_hunkar24_master.sql
-- ============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name_hi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default news categories
INSERT INTO public.categories (slug, name_hi, name_en, display_order)
VALUES
  ('rajasthan', 'राजस्थान', 'Rajasthan', 1),
  ('national', 'देश', 'National', 2),
  ('world', 'विदेश', 'World', 3),
  ('politics', 'राजनीति', 'Politics', 4),
  ('education', 'शिक्षा', 'Education', 5),
  ('jobs', 'सरकारी नौकरी', 'Government Jobs', 6),
  ('business', 'व्यापार', 'Business', 7),
  ('technology', 'तकनीक', 'Technology', 8),
  ('sports', 'खेलकूद', 'Sports', 9),
  ('agriculture', 'कृषि व मंडी', 'Agriculture', 10),
  ('entertainment', 'मनोरंजन', 'Entertainment', 11),
  ('breaking', 'ब्रेकिंग न्यूज़', 'Breaking News', 12)
ON CONFLICT (slug) DO UPDATE
SET name_hi = EXCLUDED.name_hi, name_en = EXCLUDED.name_en;

-- ----------------------------------------------------------------------------
-- 2. REPORTERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reporters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'reporter',
  avatar_url TEXT,
  assigned_district TEXT DEFAULT 'rajasthan',
  assigned_tehsil TEXT,
  is_verified BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  published_article_count INT DEFAULT 0,
  bio TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. ARTICLES TABLE (Text Primary Key for zero-error insertion of string IDs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT 'rajasthan',
  district TEXT,
  tehsil TEXT,
  village TEXT,
  main_image TEXT NOT NULL,
  image_caption TEXT,
  image_source TEXT,
  reporter_id TEXT,
  reporter_name TEXT NOT NULL DEFAULT 'हुंकार 24 ब्यूरो',
  reporter_role TEXT DEFAULT 'संवाददाता',
  reporter_photo TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  is_breaking BOOLEAN DEFAULT false,
  is_hero BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,
  views_count BIGINT DEFAULT 1,
  likes_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 3,
  tags TEXT[] DEFAULT ARRAY['राजस्थान', 'हुंकार24']::TEXT[],
  video_url TEXT,
  language TEXT DEFAULT 'hi',
  source_name TEXT DEFAULT 'हुंकार 24 ग्राउंड नेटवर्क',
  original_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns safely if table previously existed
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS original_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'hi';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;

-- Indexes for lightning fast reader queries
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_district ON public.articles(district);
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON public.articles(is_breaking);

-- ----------------------------------------------------------------------------
-- 4. BREAKING NEWS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.breaking_news (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link_article_id TEXT,
  link_url TEXT,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breaking_active ON public.breaking_news(is_active, priority DESC);

-- ----------------------------------------------------------------------------
-- 5. ADVERTISEMENTS TABLE (Admin-Managed, Zero Demo Ads)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advertisements (
  id TEXT PRIMARY KEY,
  campaign_title TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  placement TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  desktop_visible BOOLEAN DEFAULT true,
  mobile_visible BOOLEAN DEFAULT true,
  impressions_count BIGINT DEFAULT 0,
  clicks_count BIGINT DEFAULT 0,
  pricing_inr NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_by_admin BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. USER SUBMISSIONS (Citizen Journalism)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_submissions (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  district TEXT NOT NULL,
  tehsil TEXT,
  village TEXT,
  submitter_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_article_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. NEWS SOURCES (Configured news feeds & providers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'rss', 'custom')),
  endpoint TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_day INT DEFAULT 500,
  requests_today INT DEFAULT 0,
  last_status TEXT DEFAULT 'active',
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.news_sources (id, name, source_type, endpoint, is_enabled)
VALUES
  ('newsapi', 'NewsAPI.org', 'api', 'https://newsapi.org/v2', true),
  ('newsdata', 'NewsData.io (Hindi)', 'api', 'https://newsdata.io/api/1/latest', true),
  ('gnews', 'GNews.io (Regional)', 'api', 'https://gnews.io/api/v4', true),
  ('google_news_rss', 'Google News RSS (Rajasthan & Mandi)', 'rss', 'https://news.google.com/rss', true),
  ('bbc_hindi_rss', 'बीबीसी हिंदी RSS', 'rss', 'https://feeds.bbci.co.uk/hindi/rss.xml', true)
ON CONFLICT (id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- ----------------------------------------------------------------------------
-- 8. AUTOMATION SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_settings (
  id TEXT PRIMARY KEY DEFAULT 'master_config',
  auto_news_enabled BOOLEAN NOT NULL DEFAULT true,
  fetch_interval_minutes INT NOT NULL DEFAULT 30,
  publishing_mode TEXT NOT NULL DEFAULT 'auto_safe' CHECK (publishing_mode IN ('manual', 'auto_safe', 'paused', 'emergency_stop')),
  prioritize_rajasthan BOOLEAN NOT NULL DEFAULT true,
  gemini_ai_enabled BOOLEAN NOT NULL DEFAULT true,
  duplicate_detection_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.automation_settings (id, auto_news_enabled, fetch_interval_minutes, publishing_mode, prioritize_rajasthan)
VALUES ('master_config', true, 30, 'auto_safe', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. AUTOMATION LOGS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. ADMIN USERS & SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT 'प्रशासक',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'reporter')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 11. NEWSLETTER SUBSCRIBERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  edition TEXT NOT NULL DEFAULT 'rajasthan',
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop prior policies to avoid duplicate policy errors
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Public can view active breaking news" ON public.breaking_news;
DROP POLICY IF EXISTS "Public can view visible categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;
DROP POLICY IF EXISTS "Public can insert citizen submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public read reporters" ON public.reporters;

-- Recreate clean permissive read policies
CREATE POLICY "Public can view published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view active breaking news"
  ON public.breaking_news FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view visible categories"
  ON public.categories FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can view active advertisements"
  ON public.advertisements FOR SELECT
  USING (status = 'active' AND approved = true AND is_demo = false);

CREATE POLICY "Public can insert citizen submissions"
  ON public.user_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read reporters"
  ON public.reporters FOR SELECT
  USING (is_active = true);

-- Enable Realtime replication for instant multi-device live sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.breaking_news;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
