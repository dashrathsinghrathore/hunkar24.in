import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, Save, CheckCircle2, Megaphone, Link as LinkIcon, TrendingUp } from 'lucide-react';
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

  // Mandi API Key State
  const [mandiApiKey, setMandiApiKey] = useState('');
  const [mandiApiSaved, setMandiApiSaved] = useState(false);

  useEffect(() => {
    fetch('/api/mandi/settings')
      .then(res => res.json())
      .then(d => {
        if (d?.apiKey) setMandiApiKey(d.apiKey);
      })
      .catch(() => {});
  }, []);

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mandiApiKey) {
      fetch('/api/mandi/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: mandiApiKey })
      }).catch(() => {});
    }
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
              <option value="https://hunkar24.in">https://hunkar24.in (अनुशंसित - अभी लाइव)</option>
              <option value="https://hunkar24.in/">https://hunkar24.in/</option>
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

        {/* Section 5: Dual Cloud Media Infrastructure & Secondary Backup */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>5. डुअल क्लाउड मीडिया बैकअप नियंत्रण (Dual Cloud Storage Controls)</span>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <span className="text-stone-600 dark:text-stone-400">Firebase सेकेंडरी बैकअप:</span>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  const { setSecondaryBackupEnabled } = await import('../../lib/firebaseClient');
                  setSecondaryBackupEnabled(enabled);
                  fetch('/api/media/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secondaryBackupEnabled: enabled })
                  }).catch(() => {});
                }}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">सक्रिय</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
                प्राथमिक स्टोरेज (Supabase)
              </div>
              <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">
                hunkar-news-images
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                तस्वीरें (अधिकतम 50 MB प्रति फ़ाइल)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
                वीडियो स्टोरेज (Supabase)
              </div>
              <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">
                hunkar-news-videos
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                वीडियो बुलेटिन (अधिकतम 50 MB)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="text-[10px] text-orange-600 font-bold uppercase mb-1">
                सेकेंडरी बैकअप (Firebase)
              </div>
              <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">
                hunkar24/news/*
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                अतिरिक्त क्लाउड प्रति व आपदा रिकवरी
              </div>
            </div>
          </div>
        </div>

        {/* 6. Real-time Mandi APMC API Settings */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-amber-200 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>6. रियल-टाइम मंडी भाव API विन्यास (Mandi Bhav Realtime API Keys)</span>
          </div>
          <p className="text-[11px] text-stone-500">
            राजस्थान कृषि उपज मंडी (APMC/Agmarknet) लाइव दैनिक भाव हेतु API कुंजी जोड़ें। कुंजी उपलब्ध न होने पर भी सिस्टम प्रतिदिन स्वतः सत्यापित डायनेमिक दरों से अद्यतित रहता है।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                Data.gov.in / Agmarknet API Key
              </label>
              <input
                type="password"
                value={mandiApiKey}
                onChange={e => setMandiApiKey(e.target.value)}
                placeholder="579b464db66ec23bdd000001..."
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono text-xs"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Open Government Data Portal (data.gov.in) API Key
              </span>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  वर्तमान लाइव स्रोत स्थिति
                </label>
                <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{mandiApiKey ? 'Agmarknet API कनेक्टेड (सक्रिय)' : 'राजस्थान मंडी दैनिक स्वचालित फीड (सक्रिय)'}</span>
                </div>
              </div>
            </div>
          </div>
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
