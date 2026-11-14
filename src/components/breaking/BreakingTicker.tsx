import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  List,
  X,
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { deduplicateBreakingNews, areHeadlinesDuplicate } from '../../utils/deduplication';
import { BreakingNewsItem, Article } from '../../types';

export const BreakingTicker: React.FC = () => {
  const { breakingNews, articles, setActiveArticle } = useNews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAllDrawer, setShowAllDrawer] = useState(false);

  // Combine dedicated breaking news items + latest published articles (newest always #1)
  const activeItems = useMemo(() => {
    const rawBreaking = breakingNews
      .filter(item => item.isActive)
      .sort((a, b) => {
        const diff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (diff !== 0) return diff;
        return (a.priority || 99) - (b.priority || 99);
      });

    // Map latest published articles into bulletin news items
    const articleBulletins: BreakingNewsItem[] = articles
      .filter(a => a.status === 'published')
      .slice(0, 30)
      .map((a, idx) => ({
        id: `art-bulletin-${a.id}`,
        text: a.headline,
        category: a.category || 'rajasthan',
        linkArticleId: a.id,
        linkUrl: `/news/${a.slug}`,
        priority: a.isBreaking ? 1 : 10 + idx,
        isActive: true,
        createdAt: a.publishedAt
      }));

    // Merge and deduplicate by headline
    const combined = [...rawBreaking, ...articleBulletins];
    const unique = deduplicateBreakingNews(combined);
    return unique.slice(0, 35);
  }, [breakingNews, articles]);

  const topBreakingId = activeItems[0]?.id;
  useEffect(() => {
    setCurrentIndex(0);
  }, [topBreakingId]);

  // Auto-cycle ticker every 4.5 seconds
  useEffect(() => {
    if (isPaused || activeItems.length <= 1 || showAllDrawer) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, activeItems.length, showAllDrawer]);

  if (activeItems.length === 0) return null;

  const currentItem = activeItems[currentIndex % activeItems.length];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeItems.length) % activeItems.length);
  };

  const handleClickItem = (itemToOpen: BreakingNewsItem = currentItem) => {
    let art = itemToOpen.linkArticleId ? articles.find(a => a.id === itemToOpen.linkArticleId) : null;
    if (!art) {
      art = articles.find(a => areHeadlinesDuplicate(a.headline, itemToOpen.text)) || null;
    }
    if (art) {
      setActiveArticle(art);
      setShowAllDrawer(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div id="breaking-ticker" className="bg-red-950 text-white border-b border-red-800 text-xs sm:text-sm overflow-hidden select-none relative z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 flex items-center gap-2 sm:gap-3">
          {/* Urgent Label Badge with Live Pulsing Dot */}
          <div className="flex items-center gap-1.5 bg-red-600 text-white font-extrabold px-2.5 py-1 rounded text-xs uppercase tracking-wider shrink-0 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <AlertCircle className="w-3.5 h-3.5 fill-current" />
            <span className="font-black">बुलेटिन 24</span>
          </div>

          {/* Ticker Headline Content */}
          <div
            className="flex-1 overflow-hidden cursor-pointer group"
            onClick={() => handleClickItem(currentItem)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex items-center gap-2 truncate">
              {currentItem.category && (
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded shrink-0">
                  {currentItem.category}
                </span>
              )}
              <span className="truncate font-semibold text-red-50 text-xs sm:text-sm tracking-wide group-hover:underline">
                {currentItem.text}
              </span>
            </div>
          </div>

          {/* Controls & All Bulletins Trigger */}
          <div className="flex items-center gap-1 shrink-0 text-red-200">
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="p-1 hover:text-white rounded hover:bg-red-900/50 transition-colors"
              title={isPaused ? 'प्ले करें' : 'रोकें'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handlePrev}
              className="p-1 hover:text-white rounded hover:bg-red-900/50 transition-colors"
              title="पिछली खबर"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-bold text-red-300">
              {currentIndex + 1}/{activeItems.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 hover:text-white rounded hover:bg-red-900/50 transition-colors"
              title="अगली खबर"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* View All Bulletins Modal Button */}
            <button
              onClick={() => setShowAllDrawer(true)}
              className="hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-[11px] font-bold text-white transition-colors cursor-pointer border border-red-700/60"
              title="सभी ताज़ा बुलेटिन खबरें देखें"
            >
              <List className="w-3 h-3" />
              <span>सभी बुलेटिन</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Bulletin Headlines Modal / Drawer */}
      {showAllDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="text-base font-black font-newspaper-headline">
                    हुंकार 24 — लाइव बुलेटिन बोर्ड
                  </h3>
                  <p className="text-[11px] text-red-100">
                    कुल {activeItems.length} ताज़ा एवं ब्रेकिंग समाचार सुर्खियां
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-red-800 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of all bulletin headlines */}
            <div className="p-4 overflow-y-auto space-y-2.5 divide-y divide-stone-100 dark:divide-stone-800 flex-1">
              {activeItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleClickItem(item)}
                  className="pt-2.5 first:pt-0 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 p-2 rounded-xl transition-colors group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-red-700 dark:text-red-400">
                        #{idx + 1}
                      </span>
                      {item.category && (
                        <span className="text-[10px] uppercase font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors leading-snug">
                      {item.text}
                    </h4>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-red-600 shrink-0 mt-1" />
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-stone-100 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setShowAllDrawer(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold hover:bg-stone-700 transition-colors"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

