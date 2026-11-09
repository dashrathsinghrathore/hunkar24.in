import React, { useState } from 'react';
import { TrendingUp, Flame, Clock } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Article } from '../../types';

export const TrendingNewsSection: React.FC = () => {
  const { articles, setActiveArticle } = useNews();
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week'>('today');

  // Trending stories sorted by breaking status and fresh recency
  const trendingArticles = [...articles]
    .sort((a, b) => {
      if (a.isBreaking !== b.isBreaking) return a.isBreaking ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 5);

  const handleOpen = (article: Article) => {
    setActiveArticle(article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-600 fill-current" />
          <h3 className="text-base font-extrabold font-newspaper-headline text-stone-900 dark:text-stone-100">
            ट्रेंडिंग: सबसे ज्यादा पढ़ी गई
          </h3>
        </div>

        <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded p-0.5 text-xs">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-2 py-0.5 rounded font-bold ${
              filterPeriod === 'today' ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs' : 'text-stone-500'
            }`}
          >
            24 घंटे
          </button>
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-2 py-0.5 rounded font-bold ${
              filterPeriod === 'week' ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs' : 'text-stone-500'
            }`}
          >
            इस सप्ताह
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {trendingArticles.map((article, index) => (
          <div
            key={article.id}
            onClick={() => handleOpen(article)}
            className="group cursor-pointer flex items-start gap-3 py-2 border-b border-stone-100 dark:border-stone-800/60 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/40 p-1.5 rounded transition-colors"
          >
            {/* Rank index */}
            <span className="text-2xl font-black font-mono text-stone-300 dark:text-stone-700 group-hover:text-red-600 w-6 text-center shrink-0">
              0{index + 1}
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-1">
                {article.district && (
                  <span className="font-bold text-red-700 dark:text-red-400">{article.district}</span>
                )}
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{article.readingTimeMinutes || 2} मिनट</span>
                </span>
              </div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-snug line-clamp-2">
                {article.headline}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
