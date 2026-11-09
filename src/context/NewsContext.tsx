import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Article,
  BreakingNewsItem,
  CategoryItem,
  PublicNewsSubmission,
  BusinessPromotionRequest,
  AdvertisementCampaign,
  ReporterProfile,
  VideoNewsItem,
  PhotoGalleryAlbum,
  BusinessListing,
  AuditLog,
  UserRole
} from '../types';
import {
  INITIAL_ARTICLES,
  INITIAL_BREAKING_NEWS,
  INITIAL_ADVERTISEMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_PROMOTION_REQUESTS,
  INITIAL_REPORTERS,
  INITIAL_VIDEOS,
  INITIAL_GALLERIES,
  INITIAL_BUSINESS_LISTINGS
} from '../data/mockData';
import { DEFAULT_CATEGORIES, RAJASTHAN_DISTRICTS } from '../config/siteConfig';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { safeFetchJson } from '../lib/apiClient';
import {
  fetchNewsClientSide,
  getClientPendingArticles,
  getClientApprovedArticles,
  approveClientArticle,
  rejectClientArticle
} from '../lib/clientNewsEngine';
import {
  saveArticleToFirebase,
  updateArticleInFirebase,
  deleteArticleFromFirebase,
  saveBreakingNewsToFirebase,
  deleteBreakingNewsFromFirebase,
  subscribeToFirebaseArticles,
  subscribeToFirebaseBreakingNews,
  seedFirebaseIfEmpty,
  isFirebaseConfigured
} from '../lib/firebaseClient';

export type LanguageCode = 'hi' | 'raj' | 'en';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string;
  avatarUrl: string;
}

