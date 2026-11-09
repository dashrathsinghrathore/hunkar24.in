import React, { useState } from 'react';
import {
  Home,
  MessageCircle,
  Send,
  Zap,
  PhoneCall,
  X,
  FileText,
  Megaphone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const MobileBottomNav: React.FC = () => {
  const {
    setActiveArticle,
    setSelectedCategory,
    setSelectedDistrict,
    setIsSubmitNewsOpen,
    setIsPromotionModalOpen,
    breakingNews
  } = useNews();

  const [isConnectSheetOpen, setIsConnectSheetOpen] = useState(false);

  const handleHomeClick = () => {
    setActiveArticle(null);
    setSelectedCategory('all');
    setSelectedDistrict('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsConnectSheetOpen(false);
  };

  const handleBreakingClick = () => {
    setActiveArticle(null);
    const tickerEl = document.getElementById('breaking-ticker') || document.querySelector('.breaking-ticker-container');
    if (tickerEl) {
      tickerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsConnectSheetOpen(false);
  };

  const activeBreakingCount = breakingNews.filter(b => b.isActive).length;

  return (
    <>
      {/* Quick Connect Sheet Modal for Mobile */}
      {isConnectSheetOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsConnectSheetOpen(false)}
          />

          <div className="relative bg-white dark:bg-stone-900 border-t-2 border-orange-600 rounded-t-3xl p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    हुंकार 24 कनेक्ट (Connect Desk)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    सीधा संपर्क, खबर भेजें व विज्ञापन समाधान
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectSheetOpen(false)}
                className="p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp Help */}
              <a
                href="https://wa.me/917726084809"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsConnectSheetOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">व्हाट्सएप हेल्पलाइन</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">7726084809</p>
                </div>
              </a>

              {/* Telegram Channel */}
              <a
                href="https://t.me/HUNKAR24"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsConnectSheetOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">टेलीग्राम चैनल</p>
                  <p className="text-[10px] text-sky-600 dark:text-sky-400">@HUNKAR24</p>
                </div>
              </a>

              {/* Submit Citizen News */}
              <button
                type="button"
                onClick={() => {
                  setIsConnectSheetOpen(false);
                  setIsSubmitNewsOpen(true);
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-800 dark:text-orange-300 hover:bg-orange-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">खबर भेजें</p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400">नागरिक पत्रकारिता</p>
                </div>
              </button>

              {/* Business Advertising */}
              <button
                type="button"
                onClick={() => {
                  setIsConnectSheetOpen(false);
                  setIsPromotionModalOpen(true);
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">विज्ञापन दें</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">प्रमोशन व ब्रांडिंग</p>
                </div>
              </button>
            </div>

            {/* Direct Official Desk Contact */}
            <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-xs space-y-1.5 text-stone-700 dark:text-stone-300">
              <p className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-600" />
                संपादकीय डेस्क ईमेल:
              </p>
              <a
                href="mailto:contact@hunkar24.in"
                className="block text-orange-600 dark:text-orange-400 font-mono text-xs hover:underline"
              >
                contact@hunkar24.in
              </a>
              <p className="text-[11px] text-stone-500 pt-1">
                आधिकारिक पता: हुंकार 24 डिजिटल मीडिया, सीकर रोड, जयपुर (राज.) 302013
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Mobile Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 text-white shadow-2xl safe-area-pb"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Home */}
          <button
            type="button"
            onClick={handleHomeClick}
            className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-transform text-stone-400 hover:text-white"
          >
            <Home className="w-5 h-5 text-orange-500" />
            <span className="text-[10px] font-semibold tracking-tight">होम</span>
          </button>

          {/* 2. WhatsApp Group */}
          <a
            href="https://chat.whatsapp.com/FCPFV5r3eruEvFMS9yy2Fa?s=cl&p=a&iam=2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-transform text-emerald-400 hover:text-emerald-300"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">व्हाट्सएप</span>
          </a>

          {/* 3. Telegram Channel */}
          <a
            href="https://t.me/HUNKAR24"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-transform text-sky-400 hover:text-sky-300"
          >
            <Send className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight">टेलीग्राम</span>
          </a>

          {/* 4. Breaking News */}
          <button
            type="button"
            onClick={handleBreakingClick}
            className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-transform text-amber-400 hover:text-amber-300 relative"
          >
            <div className="relative">
              <Zap className="w-5 h-5 fill-amber-400" />
              {activeBreakingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black rounded-full px-1 min-w-[14px] text-center">
                  {activeBreakingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">ब्रेकिंग</span>
          </button>

          {/* 5. Connect Page */}
          <button
            type="button"
            onClick={() => setIsConnectSheetOpen(true)}
            className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-transform text-stone-300 hover:text-white"
          >
            <div className="p-1 rounded-full bg-orange-600 text-white shadow-xs">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">कनेक्ट</span>
          </button>
        </div>
      </nav>
    </>
  );
};
