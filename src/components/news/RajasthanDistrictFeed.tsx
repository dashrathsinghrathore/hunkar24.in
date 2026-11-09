import React from 'react';
import { MapPin, Filter, ArrowRight } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

export const RajasthanDistrictFeed: React.FC = () => {
  const {
    articles,
    selectedDistrict,
    setSelectedDistrict,
    setSelectedCategory
  } = useNews();

  // Top featured districts for tabs
  const featuredDistricts = [
    { id: 'all', nameHi: 'समस्त राजस्थान' },
    { id: 'jaipur', nameHi: 'जयपुर' },
    { id: 'jodhpur', nameHi: 'जोधपुर' },
    { id: 'sikar', nameHi: 'सीकर' },
    { id: 'bikaner', nameHi: 'बीकानेर' },
    { id: 'kota', nameHi: 'कोटा' },
    { id: 'ajmer', nameHi: 'अजमेर' },
    { id: 'udaipur', nameHi: 'उदयपुर' },
    { id: 'barmer', nameHi: 'बाड़मेर' },
    { id: 'churu', nameHi: 'चूरू' }
  ];

  // Filter articles by district
  const districtArticles = articles.filter(a => {
    if (selectedDistrict === 'all') return true;
    return a.district?.toLowerCase() === selectedDistrict.toLowerCase();
  });

  const currentDistrictName = selectedDistrict === 'all'
    ? 'समस्त राजस्थान'
    : RAJASTHAN_DISTRICTS.find(d => d.id === selectedDistrict)?.nameHi || selectedDistrict;

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b-2 border-red-700">
        <div className="flex items-center gap-2">
          <div className="bg-red-700 text-white p-1.5 rounded">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline tracking-tight">
              राजस्थान: आपका ज़िला – आपकी खबर
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {currentDistrictName} की ताज़ा और प्रमाणित ज़मीनी रिपोर्टिंग
            </p>
          </div>
        </div>

        {/* View all Rajasthan news */}
        <button
          onClick={() => setSelectedCategory('rajasthan')}
          className="inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 hover:text-red-800 transition-colors self-start sm:self-center"
        >
          <span>राजस्थान विशेष देखें</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* District Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-5 py-1">
        {featuredDistricts.map(dist => {
          const isSelected = selectedDistrict === dist.id;
          return (
            <button
              key={dist.id}
              onClick={() => setSelectedDistrict(dist.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isSelected
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {dist.nameHi}
            </button>
          );
        })}
      </div>

      {/* Grid of District News */}
      {districtArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {districtArticles.slice(0, 6).map(art => (
            <ArticleCard
              key={art.id}
              article={art}
              layout="standard"
              showSummary={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 p-6">
          <MapPin className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
            {currentDistrictName} के लिए इस समय कोई नई रिपोर्ट दर्ज नहीं है
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            क्या आपके पास {currentDistrictName} से कोई ताज़ा खबर है? हुंकार 24 के जन-रिपोर्टर बनकर खबर भेजें।
          </p>
        </div>
      )}
    </section>
  );
};
