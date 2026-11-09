import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { deduplicateBreakingNews, areHeadlinesDuplicate } from '../../utils/deduplication';

export const BreakingTicker: React.FC = () => {
  const { breakingNews, articles, setActiveArticle } = useNews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Strict deduplication of active breaking items, limited to top 8 distinct stories
  const activeItems = deduplicateBreakingNews(breakingNews.filter(item => item.isActive)).slice(0, 8);

  if (activeItems.length === 0) return null;

  const currentItem = activeItems[currentIndex % activeItems.length];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeItems.length) % activeItems.length);
  };

  const handleClickItem = () => {
    // 1. First attempt to match by linkArticleId
    let art = currentItem.linkArticleId ? articles.find(a => a.id === currentItem.linkArticleId) : null;
    // 2. If not matched by ID, match by headline similarity
    if (!art) {
      art = articles.find(a => areHeadlinesDuplicate(a.headline, currentItem.text)) || null;
    }
    if (art) {
      setActiveArticle(art);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-red-950 text-white border-b border-red-800 text-xs sm:text-sm overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 flex items-center gap-3">
        {/* Urgent Label Badge */}
        <div className="flex items-center gap-1.5 bg-red-600 text-white font-extrabold px-2.5 py-1 rounded text-xs uppercase tracking-wider shrink-0 shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 fill-current" />
          <span>बड़ी खबर</span>
        </div>

        {/* Ticker Headline Content */}
        <div
          className="flex-1 overflow-hidden cursor-pointer hover:underline"
          onClick={handleClickItem}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="truncate font-medium text-red-50 text-xs sm:text-sm tracking-wide">
            {currentItem.text}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0 text-red-200">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-1 hover:text-white rounded"
            title={isPaused ? 'प्ले करें' : 'रोकें'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handlePrev}
            className="p-1 hover:text-white rounded"
            title="पिछली खबर"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1">
            {currentIndex + 1}/{activeItems.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1 hover:text-white rounded"
            title="अगली खबर"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
