import React from 'react';
import { Search, PenLine, Newspaper, Megaphone, MapPin, ChevronDown } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

interface MainHeaderProps {
  onOpenMobileMenu: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    setSelectedCategory,
    selectedDistrict,
    setSelectedDistrict,
    setIsSearchOpen,
    setIsPromotionModalOpen,
    setIsSubmitNewsOpen,
    setActiveArticle
  } = useNews();

  const handleLogoClick = () => {
    setSelectedCategory('all');
    setSelectedDistrict('all');
    setActiveArticle(null);
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const keyDistricts = ['all', 'jaipur', 'jodhpur', 'sikar', 'bikaner', 'kota', 'udaipur', 'ajmer'];

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Official Brand Logo */}
        <div className="flex items-center gap-4">
          <BrandLogo
            variant="header"
            showTagline={true}
            onClick={handleLogoClick}
          />
        </div>

        {/* Center: Fast District Quick Strip (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-1 text-red-700 dark:text-red-500 font-bold mr-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>ज़िला:</span>
          </div>
          {keyDistricts.map(distId => {
            const dist = distId === 'all' ? { id: 'all', nameHi: 'समस्त राजस्थान' } : RAJASTHAN_DISTRICTS.find(d => d.id === distId);
            if (!dist) return null;
            const isSelected = selectedDistrict === dist.id;
            return (
              <button
                key={dist.id}
                onClick={() => {
                  setSelectedDistrict(dist.id);
                  setActiveArticle(null);
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-red-700 text-white font-bold'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {dist.nameHi}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Actions (Search, Ads, E-Paper, Citizen Report) */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-stone-200 dark:border-stone-700"
            title="समाचार खोजें"
          >
            <Search className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">सर्च करें</span>
          </button>

          {/* Business Ad Button */}
          <button
            onClick={() => setIsPromotionModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>विज्ञापन दें</span>
          </button>

          {/* Citizen Reporter / Submit News */}
          <button
            onClick={() => setIsSubmitNewsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-xs"
            title="अपनी खबर या समस्या भेजें"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">खबर भेजें</span>
          </button>
        </div>
      </div>
    </header>
  );
};
