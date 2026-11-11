import React, { useState, useEffect } from 'react';
import { getTopicAccurateImage } from '../../utils/newsImageMatcher';
import { Maximize2, X, Download, ExternalLink } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  category?: string;
  district?: string;
  className?: string;
  aspectRatio?: string;
  imageType?: 'photo' | 'ai_illustration' | 'document' | 'graphic';
  allowFullscreen?: boolean;
  fitMode?: 'cover' | 'contain' | 'auto';
}

/**
 * Normalizes image URLs to direct high-res images.
 * Supports:
 * - Supabase Storage URLs (hunkar-news-images, article-images)
 * - Firebase Storage URLs
 * - ImgBB (ibb.co/xyz -> i.ibb.co/...)
 * - Cloudinary & ImageKit
 * - Local /assets/
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
    clean.includes('firebasestorage.googleapis.com') ||
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
  allowFullscreen = false,
  fitMode = 'cover',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [normalizedSrc, setNormalizedSrc] = useState(() => normalizeDirectImageUrl(src));
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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

  // Compute topic-accurate image fallback only if actual image fails
  const topicVisual = getTopicAccurateImage(alt, category, district, normalizedSrc);
  const imageSrc = (!normalizedSrc || hasError) ? topicVisual.imageUrl : normalizedSrc;
  const effectiveImageType = imageType || topicVisual.imageType;

  const objectFitClass = fitMode === 'contain' ? 'object-contain' : fitMode === 'auto' ? 'object-scale-down' : 'object-cover';

  return (
    <>
      <div className={`relative overflow-hidden bg-stone-100 dark:bg-stone-850 group ${className}`}>
        {/* Placeholder skeleton during initial paint */}
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
          className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...rest}
        />

        {/* AI illustration badge if symbolically generated */}
        {effectiveImageType === 'ai_illustration' && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-stone-900/85 backdrop-blur-xs text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              🎨 प्रतीकात्मक AI इलस्ट्रेशन
            </span>
          </div>
        )}

        {/* Fullscreen zoom button if requested */}
        {allowFullscreen && isLoaded && (
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-stone-900/70 hover:bg-stone-900 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
            title="तस्वीर पूरी स्क्रीन पर देखें"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* High-Resolution Fullscreen Modal */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white">
            <span className="text-xs font-bold line-clamp-1">{alt}</span>
            <div className="flex items-center gap-2">
              <a
                href={imageSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                title="मूल रिज़ॉल्यूशन लिंक खोलें"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="p-2 rounded-lg bg-stone-800 hover:bg-red-700 text-stone-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden flex items-center justify-center">
            <img
              src={imageSrc}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
