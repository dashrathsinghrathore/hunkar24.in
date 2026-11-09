import React, { useState, useEffect } from 'react';
import { useNews, NewsProvider } from './context/NewsContext';
import { TopUtilityBar } from './components/header/TopUtilityBar';
import { MainHeader } from './components/header/MainHeader';
import { NavBar } from './components/header/NavBar';
import { MobileNavDrawer } from './components/header/MobileNavDrawer';
import { BreakingTicker } from './components/breaking/BreakingTicker';
import { MobileNewsSlider } from './components/news/MobileNewsSlider';
import { HeroSection } from './components/news/HeroSection';
import { RajasthanDistrictFeed } from './components/news/RajasthanDistrictFeed';
import { AgricultureFarmersSection } from './components/news/AgricultureFarmersSection';
import { EducationJobsSection } from './components/news/EducationJobsSection';
import { GroundReportSection } from './components/news/GroundReportSection';
import { VideoNewsSection } from './components/news/VideoNewsSection';
import { PhotoGallerySection } from './components/news/PhotoGallerySection';
import { TrendingNewsSection } from './components/news/TrendingNewsSection';
import { ArticleCard } from './components/news/ArticleCard';
import { NewsArticleView } from './components/news/NewsArticleView';
import { AdBanner } from './components/ads/AdBanner';
import { NewsletterSubscribe } from './components/news/NewsletterSubscribe';
import { Footer } from './components/footer/Footer';

// Modals
import { SubmitNewsModal } from './components/publicSubmission/SubmitNewsModal';
import { BusinessPromotionModal } from './components/promotion/BusinessPromotionModal';
import { SearchModal } from './components/modals/SearchModal';
import { ReportIssueModal } from './components/modals/ReportIssueModal';
import { PolicyModal } from './components/modals/PolicyModal';

// Admin Views
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { DashboardHome } from './components/admin/DashboardHome';
import { NewsEditor } from './components/admin/NewsEditor';
import { NewsList } from './components/admin/NewsList';
import { BreakingNewsManager } from './components/admin/BreakingNewsManager';
import { CategoriesManager } from './components/admin/CategoriesManager';
import { DistrictsManager } from './components/admin/DistrictsManager';
import { PublicSubmissionsReview } from './components/admin/PublicSubmissionsReview';
import { ReporterManager } from './components/admin/ReporterManager';
import { AdManager } from './components/admin/AdManager';
import { PromotionRequestsManager } from './components/admin/PromotionRequestsManager';
import { MediaLibrary } from './components/admin/MediaLibrary';
import { VideoManager } from './components/admin/VideoManager';
import { GalleryManager } from './components/admin/GalleryManager';
import { AIViralAssistant } from './components/admin/AIViralAssistant';
import { SupabaseSetupGuide } from './components/admin/SupabaseSetupGuide';
import { WebsiteSettings } from './components/admin/WebsiteSettings';
import { ActivityLogsView } from './components/admin/ActivityLogsView';
import { AutoNewsControlCenter } from './components/admin/AutoNewsControlCenter';
import { AdminPortalLogin } from './components/admin/AdminPortalLogin';
import { Article } from './types';
import { ArrowLeft, RefreshCw, Layers } from 'lucide-react';

const CATEGORY_NAMES_HI: Record<string, string> = {
  all: 'सभी समाचार',
  latest: 'ताज़ा समाचार',
  rajasthan: 'राजस्थान',
  national: 'राष्ट्रीय',
  politics: 'राजनीति',
  schemes: 'सरकारी योजनाएं',
  jobs: 'शिक्षा व रोजगार',
  education: 'शिक्षा',
  business: 'व्यापार व अर्थव्यवस्था',
  agriculture: 'कृषि व मंडी भाव',
  crime: 'अपराध व सुरक्षा',
  sports: 'खेलकूद',
  entertainment: 'मनोरंजन व कला',
  technology: 'तकनीक व विज्ञान',
  world: 'देश-विदेश',
  churu: 'चूरू',
  jaipur: 'जयपुर',
  sikar: 'सीकर',
  bikaner: 'बीकानेर',
  jodhpur: 'जोधपुर',
  udaipur: 'उदयपुर',
  ajmer: 'अजमेर',
  nagaur: 'नागौर',
  jhunjhunu: 'झुंझुनूं',
  kota: 'कोटा'
};

