import React from 'react';
import {
  Sun,
  Moon,
  Volume2,
  Share2,
  ExternalLink,
  MessageCircle,
  Send,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Search,
  PenSquare
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { SITE_CONFIG } from '../../config/siteConfig';

export const TopUtilityBar: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
    setIsSearchOpen,
    setIsSubmitNewsOpen,
    setIsPromotionModalOpen
  } = useNews();

  // Current formatted Hindi date
  const getHindiDate = () => {
    const today = new Date();
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    
    const dayName = days[today.getDay()];
    const dateNum = today.getDate();
    const monthName = months[today.getMonth()];
    const year = today.getFullYear();
    
    return `${dayName}, ${dateNum} ${monthName} ${year} | विक्रम संवत 2083`;
  };

  return (
    <div className="bg-stone-900 text-stone-200 text-xs border-b border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Date, Almanac and Weather */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-stone-300">
            {getHindiDate()}
          </span>
          <span className="text-stone-600 hidden sm:inline" aria-hidden="true">·</span>
          <div className="hidden sm:flex items-center gap-1.5 text-amber-400 font-medium">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>जयपुर 28°C धूप</span>
          </div>
          <span className="text-stone-600 hidden md:inline" aria-hidden="true">·</span>
          <a
            href="https://wa.me/917726084809"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60"
            title="हुंकार 24 व्हाट्सऐप सहायता"
          >
            <MessageCircle className="w-3 h-3 text-emerald-400" />
            <span>Only WhatsApp: 7726084809</span>
          </a>
        </div>

        {/* Right: Language switch, Accessibility, Social Links & CTAs */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center bg-stone-800 rounded px-1.5 py-0.5 border border-stone-700">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'hi'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('raj')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'raj'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="राजस्थानी भाषा संस्करण"
            >
              राजस्थानी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'en'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Font Size Adjuster for senior readers */}
          <div className="hidden md:flex items-center gap-1 bg-stone-800 rounded px-1.5 py-0.5 border border-stone-700">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-1 text-[11px] font-bold ${fontSize === 'normal' ? 'text-amber-400' : 'text-stone-400'}`}
              title="सामान्य फॉन्ट"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-1 text-xs font-bold ${fontSize === 'large' ? 'text-amber-400' : 'text-stone-400'}`}
              title="बड़ा फॉन्ट"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('extra-large')}
              className={`px-1 text-sm font-bold ${fontSize === 'extra-large' ? 'text-amber-400' : 'text-stone-400'}`}
              title="अधिक बड़ा फॉन्ट"
            >
              A++
            </button>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
            title={theme === 'dark' ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-300" />}
          </button>

          {/* Social Channels */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-stone-800">
            <a
              href={SITE_CONFIG.social.whatsappChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-emerald-400 transition-colors"
              title="हुंकार 24 व्हाट्सऐप चैनल से जुड़ें"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <a
              href={SITE_CONFIG.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-sky-400 transition-colors"
              title="टेलीग्राम चैनल"
            >
              <Send className="w-3.5 h-3.5" />
            </a>
            <a
              href={SITE_CONFIG.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-red-500 transition-colors"
              title="यूट्यूब"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
            <a
              href={SITE_CONFIG.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-pink-400 transition-colors"
              title="इंस्टाग्राम"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href={SITE_CONFIG.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-blue-500 transition-colors"
              title="फेसबुक"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick Submit News Button */}
          <button
            onClick={() => setIsSubmitNewsOpen(true)}
            className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white font-semibold px-2.5 py-1 rounded transition-colors text-[11px]"
          >
            <PenSquare className="w-3 h-3" />
            <span>खबर भेजें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
