import React, { useState } from 'react';
import { X, Search, Shield, PenSquare, Megaphone, MapPin, ChevronRight, MessageCircle } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS, SITE_CONFIG } from '../../config/siteConfig';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDistrict,
    setSelectedDistrict,
    setActiveArticle,
    setIsSubmitNewsOpen,
    setIsPromotionModalOpen,
    setIsSearchOpen,
    theme,
    toggleTheme
  } = useNews();

  const [showDistricts, setShowDistricts] = useState(false);

  if (!isOpen) return null;

  const handleCategoryClick = (slug: string) => {
    const target = (slug === 'home' || slug === 'all') ? 'all' : slug;
    setSelectedCategory(target);
    setActiveArticle(null);
    window.history.pushState(null, '', target === 'all' ? '/' : `/${target}`);
    onClose();
  };

  const handleDistrictClick = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedCategory('rajasthan');
    setActiveArticle(null);
    window.history.pushState(null, '', '/rajasthan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
          <BrandLogo variant="mobile" onClick={() => { setSelectedCategory('all'); setActiveArticle(null); window.history.pushState(null, '', '/'); onClose(); }} />
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              setIsSubmitNewsOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-700 text-white font-bold rounded-lg text-xs"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>खबर भेजें</span>
          </button>
          <button
            onClick={() => {
              onClose();
              setIsPromotionModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-amber-600 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs hover:bg-amber-50"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>विज्ञापन</span>
          </button>
        </div>

        {/* Categories & Districts scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
            समाचार श्रेणियां
          </div>

          {categories.filter(c => c.isVisible).map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-red-700 text-white font-bold'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200'
              }`}
            >
              <span>{cat.nameHi}</span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          ))}

          {/* Rajasthan District Toggle */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setShowDistricts(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>राजस्थान ज़िलावार समाचार</span>
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showDistricts ? 'rotate-90' : ''}`} />
            </button>

            {showDistricts && (
              <div className="grid grid-cols-2 gap-1 p-2 bg-stone-50 dark:bg-stone-950 rounded-lg mt-1 text-xs">
                <button
                  onClick={() => handleDistrictClick('all')}
                  className={`text-left px-2 py-1.5 rounded font-medium ${
                    selectedDistrict === 'all' ? 'bg-red-700 text-white' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  सभी ज़िले
                </button>
                {RAJASTHAN_DISTRICTS.map(dist => (
                  <button
                    key={dist.id}
                    onClick={() => handleDistrictClick(dist.id)}
                    className={`text-left px-2 py-1.5 rounded font-medium truncate ${
                      selectedDistrict === dist.id ? 'bg-red-700 text-white' : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {dist.nameHi}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer & Citizen Reporter trigger */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
          <button
            onClick={() => {
              onClose();
              setIsSubmitNewsOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <PenSquare className="w-4 h-4 text-amber-300" />
            <span>नागरिक पत्रकारिता — खबर भेजें</span>
          </button>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <a
              href={SITE_CONFIG.social.whatsappChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-600 font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>व्हाट्सऐप चैनल</span>
            </a>
            <button
              onClick={toggleTheme}
              className="font-medium hover:underline text-stone-600 dark:text-stone-300"
            >
              {theme === 'dark' ? 'लाइट मोड' : 'डार्क मोड'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