const NewsAppContent: React.FC = () => {
  const {
    articles,
    selectedCategory,
    setSelectedCategory,
    selectedDistrict,
    setSelectedDistrict,
    activeArticle,
    setActiveArticle,
    currentUser
  } = useNews();

  // Route / View state: Supports direct /admin, /admin/, #admin, and ?admin=true
  const checkIsAdminRequested = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return path === '/admin' || path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin') || search.includes('admin=true');
  };

  const [isAdminView, setIsAdminView] = useState(() => checkIsAdminRequested());
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Modals state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);

  // Category Feed Pagination
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Initial URL parsing
  useEffect(() => {
    if (checkIsAdminRequested()) {
      setIsAdminView(true);
      return;
    }
    const path = window.location.pathname;
    if (path.startsWith('/news/')) {
      const slug = path.replace('/news/', '').trim();
      const matched = articles.find(a => a.slug === slug);
      if (matched) {
        setActiveArticle(matched);
      }
    } else if (path.length > 1) {
      const clean = path.replace('/', '').toLowerCase();
      if (CATEGORY_NAMES_HI[clean]) {
        setSelectedCategory(clean);
      }
    }
  }, []);

  // Listen for browser navigation (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      if (checkIsAdminRequested()) {
        setIsAdminView(true);
        return;
      }
      setIsAdminView(false);
      const path = window.location.pathname;
      if (path.startsWith('/news/')) {
        const slug = path.replace('/news/', '').trim();
        const matched = articles.find(a => a.slug === slug);
        if (matched) setActiveArticle(matched);
      } else if (path === '/' || path === '') {
        setActiveArticle(null);
        setSelectedCategory('all');
      } else {
        setActiveArticle(null);
        const clean = path.replace('/', '').toLowerCase();
        if (CATEGORY_NAMES_HI[clean]) {
          setSelectedCategory(clean);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [articles]);

  // Sync URL history state
  useEffect(() => {
    if (isAdminView) {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else if (activeArticle) {
      const target = `/news/${activeArticle.slug}`;
      if (window.location.pathname !== target) {
        window.history.pushState(null, '', target);
      }
    } else if (selectedCategory !== 'all') {
      const target = `/${selectedCategory}`;
      if (window.location.pathname !== target) {
        window.history.pushState(null, '', target);
      }
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [isAdminView, activeArticle, selectedCategory]);

  // If Admin View is active, verify authentication
  if (isAdminView) {
    if (!currentUser) {
      return (
        <AdminPortalLogin
          onLoginSuccess={() => {}}
          onExitToPublic={() => {
            setIsAdminView(false);
            window.history.pushState(null, '', '/');
          }}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={tab => {
          if (tab === 'news_create') {
            setEditingArticle(null);
          }
          setAdminTab(tab);
        }}
        onExitAdmin={() => {
          setIsAdminView(false);
          window.history.pushState(null, '', '/');
        }}
      >
        {adminTab === 'dashboard' && (
          <DashboardHome
            onNavigate={tab => {
              if (tab === 'news_create') setEditingArticle(null);
              setAdminTab(tab);
            }}
          />
        )}
        {adminTab === 'auto_news' && <AutoNewsControlCenter />}
        {adminTab === 'news_list' && (
          <NewsList
            onCreateNew={() => {
              setEditingArticle(null);
              setAdminTab('news_create');
            }}
            onEditArticle={art => {
              setEditingArticle(art);
              setAdminTab('news_create');
            }}
          />
        )}
        {adminTab === 'news_create' && (
          <NewsEditor
            initialArticle={editingArticle}
            onSaved={() => {
              setEditingArticle(null);
              setAdminTab('news_list');
            }}
          />
        )}
        {adminTab === 'breaking' && <BreakingNewsManager />}
        {adminTab === 'categories' && <CategoriesManager />}
        {adminTab === 'districts' && <DistrictsManager />}
        {adminTab === 'submissions' && <PublicSubmissionsReview />}
        {adminTab === 'reporters' && <ReporterManager />}
        {adminTab === 'media' && <MediaLibrary />}
        {adminTab === 'videos' && <VideoManager />}
        {adminTab === 'galleries' && <GalleryManager />}
        {adminTab === 'ads' && <AdManager />}
        {adminTab === 'promotions' && <PromotionRequestsManager />}
        {adminTab === 'ai_assistant' && <AIViralAssistant />}
        {adminTab === 'supabase_guide' && <SupabaseSetupGuide />}
        {adminTab === 'settings' && <WebsiteSettings />}
        {adminTab === 'audit' && <ActivityLogsView />}
        {adminTab === 'users' && <ReporterManager />}
        {adminTab === 'listings' && <PromotionRequestsManager />}
        {adminTab === 'payments' && <AdManager />}
        {adminTab === 'analytics' && <DashboardHome onNavigate={setAdminTab} />}
        {adminTab === 'seo' && <WebsiteSettings />}
        {adminTab === 'social' && <WebsiteSettings />}
        {adminTab === 'notifications' && <BreakingNewsManager />}
        {adminTab === 'security' && <SupabaseSetupGuide />}
      </AdminLayout>
    );
  }

  // Filtered Articles for Category Feed
  const filteredCategoryArticles = articles.filter(a => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'latest') return a.status === 'published';
    const matchCategory = a.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchDistrict = a.district?.toLowerCase() === selectedCategory.toLowerCase();
    const matchTag = a.tags?.some(t => t.toLowerCase() === selectedCategory.toLowerCase());
    return matchCategory || matchDistrict || matchTag;
  });

  const categoryTitle = CATEGORY_NAMES_HI[selectedCategory] || selectedCategory.toUpperCase();

  // Public News Portal View — STRICTLY ZERO ADMIN BUTTONS OR LINKS
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* 1. Top Utility Ribbon */}
      <TopUtilityBar />

      {/* 2. Main Desktop / Mobile Header — Clean public presentation */}
      <MainHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* 3. Primary Sticky Categories Navigation Bar */}
      <NavBar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* 4. Breaking News Scrolling Ticker */}
      <BreakingTicker />

      {/* 5. Top Leaderboard Advertisement Banner */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <AdBanner placement="top_header" />
      </div>

      {/* 5.1 Mobile News Slider (Touch-swipeable, responsive headline slider below top banner) */}
      {!activeArticle && selectedCategory === 'all' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 w-full pt-2">
          <MobileNewsSlider />
        </div>
      )}

      {/* 6. Main Body Content Routing */}
      <div className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 w-full py-4 sm:py-6">
        {activeArticle ? (
          /* Single Article Reading View */
          <NewsArticleView
            article={activeArticle}
            onBack={() => {
              setActiveArticle(null);
              window.history.pushState(null, '', selectedCategory === 'all' ? '/' : `/${selectedCategory}`);
            }}
          />
        ) : selectedCategory !== 'all' ? (
          /* Category / District Filtered Feed View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-red-700">
              <div>
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest block">
                  हुंकार 24 विशेष अनुभाग
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
                  {categoryTitle} समाचार
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    window.history.pushState(null, '', '/');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>सभी समाचार देखें</span>
                </button>
              </div>
            </div>

            {/* Quick District / Category Switch Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs">
              <span className="text-stone-400 font-bold shrink-0">त्वरित ज़िला:</span>
              {['jaipur', 'churu', 'sikar', 'bikaner', 'jodhpur', 'udaipur', 'ajmer'].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedCategory(d);
                    setVisibleCount(9);
                  }}
                  className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === d
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {CATEGORY_NAMES_HI[d] || d}
                </button>
              ))}
            </div>

            {filteredCategoryArticles.length === 0 ? (
              /* Informative Empty State with Related Stories */
              <div className="space-y-6">
                <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 font-newspaper-headline">
                    इस अनुभाग ({categoryTitle}) में वर्तमान में कोई ताज़ा समाचार उपलब्ध नहीं है
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    हुंकार 24 का स्वचालित न्यूज़ नेटवर्क इस क्षेत्र की नवीनतम खबरों की निरंतर निगरानी कर रहा है। शीघ्र ही नए समाचार यहां उपलब्ध होंगे।
                  </p>
                </div>

                {/* Show Top Rajasthan News as Related */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold font-newspaper-headline text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-200 dark:border-stone-800">
                    राजस्थान के अन्य महत्वपूर्ण समाचार:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {articles.slice(0, 3).map(art => (
                      <ArticleCard key={art.id} article={art} layout="standard" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategoryArticles.slice(0, visibleCount).map(art => (
                    <ArticleCard key={art.id} article={art} layout="standard" />
                  ))}
                </div>

                {/* Load More Button */}
                {filteredCategoryArticles.length > visibleCount && (
                  <div className="text-center pt-6">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>और समाचार लोड करें ({filteredCategoryArticles.length - visibleCount} शेष)</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Comprehensive Homepage Layout */
          <>
            {/* Section A: 3-Tier Hero Section (Lead Story + Secondary + Fast Feed) */}
            <HeroSection />

            {/* Section B: Rajasthan Hyper-Local District Feed */}
            <RajasthanDistrictFeed />

            {/* Mid-Feed Advertisement Banner */}
            <AdBanner placement="middle_feed" />

            {/* Section C: Agriculture, Farmers & Live Mandi Bhav Special */}
            <AgricultureFarmersSection />

            {/* Section D: Education, Govt Jobs & Schemes */}
            <EducationJobsSection />

            {/* Section D: Ground Reports & Investigative Journalism */}
            <GroundReportSection />

            {/* Section E: Video News Bulletin */}
            <VideoNewsSection />

            {/* Section F: Photo Gallery & Cultural Heritage */}
            <PhotoGallerySection />

            {/* Section G: Trending & Most Read vs Latest Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
              {/* Latest News Feed (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-stone-800 dark:border-stone-700">
                  <h3 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
                    ताज़ा खबरें एवं प्रादेशिक हलचल
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">निरंतर अद्यतन</span>
                </div>

                <div className="space-y-4">
                  {articles.slice(2, 7).map(art => (
                    <ArticleCard key={art.id} article={art} layout="horizontal" />
                  ))}
                </div>
              </div>

              {/* Sidebar: Trending News & Rectangle Ad Banner (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <TrendingNewsSection />
                <AdBanner placement="sidebar" />
              </div>
            </div>

            {/* Newsletter Subscription Component (Integrated into bottom of main content feed) */}
            <NewsletterSubscribe />
          </>
        )}
      </div>

      {/* 7. Comprehensive Public Footer — No admin link visible */}
      <Footer onSelectPolicy={policy => setActivePolicy(policy)} />

      {/* Global Public Modals */}
      <SubmitNewsModal />
      <BusinessPromotionModal />
      <SearchModal />
      <ReportIssueModal />
      <PolicyModal policyType={activePolicy} onClose={() => setActivePolicy(null)} />
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <NewsProvider>
      <NewsAppContent />
    </NewsProvider>
  );
}

export default App;
