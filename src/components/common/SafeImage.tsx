import React, { useState, useEffect } from 'react';
import { getTopicAccurateImage } from '../../utils/newsImageMatcher';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  category?: string;
  district?: string;
  className?: string;
  aspectRatio?: string;
  imageType?: 'photo' | 'ai_illustration' | 'document' | 'graphic';
}

/**
 * Normalizes image URLs to direct high-res images.
 * Automatically converts ImgBB page links (ibb.co/xyz) to direct images (i.ibb.co/...).
 */
export function normalizeDirectImageUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const clean = rawUrl.trim();

  // If already direct image or local asset
  if (
    clean.startsWith('/assets/') ||
    clean.startsWith('data:image/') ||
    clean.startsWith('blob:') ||
    clean.includes('i.ibb.co/') ||
    clean.includes('supabase.co/storage/v1/object/public/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(clean)
  ) {
    return clean;
  }

  // Known ImgBB page links
  if (clean.includes('ibb.co/xtFcQHhM')) {
    return 'https://i.ibb.co/hJYnvfsK/Whats-App-Image-2026-11-09-at-19-06-47.jpg';
  }
  if (clean.includes('ibb.co/v6p5rwwb')) {
    return 'https://i.ibb.co/67zhpnn2/image.png';
  }

  return clean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  category = 'rajasthan',
  district,
  className = '',
  loading = 'lazy',
  imageType,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [normalizedSrc, setNormalizedSrc] = useState(() => normalizeDirectImageUrl(src));

  // Whenever src prop changes, reset error state & normalize
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    const direct = normalizeDirectImageUrl(src);
    setNormalizedSrc(direct);

    // If an ibb.co page URL was passed that is not yet direct, attempt server resolution
    if (direct && direct.includes('ibb.co/') && !direct.includes('i.ibb.co/')) {
      fetch(`/api/resolve-image-url?url=${encodeURIComponent(direct)}`)
        .then(r => r.json())
        .then(data => {
          if (data?.success && data?.directUrl && data.directUrl !== direct) {
            setNormalizedSrc(data.directUrl);
          }
        })
        .catch(() => {});
    }
  }, [src]);

  // Compute topic-accurate image fallback
  const topicVisual = getTopicAccurateImage(alt, category, district, normalizedSrc);
  const imageSrc = (!normalizedSrc || hasError) ? topicVisual.imageUrl : normalizedSrc;
  const effectiveImageType = imageType || topicVisual.imageType;

  return (
    <div className={`relative overflow-hidden bg-stone-100 dark:bg-stone-800 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200 dark:bg-stone-800 animate-pulse flex items-center justify-center">
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">हुंकार 24</span>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt || topicVisual.imageAlt || 'हुंकार 24 समाचार'}
        loading={loading}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
      {effectiveImageType === 'ai_illustration' && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="bg-stone-900/80 backdrop-blur-xs text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            🎨 प्रतीकात्मक AI इलस्ट्रेशन
          </span>
        </div>
      )}
    </div>
  );
};
