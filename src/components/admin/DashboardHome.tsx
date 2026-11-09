import React from 'react';
import {
  Newspaper,
  Eye,
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
  Plus
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
    autoNewsPendingCount
  } = useNews();

  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const activeAdsCount = advertisements.filter(a => a.status === 'active').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const topArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

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
            <span className="text-xs font-bold">कुल समाचार दृश्य (Views)</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900 dark:text-stone-100">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            सत्यापित पाठक संख्या
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
              <span>शीर्ष लोकप्रिय समाचार (Real Traffic)</span>
            </h3>
            <button
              onClick={() => onNavigate('news_list')}
              className="text-xs text-red-700 dark:text-red-400 font-bold hover:underline"
            >
              सभी देखें →
            </button>
          </div>

          <div className="space-y-3">
            {topArticles.map((art, idx) => (
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
                  <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 block">
                    {(art.views || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-400">पाठक</span>
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
