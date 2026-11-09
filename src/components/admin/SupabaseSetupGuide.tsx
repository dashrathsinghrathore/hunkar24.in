import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  Lock,
  FileCode
} from 'lucide-react';
import { getSupabaseConfigStatus, saveSupabaseCredentials, clearSupabaseCredentials } from '../../lib/supabaseClient';

export const SupabaseSetupGuide: React.FC = () => {
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customAnonKey, setCustomAnonKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [status, setStatus] = useState(() => getSupabaseConfigStatus());

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setConnectMsg(null);

    const res = await saveSupabaseCredentials(customUrl, customAnonKey);
    if (res.success) {
      setConnectMsg({ type: 'success', text: 'सफलतापूर्वक Supabase रियल-टाइम डेटाबेस से कनेक्ट हो गया! डेटाबेस सक्रिय है।' });
      setStatus(getSupabaseConfigStatus());
    } else {
      setConnectMsg({ type: 'error', text: res.error || 'कनेक्शन विफल रहा' });
    }
    setIsSaving(false);
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setStatus(getSupabaseConfigStatus());
    setConnectMsg({ type: 'success', text: 'स्थानीय डेटाबेस मोड पर रीसेट कर दिया गया।' });
  };

  const handleCopySchema = () => {
    const fullSql = `-- ============================================================================
-- HUNKAR 24 (हुंकार 24) – SUPABASE REAL-TIME MASTER SCHEMA
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT 'rajasthan',
  district TEXT,
  tehsil TEXT,
  village TEXT,
  main_image TEXT NOT NULL,
  image_caption TEXT,
  image_source TEXT,
  reporter_name TEXT NOT NULL DEFAULT 'हुंकार ब्यूरो',
  reporter_role TEXT DEFAULT 'संवाददाता',
  reporter_photo TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_breaking BOOLEAN DEFAULT false,
  is_hero BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  views_count BIGINT DEFAULT 1,
  likes_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 3,
  tags TEXT[] DEFAULT ARRAY['राजस्थान', 'हुंकार24']::TEXT[],
  video_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BREAKING NEWS TABLE
CREATE TABLE IF NOT EXISTS public.breaking_news (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link_article_id TEXT,
  link_url TEXT,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

-- 4. PUBLIC ACCESS & ANONYMOUS POLICIES (Read & Write)
DROP POLICY IF EXISTS "Public Read Articles" ON public.articles;
CREATE POLICY "Public Read Articles" ON public.articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Breaking" ON public.breaking_news;
CREATE POLICY "Public Read Breaking" ON public.breaking_news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Insert Articles" ON public.articles;
CREATE POLICY "Admin Insert Articles" ON public.articles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Update Articles" ON public.articles;
CREATE POLICY "Admin Update Articles" ON public.articles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin Delete Articles" ON public.articles;
CREATE POLICY "Admin Delete Articles" ON public.articles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admin Manage Breaking" ON public.breaking_news;
CREATE POLICY "Admin Manage Breaking" ON public.breaking_news FOR ALL USING (true);

-- 5. ENABLE SUPABASE REALTIME REPLICATION (Instant Updates across all devices without refresh)
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.breaking_news;
`;
    navigator.clipboard.writeText(fullSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const checklistItems = [
    {
      num: 1,
      title: 'Supabase Project URL (प्रोजेक्ट URL)',
      whereToFind: 'Supabase Dashboard -> Project Settings -> API -> Project URL',
      visibility: 'सार्वजनिक (Public)',
      storageLocation: 'VITE_SUPABASE_URL (Netlify Environment Variables / .env)',
      description: 'क्लाइंट-साइड डेटाबेस एक्सेस एवं इमेज स्टोरेज पाथ के लिए आवश्यक।'
    },
    {
      num: 2,
      title: 'Supabase Publishable / Anon Key (अनाम कुंजी)',
      whereToFind: 'Supabase Dashboard -> Project Settings -> API -> Project API keys -> "anon" "public"',
      visibility: 'सार्वजनिक (Public Safe for Client)',
      storageLocation: 'VITE_SUPABASE_ANON_KEY (Netlify Environment Variables / .env)',
      description: 'Row Level Security (RLS) के तहत सुरक्षित डेटा क्वेरी करने के लिए।'
    },
    {
      num: 3,
      title: 'Supabase Service Role Key (सर्विस रोल सीक्रेट)',
      whereToFind: 'Supabase Dashboard -> Project Settings -> API -> Project API keys -> "service_role" "secret"',
      visibility: 'अत्यंत गोपनीय (STRICTLY SECRET - Never Frontend)',
      storageLocation: 'Netlify Functions Environment Variables / Supabase Edge Functions',
      description: 'बैकएंड ऑटोमेशन व सुपर एडमिन प्रक्रियाओं के लिए। कभी भी फ्रंटएंड कोड में न डालें।'
    },
    {
      num: 4,
      title: 'PostgreSQL Database & RLS Schema (डेटाबेस माइग्रेशन)',
      whereToFind: 'Supabase Dashboard -> SQL Editor',
      visibility: 'आंतरिक स्कीमा (Internal Schema)',
      storageLocation: '/supabase/migrations/20261107000000_hunkar24_schema.sql',
      description: '30+ टेबल्स, रो-लेवल सिक्योरिटी नीतियां, अनुक्रमणिकाएं व सुरक्षा नियम।'
    },
    {
      num: 5,
      title: 'Storage Buckets (स्टोरेज बकेट्स)',
      whereToFind: 'Supabase Dashboard -> Storage -> Create New Bucket',
      visibility: 'पब्लिक बकेट (Public for Images)',
      storageLocation: 'news-media, reporters, advertisements',
      description: 'समाचार फोटो, संवाददाताओं की प्रोफाइल और विज्ञापन बैनर अपलोड करने के लिए।'
    },
    {
      num: 6,
      title: 'Authentication Settings (प्रमाणीकरण)',
      whereToFind: 'Supabase Dashboard -> Authentication -> Providers',
      visibility: 'कन्फिगरेशन',
      storageLocation: 'Email/Password (सक्रिय) एवं Google OAuth (वैकल्पिक)',
      description: 'एडमिन व रिपोर्टर्स के सुरक्षित लॉगिन एवं पासवर्ड रीसेट के लिए।'
    }
  ];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Supabase बैकएंड कनेक्शन चेकलिस्ट (Section 26 Master Checklist)</span>
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 के उत्पादन स्तरीय डेटाबेस एवं स्टोरेज एकीकरण की विस्तृत मार्गदर्शिका
          </p>
        </div>

        {/* Live Status Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 self-start sm:self-center ${
          status.isConfigured
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${status.isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span>{status.isConfigured ? 'लाइव Supabase कनेक्टेड' : 'लोकल डेटाबेस मोड सक्रिय (100% कार्यात्मक)'}</span>
        </div>
      </div>

      {/* Security Advisory Notice */}
      <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900 dark:text-stone-100 text-sm block mb-1">
            सुरक्षा एवं क्रेडेंशियल नियम (Cybersecurity Guidelines)
          </strong>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            हुंकार 24 में सुरक्षा सर्वोपरि है। कभी भी <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded font-mono text-red-700 dark:text-red-300">SUPABASE_SERVICE_ROLE_KEY</code> या पेमेंट गेटवे सीक्रेट्स को फ्रंटएंड कोड में साझा न करें। सार्वजनिक कुंजियां (<code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded font-mono text-emerald-700 dark:text-emerald-300">VITE_SUPABASE_ANON_KEY</code>) सुरक्षित रूप से नेटलिफाई या एनवायरनमेंट वेरिएबल्स में रखी जाती हैं।
          </p>
        </div>
      </div>

      {/* Live Direct Supabase Connection Box */}
      <div className="p-5 bg-stone-900 text-white rounded-xl border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>लाइव Supabase रियल-टाइम डेटाबेस कनेक्शन (Live Real-Time Connect)</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              अपने Supabase प्रोजेक्ट का URL और Anon Key यहां दर्ज करें। यह रियल-टाइम डेटाबेस से तुरंत जुड़ जाएगा।
            </p>
          </div>
          {status.isConfigured && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
            >
              डिस्कनेक्ट करें
            </button>
          )}
        </div>

        {connectMsg && (
          <div className={`p-3 rounded-lg text-xs font-medium ${connectMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' : 'bg-red-950/80 border border-red-700 text-red-300'}`}>
            {connectMsg.text}
          </div>
        )}

        <form onSubmit={handleConnect} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-5">
            <label className="block text-stone-300 font-bold mb-1">प्रोजेक्ट URL (Project URL)</label>
            <input
              type="url"
              required
              placeholder="https://yourproject.supabase.co"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white font-mono placeholder-stone-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-stone-300 font-bold mb-1">Anon / Public API Key</label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={customAnonKey}
              onChange={e => setCustomAnonKey(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white font-mono placeholder-stone-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-white font-bold transition-colors cursor-pointer"
            >
              {isSaving ? 'कनेक्ट...' : 'कनेक्ट करें'}
            </button>
          </div>
        </form>
      </div>

      {/* Master Checklist Cards */}
      <div className="space-y-4">
        {checklistItems.map(item => (
          <div
            key={item.num}
            className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:shadow-xs transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center font-mono font-bold text-xs">
                  {item.num}
                </span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {item.title}
                </h3>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                item.visibility.includes('गोपनीय')
                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {item.visibility}
              </span>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 mb-3">
              {item.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-lg border border-stone-100 dark:border-stone-700/80">
              <div>
                <span className="font-bold text-stone-500 block">कहाँ मिलेगा (Source):</span>
                <span className="text-stone-800 dark:text-stone-200">{item.whereToFind}</span>
              </div>
              <div>
                <span className="font-bold text-stone-500 block">कहाँ स्टोर करें (Env Storage):</span>
                <span className="font-mono text-red-700 dark:text-red-400 font-bold">{item.storageLocation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SQL Migration Quick Action */}
      <div className="p-4 rounded-xl bg-stone-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            उत्पादन स्तर का PostgreSQL स्कीमा तैयार है
          </span>
          <p className="text-xs text-stone-300 mt-0.5">
            सभी 25+ टेबल्स, RLS पॉलिसियां एवं विदेशी कुंजियां <code className="text-emerald-400">/supabase/migrations/20261107000000_hunkar24_schema.sql</code> में सम्मिलित हैं।
          </p>
        </div>

        <button
          onClick={handleCopySchema}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
        >
          {copiedSchema ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copiedSchema ? 'कॉपी हो गया!' : 'स्कीमा पाथ कॉपी करें'}</span>
        </button>
      </div>
    </div>
  );
};
