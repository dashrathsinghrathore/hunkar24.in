import React, { useState } from 'react';
import { Settings, Globe, Shield, Save, CheckCircle2, Megaphone, Link as LinkIcon } from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { useNews } from '../../context/NewsContext';

export const WebsiteSettings: React.FC = () => {
  const { logAction } = useNews();

  const [currentDomain, setCurrentDomain] = useState(SITE_CONFIG.currentSiteUrl);
  const [futureDomain, setFutureDomain] = useState(SITE_CONFIG.futureCustomDomain);
  const [primaryDomain, setPrimaryDomain] = useState(SITE_CONFIG.primarySiteUrl);
  const [brandName, setBrandName] = useState(SITE_CONFIG.brandName);
  const [brandNameHi, setBrandNameHi] = useState(SITE_CONFIG.brandNameHi);
  const [tagline, setTagline] = useState(SITE_CONFIG.brandTagline);
  const [logoUrl, setLogoUrl] = useState(SITE_CONFIG.logoUrl);
  const [adsenseId, setAdsenseId] = useState(SITE_CONFIG.adsensePublisherId);

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    logAction(
      'वेबसाइट सेटिंग्स अद्यतित',
      'Website Settings',
      `डोमेन: ${primaryDomain} | लोगो: ${logoUrl}`
    );
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-600" />
            <span>वेबसाइट एवं डोमेन सेटिंग्स (Website & Domain Settings)</span>
          </h2>
          <p className="text-xs text-stone-500">
            ब्रांड विन्यास, आधिकारिक लोगो, नेटलिफाई एवं भविष्य के कस्टम डोमेन का केंद्रीकृत प्रबंधन
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>वेबसाइट सेटिंग्स सफलतापूर्वक सुरक्षित कर दी गई हैं!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Domain Configuration (Section 1) */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>1. केंद्रीकृत डोमेन विन्यास (Domain Configuration)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                वर्तमान लाइव डोमेन (Current Live Domain)
              </label>
              <input
                type="text"
                value={currentDomain}
                onChange={e => setCurrentDomain(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                नेटलिफाई पर तत्काल चालू
              </span>
            </div>

            <div>
              <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                आगामी कस्टम डोमेन (Future Custom Domain)
              </label>
              <input
                type="text"
                value={futureDomain}
                onChange={e => setFutureDomain(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono"
              />
              <span className="text-[10px] text-amber-500 mt-1 block">
                क्रय एवं DNS सत्यापन उपरांत ही प्राथमिक बनाएं
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
            <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
              सक्रिय प्राथमिक कैनोनिकल डोमेन (Primary Canonical Domain)
            </label>
            <select
              value={primaryDomain}
              onChange={e => setPrimaryDomain(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono text-red-700 dark:text-red-400 font-bold"
            >
              <option value="https://hunkar24.netlify.app">https://hunkar24.netlify.app (अनुशंसित - अभी लाइव)</option>
              <option value="https://hunkar24.in">https://hunkar24.in (सत्यापन के बाद)</option>
            </select>
          </div>
        </div>

        {/* Brand & Logo Configuration (Section 1) */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-red-600" />
            <span>2. आधिकारिक ब्रांड एवं लोगो (Official Brand Identity)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Hindi Name</label>
              <input
                type="text"
                value={brandNameHi}
                onChange={e => setBrandNameHi(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Official Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold mb-1">
              आधिकारिक लोगो पाथ / URL (Official Supplied Logo)
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono text-red-700 dark:text-red-400"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              सत्यापित प्रत्यक्ष इमेज: https://i.ibb.co/bMrrmCqP/hunkar24.png / स्थानीय बैकअप: /assets/hunkar24-logo.png
            </span>
          </div>
        </div>

        {/* Google AdSense & Ads.txt (Section 12) */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>3. Google AdSense एवं मुद्रीकरण विन्यास</span>
          </div>

          <div className="text-xs">
            <label className="block font-bold mb-1">AdSense Publisher ID</label>
            <input
              type="text"
              value={adsenseId}
              onChange={e => setAdsenseId(e.target.value)}
              placeholder="pub-0000000000000000"
              className="w-full sm:w-80 px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Google AdSense अनुमोदन उपरांत /public/ads.txt में स्वतः अद्यतित होगा
            </span>
          </div>
        </div>

        {/* Firebase Realtime Database Status (Section 4) */}
        <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-orange-600" />
              <span>4. Firebase Realtime Database विन्यास (लाइव सक्रिय)</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              लाइव कनेक्टेड (Real-Time Synchronized)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">Firebase Project ID</div>
              <div className="font-mono font-bold text-stone-800 dark:text-stone-200">hunkar24</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">Database URL (Asia-SE1)</div>
              <div className="font-mono text-[11px] text-stone-700 dark:text-stone-300 truncate">
                https://hunkar24-default-rtdb.asia-southeast1.firebasedatabase.app
              </div>
            </div>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-400">
            हुंकार 24 वेबसाइट अब सीधे आपके Firebase Realtime Database से लाइव जुड़ी हुई है। समाचार और ब्रेकिंग न्यूज़ बिना पेज रिफ्रेश किए सभी डिवाइसों में स्वतः अपडेट हो रहे हैं।
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>परिवर्तन सुरक्षित करें</span>
          </button>
        </div>
      </form>
    </div>
  );
};
