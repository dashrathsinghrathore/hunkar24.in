-- ============================================================================
-- HUNKAR 24 (हुंकार 24) - News Quality & Contextual Image Schema Upgrade
-- Migration: 20261110010000_image_metadata_and_quality.sql
-- ============================================================================

-- Add image metadata fields to articles table for contextual matching and AI illustration labeling
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'photo' CHECK (image_type IN ('photo', 'ai_illustration')),
  ADD COLUMN IF NOT EXISTS image_generation_status TEXT DEFAULT 'completed' CHECK (image_generation_status IN ('pending', 'completed', 'failed'));

-- Add comments for documentation
COMMENT ON COLUMN public.articles.image_alt IS 'Descriptive alt text reflecting the authentic subject of the article';
COMMENT ON COLUMN public.articles.image_type IS 'Distinguishes verified field photo from symbolic AI illustration (photo vs ai_illustration)';
COMMENT ON COLUMN public.articles.image_generation_status IS 'Lifecycle tracking of visual asset generation (pending, completed, failed)';

-- Index for querying by image type and status
CREATE INDEX IF NOT EXISTS idx_articles_image_type ON public.articles(image_type);
CREATE INDEX IF NOT EXISTS idx_articles_image_generation_status ON public.articles(image_generation_status);
