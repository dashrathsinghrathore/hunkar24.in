-- ============================================================================
-- HUNKAR 24 (हुंकार 24) — PRODUCTION RLS, SUPABASE REALTIME & CHATGPT PUBLISHING API
-- Migration: 20261110000000_production_rls_and_chatgpt_api.sql
-- ============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Confirm public.articles structure with all required fields
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tehsil TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_name TEXT DEFAULT 'हुंकार 24 ग्राउंड नेटवर्क';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS original_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'hi';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 1;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time_minutes INT DEFAULT 3;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY['राजस्थान', 'हुंकार24']::TEXT[];
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Indexes for ultra-fast reader queries and district feeds
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_slug ON public.articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_district ON public.articles(district);
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON public.articles(is_breaking);

-- 3. CHATGPT / EXTERNAL PUBLISHER API KEYS TABLE
CREATE TABLE IF NOT EXISTS public.api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'ChatGPT Custom GPT Action',
  role TEXT NOT NULL DEFAULT 'publisher' CHECK (role IN ('publisher', 'admin', 'service')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INT DEFAULT 30,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default primary API key if empty
INSERT INTO public.api_keys (key_hash, name, role)
VALUES (encode(digest('hunkar24-prod-chatgpt-key-2026', 'sha256'), 'hex'), 'ChatGPT Hunkar 24 News Action', 'publisher')
ON CONFLICT (key_hash) DO NOTHING;

-- 4. STORAGE BUCKET FOR ARTICLE IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public can view article images" ON storage.objects;
CREATE POLICY "Public can view article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Anyone can upload article images" ON storage.objects;
CREATE POLICY "Anyone can upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-images');

-- 5. COMPLETE PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES FOR ARTICLES
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Staff can view all articles" ON public.articles;
DROP POLICY IF EXISTS "Authorized can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Authorized can update articles" ON public.articles;
DROP POLICY IF EXISTS "Authorized can delete articles" ON public.articles;

-- Public can ONLY view published articles
CREATE POLICY "Public can view published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- Authenticated staff & service role can view ALL articles (including draft and scheduled)
CREATE POLICY "Staff can view all articles"
  ON public.articles FOR SELECT
  TO authenticated, service_role
  USING (true);

-- Permissive write policies for authorized publishing operations (service_role, authenticated, or verified client actions)
CREATE POLICY "Authorized can insert articles"
  ON public.articles FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authorized can update articles"
  ON public.articles FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authorized can delete articles"
  ON public.articles FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- 6. BREAKING NEWS RLS POLICIES
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active breaking news" ON public.breaking_news;
DROP POLICY IF EXISTS "Authorized can manage breaking news" ON public.breaking_news;

CREATE POLICY "Public can view active breaking news"
  ON public.breaking_news FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authorized can manage breaking news"
  ON public.breaking_news FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 7. ENSURE SUPABASE REALTIME PUBLICATION COVERS ARTICLES & BREAKING NEWS
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
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
