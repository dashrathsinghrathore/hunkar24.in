import React, { useState } from 'react';
import { Play, AlertCircle, ExternalLink, Video } from 'lucide-react';

interface UniversalVideoPlayerProps {
  url?: string;
  title?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
}

/**
 * Normalizes any video link (YouTube, YouTu.be, Shorts, Supabase Storage, MP4, Vimeo)
 * into the appropriate playable element (HTML5 <video> or <iframe>).
 */
export function parseVideoUrl(rawUrl?: string): {
  type: 'youtube' | 'direct_video' | 'vimeo' | 'iframe' | 'unsupported';
  src: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unsupported', src: '' };
  }

  const clean = rawUrl.trim();

  // 1. YouTube detection (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    };
  }

  // 2. Direct video file or Supabase storage video URL (.mp4, .webm, .mov, .m4v, .ogg)
  const isDirectVideo =
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(clean) ||
    (clean.includes('supabase.co/storage/') && !clean.includes('/embed/'));

  if (isDirectVideo) {
    return {
      type: 'direct_video',
      src: clean
    };
  }

  // 3. Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`
    };
  }

  // 4. Already an embed URL or other iframe
  if (clean.includes('/embed/') || clean.startsWith('http')) {
    return {
      type: 'iframe',
      src: clean
    };
  }

  return { type: 'unsupported', src: clean };
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  url,
  title = 'समाचार वीडियो',
  poster,
  className = '',
  autoPlay = false
}) => {
  const [loadError, setLoadError] = useState(false);

  if (!url) return null;

  const parsed = parseVideoUrl(url);

  if (parsed.type === 'unsupported' || loadError) {
    return (
      <div className={`aspect-16/9 w-full bg-stone-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 text-center text-stone-300 border border-stone-800 ${className}`}>
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <p className="text-xs font-semibold mb-2">वीडियो सीधे एम्बेड नहीं हो सकी</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors"
        >
          <span>मूल लिंक पर वीडियो देखें</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // Direct video tag (Supabase Storage MP4 / WebM / QuickTime)
  if (parsed.type === 'direct_video') {
    return (
      <div className={`relative aspect-16/9 w-full bg-black rounded-xl overflow-hidden shadow-md border border-stone-800 group ${className}`}>
        <video
          src={parsed.src}
          poster={poster}
          controls
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          onError={() => setLoadError(true)}
        >
          <source src={parsed.src} />
          आपका ब्राउज़र HTML5 वीडियो प्लेयर का समर्थन नहीं करता है।
        </video>
        <div className="absolute top-2 left-2 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-stone-700 flex items-center gap-1">
            <Video className="w-3 h-3 text-red-500" />
            <span>लाइव वीडियो रिपोर्ट</span>
          </span>
        </div>
      </div>
    );
  }

  // YouTube, Vimeo, or standard responsive iframe
  const iframeSrc = autoPlay && !parsed.src.includes('autoplay')
    ? `${parsed.src}${parsed.src.includes('?') ? '&' : '?'}autoplay=1`
    : parsed.src;

  return (
    <div className={`relative aspect-16/9 w-full bg-black rounded-xl overflow-hidden shadow-md border border-stone-800 ${className}`}>
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
