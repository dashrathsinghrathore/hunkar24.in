import React, { useState } from 'react';
import { Search, X, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Article } from '../../types';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    articles,
    setActiveArticle,
    incrementArticleViews
  } = useNews();

  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const filteredArticles = query.trim()
    ? articles.filter(
        a =>
          a.headline.toLowerCase().includes(query.toLowerCase()) ||
          a.summary.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase()) ||
          (a.district && a.district.toLowerCase().includes(query.toLowerCase())) ||
          a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleSelectArticle = (art: Article) => {
    incrementArticleViews(art.id);
    setActiveArticle(art);
    setIsSearchOpen(false);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const popularKeywords = ['RPSC भर्ती', 'जल जीवन मिशन', 'सीकर', 'माउंट आबू', 'वंदे भारत', 'सरसों भाव', 'कोटा'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="समाचार, ज़िला, योजना या विषय खोजें..."
            className="flex-1 text-base bg-transparent border-0 focus:outline-hidden text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold px-2 py-1"
            >
              साफ करें
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popular searches suggestions */}
        {!query && (
          <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
              लोकप्रिय खोजें
            </span>
            <div className="flex flex-wrap gap-2">
              {popularKeywords.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(kw)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 hover:border-red-600 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {query.trim() && (
            <div className="text-xs text-stone-500 pb-2 border-b border-stone-100 dark:border-stone-800">
              '{query}' के लिए {filteredArticles.length} परिणाम मिले
            </div>
          )}

          {filteredArticles.map(art => (
            <div
              key={art.id}
              onClick={() => handleSelectArticle(art)}
              className="group cursor-pointer p-3 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-red-500 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  {art.district && (
                    <span className="font-bold text-red-700 dark:text-red-400">{art.district}</span>
                  )}
                  <span>·</span>
                  <span>{art.category}</span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-newspaper-headline group-hover:text-red-700 line-clamp-1">
                  {art.headline}
                </h4>
              </div>

              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-red-700 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          ))}

          {query.trim() && filteredArticles.length === 0 && (
            <div className="text-center py-10 text-stone-500 text-sm">
              '{query}' से संबंधित कोई समाचार नहीं मिला। कृपया अन्य शब्द का प्रयास करें।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
