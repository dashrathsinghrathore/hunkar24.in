-- ============================================================================
-- HUNKAR 24 (हुंकार 24) – MASTER DATABASE SCHEMA MIGRATION
-- Compatible with PostgreSQL & Supabase
-- Target: production-grade digital media ecosystem
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USER ROLES & PROFILES
-- ----------------------------------------------------------------------------
CREATE TYPE app_role AS ENUM (
  'super_admin',
  'admin',
  'editor',
  'reporter',
  'ad_manager',
  'analyst'
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'reporter',
  avatar_url TEXT,
  assigned_district TEXT,
  assigned_tehsil TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES & LOCATIONS (RAJASTHAN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_hi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_hi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  division TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tehsils (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name_hi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. ARTICLES & EDITORIAL
-- ----------------------------------------------------------------------------
CREATE TYPE article_status AS ENUM ('draft', 'scheduled', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT NOT NULL,
  district TEXT,
  tehsil TEXT,
  village TEXT,
  main_image TEXT NOT NULL,
  image_caption TEXT,
  image_source TEXT,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  reporter_role TEXT,
  reporter_photo TEXT,
  status article_status NOT NULL DEFAULT 'draft',
  is_breaking BOOLEAN DEFAULT false,
  is_hero BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  views_count BIGINT DEFAULT 0,
  likes_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 3,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  content TEXT NOT NULL,
  revised_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.breaking_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  link_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  link_url TEXT,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. PUBLIC NEWS SUBMISSIONS (CITIZEN JOURNALISM)
-- ----------------------------------------------------------------------------
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

CREATE TABLE IF NOT EXISTS public.news_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  district TEXT NOT NULL,
  tehsil TEXT NOT NULL,
  village TEXT,
  incident_date TIMESTAMPTZ,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  submitter_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  status submission_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 5. ADVERTISING, SPONSORSHIPS & BUSINESS DIRECTORY
-- ----------------------------------------------------------------------------
CREATE TYPE ad_placement AS ENUM ('top_header', 'middle_feed', 'sidebar', 'article_page', 'mobile_sticky');

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_title TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  placement ad_placement NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  desktop_visible BOOLEAN DEFAULT true,
  mobile_visible BOOLEAN DEFAULT true,
  impressions_count BIGINT DEFAULT 0,
  clicks_count BIGINT DEFAULT 0,
  pricing_inr NUMERIC(10, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT,
  video_url TEXT,
  website_url TEXT,
  preferred_placement TEXT NOT NULL,
  campaign_duration_days INT NOT NULL DEFAULT 7,
  budget_inr NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  whatsapp_number TEXT,
  verified BOOLEAN DEFAULT false,
  rating NUMERIC(2, 1) DEFAULT 4.8,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. MEDIA, VIDEOS & PHOTO GALLERIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  views_count BIGINT DEFAULT 0,
  source TEXT DEFAULT 'youtube',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photo_galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category TEXT NOT NULL,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. AUDIT LOGS, VIEWS & SYSTEM SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_views (
  id BIGSERIAL PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_district ON public.articles(district);
CREATE INDEX IF NOT EXISTS idx_articles_breaking ON public.articles(is_breaking);
CREATE INDEX IF NOT EXISTS idx_breaking_news_active ON public.breaking_news(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.news_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_active_placement ON public.advertisements(status, placement);

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Articles: Public can read published articles, staff can read/write everything
CREATE POLICY "Public can view published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can manage all articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (true);

-- Breaking News: Public can view active breaking news
CREATE POLICY "Public can view active breaking news"
  ON public.breaking_news FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can manage breaking news"
  ON public.breaking_news FOR ALL
  TO authenticated
  USING (true);

-- Categories: Public can view visible categories
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (is_visible = true);

-- News Submissions: Anyone can submit news (Citizen Journalism)
CREATE POLICY "Public can insert submissions"
  ON public.news_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view and moderate submissions"
  ON public.news_submissions FOR ALL
  TO authenticated
  USING (true);

-- Advertisements: Public can view active ads
CREATE POLICY "Public can view active ads"
  ON public.advertisements FOR SELECT
  USING (status = 'active');

CREATE POLICY "Staff can manage ads"
  ON public.advertisements FOR ALL
  TO authenticated
  USING (true);
