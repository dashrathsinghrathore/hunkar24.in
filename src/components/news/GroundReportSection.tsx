import React from 'react';
import { ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';

interface GroundReportSectionProps {
  excludeIds?: Set<string>;
}

export const GroundReportSection: React.FC<GroundReportSectionProps> = ({ excludeIds }) => {
  const { articles, setSelectedCategory } = useNews();

  const candidateArticles = excludeIds && excludeIds.size > 0
    ? articles.filter(a => !excludeIds.has(a.id))
    : articles;

  const groundReports = candidateArticles.filter(
    a => a.category === 'ground-report' || a.isExclusive
  );

  if (groundReports.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b-2 border-red-800">
        <div className="flex items-center gap-2">
          <div className="bg-red-800 text-white p-1.5 rounded">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline">
              हुंकार ग्राउंड रिपोर्ट: जनसरोकार की आवाज़
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              गाँव, ढाणी और कस्बों से सीधी बेबाक और निष्पक्ष पड़ताल
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedCategory('ground-report')}
          className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline self-start sm:self-center"
        >
          सभी ग्राउंड रिपोर्ट पढ़ें →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groundReports.slice(0, 3).map(art => (
          <ArticleCard
            key={art.id}
            article={art}
            layout="standard"
            showSummary={true}
          />
        ))}
      </div>
    </section>
  );
};
