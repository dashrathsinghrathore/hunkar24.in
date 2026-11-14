import React, { useState, useEffect, lazy, Suspense } from 'react';
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
import { MobileBottomNav } from './components/navigation/MobileBottomNav';

// Modals
import { SubmitNewsModal } from './components/publicSubmission/SubmitNewsModal';
import { BusinessPromotionModal } from './components/promotion/BusinessPromotionModal';
import { SearchModal } from './components/modals/SearchModal';
import { ReportIssueModal } from './components/modals/ReportIssueModal';
import { PolicyModal } from './components/modals/PolicyModal';

// Lazy-loaded Admin Views (code-split away from public news bundle)
import type { AdminTab } from './components/admin/AdminLayout';
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DashboardHome = lazy(() => import('./components/admin/DashboardHome').then(m => ({ default: m.DashboardHome })));
const NewsEditor = lazy(() => import('./components/admin/NewsEditor').then(m => ({ default: m.NewsEditor })));
const NewsList = lazy(() => import('./components/admin/NewsList').then(m => ({ default: m.NewsList })));
const BreakingNewsManager = lazy(() => import('./components/admin/BreakingNewsManager').then(m => ({ default: m.BreakingNewsManager })));
const CategoriesManager = lazy(() => import('./components/admin/CategoriesManager').then(m => ({ default: m.CategoriesManager })));
const DistrictsManager = lazy(() => import('./components/admin/DistrictsManager').then(m => ({ default: m.DistrictsManager })));
const PublicSubmissionsReview = lazy(() => import('./components/admin/PublicSubmissionsReview').then(m => ({ default: m.PublicSubmissionsReview })));
const ReporterManager = lazy(() => import('./components/admin/ReporterManager').then(m => ({ default: m.ReporterManager })));
const AdManager = lazy(() => import('./components/admin/AdManager').then(m => ({ default: m.AdManager })));
const PromotionRequestsManager = lazy(() => import('./components/admin/PromotionRequestsManager').then(m => ({ default: m.PromotionRequestsManager })));
const MediaLibrary = lazy(() => import('./components/admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const VideoManager = lazy(() => import('./components/admin/VideoManager').then(m => ({ default: m.VideoManager })));
const GalleryManager = lazy(() => import('./components/admin/GalleryManager').then(m => ({ default: m.GalleryManager })));
const AIViralAssistant = lazy(() => import('./components/admin/AIViralAssistant').then(m => ({ default: m.AIViralAssistant })));
const SupabaseSetupGuide = lazy(() => import('./components/admin/SupabaseSetupGuide').then(m => ({ default: m.SupabaseSetupGuide })));
const WebsiteSettings = lazy(() => import('./components/admin/WebsiteSettings').then(m => ({ default: m.WebsiteSettings })));
const ActivityLogsView = lazy(() => import('./components/admin/ActivityLogsView').then(m => ({ default: m.ActivityLogsView })));
const AutoNewsControlCenter = lazy(() => import('./components/admin/AutoNewsControlCenter').then(m => ({ default: m.AutoNewsControlCenter })));
const AdminPortalLogin = lazy(() => import('./components/admin/AdminPortalLogin').then(m => ({ default: m.AdminPortalLogin })));

import { Article } from './types';
import { INITIAL_ARTICLES } from './data/mockData';
import { updateCategorySEO } from './utils/seoUtils';
import { ArrowLeft, RefreshCw, Layers } from 'lucide-react';

const CATEGORY_NAMES_HI: Record<string, string> = {
  all: 'सभी समाचार',
  latest: 'ताज़ा समाचार',
  saved: 'सहेजे गए समाचार (Bookmarks)',
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

  // Helper to extract clean slug from pathname (handles trailing slashes, encoding & query params)
  const getSlugFromPath = (path: string): string | null => {
    const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (clean.startsWith('/news/')) {
      const rawSlug = clean.substring('/news/'.length).trim();
      return decodeURIComponent(rawSlug);
    }
    return null;
  };

  // Resilient article finder across dynamic state and initial catalog
  const findArticleBySlug = (slug: string): Article | undefined => {
    const clean = slug.toLowerCase().trim();
    return (
      articles.find(a => a.slug.toLowerCase() === clean || a.id.toLowerCase() === clean) ||
      INITIAL_ARTICLES.find(a => a.slug.toLowerCase() === clean || a.id.toLowerCase() === clean) ||
      articles.find(a => clean.includes(a.slug.toLowerCase()) || a.slug.toLowerCase().includes(clean)) ||
      INITIAL_ARTICLES.find(a => clean.includes(a.slug.toLowerCase()) || a.slug.toLowerCase().includes(clean))
    );
  };

  // URL parsing & deep-linking synchronization
  useEffect(() => {
    if (checkIsAdminRequested()) {
      setIsAdminView(true);
      return;
    }

    const requestedSlug = getSlugFromPath(window.location.pathname);
    if (requestedSlug) {
      const matched = findArticleBySlug(requestedSlug);
      if (matched) {
        setActiveArticle(matched);
        return;
      }
    }

    const path = window.location.pathname;
    if (path.length > 1 && !path.startsWith('/news/')) {
      const clean = path.replace('/', '').toLowerCase();
      if (clean === 'home' || clean === 'all') {
        setSelectedCategory('all');
      } else if (CATEGORY_NAMES_HI[clean]) {
        setSelectedCategory(clean);
      }
    }
  }, [articles]);

  // Listen for browser navigation (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      if (checkIsAdminRequested()) {
        setIsAdminView(true);
        return;
      }
      setIsAdminView(false);

      const path = window.location.pathname;
      const requestedSlug = getSlugFromPath(path);
      if (requestedSlug) {
        const matched = findArticleBySlug(requestedSlug);
        if (matched) {
          setActiveArticle(matched);
          return;
        }
      }

      if (path === '/' || path === '' || path === '/home' || path === '/all') {
        setActiveArticle(null);
        setSelectedCategory('all');
      } else {
        setActiveArticle(null);
        const clean = path.replace('/', '').toLowerCase();
        if (clean === 'home' || clean === 'all') {
          setSelectedCategory('all');
        } else if (CATEGORY_NAMES_HI[clean]) {
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

  // Sync URL history state without wiping out valid deep-link news URLs
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
      // Never wipe out a /news/ URL if article is still resolving
      const currentPath = window.location.pathname;
      const isNewsPath = currentPath.startsWith('/news/');
      if (!isNewsPath && currentPath !== '/') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [isAdminView, activeArticle, selectedCategory]);

  // Dynamic Google SEO + Schema.org CollectionPage / BreadcrumbList for home & category views
  useEffect(() => {
    if (!isAdminView && !activeArticle) {
      const titleHi = CATEGORY_NAMES_HI[selectedCategory] || selectedCategory.toUpperCase();
      updateCategorySEO(selectedCategory, titleHi);
    }
  }, [isAdminView, activeArticle, selectedCategory]);

  // If Admin View is active, verify authentication
  if (isAdminView) {
    const adminFallback = (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 text-sm font-bold">
        प्रशासन पैनल लोड हो रहा है...
      </div>
    );

    if (!currentUser) {
      return (
        <Suspense fallback={adminFallback}>
          <AdminPortalLogin
            onLoginSuccess={() => {}}
            onExitToPublic={() => {
              setIsAdminView(false);
              window.history.pushState(null, '', '/');
            }}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={adminFallback}>
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
      </Suspense>
    );
  }

  const publishedArticles = articles.filter(a => a.status === 'published');

  // Filtered Articles for Category Feed
  const filteredCategoryArticles = publishedArticles.filter(a => {
    if (selectedCategory === 'all' || selectedCategory === 'home') return true;
    if (selectedCategory === 'saved') {
      try {
        const raw = localStorage.getItem('hunkar24_saved_articles');
        const ids: string[] = raw ? JSON.parse(raw) : [];
        return Array.isArray(ids) && ids.includes(a.id);
      } catch {
        return false;
      }
    }
    if (selectedCategory === 'latest') return true;
    const matchCategory = a.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchDistrict = a.district?.toLowerCase() === selectedCategory.toLowerCase();
    const matchTag = a.tags?.some(t => t.toLowerCase() === selectedCategory.toLowerCase());
    return matchCategory || matchDistrict || matchTag;
  });

  // Calculate strictly non-overlapping articles for homepage feed (Zero repetition guarantee)
  // 1. Hero Section Stories (1 Lead + 2 Secondary + 3 Fast Updates = 6 unique stories)
  const heroLead = publishedArticles[0];
  const heroSecondary = publishedArticles.slice(1, 3);
  const heroFast = publishedArticles.slice(3, 6);
  const usedInHero = new Set([heroLead?.id, ...heroSecondary.map(a => a.id), ...heroFast.map(a => a.id)].filter(Boolean) as string[]);

  // 2. District Feed Stories (excludes Hero)
  const districtFiltered = publishedArticles.filter(a => !usedInHero.has(a.id));
  const usedInDistrict = new Set([...usedInHero, ...districtFiltered.slice(0, 6).map(a => a.id)]);

  // 3. Agriculture & Mandi Stories (excludes Hero & District)
  const agriFiltered = publishedArticles.filter(a => !usedInDistrict.has(a.id) && (a.category === 'agriculture' || a.tags?.some(t => ['किसान', 'कृषि', 'मंडी भाव', 'ग्रामीण', 'कुसुम योजना'].includes(t))));
  const usedInAgri = new Set([...usedInDistrict, ...agriFiltered.slice(0, 6).map(a => a.id)]);

  // 4. Education & Jobs Stories (excludes above)
  const eduFiltered = publishedArticles.filter(a => !usedInAgri.has(a.id) && (a.category === 'education' || a.category === 'jobs' || a.category === 'schemes'));
  const usedInEdu = new Set([...usedInAgri, ...eduFiltered.slice(0, 4).map(a => a.id)]);

  // 5. Ground Reports (excludes above)
  const groundFiltered = publishedArticles.filter(a => !usedInEdu.has(a.id) && (a.category === 'ground-report' || a.isExclusive));
  const usedInGround = new Set([...usedInEdu, ...groundFiltered.slice(0, 3).map(a => a.id)]);

  // 6. Homepage Latest Feed (strictly remaining stories not displayed above)
  const remainingLatest = publishedArticles.filter(a => !usedInGround.has(a.id));
  const homepageLatestFeed = remainingLatest.length >= 4
    ? remainingLatest.slice(0, 10)
    : publishedArticles.filter(a => !usedInHero.has(a.id)).slice(0, 8);

  const categoryTitle = CATEGORY_NAMES_HI[selectedCategory] || selectedCategory.toUpperCase();

  // Public News Portal View — STRICTLY ZERO ADMIN BUTTONS OR LINKS
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors pb-16 sm:pb-0">
      {/* Main Desktop / Mobile Header — Clean public presentation */}
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
      {!activeArticle && (selectedCategory === 'all' || selectedCategory === 'home') && (
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
        ) : (selectedCategory !== 'all' && selectedCategory !== 'home') ? (
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
            <RajasthanDistrictFeed excludeIds={usedInHero} />

            {/* Mid-Feed Advertisement Banner */}
            <AdBanner placement="middle_feed" />

            {/* Section C: Agriculture, Farmers & Live Mandi Bhav Special */}
            <AgricultureFarmersSection excludeIds={usedInDistrict} />

            {/* Section D: Education, Govt Jobs & Schemes */}
            <EducationJobsSection excludeIds={usedInAgri} />

            {/* Section D: Ground Reports & Investigative Journalism */}
            <GroundReportSection excludeIds={usedInEdu} />

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
                  {homepageLatestFeed.map(art => (
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

      {/* 8. Mobile Bottom Sticky Navigation Strip */}
      <MobileBottomNav />

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
