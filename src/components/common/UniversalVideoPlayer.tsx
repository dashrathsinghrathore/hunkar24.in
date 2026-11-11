import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Video, Play, RefreshCw } from 'lucide-react';

interface UniversalVideoPlayerProps {
  url?: string;
  title?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
}

export type ParsedVideoResult = {
  type: 'youtube' | 'direct_video' | 'instagram' | 'facebook' | 'vimeo' | 'iframe' | 'unsupported';
  src: string;
  originalUrl: string;
  providerLabel: string;
  aspectRatioClass?: string;
};

/**
 * Intelligent detector and normalizer for:
 * 1. Supabase video URLs
 * 2. Firebase video URLs
 * 3. Direct MP4 URLs
 * 4. WebM URLs
 * 5. YouTube URLs (watch, share, youtu.be)
 * 6. YouTube Shorts
 * 7. Instagram Reels
 * 8. Instagram video posts
 * 9. Public Facebook videos
 * 10. Facebook Watch links
 */
export function parseVideoUrl(rawUrl?: string): ParsedVideoResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unsupported', src: '', originalUrl: '', providerLabel: 'अज्ञात' };
  }

  const clean = rawUrl.trim();

  // 1. YouTube (watch?v=, youtu.be/, embed/, shorts/)
  const ytShortsMatch = clean.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (ytShortsMatch && ytShortsMatch[1]) {
    const videoId = ytShortsMatch[1];
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
      originalUrl: clean,
      providerLabel: 'यूट्यूब शॉर्ट्स (YouTube Shorts)',
      aspectRatioClass: 'aspect-9/16 max-w-[360px] mx-auto'
    };
  }

  const ytStandardMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytStandardMatch && ytStandardMatch[1]) {
    const videoId = ytStandardMatch[1];
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
      originalUrl: clean,
      providerLabel: 'यूट्यूब (YouTube)'
    };
  }

  // 2. Instagram Reels & Video Posts
  const instaReelMatch = clean.match(/instagram\.com\/reels?\/([a-zA-Z0-9_-]+)/i);
  if (instaReelMatch && instaReelMatch[1]) {
    const reelId = instaReelMatch[1];
    return {
      type: 'instagram',
      src: `https://www.instagram.com/reel/${reelId}/embed/captioned/`,
      originalUrl: clean,
      providerLabel: 'इंस्टाग्राम रील्स (Instagram Reel)',
      aspectRatioClass: 'aspect-9/16 max-w-[400px] mx-auto min-h-[480px]'
    };
  }

  const instaPostMatch = clean.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/i);
  if (instaPostMatch && instaPostMatch[1]) {
    const postId = instaPostMatch[1];
    return {
      type: 'instagram',
      src: `https://www.instagram.com/p/${postId}/embed/captioned/`,
      originalUrl: clean,
      providerLabel: 'इंस्टाग्राम पोस्ट (Instagram Post)',
      aspectRatioClass: 'aspect-4/5 max-w-[440px] mx-auto min-h-[460px]'
    };
  }

  // 3. Facebook Videos & Facebook Watch links
  if (clean.includes('facebook.com') || clean.includes('fb.watch')) {
    const fbEmbedUrl = `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(clean)}&show_text=false&width=560&t=0`;
    return {
      type: 'facebook',
      src: fbEmbedUrl,
      originalUrl: clean,
      providerLabel: 'फेसबुक वीडियो (Facebook Video)'
    };
  }

  // 4. Supabase Video Storage URLs (.mp4, .webm, .mov, or hunkar-news-videos bucket)
  if (
    clean.includes('supabase.co/storage/') &&
    (clean.includes('videos') || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(clean))
  ) {
    return {
      type: 'direct_video',
      src: clean,
      originalUrl: clean,
      providerLabel: 'Supabase क्लाउड वीडियो'
    };
  }

  // 5. Firebase Video Storage URLs
  if (
    clean.includes('firebasestorage.googleapis.com') &&
    (clean.includes('videos') || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(clean))
  ) {
    return {
      type: 'direct_video',
      src: clean,
      originalUrl: clean,
      providerLabel: 'Firebase स्टोरेज वीडियो'
    };
  }

  // 6. Direct MP4, WebM, MOV, OGG, or local uploads
  const isDirectVideo =
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(clean) ||
    clean.startsWith('/assets/uploads/') ||
    clean.startsWith('blob:');

  if (isDirectVideo) {
    return {
      type: 'direct_video',
      src: clean,
      originalUrl: clean,
      providerLabel: 'डायरेक्ट वीडियो (HTML5 Player)'
    };
  }

  // 7. Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`,
      originalUrl: clean,
      providerLabel: 'Vimeo'
    };
  }

  // 8. Pre-formatted embed URL or generic iframe
  if (clean.includes('/embed/') || clean.startsWith('http')) {
    return {
      type: 'iframe',
      src: clean,
      originalUrl: clean,
      providerLabel: 'वेब एम्बेड प्लेयर'
    };
  }

  return { type: 'unsupported', src: clean, originalUrl: clean, providerLabel: 'असमर्थित प्रारूप' };
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  url,
  title = 'समाचार वीडियो रिपोर्ट',
  poster,
  className = '',
  autoPlay = false
}) => {
  const [loadError, setLoadError] = useState(false);
  const [isPlayingDirect, setIsPlayingDirect] = useState(false);

  if (!url) return null;

  const parsed = parseVideoUrl(url);

  if (parsed.type === 'unsupported' || loadError) {
    return (
      <div className={`aspect-16/9 w-full bg-stone-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-5 text-center text-stone-300 border border-stone-800 ${className}`}>
        <AlertCircle className="w-9 h-9 text-amber-500 mb-2.5" />
        <h4 className="text-sm font-bold text-white mb-1">वीडियो एम्बेड सूचना</h4>
        <p className="text-xs text-stone-400 max-w-md mb-3">
          यह वीडियो सीधे प्लेयर में लोड नहीं हो सकी (कॉपीराइट, प्राइवेसी या सुरक्षा प्रतिबंधों के कारण)।
        </p>
        <div className="flex items-center gap-2">
          {loadError && (
            <button
              onClick={() => setLoadError(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः प्रयास करें</span>
            </button>
          )}
          <a
            href={parsed.originalUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span>{parsed.providerLabel} पर देखें</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Direct HTML5 Video Player for Supabase, Firebase, MP4, WebM, MOV
  if (parsed.type === 'direct_video') {
    return (
      <div className={`relative aspect-16/9 w-full bg-black rounded-xl overflow-hidden shadow-lg border border-stone-800 group ${className}`}>
        <video
          src={parsed.src}
          poster={poster}
          controls
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          onPlay={() => setIsPlayingDirect(true)}
          onError={() => setLoadError(true)}
        >
          <source src={parsed.src} />
          आपका ब्राउज़र HTML5 वीडियो प्लेयर का समर्थन नहीं करता है।
        </video>
        <div className="absolute top-2.5 left-2.5 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
          <span className="bg-stone-900/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-stone-700/80 flex items-center gap-1.5 shadow-sm">
            <Video className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{parsed.providerLabel}</span>
          </span>
        </div>
      </div>
    );
  }

  // Instagram Reels & Posts Embed
  if (parsed.type === 'instagram') {
    return (
      <div className={`relative w-full rounded-xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-2 ${parsed.aspectRatioClass || 'aspect-9/16 max-w-[400px] mx-auto'} ${className}`}>
        <div className="mb-2 px-1 flex items-center justify-between text-[11px] text-stone-500">
          <span className="font-bold flex items-center gap-1 text-pink-600">
            <Play className="w-3 h-3 fill-pink-600" />
            <span>{parsed.providerLabel}</span>
          </span>
          <a
            href={parsed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-600 flex items-center gap-1 text-[10px]"
          >
            <span>Instagram खोलें</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={parsed.src}
          title={title}
          className="w-full h-[520px] border-0 rounded-lg"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          scrolling="no"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // Facebook Video Embed
  if (parsed.type === 'facebook') {
    return (
      <div className={`relative aspect-16/9 w-full bg-black rounded-xl overflow-hidden shadow-lg border border-stone-800 ${className}`}>
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-stone-700 flex items-center gap-1">
            <Video className="w-3 h-3 text-blue-500" />
            <span>{parsed.providerLabel}</span>
          </span>
        </div>
        <iframe
          src={parsed.src}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // YouTube / Vimeo / General responsive iframe
  const iframeSrc = autoPlay && !parsed.src.includes('autoplay')
    ? `${parsed.src}${parsed.src.includes('?') ? '&' : '?'}autoplay=1`
    : parsed.src;

  return (
    <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-lg border border-stone-800 ${parsed.aspectRatioClass || 'aspect-16/9'} ${className}`}>
      <iframe
        src={iframeSrc}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onError={() => setLoadError(true)}
      />
    </div>
  );
};
