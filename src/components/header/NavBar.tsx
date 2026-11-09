import React, { useState } from 'react';
import { Menu, ChevronDown, MapPin, X, Flame } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

interface NavBarProps {
  onOpenMobileMenu: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ onOpenMobileMenu }) => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDistrict,
    setSelectedDistrict,
    setActiveArticle
  } = useNews();

  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);

  const handleCategoryClick = (slug: string) => {
    const target = (slug === 'home' || slug === 'all') ? 'all' : slug;
    setSelectedCategory(target);
    setActiveArticle(null);
    setIsDistrictMenuOpen(false);
    window.history.pushState(null, '', target === 'all' ? '/' : `/${target}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDistrictSelect = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedCategory('rajasthan');
    setActiveArticle(null);
    setIsDistrictMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-40 bg-red-700 text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Mobile Hamburger Button */}
          <div className="flex items-center lg:hidden py-2">
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 rounded text-white hover:bg-red-800 focus:outline-hidden"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-2 font-bold text-sm tracking-wide">मेन्यू</span>
          </div>

          {/* Desktop Categories Scrollable List */}
          <div className="hidden lg:flex items-center overflow-x-auto no-scrollbar py-1 gap-1 text-sm font-semibold">
            {categories
              .filter(cat => cat.isVisible)
              .sort((a, b) => a.order - b.order)
              .map(cat => {
                const isActive = selectedCategory === cat.slug;

                if (cat.slug === 'rajasthan') {
                  return (
                    <div key={cat.id} className="relative group">
                      <button
                        onClick={() => handleCategoryClick('rajasthan')}
                        onMouseEnter={() => setIsDistrictMenuOpen(true)}
                        className={`flex items-center gap-1 px-3 py-2 rounded whitespace-nowrap shrink-0 transition-colors ${
                          isActive
                            ? 'bg-red-900 text-white font-bold'
                            : 'hover:bg-red-800 text-red-50'
                        }`}
                      >
                        <span>{cat.nameHi}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-red-200" />
                      </button>

                      {/* Dropdown for Rajasthan Districts */}
                      {isDistrictMenuOpen && (
                        <div
                          onMouseLeave={() => setIsDistrictMenuOpen(false)}
                          className="absolute left-0 top-full mt-0 w-80 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl rounded-b-xl border border-stone-200 dark:border-stone-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-stone-800 text-xs font-bold text-red-700 dark:text-red-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>राजस्थान के ज़िले चुनें</span>
                            </span>
                            <button
                              onClick={() => handleDistrictSelect('all')}
                              className="text-[11px] underline hover:text-red-900"
                            >
                              सभी ज़िले
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 max-h-64 overflow-y-auto text-xs">
                            {RAJASTHAN_DISTRICTS.map(dist => (
                              <button
                                key={dist.id}
                                onClick={() => handleDistrictSelect(dist.id)}
                                className={`text-left px-2 py-1.5 rounded transition-colors truncate ${
                                  selectedDistrict === dist.id
                                    ? 'bg-red-700 text-white font-bold'
                                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                                }`}
                                title={dist.nameHi}
                              >
                                {dist.nameHi}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`px-3 py-2 rounded whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-red-900 text-white font-bold shadow-inner'
                        : 'hover:bg-red-800 text-red-50'
                    }`}
                  >
                    {cat.nameHi}
                  </button>
                );
              })}
          </div>

          {/* Right Live Ticker Highlight Pill */}
          <div className="flex items-center shrink-0 py-1">
            <button
              onClick={() => handleCategoryClick('latest')}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold px-3 py-1.5 rounded uppercase tracking-wider transition-all"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>ताज़ा अपडेट्स</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
