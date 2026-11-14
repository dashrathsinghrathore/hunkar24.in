import React, { useState, useEffect } from 'react';
import { Clock, Share2, Bookmark } from 'lucide-react';
import { Article } from '../../types';
import { useNews } from '../../context/NewsContext';
import { SITE_CONFIG } from '../../config/siteConfig';
import { SafeImage } from '../common/SafeImage';
import { estimateReadingTime, sanitizeHeadline, sanitizeSummary } from '../../utils/newsUtils';

interface ArticleCardProps {
  article: Article;
  layout?: 'standard' | 'horizontal' | 'compact' | 'lead';
  showSummary?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  layout = 'standard',
  showSummary = true
}) => {
  const { setActiveArticle } = useNews();

  // Save for Later (Local Bookmark) state
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('hunkar24_saved_articles');
      if (!raw) return false;
      const ids: string[] = JSON.parse(raw);
      return Array.isArray(ids) && ids.includes(article.id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleBookmarkChange = () => {
      try {
        const raw = localStorage.getItem('hunkar24_saved_articles');
        if (!raw) {
          setIsSaved(false);
          return;
        }
        const ids: string[] = JSON.parse(raw);
        setIsSaved(Array.isArray(ids) && ids.includes(article.id));
      } catch {}
    };

    window.addEventListener('hunkar24_bookmarks_updated', handleBookmarkChange);
    return () => window.removeEventListener('hunkar24_bookmarks_updated', handleBookmarkChange);
  }, [article.id]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('hunkar24_saved_articles');
      const savedIds: string[] = raw ? JSON.parse(raw) : [];
      let updated: string[];
      if (savedIds.includes(article.id)) {
        updated = savedIds.filter(id => id !== article.id);
        setIsSaved(false);
      } else {
        updated = [...savedIds, article.id];
        setIsSaved(true);
      }
      localStorage.setItem('hunkar24_saved_articles', JSON.stringify(updated));
      window.dispatchEvent(new Event('hunkar24_bookmarks_updated'));
    } catch (err) {
      console.warn('Could not update bookmarks in localStorage:', err);
    }
  };

  const handleOpen = () => {
    setActiveArticle(article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanTitle = sanitizeHeadline(article.headline);
  const cleanDesc = sanitizeSummary(article.summary, cleanTitle, article.category);
  const readTimeMinutes = estimateReadingTime(article.content, article.summary, article.readingTimeMinutes);

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `*${cleanTitle}*\n\n${cleanDesc.slice(0, 120)}...\n\nपूरी खबर पढ़ें हुंकार 24 पर:\n${SITE_CONFIG.currentSiteUrl}/news/${article.slug}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  // Format publication date in Hindi relative or short date
  const formatPublishedDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return 'आज';
    }
  };

  if (layout === 'compact') {
    return (
      <article
        onClick={handleOpen}
        className="group cursor-pointer py-2.5 border-b border-stone-200 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded transition-colors"
      >
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
          <div className="flex items-center gap-2">
            {article.district && (
              <>
                <span className="font-semibold text-red-700 dark:text-red-400 capitalize">{article.district}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{formatPublishedDate(article.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{readTimeMinutes} मिनट</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            className={`p-1 rounded transition-colors ${
              isSaved
                ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                : 'text-stone-400 hover:text-red-700 dark:hover:text-red-400'
            }`}
            title={isSaved ? 'सहेजा गया (हटाएं)' : 'बाद में पढ़ें (सहेजें)'}
            aria-label="Save for later"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-snug line-clamp-2">
          {cleanTitle}
        </h4>
      </article>
    );
  }

  if (layout === 'horizontal') {
    return (
      <article
        onClick={handleOpen}
        className="group cursor-pointer p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4"
      >
        <div className="sm:w-1/3 shrink-0 aspect-16/10 overflow-hidden rounded bg-stone-100 dark:bg-stone-800 relative">
          <SafeImage
            src={article.mainImage}
            alt={cleanTitle}
            category={article.category}
            district={article.district}
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          {article.isBreaking && (
            <span className="absolute top-2 left-2 bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              बड़ी खबर
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-xs transition-colors shadow-xs ${
              isSaved
                ? 'bg-red-700 text-white'
                : 'bg-black/60 text-white hover:bg-black/80'
            }`}
            title={isSaved ? 'सहेजा गया (हटाएं)' : 'बाद में पढ़ें (सहेजें)'}
            aria-label="Save for later"
          >
            <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Metadata with District, Date & Calculated Read-Time */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1.5">
              {article.district && (
                <>
                  <span className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    {article.district}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{formatPublishedDate(article.publishedAt)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300 font-medium">
                <Clock className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span>{readTimeMinutes} मिनट पठन</span>
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-tight line-clamp-2 mb-1.5">
              {cleanTitle}
            </h3>

            {showSummary && (
              <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                {cleanDesc}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    : 'text-stone-500 hover:text-red-700 dark:hover:text-red-400'
                }`}
                title={isSaved ? 'सहेजा गया (हटाएं)' : 'बाद में पढ़ें'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'सहेजा गया' : 'सहेजें'}</span>
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="hover:text-emerald-600 transition-colors p-1"
                title="व्हाट्सऐप पर शेयर करें"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard vertical card
  return (
    <article
      onClick={handleOpen}
      className="group cursor-pointer rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-md transition-all flex flex-col overflow-hidden"
    >
      <div className="aspect-16/10 overflow-hidden bg-stone-100 dark:bg-stone-800 relative">
        <SafeImage
          src={article.mainImage}
          alt={cleanTitle}
          category={article.category}
          district={article.district}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {article.isBreaking && (
          <span className="absolute top-2 left-2 bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            बड़ी खबर
          </span>
        )}
        {article.isExclusive && (
          <span className="absolute top-2 left-16 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            एक्सक्लूसिव
          </span>
        )}
        {/* Quick Save for Later Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-xs transition-colors shadow-xs ${
            isSaved
              ? 'bg-red-700 text-white'
              : 'bg-black/60 text-white hover:bg-black/80'
          }`}
          title={isSaved ? 'सहेजा गया (हटाएं)' : 'बाद में पढ़ें (सहेजें)'}
          aria-label="Save for later"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        {/* Read-time pill overlay */}
        <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-stone-100 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span>{readTimeMinutes} मिनट</span>
        </span>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2">
            {article.district && (
              <>
                <span className="font-bold text-red-700 dark:text-red-400 capitalize">{article.district}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{formatPublishedDate(article.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">{readTimeMinutes} मिनट पठन</span>
          </div>

          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-snug line-clamp-2 mb-2">
            {cleanTitle}
          </h3>

          {showSummary && (
            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed mb-3">
              {cleanDesc}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end pt-2.5 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                  : 'text-stone-500 hover:text-red-700 dark:hover:text-red-400'
              }`}
              title={isSaved ? 'सहेजा गया (हटाएं)' : 'बाद में पढ़ें'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'सहेजा गया' : 'सहेजें'}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="text-stone-400 hover:text-emerald-600 transition-colors p-1"
              title="व्हाट्सऐप पर शेयर करें"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
