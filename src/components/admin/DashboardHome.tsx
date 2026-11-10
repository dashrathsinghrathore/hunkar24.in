import React from 'react';
import {
  Newspaper,
  Zap,
  Inbox,
  Users,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Radio,
  Plus,
  Sparkles,
  Bot,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { AdminTab } from './AdminLayout';

interface DashboardHomeProps {
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const {
    articles,
    breakingNews,
    submissions,
    advertisements,
    reporters,
    auditLogs,
    autoNewsPendingCount,
    supabaseStatus,
    realtimeStatus,
    lastSyncTime
  } = useNews();

  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const activeAdsCount = advertisements.filter(a => a.status === 'active').length;
  const activeBreakingCount = breakingNews.filter(b => b.isActive).length;

  const recentArticles = [...articles].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Strip */}
      <div className="bg-gradient-to-r from-red-800 to-stone-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            हुंकार 24 मास्टर एडमिन पोर्टल
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-newspaper-headline">
            नमस्ते, संपादकीय कक्ष में आपका स्वागत है
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            प्रमाणित, निष्पक्ष एवं तीव्र डिजिटल पत्रकारिता का केंद्रीय नियंत्रण कक्ष
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('auto_news')}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Radio className="w-4 h-4 text-amber-300" />
            <span>ऑटो न्यूज़ नेटवर्क ({autoNewsPendingCount})</span>
          </button>
          <button
            onClick={() => onNavigate('news_create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>नया समाचार लिखें</span>
          </button>
          <button
            onClick={() => onNavigate('supabase_guide')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-xl text-xs border border-stone-700 transition-colors"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase चेकलिस्ट</span>
          </button>
        </div>
      </div>

      {/* Live System Health & Automation Status (Phase 9 Indicators) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-200">
              लाइव सिस्टम स्थिति एवं ऑटोमेशन मॉनिटर (Live System Health)
            </h2>
          </div>
          {lastSyncTime && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono">
              <RefreshCw className="w-3 h-3 text-stone-500" />
              <span>अंतिम डेटाबेस सिंक: {new Date(lastSyncTime).toLocaleTimeString('hi-IN')}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Supabase Status */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[11px] font-medium">Supabase DB</span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className={`w-2 h-2 rounded-full ${supabaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={supabaseStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>
                {supabaseStatus === 'connected' ? 'कनेक्टेड (LIVE)' : 'लोकल सिंक (POLL)'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Single Source of Truth</p>
          </div>

          {/* Realtime Sync */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[11px] font-medium">रीयल-टाइम सिंक</span>
              <Radio className={`w-3.5 h-3.5 ${realtimeStatus === 'active' ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
            </div>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'active' ? 'bg-emerald-500' : 'bg-stone-500'}`} />
              <span className={realtimeStatus === 'active' ? 'text-emerald-400' : 'text-stone-400'}>
                {realtimeStatus === 'active' ? 'सक्रिय (ACTIVE)' : 'पुनः संयोजन'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">मल्टी-डिवाइस ऑटो पुश</p>
          </div>

          {/* Google Gemini AI Engine */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[11px] font-medium">Gemini 2.5 AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>सक्रिय (ENABLED)</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">हिंदी पत्रकारिता रूपांतरण</p>
          </div>

          {/* 3-Hour News Scheduler & ChatGPT API */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[11px] font-medium">3-घंटे शेड्यूलर & API</span>
              <Bot className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-center gap-1.5 font-bold font-mono text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>180m चक्र / OpenAPI</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">ऑटो-पब्लिश & ChatGPT</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">कुल प्रकाशित समाचार</span>
            <Newspaper className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900 dark:text-stone-100">
            {publishedCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {draftCount} ड्राफ्ट सुरक्षित
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">सक्रिय ब्रेकिंग न्यूज़</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900 dark:text-stone-100">
            {activeBreakingCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            लाइव टिकर में प्रसारित
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">नागरिक समाचार समीक्षा</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            {pendingSubmissions.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            प्रतीक्षारत जन-रिपोर्ट
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold">सक्रिय विज्ञापन अभियान</span>
            <Megaphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900 dark:text-stone-100">
            {activeAdsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            लाइव प्रचारित बैनर
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Top Articles & Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Read Articles (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span>हालिया मुख्य समाचार (Latest News)</span>
            </h3>
            <button
              onClick={() => onNavigate('news_list')}
              className="text-xs text-red-700 dark:text-red-400 font-bold hover:underline"
            >
              सभी देखें →
            </button>
          </div>

          <div className="space-y-3">
            {recentArticles.map((art, idx) => (
              <div
                key={art.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="font-mono text-xs font-bold text-stone-400 w-4">
                    {idx + 1}.
                  </span>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {art.headline}
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      {art.district || 'राजस्थान'} · {art.category}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    {art.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {art.readingTimeMinutes || 2} मिनट
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activities (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>हालिया गतिविधियां (Audit Log)</span>
            </h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline"
            >
              लॉग्स देखें
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map(log => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-xs"
              >
                <div className="flex items-center justify-between text-stone-500 mb-1">
                  <span className="font-bold text-stone-800 dark:text-stone-200">{log.action}</span>
                  <span className="text-[10px] font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2">
                  {log.details}
                </p>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  द्वारा: {log.userName} ({log.module})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
