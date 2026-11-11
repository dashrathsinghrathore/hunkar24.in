import React, { useState } from 'react';
import {
  Search,
  PenLine,
  Megaphone,
  Sun,
  Moon,
  Menu,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useNews } from '../../context/NewsContext';
import { SITE_CONFIG } from '../../config/siteConfig';

interface MainHeaderProps {
  onOpenMobileMenu: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    setSelectedCategory,
    setSelectedDistrict,
    setIsSearchOpen,
    setIsPromotionModalOpen,
    setIsSubmitNewsOpen,
    setActiveArticle,
    theme,
    toggleTheme
  } = useNews();

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const handleLogoClick = () => {
    setSelectedCategory('all');
    setSelectedDistrict('all');
    setActiveArticle(null);
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(true);
  };

  const getTodayHindiDate = () => {
    const today = new Date();
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const day = days[today.getDay()];
    const date = today.getDate();
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day}, ${date} ${month} ${year}`;
  };

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 transition-colors sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 md:gap-6">
        {/* Left: Official Brand Logo + Website Name (हुंकार 24) */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick={handleLogoClick}>
          <BrandLogo
            variant="header"
            showTagline={false}
          />
          <div className="flex flex-col select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-black font-newspaper-headline text-red-700 dark:text-red-500 tracking-tight leading-none group-hover:text-red-800 transition-colors">
                हुंकार 24
              </span>
              <span className="bg-red-700 text-white text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-600 dark:text-stone-300 tracking-tight mt-0.5 hidden xs:block">
              राजस्थान का निष्पक्ष एवं निर्भीक डिजिटल न्यूज़ नेटवर्क
            </p>
          </div>
        </div>

        {/* Center: Long, Prominent Search Engine (Google News & Dainik Bhaskar style) */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-2 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="राजस्थान, चुनाव, ज़िले, योजनाएं या ताज़ा खबर खोजें..."
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              onClick={() => setIsSearchOpen(true)}
              className="w-full pl-10 pr-20 py-2 text-xs sm:text-sm bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-full border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-stone-400 font-medium"
            />
            <button
              type="submit"
              onClick={() => setIsSearchOpen(true)}
              className="absolute right-1 px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-full text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>सर्च</span>
            </button>
          </form>
        </div>

        {/* Right: Date, Dark Mode & CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
            title="सर्च करें"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-stone-600 dark:text-stone-300" />
          </button>

          {/* Date & Weather (Desktop) */}
          <div className="hidden lg:flex flex-col text-right pr-2 border-r border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {getTodayHindiDate()}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              जयपुर 28°C · धूप
            </span>
          </div>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer"
            title={theme === 'dark' ? 'लाइट मोड' : 'डार्क मोड'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Business Ad Button */}
          <button
            onClick={() => setIsPromotionModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>विज्ञापन</span>
          </button>

          {/* Citizen Reporter / Submit News */}
          <button
            onClick={() => setIsSubmitNewsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="अपनी खबर या समस्या भेजें"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">खबर भेजें</span>
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
            title="मेन्यू"
            aria-label="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

