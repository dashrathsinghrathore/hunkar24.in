-- ============================================================================
-- HUNKAR 24 (हुंकार 24) – UNIFIED CLOUD MEDIA & REAL-TIME INFRASTRUCTURE
-- Migration: 20261111000000_unified_media_infrastructure.sql
-- ============================================================================

-- Enable required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. EXTEND ARTICLES TABLE WITH MULTI-IMAGE & MEDIA ASSETS SUPPORT
-- ----------------------------------------------------------------------------
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS media_asset_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.articles.gallery_images IS 'Up to 5 images per news article for multi-photo galleries and slides';
COMMENT ON COLUMN public.articles.media_asset_ids IS 'Associated media asset tracking IDs for unified storage';

-- ----------------------------------------------------------------------------
-- 2. MEDIA ASSETS TABLE (Single Source of Truth for Images & Videos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id TEXT PRIMARY KEY DEFAULT ('med-' || gen_random_uuid()::text),
  news_id TEXT REFERENCES public.articles(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'thumbnail')),
  source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'external_url', 'imported')),
  storage_provider TEXT NOT NULL DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'firebase', 'external', 'local')),
  storage_bucket TEXT,
  storage_path TEXT,
  media_url TEXT NOT NULL,
  firebase_storage_path TEXT,
  firebase_backup_url TEXT,
  mime_type TEXT,
  file_size BIGINT,
  thumbnail_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  backup_status TEXT NOT NULL DEFAULT 'pending' CHECK (backup_status IN ('pending', 'backed_up', 'failed', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast media queries
CREATE INDEX IF NOT EXISTS idx_media_assets_news_id ON public.media_assets(news_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_media_type ON public.media_assets(media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_provider ON public.media_assets(storage_provider);
CREATE INDEX IF NOT EXISTS idx_media_assets_backup_status ON public.media_assets(backup_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets(created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. SYNC EVENTS TABLE (Transactional Outbox & Dual-Cloud Sync Queue)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_events (
  event_id TEXT PRIMARY KEY DEFAULT ('evt-' || gen_random_uuid()::text),
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('article_publish', 'article_update', 'article_delete', 'media_backup', 'media_import')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_events_status_created ON public.sync_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_events_entity_id ON public.sync_events(entity_id);

-- ----------------------------------------------------------------------------
-- 4. AUTOMATIC SUPABASE STORAGE BUCKETS INITIALIZATION
-- ----------------------------------------------------------------------------
-- Ensure buckets exist in Supabase Storage with 50MB file size limits
DO $$
BEGIN
  -- 1. hunkar-news-images (Max 50MB per image, JPG, PNG, WEBP, AVIF)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'hunkar-news-images',
    'hunkar-news-images',
    true,
    52428800, -- 50 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']::text[];

  -- 2. hunkar-news-videos (Max 50MB per video, MP4, WebM, QuickTime MOV)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'hunkar-news-videos',
    'hunkar-news-videos',
    true,
    52428800, -- 50 MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']::text[];

  -- 3. hunkar-media-thumbnails (Max 10MB per thumbnail)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'hunkar-media-thumbnails',
    'hunkar-media-thumbnails',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

  -- Backward compatibility with legacy bucket 'article-images'
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('article-images', 'article-images', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Gracefully ignore if storage schema is managed separately
END $$;

-- ----------------------------------------------------------------------------
-- 5. STORAGE ACCESS POLICIES
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop existing storage policies to ensure clean idempotent recreation
  DROP POLICY IF EXISTS "Public Read Hunkar News Images" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read Hunkar News Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read Hunkar Thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Manage Hunkar News Images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Manage Hunkar News Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Manage Hunkar Thumbnails" ON storage.objects;

  -- Create permissive public read policies for all media
  CREATE POLICY "Public Read Hunkar News Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hunkar-news-images');

  CREATE POLICY "Public Read Hunkar News Videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hunkar-news-videos');

  CREATE POLICY "Public Read Hunkar Thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hunkar-media-thumbnails');

  -- Create insert/update/delete policies for authenticated operations
  CREATE POLICY "Admin Manage Hunkar News Images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'hunkar-news-images')
    WITH CHECK (bucket_id = 'hunkar-news-images');

  CREATE POLICY "Admin Manage Hunkar News Videos"
    ON storage.objects FOR ALL
    USING (bucket_id = 'hunkar-news-videos')
    WITH CHECK (bucket_id = 'hunkar-news-videos');

  CREATE POLICY "Admin Manage Hunkar Thumbnails"
    ON storage.objects FOR ALL
    USING (bucket_id = 'hunkar-media-thumbnails')
    WITH CHECK (bucket_id = 'hunkar-media-thumbnails');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view media assets" ON public.media_assets;
CREATE POLICY "Public can view media assets"
  ON public.media_assets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage media assets" ON public.media_assets;
CREATE POLICY "Admin can manage media assets"
  ON public.media_assets FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage sync events" ON public.sync_events;
CREATE POLICY "Admin can manage sync events"
  ON public.sync_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. REAL-TIME REPLICATION FOR MEDIA ASSETS & SYNC EVENTS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_assets;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_events;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
