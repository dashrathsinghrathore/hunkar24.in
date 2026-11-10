import React, { useState } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  PenTool,
  AlertCircle,
  FolderTree,
  MapPin,
  Inbox,
  Users,
  Image,
  Video,
  Camera,
  Megaphone,
  Briefcase,
  Store,
  CreditCard,
  BarChart3,
  Sparkles,
  Search,
  Globe,
  Share2,
  Settings,
  Bell,
  Shield,
  Activity,
  Database,
  Radio,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  Menu
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useNews } from '../../context/NewsContext';
import { SITE_CONFIG } from '../../config/siteConfig';

export type AdminTab =
  | 'dashboard'
  | 'auto_news'
  | 'news_list'
  | 'news_create'
  | 'breaking'
  | 'categories'
  | 'districts'
  | 'submissions'
  | 'reporters'
  | 'users'
  | 'media'
  | 'videos'
  | 'galleries'
  | 'ads'
  | 'promotions'
  | 'listings'
  | 'payments'
  | 'analytics'
  | 'ai_assistant'
  | 'seo'
  | 'social'
  | 'settings'
  | 'notifications'
  | 'audit'
  | 'security'
  | 'supabase_guide';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const {
    currentUser,
    logout,
    theme,
    toggleTheme,
    submissions,
    promotionRequests,
    autoNewsPendingCount,
    supabaseStatus,
    realtimeStatus,
    lastSyncTime
  } = useNews();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;
  const pendingPromotionsCount = promotionRequests.filter(p => p.status === 'pending').length;

  const navItems = [
    { id: 'dashboard', label: '1. डैशबोर्ड (Dashboard)', icon: LayoutDashboard },
    {
      id: 'auto_news',
      label: '★ स्वचालित न्यूज़ नेटवर्क (Auto News)',
      icon: Radio,
      highlight: true,
      badge: autoNewsPendingCount > 0 ? autoNewsPendingCount : undefined
    },
    { id: 'news_list', label: '2. समाचार प्रबंधन (News)', icon: Newspaper },
    { id: 'news_create', label: '3. नया समाचार लिखें (Create)', icon: PenTool },
    { id: 'breaking', label: '4. ब्रेकिंग न्यूज़ (Breaking)', icon: AlertCircle },
    { id: 'categories', label: '5. श्रेणियां (Categories)', icon: FolderTree },
    { id: 'districts', label: '6. राजस्थान ज़िले (Districts)', icon: MapPin },
    {
      id: 'submissions',
      label: '7. नागरिक समाचार (Submissions)',
      icon: Inbox,
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined
    },
    { id: 'reporters', label: '8. रिपोर्टर प्रबंधन (Reporters)', icon: Users },
    { id: 'users', label: '9. यूज़र्स व भूमिकाएं (RBAC)', icon: Shield },
    { id: 'media', label: '10. मीडिया लाइब्रेरी (Media)', icon: Image },
    { id: 'videos', label: '11. वीडियो न्यूज़ (Videos)', icon: Video },
    { id: 'galleries', label: '12. फोटो गैलरी (Gallery)', icon: Camera },
    { id: 'ads', label: '13. विज्ञापन प्रबंधन (Ads)', icon: Megaphone },
    {
      id: 'promotions',
      label: '14. प्रायोजित प्रचार (Promotions)',
      icon: Briefcase,
      badge: pendingPromotionsCount > 0 ? pendingPromotionsCount : undefined
    },
    { id: 'listings', label: '15. बिज़नेस डायरेक्टरी (Listings)', icon: Store },
    { id: 'payments', label: '16. भुगतान प्रबंधन (Payments)', icon: CreditCard },
    { id: 'analytics', label: '17. एनालिटिक्स रिपोर्ट (Analytics)', icon: BarChart3 },
    { id: 'ai_assistant', label: '18. AI वायरल असिस्टेंट (AI)', icon: Sparkles, highlight: true },
    { id: 'seo', label: '19. SEO व डोमेन प्रबंधन (SEO)', icon: Search },
    { id: 'social', label: '20. सोशल मीडिया सेटिंग्स (Social)', icon: Share2 },
    { id: 'settings', label: '21. वेबसाइट सेटिंग्स (Settings)', icon: Settings },
    { id: 'notifications', label: '22. नोटिफिकेशन (Alerts)', icon: Bell },
    { id: 'audit', label: '23. ऑडिट लॉग्स (Activity Logs)', icon: Activity },
    { id: 'security', label: '24. सुरक्षा व RLS (Security)', icon: Shield },
    { id: 'supabase_guide', label: '25. Supabase कनेक्शन चेकलिस्ट', icon: Database, highlight: true }
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col antialiased">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo variant="admin" onClick={onExitAdmin} />
          <span className="hidden sm:inline bg-red-700 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
            एडमिन कंट्रोल रूम
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-stone-900 rounded-lg border border-stone-800 text-[11px]">
            <div className="flex items-center gap-1.5" title="Supabase PostgreSQL Status">
              <span className={`w-2 h-2 rounded-full ${supabaseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : supabaseStatus === 'connecting' ? 'bg-amber-500' : 'bg-stone-500'}`} />
              <span className="text-stone-400 font-medium">Supabase:</span>
              <span className={`font-mono font-bold text-[10px] ${supabaseStatus === 'connected' ? 'text-emerald-400' : supabaseStatus === 'connecting' ? 'text-amber-400' : 'text-stone-400'}`}>
                {supabaseStatus === 'connected' ? 'LIVE' : supabaseStatus === 'connecting' ? 'SYNC...' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-stone-700">|</span>
            <div className="flex items-center gap-1.5" title="Supabase Realtime Sync">
              <Radio className={`w-3 h-3 ${realtimeStatus === 'active' ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
              <span className="text-stone-400 font-medium">Realtime:</span>
              <span className={`font-mono font-bold text-[10px] ${realtimeStatus === 'active' ? 'text-emerald-400' : realtimeStatus === 'reconnecting' ? 'text-amber-400' : 'text-stone-400'}`}>
                {realtimeStatus === 'active' ? 'SYNCED' : realtimeStatus === 'reconnecting' ? 'RECONNECTING' : 'OFFLINE'}
              </span>
            </div>
            {lastSyncTime && (
              <>
                <span className="text-stone-700">|</span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {new Date(lastSyncTime).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </>
            )}
          </div>

          {/* View live site button */}
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">लाइव वेबसाइट देखें</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
            title="थीम बदलें"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Neutral Administrator Badge (Zero Personal Identity Exposed) */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
            <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left text-xs">
              <span className="font-bold block truncate max-w-[140px] text-white">
                सिस्टम प्रशासक
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                प्रशासनिक खाता (Active)
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer ml-1"
              title="सुरक्षित लॉगआउट करें"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside
          className={`hidden md:flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-200 select-none ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Collapse Toggle */}
          <div className="p-2 border-b border-stone-200 dark:border-stone-800 flex justify-end">
            <button
              onClick={() => setIsCollapsed(prev => !prev)}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
              title={isCollapsed ? 'साइडबार विस्तार करें' : 'साइडबार समेटें'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links (All 25 modules) */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 text-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-red-700 text-white font-bold shadow-xs'
                      : item.highlight
                      ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col z-10 p-3 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-2">
                <span className="text-xs font-bold text-red-700 uppercase">एडमिन मेन्यू</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-stone-400">✕</button>
              </div>
              <div className="space-y-1 text-xs">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id as AdminTab);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium ${
                        isActive ? 'bg-red-700 text-white font-bold' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
