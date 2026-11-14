import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Clock, Sparkles } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Article } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { deduplicateArticlesList } from '../../utils/deduplication';

export const MobileNewsSlider: React.FC = () => {
  const { articles, setActiveArticle, incrementArticleViews } = useNews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Take top 10 unique published articles with zero duplicate stories
  const publishedArticles = articles.filter(a => a.status === 'published');
  const sliderArticles: Article[] = deduplicateArticlesList(publishedArticles).slice(0, 10);

  const totalSlides = sliderArticles.length;
  const topArticleId = sliderArticles[0]?.id;

  useEffect(() => {
    setCurrentIndex(0);
  }, [topArticleId]);

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay effect with pause on hover / touch
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    autoPlayTimer.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPaused, nextSlide, totalSlides]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false);
      return;
    }
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // px

    if (distance > minSwipeDistance) {
      nextSlide(); // Swiped left -> next
    } else if (distance < -minSwipeDistance) {
      prevSlide(); // Swiped right -> prev
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleOpenArticle = (art: Article) => {
    incrementArticleViews(art.id);
    setActiveArticle(art);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sliderArticles.length === 0) return null;

  const activeArticle = sliderArticles[currentIndex];

  return (
    <section
      aria-label="ताज़ा समाचार स्लाइडर"
      className="w-full my-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <h2 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5 font-newspaper-headline">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>विशेष ताज़ा बुलेटिन</span>
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            aria-label={isPaused ? 'स्लाइडर चालू करें' : 'स्लाइडर रोकें'}
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={prevSlide}
            aria-label="पिछला समाचार"
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-stone-500 px-1">
            {currentIndex + 1}/{totalSlides}
          </span>
          <button
            onClick={nextSlide}
            aria-label="अगला समाचार"
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card Container */}
      <div
        className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm cursor-pointer group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => handleOpenArticle(activeArticle)}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[220px] sm:min-h-[260px]">
          {/* Image Column */}
          <div className="md:col-span-5 relative overflow-hidden bg-stone-100 dark:bg-stone-800 h-48 sm:h-56 md:h-full">
            <SafeImage
              src={activeArticle.mainImage}
              alt={activeArticle.headline}
              category={activeArticle.category}
              district={activeArticle.district}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />

            {/* Badges on mobile */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="bg-red-700 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                ताज़ा खबर
              </span>
              {activeArticle.district && (
                <span className="bg-stone-900/80 backdrop-blur-xs text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded">
                  {activeArticle.district.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="md:col-span-7 p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>3 मिनट पठन</span>
                </span>
              </div>

              <h3 className="text-base sm:text-xl lg:text-2xl font-black text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-snug line-clamp-2 sm:line-clamp-3">
                {activeArticle.headline}
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                {activeArticle.summary}
              </p>
            </div>

            <div className="pt-3 mt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold">
              <span className="text-red-700 dark:text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                <span>पूरी खबर पढ़ें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>

              {/* Slide Dots Indicator */}
              <div className="flex items-center gap-1.5">
                {sliderArticles.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    aria-label={`स्लाइड ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentIndex ? 'w-5 bg-red-700' : 'w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