interface NewsContextType {
  // Articles
  articles: Article[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  activeArticle: Article | null;
  setActiveArticle: (article: Article | null) => void;
  addArticle: (article: Omit<Article, 'id' | 'views' | 'publishedAt' | 'updatedAt'>) => Article;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  incrementArticleViews: (id: string) => void;
  toggleArticleLike: (id: string) => void;

  // Breaking News
  breakingNews: BreakingNewsItem[];
  addBreakingNews: (text: string, linkUrl?: string, linkArticleId?: string) => void;
  toggleBreakingNews: (id: string) => void;
  deleteBreakingNews: (id: string) => void;

  // Categories
  categories: CategoryItem[];
  addCategory: (category: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;

  // Public Citizen Submissions
  submissions: PublicNewsSubmission[];
  submitPublicNews: (submission: Omit<PublicNewsSubmission, 'id' | 'status' | 'createdAt'>) => string;
  approveSubmission: (id: string, notes?: string) => void;
  rejectSubmission: (id: string, reason: string) => void;

  // Advertisements
  advertisements: AdvertisementCampaign[];
  addAdvertisement: (ad: Omit<AdvertisementCampaign, 'id' | 'impressions' | 'clicks'>) => void;
  toggleAdStatus: (id: string) => void;
  deleteAdvertisement: (id: string) => void;
  recordAdClick: (id: string) => void;

  // Business Promotion Requests
  promotionRequests: BusinessPromotionRequest[];
  submitPromotionRequest: (req: Omit<BusinessPromotionRequest, 'id' | 'status' | 'paymentStatus' | 'createdAt'>) => string;
  updatePromotionStatus: (id: string, status: 'approved' | 'rejected', paymentStatus?: 'completed' | 'failed') => void;

  // Business Directory Listings
  businessListings: BusinessListing[];
  addBusinessListing: (biz: Omit<BusinessListing, 'id'>) => void;

  // Multimedia
  videos: VideoNewsItem[];
  addVideo: (vid: Omit<VideoNewsItem, 'id' | 'views' | 'publishedAt'>) => void;
  deleteVideo: (id: string) => void;
  clearAllVideos: () => void;
  galleries: PhotoGalleryAlbum[];
  addGallery: (gal: Omit<PhotoGalleryAlbum, 'id' | 'publishedAt'>) => void;

  // Reporters
  reporters: ReporterProfile[];
  addReporter: (rep: Omit<ReporterProfile, 'id' | 'publishedArticleCount' | 'joinedDate'>) => void;
  updateReporter: (id: string, updates: Partial<ReporterProfile>) => void;

  // Auth & Roles
  currentUser: CurrentUser | null;
  loginAs: (role: UserRole, email?: string) => void;
  setAdminUser: (user: CurrentUser) => void;
  logout: () => void;
  isAdmin: boolean;

  // Preferences & Accessibility
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSize: 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Modals
  isSubmitNewsOpen: boolean;
  setIsSubmitNewsOpen: (open: boolean) => void;
  isPromotionModalOpen: boolean;
  setIsPromotionModalOpen: (open: boolean) => void;
  isReportIssueOpen: boolean;
  setIsReportIssueOpen: (open: boolean) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAction: (action: string, module: string, details: string) => void;

  // Auto News Network
  autoNewsPendingCount: number;
  syncAutoNewsApproved: () => Promise<void>;
  fetchAutoNewsNow: () => Promise<{ success: boolean; stats?: any; error?: string }>;
  approveAutoArticle: (id: string, customData?: Partial<Article>) => Promise<boolean>;
  rejectAutoArticle: (id: string, reason: string) => Promise<boolean>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial seed data
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('hunkar24_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>(() => {
    const saved = localStorage.getItem('hunkar24_breaking');
    return saved ? JSON.parse(saved) : INITIAL_BREAKING_NEWS;
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('hunkar24_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [submissions, setSubmissions] = useState<PublicNewsSubmission[]>(() => {
    const saved = localStorage.getItem('hunkar24_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [advertisements, setAdvertisements] = useState<AdvertisementCampaign[]>(() => {
    const saved = localStorage.getItem('hunkar24_ads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly purge all demo, sample, placeholder, default or unapproved ads (Requirement 5)
          return parsed.filter(
            (a: any) => a && !a.isDemo && a.id !== 'ad-01' && a.id !== 'ad-02' && a.id !== 'ad-03' && a.createdByAdmin && a.approved
          );
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [promotionRequests, setPromotionRequests] = useState<BusinessPromotionRequest[]>(() => {
    const saved = localStorage.getItem('hunkar24_promotions');
    return saved ? JSON.parse(saved) : INITIAL_PROMOTION_REQUESTS;
  });

  const [reporters, setReporters] = useState<ReporterProfile[]>(() => {
    const saved = localStorage.getItem('hunkar24_reporters');
    return saved ? JSON.parse(saved) : INITIAL_REPORTERS;
  });

  const [videos, setVideos] = useState<VideoNewsItem[]>(() => {
    // Purge any stored non-news or legacy videos from localStorage
    try {
      localStorage.removeItem('hunkar24_videos');
    } catch {
      // ignore
    }
    return [];
  });

  const [galleries, setGalleries] = useState<PhotoGalleryAlbum[]>(() => {
    const saved = localStorage.getItem('hunkar24_galleries');
    return saved ? JSON.parse(saved) : INITIAL_GALLERIES;
  });

  const [businessListings, setBusinessListings] = useState<BusinessListing[]>(() => {
    const saved = localStorage.getItem('hunkar24_biz_listings');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_LISTINGS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hunkar24_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-1',
        userName: 'सिस्टम प्रशासक',
        userRole: 'super_admin',
        action: 'सिस्टम इनिशियलाइज़ेशन',
        module: 'Website Settings',
        details: 'हुंकार 24 मास्टर न्यूज़ प्लेटफॉर्म लोड किया गया',
        timestamp: new Date().toISOString()
      }
    ];
  });

  // Active filters and views
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // User auth state: Starts null (unauthenticated). Zero personal identity stored or displayed (Requirement 2)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = sessionStorage.getItem('hunkar24_admin_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && user.role) {
          return {
            id: user.id || 'usr-admin-01',
            name: 'प्रशासक',
            email: 'admin@hunkar24.in',
            role: user.role || 'super_admin',
            avatarUrl: ''
          };
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  // UI & Accessibility
  const [language, setLanguage] = useState<LanguageCode>('hi');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hunkar24_theme') as 'light' | 'dark') || 'light';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSubmitNewsOpen, setIsSubmitNewsOpen] = useState<boolean>(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState<boolean>(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hunkar24_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('hunkar24_breaking', JSON.stringify(breakingNews));
  }, [breakingNews]);

  useEffect(() => {
    localStorage.setItem('hunkar24_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('hunkar24_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('hunkar24_ads', JSON.stringify(advertisements));
  }, [advertisements]);

  useEffect(() => {
    localStorage.setItem('hunkar24_promotions', JSON.stringify(promotionRequests));
  }, [promotionRequests]);

  useEffect(() => {
    localStorage.setItem('hunkar24_reporters', JSON.stringify(reporters));
  }, [reporters]);

  useEffect(() => {
    localStorage.setItem('hunkar24_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('hunkar24_galleries', JSON.stringify(galleries));
  }, [galleries]);

  useEffect(() => {
    localStorage.setItem('hunkar24_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('hunkar24_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auto News Network State & Synchronization
  const [autoNewsPendingCount, setAutoNewsPendingCount] = useState<number>(0);

  const syncAutoNewsApproved = async () => {
    try {
      // 1. Sync client-side approved articles from local storage (Netlify mode)
      const clientApproved = getClientApprovedArticles();
      if (clientApproved.length > 0) {
        setArticles(prevArticles => {
          const existingIds = new Set(prevArticles.map(a => a.id));
          const existingSlugs = new Set(prevArticles.map(a => a.slug));
          const newlyApproved = clientApproved.filter(a => !existingIds.has(a.id) && !existingSlugs.has(a.slug));
          return newlyApproved.length > 0 ? [...newlyApproved, ...prevArticles] : prevArticles;
        });
      }

      // Update client pending count
      const clientPending = getClientPendingArticles();
      setAutoNewsPendingCount(clientPending.length);

      // 2. If full-stack backend is present, safely fetch approved server articles
      const res = await safeFetchJson('/api/news-engine/approved');
      if (res.success && res.data && Array.isArray(res.data.articles) && res.data.articles.length > 0) {
        setArticles(prevArticles => {
          const existingIds = new Set(prevArticles.map(a => a.id));
          const existingSlugs = new Set(prevArticles.map(a => a.slug));
          const newlyApproved: Article[] = [];

          for (const item of res.data.articles) {
            const artId = `auto-${item.id}`;
            const slug = (item.hindiHeadline || item.originalHeadline || 'news')
              .toLowerCase()
              .replace(/[^\w\u0900-\u097F]+/g, '-')
              .slice(0, 70);

            if (!existingIds.has(artId) && !existingSlugs.has(slug)) {
              newlyApproved.push({
                id: artId,
                headline: item.hindiHeadline || item.originalHeadline,
                slug: `${slug}-${item.id.slice(-4)}`,
                summary: item.hindiSummary || '',
                content: item.hindiContent || item.hindiSummary || '',
                category: item.category || 'rajasthan',
                district: item.district,
                mainImage: item.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
                imageCaption: `${item.sourceProvider} स्रोत रिपोर्ट`,
                imageSource: item.sourceProvider,
                reporterName: `हुंकार AI न्यूज़ डेस्क (${item.sourceProvider})`,
                reporterRole: 'स्वचालित न्यूज़ नेटवर्क',
                status: 'published',
                publishedAt: item.publishedAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
                views: Math.floor(Math.random() * 80) + 20,
                readingTimeMinutes: 2,
                tags: ['हुंकार-AI', item.category, item.district || 'राजस्थान'].filter(Boolean) as string[],
                isAutoImported: true,
                sourceName: item.sourceProvider,
                sourceUrl: item.originalUrl,
                originalHeadline: item.originalHeadline,
                originalSources: item.sources || [{ name: item.sourceProvider, url: item.originalUrl }],
                verificationStatus: item.verificationStatus || 'single_source',
                riskFlags: item.riskFlags || [],
                entities: item.entities || { names: [], locations: [], dates: [] }
              });
            }
          }

          return newlyApproved.length > 0 ? [...newlyApproved, ...prevArticles] : prevArticles;
        });
      }

      // Check server pending count if available
      const statusRes = await safeFetchJson('/api/news-engine/status');
      if (statusRes.success && statusRes.data?.stats?.pendingCount !== undefined) {
        setAutoNewsPendingCount(statusRes.data.stats.pendingCount + clientPending.length);
      }
    } catch {
      // Safe no-op on network issues
    }
  };

  useEffect(() => {
    syncAutoNewsApproved();
    const interval = setInterval(syncAutoNewsApproved, 30000); // Check auto news every 30s
    return () => clearInterval(interval);
  }, []);

  // Autonomous 15-30 minute news fetcher (runs seamlessly in background)
  useEffect(() => {
    const triggerAutonomousFetch = async () => {
      const lastFetchKey = 'hunkar24_last_autonomous_fetch';
      const lastFetch = localStorage.getItem(lastFetchKey);
      const now = Date.now();
      const fifteenMinutesMs = 15 * 60 * 1000;

      // If 15 minutes elapsed or never fetched before
      if (!lastFetch || now - Number(lastFetch) > fifteenMinutesMs) {
        localStorage.setItem(lastFetchKey, String(now));
        try {
          await fetchAutoNewsNow();
        } catch (err) {
          console.warn('[AutonomousNewsEngine] Auto-fetch notice:', err);
        }
      }
    };

    // Trigger on app start
    triggerAutonomousFetch();

    // Check every 3 minutes if 15m window has elapsed
    const autoCron = setInterval(triggerAutonomousFetch, 3 * 60 * 1000);
    return () => clearInterval(autoCron);
  }, []);

  // Supabase Real-Time Database Connection & Sync
  useEffect(() => {
    if (!supabase) return;

    // 1. Fetch initial live articles from Supabase
    supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          const mappedArticles: Article[] = data.map((d: any) => ({
            id: d.id,
            headline: d.headline,
            slug: d.slug,
            summary: d.summary || '',
            content: d.content || d.summary || '',
            category: d.category_slug || d.category || 'rajasthan',
            district: d.district,
            tehsil: d.tehsil,
            village: d.village,
            mainImage: d.main_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
            imageCaption: d.image_caption,
            imageSource: d.image_source || 'हुंकार 24 डेस्क',
            reporterName: d.reporter_name || 'हुंकार ब्यूरो',
            reporterRole: d.reporter_role || 'संवाददाता',
            reporterPhoto: d.reporter_photo,
            status: d.status || 'published',
            publishedAt: d.published_at || d.created_at || new Date().toISOString(),
            updatedAt: d.updated_at || new Date().toISOString(),
            views: Number(d.views_count || 1),
            isBreaking: Boolean(d.is_breaking),
            isHero: Boolean(d.is_hero),
            isExclusive: Boolean(d.is_exclusive),
            tags: Array.isArray(d.tags) ? d.tags : ['राजस्थान', 'हुंकार24'],
            readingTimeMinutes: d.reading_time_minutes || 2,
            likesCount: d.likes_count || 0,
            videoUrl: d.video_url
          }));

          setArticles(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mappedArticles.filter(m => !existingIds.has(m.id));
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
          });
        }
      });

    // 2. Fetch initial breaking news from Supabase
    supabase
      .from('breaking_news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          const mappedBreaking: BreakingNewsItem[] = data.map((b: any) => ({
            id: b.id,
            text: b.text,
            linkUrl: b.link_url,
            linkArticleId: b.link_article_id,
            isActive: b.is_active ?? true,
            priority: b.priority || 1,
            createdAt: b.created_at || new Date().toISOString()
          }));
          setBreakingNews(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mappedBreaking.filter(m => !existingIds.has(m.id));
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
          });
        }
      });

    // 3. Real-Time channel subscriptions for Articles
    const articlesChannel = supabase
      .channel('public:articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const d = payload.new;
            const newArt: Article = {
              id: d.id,
              headline: d.headline,
              slug: d.slug,
              summary: d.summary || '',
              content: d.content || d.summary || '',
              category: d.category_slug || 'rajasthan',
              district: d.district,
              tehsil: d.tehsil,
              village: d.village,
              mainImage: d.main_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
              imageCaption: d.image_caption,
              imageSource: d.image_source || 'हुंकार 24 डेस्क',
              reporterName: d.reporter_name || 'हुंकार ब्यूरो',
              reporterRole: d.reporter_role || 'संवाददाता',
              status: d.status || 'published',
              publishedAt: d.published_at || new Date().toISOString(),
              updatedAt: d.updated_at || new Date().toISOString(),
              views: Number(d.views_count || 1),
              readingTimeMinutes: d.reading_time_minutes || 2,
              isBreaking: Boolean(d.is_breaking),
              isHero: Boolean(d.is_hero),
              isExclusive: Boolean(d.is_exclusive),
              tags: d.tags || []
            };
            setArticles(prev => [newArt, ...prev.filter(a => a.id !== newArt.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const d = payload.new;
            setArticles(prev =>
              prev.map(a =>
                a.id === d.id
                  ? {
                      ...a,
                      headline: d.headline || a.headline,
                      summary: d.summary || a.summary,
                      content: d.content || a.content,
                      category: d.category_slug || a.category,
                      district: d.district || a.district,
                      mainImage: d.main_image || a.mainImage,
                      status: d.status || a.status,
                      isBreaking: d.is_breaking !== undefined ? Boolean(d.is_breaking) : a.isBreaking,
                      isHero: d.is_hero !== undefined ? Boolean(d.is_hero) : a.isHero,
                      views: Number(d.views_count || a.views)
                    }
                  : a
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const d = payload.old;
            if (d?.id) {
              setArticles(prev => prev.filter(a => a.id !== d.id));
            }
          }
        }
      )
      .subscribe();

    // 4. Real-Time channel subscriptions for Breaking News
    const breakingChannel = supabase
      .channel('public:breaking_news')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'breaking_news' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const b = payload.new;
            const newItem: BreakingNewsItem = {
              id: b.id,
              text: b.text,
              linkUrl: b.link_url,
              linkArticleId: b.link_article_id,
              isActive: b.is_active ?? true,
              priority: b.priority || 1,
              createdAt: b.created_at || new Date().toISOString()
            };
            setBreakingNews(prev => [newItem, ...prev.filter(x => x.id !== newItem.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const b = payload.new;
            setBreakingNews(prev =>
              prev.map(item =>
                item.id === b.id
                  ? {
                      ...item,
                      text: b.text || item.text,
                      isActive: b.is_active ?? item.isActive,
                      linkUrl: b.link_url !== undefined ? b.link_url : item.linkUrl
                    }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const b = payload.old;
            if (b?.id) {
              setBreakingNews(prev => prev.filter(item => item.id !== b.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(articlesChannel);
      supabase?.removeChannel(breakingChannel);
    };
  }, []);

  // Firebase Realtime Database Connection & Live Sync
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // 1. Seed initial data to Firebase Realtime Database if empty
    seedFirebaseIfEmpty(INITIAL_ARTICLES, INITIAL_BREAKING_NEWS);

    // 2. Real-time live listener for articles
    const unsubArticles = subscribeToFirebaseArticles((firebaseArticles) => {
      if (Array.isArray(firebaseArticles) && firebaseArticles.length > 0) {
        setArticles(prev => {
          const map = new Map<string, Article>();
          // Existing items
          for (const a of prev) {
            map.set(a.id, a);
          }
          // Merge Firebase items (Firebase is authoritative)
          for (const fa of firebaseArticles) {
            map.set(fa.id, fa);
          }
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          return merged;
        });
      }
    });

    // 3. Real-time live listener for breaking news
    const unsubBreaking = subscribeToFirebaseBreakingNews((firebaseBreaking) => {
      if (Array.isArray(firebaseBreaking) && firebaseBreaking.length > 0) {
        setBreakingNews(firebaseBreaking);
      }
    });

    return () => {
      unsubArticles();
      unsubBreaking();
    };
  }, []);

  const fetchAutoNewsNow = async (): Promise<{ success: boolean; stats?: any; error?: string }> => {
    try {
      // 1. First, attempt backend fetch if fullstack server is running
      const res = await safeFetchJson('/api/news-engine/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('hunkar24_admin_token') || ''}`
        }
      });

      if (res.success && res.data) {
        await syncAutoNewsApproved();
        logAction('स्वचालित न्यूज़ फेच संपन्न (सर्वर)', 'Auto News Network', `कुल नए आयात: ${res.data?.stats?.newImported || 0}`);
        return res.data;
      }

      // 2. If running on Netlify (static hosting) or server returned HTML:
      // Run robust client-side news fetcher with zero JSON errors!
      const clientResult = await fetchNewsClientSide(articles);
      if (clientResult.success && clientResult.articles.length > 0) {
        setArticles(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnes = clientResult.articles.filter(a => !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
      }
      await syncAutoNewsApproved();
      logAction('लाइव न्यूज़ फेच संपन्न (क्लाइंट/नेटलिफ़ाई)', 'Auto News Network', `कुल नए लेख: ${clientResult.stats.newImported}`);
      return clientResult;
    } catch {
      // Direct client fallback
      const clientResult = await fetchNewsClientSide(articles);
      if (clientResult.success && clientResult.articles.length > 0) {
        setArticles(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnes = clientResult.articles.filter(a => !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
      }
      return clientResult;
    }
  };

  const approveAutoArticle = async (id: string, customData?: Partial<Article>): Promise<boolean> => {
    try {
      const res = await safeFetchJson('/api/news-engine/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('hunkar24_admin_token') || ''}`
        },
        body: JSON.stringify({
          articleId: id,
          action: 'approve',
          editedData: customData ? {
            hindiHeadline: customData.headline,
            hindiSummary: customData.summary,
            hindiContent: customData.content,
            category: customData.category,
            district: customData.district
          } : undefined
        })
      });

      if (res.success) {
        await syncAutoNewsApproved();
        logAction('स्वचालित समाचार स्वीकृत', 'Auto News Network', `आईडी ${id} मुख्य वेबसाइट पर लाइव किया गया`);
        return true;
      }

      // Netlify / Client-side approval fallback
      const approvedArt = await approveClientArticle(id, customData);
      if (approvedArt) {
        setArticles(prev => [approvedArt, ...prev.filter(a => a.id !== approvedArt.id)]);
        await syncAutoNewsApproved();
        logAction('समाचार स्वीकृत (क्लाइंट मोड)', 'Auto News Network', `आईडी ${id} मुख्य वेबसाइट पर लाइव किया गया`);
        return true;
      }
      return false;
    } catch {
      const approvedArt = await approveClientArticle(id, customData);
      if (approvedArt) {
        setArticles(prev => [approvedArt, ...prev.filter(a => a.id !== approvedArt.id)]);
        await syncAutoNewsApproved();
        return true;
      }
      return false;
    }
  };

  const rejectAutoArticle = async (id: string, reason: string): Promise<boolean> => {
    try {
      const res = await safeFetchJson('/api/news-engine/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('hunkar24_admin_token') || ''}`
        },
        body: JSON.stringify({
          articleId: id,
          action: 'reject',
          rejectionReason: reason
        })
      });

      if (res.success) {
        await syncAutoNewsApproved();
        logAction('स्वचालित समाचार अस्वीकृत', 'Auto News Network', `आईडी ${id} अस्वीकृत। कारण: ${reason}`);
        return true;
      }

      // Client-side reject
      rejectClientArticle(id, reason);
      await syncAutoNewsApproved();
      logAction('समाचार अस्वीकृत (क्लाइंट मोड)', 'Auto News Network', `आईडी ${id} अस्वीकृत।`);
      return true;
    } catch {
      rejectClientArticle(id, reason);
      await syncAutoNewsApproved();
      return true;
    }
  };

  // Log action helper
  const logAction = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userName: currentUser ? currentUser.name : 'अतिथि पाठक',
      userRole: currentUser ? currentUser.role : 'guest',
      action,
      module,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Article Actions with Instant Two-Way Supabase Real-Time Broadcast
  const addArticle = (data: Omit<Article, 'id' | 'views' | 'publishedAt' | 'updatedAt'>): Article => {
    const now = new Date().toISOString();
    const newArticle: Article = {
      ...data,
      id: `art-${Date.now()}`,
      views: 1,
      likesCount: 0,
      publishedAt: now,
      updatedAt: now
    };
    setArticles(prev => [newArticle, ...prev]);

    // Push to Supabase Real-Time so ALL devices update instantly without page reload
    if (supabase) {
      try {
        supabase
          .from('articles')
          .insert([{
            id: newArticle.id,
            headline: newArticle.headline,
            slug: newArticle.slug,
            summary: newArticle.summary,
            content: newArticle.content,
            category_slug: newArticle.category,
            district: newArticle.district,
            tehsil: newArticle.tehsil,
            village: newArticle.village,
            main_image: newArticle.mainImage,
            image_caption: newArticle.imageCaption,
            image_source: newArticle.imageSource,
            reporter_name: newArticle.reporterName,
            reporter_role: newArticle.reporterRole,
            reporter_photo: newArticle.reporterPhoto,
            status: newArticle.status || 'published',
            is_breaking: Boolean(newArticle.isBreaking),
            is_hero: Boolean(newArticle.isHero),
            is_exclusive: Boolean(newArticle.isExclusive),
            views_count: 1,
            likes_count: 0,
            reading_time_minutes: newArticle.readingTimeMinutes || 3,
            tags: newArticle.tags || [],
            video_url: newArticle.videoUrl,
            published_at: newArticle.publishedAt
          }])
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Article insert notice:', error);
          });
      } catch (err) {
        console.warn('[Supabase] Insert error:', err);
      }
    }

    // Push to Firebase Realtime Database (Instant multi-device sync)
    saveArticleToFirebase(newArticle);

    logAction('लेख प्रकाशित', 'News Management', `नया समाचार प्रकाशित: ${data.headline}`);
    return newArticle;
  };

  const updateArticle = (id: string, updates: Partial<Article>) => {
    setArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, ...updates, updatedAt: new Date().toISOString() } : art))
    );
    if (activeArticle && activeArticle.id === id) {
      setActiveArticle(prev => (prev ? { ...prev, ...updates } : null));
    }

    // Push to Supabase Real-Time
    if (supabase) {
      try {
        supabase
          .from('articles')
          .update({
            headline: updates.headline,
            summary: updates.summary,
            content: updates.content,
            category_slug: updates.category,
            district: updates.district,
            tehsil: updates.tehsil,
            village: updates.village,
            main_image: updates.mainImage,
            image_caption: updates.imageCaption,
            image_source: updates.imageSource,
            status: updates.status,
            is_breaking: updates.isBreaking,
            is_hero: updates.isHero,
            is_exclusive: updates.isExclusive,
            tags: updates.tags,
            video_url: updates.videoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Article update notice:', error);
          });
      } catch (err) {
        console.warn('[Supabase] Update error:', err);
      }
    }

    // Push to Firebase Realtime Database
    updateArticleInFirebase(id, updates);

    logAction('लेख संशोधित', 'News Management', `समाचार आईडी ${id} अद्यतित किया गया`);
  };

  const deleteArticle = (id: string) => {
    const target = articles.find(a => a.id === id);
    setArticles(prev => prev.filter(art => art.id !== id));
    if (activeArticle?.id === id) {
      setActiveArticle(null);
    }

    // Delete in Supabase Real-Time
    if (supabase) {
      try {
        supabase
          .from('articles')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Article delete notice:', error);
          });
      } catch (err) {
        console.warn('[Supabase] Delete error:', err);
      }
    }

    // Delete in Firebase Realtime Database
    deleteArticleFromFirebase(id);

    logAction('लेख विलोपित', 'News Management', `समाचार हटाया गया: ${target?.headline || id}`);
  };

  const incrementArticleViews = (id: string) => {
    setArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, views: art.views + 1 } : art))
    );
  };

  const toggleArticleLike = (id: string) => {
    setArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, likesCount: (art.likesCount || 0) + 1 } : art))
    );
  };

  // Breaking News with Instant Supabase Broadcast
  const addBreakingNews = (text: string, linkUrl?: string, linkArticleId?: string) => {
    const item: BreakingNewsItem = {
      id: `brk-${Date.now()}`,
      text,
      linkUrl,
      linkArticleId,
      isActive: true,
      priority: 1,
      createdAt: new Date().toISOString()
    };
    setBreakingNews(prev => [item, ...prev]);

    // Push to Supabase Real-Time
    if (supabase) {
      try {
        supabase
          .from('breaking_news')
          .insert([{
            id: item.id,
            text: item.text,
            link_url: item.linkUrl,
            link_article_id: item.linkArticleId,
            priority: item.priority,
            is_active: item.isActive
          }])
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Breaking news insert notice:', error);
          });
      } catch (err) {
        console.warn('[Supabase] Insert breaking error:', err);
      }
    }

    // Push to Firebase Realtime Database
    saveBreakingNewsToFirebase(item);

    logAction('ब्रेकिंग न्यूज़ जोड़ी गई', 'Breaking News', text);
  };

  const toggleBreakingNews = (id: string) => {
    let nextActiveState = true;
    let updatedItem: BreakingNewsItem | undefined;
    setBreakingNews(prev =>
      prev.map(item => {
        if (item.id === id) {
          nextActiveState = !item.isActive;
          updatedItem = { ...item, isActive: nextActiveState };
          return updatedItem;
        }
        return item;
      })
    );

    if (supabase) {
      try {
        supabase
          .from('breaking_news')
          .update({ is_active: nextActiveState })
          .eq('id', id)
          .then(() => {});
      } catch {
        // ignore
      }
    }

    if (updatedItem) {
      saveBreakingNewsToFirebase(updatedItem);
    }
  };

  const deleteBreakingNews = (id: string) => {
    setBreakingNews(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      try {
        supabase
          .from('breaking_news')
          .delete()
          .eq('id', id)
          .then(() => {});
      } catch {
        // ignore
      }
    }

    // Delete in Firebase Realtime Database
    deleteBreakingNewsFromFirebase(id);
  };

  // Categories
  const addCategory = (cat: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...cat,
      id: `cat-${Date.now()}`
    };
    setCategories(prev => [...prev, newCat]);
    logAction('श्रेणी जोड़ी गई', 'Categories', cat.nameHi);
  };

  const updateCategory = (id: string, updates: Partial<CategoryItem>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  // Citizen Submissions
  const submitPublicNews = (sub: Omit<PublicNewsSubmission, 'id' | 'status' | 'createdAt'>): string => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `HNK-2026-${randomNum}`;
    const newSubmission: PublicNewsSubmission = {
      ...sub,
      id: trackingId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setSubmissions(prev => [newSubmission, ...prev]);
    logAction('नागरिक समाचार प्रस्तुत', 'Public Submissions', `${sub.submitterName} द्वारा: ${sub.headline}`);
    return trackingId;
  };

  const approveSubmission = (id: string, notes?: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    // Convert approved submission into a published news article
    const generatedArticle: Article = {
      id: `art-sub-${Date.now()}`,
      headline: sub.headline,
      slug: sub.headline
        .toLowerCase()
        .replace(/[^\w\u0900-\u097F]+/g, '-')
        .slice(0, 60),
      summary: sub.description.slice(0, 180) + '...',
      content: sub.description,
      category: 'rajasthan',
      district: sub.district,
      tehsil: sub.tehsil,
      village: sub.village,
      mainImage: sub.imageUrls[0] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `${sub.village ? sub.village + ', ' : ''}${sub.district} से जन-रिपोर्टर द्वारा भेजी गई तस्वीर`,
      imageSource: `हुंकार जन-रिपोर्टर (${sub.submitterName})`,
      reporterName: `जन-रिपोर्टर: ${sub.submitterName}`,
      reporterRole: 'नागरिक पत्रकार',
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 120,
      readingTimeMinutes: 2,
      tags: ['जन-रिपोर्टर', sub.district, 'ग्राउंड रिपोर्ट']
    };

    setArticles(prev => [generatedArticle, ...prev]);

    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'approved', adminNotes: notes, approvedArticleId: generatedArticle.id } : s))
    );

    logAction('समाचार स्वीकृत व प्रकाशित', 'Public Submissions', `आईडी ${id} को लेख ${generatedArticle.id} में बदला गया`);
  };

  const rejectSubmission = (id: string, reason: string) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'rejected', adminNotes: reason } : s))
    );
    logAction('समाचार अस्वीकृत', 'Public Submissions', `आईडी ${id} अस्वीकृत। कारण: ${reason}`);
  };

  // Advertisements
  const addAdvertisement = (ad: Omit<AdvertisementCampaign, 'id' | 'impressions' | 'clicks'>) => {
    const newAd: AdvertisementCampaign = {
      ...ad,
      id: `ad-${Date.now()}`,
      impressions: 1,
      clicks: 0
    };
    setAdvertisements(prev => [newAd, ...prev]);
    logAction('विज्ञापन अभियान सृजित', 'Ad Management', ad.campaignTitle);
  };

  const toggleAdStatus = (id: string) => {
    setAdvertisements(prev =>
      prev.map(ad => (ad.id === id ? { ...ad, status: ad.status === 'active' ? 'paused' : 'active' } : ad))
    );
  };

  const deleteAdvertisement = (id: string) => {
    setAdvertisements(prev => prev.filter(ad => ad.id !== id));
  };

  const recordAdClick = (id: string) => {
    setAdvertisements(prev =>
      prev.map(ad => (ad.id === id ? { ...ad, clicks: ad.clicks + 1 } : ad))
    );
  };

  // Promotion Requests
  const submitPromotionRequest = (req: Omit<BusinessPromotionRequest, 'id' | 'status' | 'paymentStatus' | 'createdAt'>): string => {
    const id = `PR-${Date.now().toString().slice(-6)}`;
    const newReq: BusinessPromotionRequest = {
      ...req,
      id,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    setPromotionRequests(prev => [newReq, ...prev]);
    logAction('व्यापार प्रचार आवेदन', 'Promotion Requests', `${req.businessName} द्वारा`);
    return id;
  };

  const updatePromotionStatus = (id: string, status: 'approved' | 'rejected', paymentStatus: 'completed' | 'failed' = 'completed') => {
    setPromotionRequests(prev =>
      prev.map(p => (p.id === id ? { ...p, status, paymentStatus } : p))
    );
    logAction('प्रचार आवेदन समीक्षा', 'Promotion Requests', `आईडी ${id} स्थिति: ${status}`);
  };

  // Business Directory
  const addBusinessListing = (biz: Omit<BusinessListing, 'id'>) => {
    const newBiz: BusinessListing = {
      ...biz,
      id: `biz-${Date.now()}`
    };
    setBusinessListings(prev => [newBiz, ...prev]);
  };

  // Multimedia
  const addVideo = (vid: Omit<VideoNewsItem, 'id' | 'views' | 'publishedAt'>) => {
    const newVid: VideoNewsItem = {
      ...vid,
      id: `vid-${Date.now()}`,
      views: 1,
      publishedAt: new Date().toISOString()
    };
    setVideos(prev => [newVid, ...prev]);
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    logAction('वीडियो विलोपित', 'Video News', `वीडियो आईडी ${id} हटाया गया`);
  };

  const clearAllVideos = () => {
    setVideos([]);
    try {
      localStorage.removeItem('hunkar24_videos');
    } catch {
      // ignore
    }
    logAction('सभी वीडियो विलोपित', 'Video News', 'सभी असंबद्ध वीडियो हटा दिए गए');
  };

  const addGallery = (gal: Omit<PhotoGalleryAlbum, 'id' | 'publishedAt'>) => {
    const newGal: PhotoGalleryAlbum = {
      ...gal,
      id: `gal-${Date.now()}`,
      publishedAt: new Date().toISOString()
    };
    setGalleries(prev => [newGal, ...prev]);
  };

  // Reporters
  const addReporter = (rep: Omit<ReporterProfile, 'id' | 'publishedArticleCount' | 'joinedDate'>) => {
    const newRep: ReporterProfile = {
      ...rep,
      id: `rep-${Date.now()}`,
      publishedArticleCount: 0,
      joinedDate: new Date().toISOString().slice(0, 10)
    };
    setReporters(prev => [...prev, newRep]);
  };

  const updateReporter = (id: string, updates: Partial<ReporterProfile>) => {
    setReporters(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // User Auth & Session Management (Neutral Labels, Zero Personal Identity)
  const setAdminUser = (user: CurrentUser) => {
    const sanitizedUser: CurrentUser = {
      id: user.id || 'usr-admin-01',
      name: 'प्रशासक',
      email: 'admin@hunkar24.in',
      role: user.role || 'super_admin',
      avatarUrl: ''
    };
    setCurrentUser(sanitizedUser);
    sessionStorage.setItem('hunkar24_admin_user', JSON.stringify(sanitizedUser));
    logAction('प्रशासक प्रमाणीकरण', 'Authentication', 'सिस्टम प्रशासक सत्र सक्रिय');
  };

  const loginAs = (role: UserRole, email: string = 'admin@hunkar24.in') => {
    const user: CurrentUser = {
      id: `usr-${role}-${Date.now()}`,
      name: role === 'super_admin' ? 'प्रशासक (Super Admin)' : role === 'editor' ? 'संपादक (Editor)' : 'संवाददाता (Reporter)',
      email,
      role,
      avatarUrl: ''
    };
    setCurrentUser(user);
    sessionStorage.setItem('hunkar24_admin_user', JSON.stringify(user));
    logAction('प्रशासक लॉगिन', 'Authentication', `प्रशासनिक खाता (${role}) लॉगिन हुआ`);
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('hunkar24_admin_token');
    sessionStorage.removeItem('hunkar24_admin_user');
    localStorage.removeItem('hunkar24_user');
    fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    logAction('लॉगआउट', 'Authentication', 'प्रशासक सत्र समाप्त किया गया');
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <NewsContext.Provider
      value={{
        articles,
        selectedCategory,
        setSelectedCategory,
        selectedDistrict,
        setSelectedDistrict,
        activeArticle,
        setActiveArticle,
        addArticle,
        updateArticle,
        deleteArticle,
        incrementArticleViews,
        toggleArticleLike,
        breakingNews,
        addBreakingNews,
        toggleBreakingNews,
        deleteBreakingNews,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        submissions,
        submitPublicNews,
        approveSubmission,
        rejectSubmission,
        advertisements,
        addAdvertisement,
        toggleAdStatus,
        deleteAdvertisement,
        recordAdClick,
        promotionRequests,
        submitPromotionRequest,
        updatePromotionStatus,
        businessListings,
        addBusinessListing,
        videos,
        addVideo,
        deleteVideo,
        clearAllVideos,
        galleries,
        addGallery,
        reporters,
        addReporter,
        updateReporter,
        currentUser,
        loginAs,
        setAdminUser,
        logout,
        isAdmin: Boolean(currentUser && ['super_admin', 'admin', 'editor'].includes(currentUser.role)),
        language,
        setLanguage,
        theme,
        toggleTheme,
        fontSize,
        setFontSize,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        isSubmitNewsOpen,
        setIsSubmitNewsOpen,
        isPromotionModalOpen,
        setIsPromotionModalOpen,
        isReportIssueOpen,
        setIsReportIssueOpen,
        auditLogs,
        logAction,
        autoNewsPendingCount,
        syncAutoNewsApproved,
        fetchAutoNewsNow,
        approveAutoArticle,
        rejectAutoArticle
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = (): NewsContextType => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};
