import React from 'react';
import { Clock, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';
import { SITE_CONFIG } from '../../config/siteConfig';
import { SafeImage } from '../common/SafeImage';

export const HeroSection: React.FC = () => {
  const { articles, setActiveArticle } = useNews();

  // Top lead story: newest article marked isHero, or simply the freshest published article
  const leadStory = articles.find(a => a.isHero) || articles[0];
  const secondaryStories = articles.filter(a => a.id !== leadStory?.id).slice(0, 2);
  const fastUpdates = articles.filter(a => a.id !== leadStory?.id && !secondaryStories.some(s => s.id === a.id)).slice(0, 4);

  if (!leadStory) return null;

  const handleOpenLead = () => {
    setActiveArticle(leadStory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `*${leadStory.headline}*\n\n${leadStory.summary.slice(0, 120)}...\n\nपूरी खबर पढ़ें हुंकार 24 पर:\n${SITE_CONFIG.currentSiteUrl}/news/${leadStory.slug}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <section className="mb-8">
      {/* 3-Tier Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier 1: Dominant Lead Story (7 cols on Desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onClick={handleOpenLead}
            className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-lg transition-all flex-1 flex flex-col"
          >
            {/* Visual Box */}
            <div className="aspect-16/10 sm:aspect-16/9 relative overflow-hidden bg-stone-100 dark:bg-stone-800">
              <SafeImage
                src={leadStory.mainImage}
                alt={leadStory.headline}
                category={leadStory.category}
                district={leadStory.district}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded shadow-md tracking-wider">
                  प्रमुख समाचार
                </span>
                {leadStory.isExclusive && (
                  <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                    एक्सक्लूसिव ग्राउंड रिपोर्ट
                  </span>
                )}
              </div>

              {/* District & Location on Image */}
              {leadStory.district && (
                <div className="absolute bottom-3 left-4 text-xs font-bold text-amber-300 drop-shadow-md">
                  {leadStory.village ? `${leadStory.village}, ` : ''}{leadStory.district.toUpperCase()}
                </div>
              )}
            </div>

            {/* Headline & Body Container */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Clean unboxed metadata */}
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    {leadStory.reporterName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{leadStory.readingTimeMinutes} मिनट पठन</span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 font-newspaper-headline leading-tight mb-3">
                  {leadStory.headline}
                </h1>

                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4 line-clamp-3">
                  {leadStory.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>विस्तार से पढ़ें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>

                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>व्हाट्सऐप पर भेजें</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2 & 3: Secondary Features & Fast Updates (5 cols on Desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 2 Structured Secondary Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {secondaryStories.map(story => (
              <ArticleCard
                key={story.id}
                article={story}
                layout="horizontal"
                showSummary={true}
              />
            ))}
          </div>

          {/* Quick Department / Fast Feed Updates Box */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>त्वरित बुलेटिन</span>
              </span>
              <span className="text-[11px] text-stone-500 font-medium">लाइव डेस्क</span>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {fastUpdates.map(art => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  layout="compact"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
