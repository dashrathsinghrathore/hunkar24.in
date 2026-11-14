import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
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
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils';
import {
  deduplicateArticlesList,
  deduplicateBreakingNews,
  normalizeHeadline,
  areHeadlinesDuplicate
} from '../utils/deduplication';

const sanitizeArticleRecord = (a: Article): Article => ({
  ...a,
  reporterId: '',
  reporterName: '',
  reporterRole: '',
  reporterPhoto: ''
});

const getAdminAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('hunkar24_admin_token') || '' : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};


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
  // System Status & Realtime Sync (Phase 3 & 9)
  supabaseStatus: 'connected' | 'connecting' | 'standby' | 'error';
  realtimeStatus: 'active' | 'reconnecting' | 'offline';
  lastSyncTime: string | null;
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
  const deletedArticleIdsRef = useRef<Set<string>>(
    new Set(safeLocalStorageGet<string[]>('hunkar24_deleted_article_ids', []) || [])
  );
  const deletedBreakingIdsRef = useRef<Set<string>>(
    new Set(safeLocalStorageGet<string[]>('hunkar24_deleted_breaking_ids', []) || [])
  );

  // Load state from safe storage or use initial seed data with strict deduplication
  const [articles, setArticles] = useState<Article[]>(() => {
    const raw = safeLocalStorageGet<Article[]>('hunkar24_articles', INITIAL_ARTICLES);
    const storedList = Array.isArray(raw) && raw.length > 0 ? raw : [];
    const deletedSet = deletedArticleIdsRef.current;

    const map = new Map<string, Article>();
    for (const a of INITIAL_ARTICLES) {
      if (!deletedSet.has(a.id)) map.set(a.id, sanitizeArticleRecord(a));
    }
    for (const a of storedList) {
      if (!a || deletedSet.has(a.id)) continue;
      const existing = map.get(a.id);
      if (existing) {
        map.set(
          a.id,
          sanitizeArticleRecord({
            ...existing,
            ...a,
            mainImage: a.mainImage || existing.mainImage,
            videoUrl: a.videoUrl !== undefined ? a.videoUrl : existing.videoUrl
          })
        );
      } else {
        map.set(a.id, sanitizeArticleRecord(a));
      }
    }

    const guaranteedIds = [
      'art-katar-chhoti-bus-stand-20261112',
      'art-amarsar-road-bike-accident-20261110',
      'art-aadhaar-voter-id-scheme-2026',
      'art-rajasthan-panchayat-polls-chaturth-2026',
      'art-sikar-zila-parishad-politics-2026',
      'art-nagaur-lakshmi-puja-viral-video-2026',
      'art-22',
      'art-board-exam-course-incomplete-2027',
      'art-katar-kabaddi-2026'
    ];
    for (const id of guaranteedIds) {
      if (deletedSet.has(id)) continue;
      const art = INITIAL_ARTICLES.find(a => a.id === id);
      if (art && !map.has(art.id)) {
        map.set(art.id, sanitizeArticleRecord(art));
      }
    }

    const list = Array.from(map.values());
    const sanitized = list.map(a =>
      sanitizeArticleRecord({
        ...a,
        views: a.views && a.views > 500 ? 0 : a.views || 0,
        likesCount: a.likesCount && a.likesCount > 50 ? 0 : a.likesCount || 0
      })
    );
    sanitized.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return deduplicateArticlesList(sanitized);
  });

  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>(() => {
    const raw = safeLocalStorageGet<BreakingNewsItem[]>('hunkar24_breaking', INITIAL_BREAKING_NEWS);
    const storedBreaking = Array.isArray(raw) && raw.length > 0 ? raw : [];
    const deletedBrkSet = deletedBreakingIdsRef.current;
    const bMap = new Map<string, BreakingNewsItem>();
    for (const b of INITIAL_BREAKING_NEWS) {
      if (!deletedBrkSet.has(b.id)) bMap.set(b.id, b);
    }
    for (const b of storedBreaking) {
      if (b && !deletedBrkSet.has(b.id)) bMap.set(b.id, b);
    }
    const boardExamBrk = INITIAL_BREAKING_NEWS.find(b => b.id === 'brk-board-exam-2027-incomplete');
    if (boardExamBrk && !deletedBrkSet.has(boardExamBrk.id)) {
      bMap.set(boardExamBrk.id, boardExamBrk);
    }
    const katarBrk = INITIAL_BREAKING_NEWS.find(b => b.id === 'brk-katar-kabaddi-1');
    if (katarBrk && !deletedBrkSet.has(katarBrk.id)) {
      bMap.set(katarBrk.id, katarBrk);
    }
    const mergedB = Array.from(bMap.values());
    mergedB.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return deduplicateBreakingNews(mergedB);
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    return safeLocalStorageGet<CategoryItem[]>('hunkar24_categories', DEFAULT_CATEGORIES);
  });

  const [submissions, setSubmissions] = useState<PublicNewsSubmission[]>(() => {
    return safeLocalStorageGet<PublicNewsSubmission[]>('hunkar24_submissions', INITIAL_SUBMISSIONS);
  });

  const [advertisements, setAdvertisements] = useState<AdvertisementCampaign[]>(() => {
    const saved = safeLocalStorageGet<AdvertisementCampaign[]>('hunkar24_ads', []);
    if (Array.isArray(saved)) {
      return saved.filter(
        (a: any) => a && !a.isDemo && a.id !== 'ad-01' && a.id !== 'ad-02' && a.id !== 'ad-03' && a.createdByAdmin && a.approved
      );
    }
    return [];
  });

  const [promotionRequests, setPromotionRequests] = useState<BusinessPromotionRequest[]>(() => {
    return safeLocalStorageGet<BusinessPromotionRequest[]>('hunkar24_promotions', INITIAL_PROMOTION_REQUESTS);
  });

  const [reporters, setReporters] = useState<ReporterProfile[]>(() => {
    return safeLocalStorageGet<ReporterProfile[]>('hunkar24_reporters', INITIAL_REPORTERS);
  });

  const [videos, setVideos] = useState<VideoNewsItem[]>([]);

  const [galleries, setGalleries] = useState<PhotoGalleryAlbum[]>(() => {
    return safeLocalStorageGet<PhotoGalleryAlbum[]>('hunkar24_galleries', INITIAL_GALLERIES);
  });

  const [businessListings, setBusinessListings] = useState<BusinessListing[]>(() => {
    return safeLocalStorageGet<BusinessListing[]>('hunkar24_biz_listings', INITIAL_BUSINESS_LISTINGS);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return safeLocalStorageGet<AuditLog[]>('hunkar24_audit_logs', [
      {
        id: 'log-1',
        userName: 'सिस्टम प्रशासक',
        userRole: 'super_admin',
        action: 'सिस्टम इनिशियलाइज़ेशन',
        module: 'Website Settings',
        details: 'हुंकार 24 मास्टर न्यूज़ प्लेटफॉर्म लोड किया गया',
        timestamp: new Date().toISOString()
      }
    ]);
  });

  // Active filters and views
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // User auth state: Starts null (unauthenticated). Zero personal identity stored or displayed
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('hunkar24_admin_user') : null;
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
    return (safeLocalStorageGet<string>('hunkar24_theme', 'light') as 'light' | 'dark') || 'light';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSubmitNewsOpen, setIsSubmitNewsOpen] = useState<boolean>(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState<boolean>(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState<boolean>(false);

  // System Status & Realtime Sync (Phase 3 & 9)
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'connecting' | 'standby' | 'error'>(() =>
    isSupabaseConfigured ? 'connecting' : 'standby'
  );
  const [realtimeStatus, setRealtimeStatus] = useState<'active' | 'reconnecting' | 'offline'>('active');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Safe sync to storage: strictly cap array length to prevent QuotaExceededError
  useEffect(() => {
    safeLocalStorageSet('hunkar24_articles', articles.slice(0, 30));
  }, [articles]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_breaking', breakingNews.slice(0, 15));
  }, [breakingNews]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_categories', categories);
  }, [categories]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_submissions', submissions.slice(0, 25));
  }, [submissions]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_ads', advertisements);
  }, [advertisements]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_promotions', promotionRequests.slice(0, 20));
  }, [promotionRequests]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_reporters', reporters);
  }, [reporters]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_galleries', galleries.slice(0, 10));
  }, [galleries]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_audit_logs', auditLogs.slice(0, 25));
  }, [auditLogs]);

  useEffect(() => {
    safeLocalStorageSet('hunkar24_theme', theme);
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
      // 1. Sync client-side approved articles from local storage (Netlify mode) with strict deduplication
      const clientApproved = getClientApprovedArticles();
      if (clientApproved.length > 0) {
        setArticles(prevArticles => deduplicateArticlesList([...clientApproved, ...prevArticles]));
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
                reporterName: '',
                reporterRole: '',
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

          return deduplicateArticlesList([...newlyApproved, ...prevArticles]);
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
    // Master Requirement: Strict deduplication migration v4 (purges duplicate news and keeps only 1 canonical copy)
    const DEDUP_MIGRATION_KEY = 'hunkar24_strict_dedup_purge_v4';
    if (!localStorage.getItem(DEDUP_MIGRATION_KEY)) {
      setArticles(prevArticles => {
        // Remove synthetic duplicate articles and deduplicate strictly
        const filtered = prevArticles.filter(a => !a.id.startsWith('art-brk-'));
        const clean = deduplicateArticlesList(filtered.length > 0 ? filtered : prevArticles);
        safeLocalStorageSet('hunkar24_articles', clean);
        return clean;
      });

      // Deduplicate breaking news
      setBreakingNews(prevBreaking => {
        const cleanBreaking = deduplicateBreakingNews(prevBreaking).slice(0, 6);
        safeLocalStorageSet('hunkar24_breaking', cleanBreaking);
        return cleanBreaking;
      });

      localStorage.setItem(DEDUP_MIGRATION_KEY, 'completed');
      console.log('[Hunkar 24] Master deduplication v4 completed: Pure unique articles guaranteed.');
    }

    syncAutoNewsApproved();
    const interval = setInterval(syncAutoNewsApproved, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Supabase Real-Time Database Connection & Sync (Reacts dynamically to hunkar24:supabase-ready)
  useEffect(() => {
    let activeCleanup: (() => void) | null = null;

    const setupSupabaseRealtime = () => {
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }

      const client = getSupabase();
      if (!client) {
        setSupabaseStatus('standby');
        return;
      }

      setSupabaseStatus('connecting');

      const fetchLiveArticles = async () => {
        try {
          const { data, error } = await client
            .from('articles')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(80);

          if (!error && Array.isArray(data)) {
            setSupabaseStatus('connected');
            setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));

            if (data.length > 0) {
              const deletedSet = deletedArticleIdsRef.current;
              const mappedArticles: Article[] = data
                .filter((d: any) => !deletedSet.has(d.id))
                .map((d: any) =>
                  sanitizeArticleRecord({
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
                    reporterName: '',
                    reporterRole: '',
                    reporterPhoto: '',
                    status: d.status || 'published',
                    publishedAt: d.published_at || d.created_at || new Date().toISOString(),
                    updatedAt: d.updated_at || new Date().toISOString(),
                    views: Number(d.views_count || 0),
                    isBreaking: Boolean(d.is_breaking),
                    isHero: Boolean(d.is_hero),
                    isExclusive: Boolean(d.is_exclusive),
                    tags: Array.isArray(d.tags) ? d.tags : ['राजस्थान', 'हुंकार24'],
                    readingTimeMinutes: d.reading_time_minutes || 2,
                    likesCount: d.likes_count || 0,
                    videoUrl: d.video_url,
                    galleryImages: Array.isArray(d.gallery_images) && d.gallery_images.length > 0 ? d.gallery_images : d.main_image ? [d.main_image] : []
                  })
                );

              setArticles(prev => {
                const dbMap = new Map<string, Article>();
                for (const a of mappedArticles) {
                  dbMap.set(a.id, a);
                }
                for (const p of prev) {
                  if (!deletedSet.has(p.id) && !dbMap.has(p.id)) {
                    dbMap.set(p.id, sanitizeArticleRecord(p));
                  }
                }
                const list = Array.from(dbMap.values());
                list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                return deduplicateArticlesList(list);
              });
            }
          } else if (error) {
            console.warn('[Supabase] Initial query notice:', error.message);
            setSupabaseStatus('error');
          }
        } catch (err) {
          console.warn('[Supabase] Connection notice:', err);
          setSupabaseStatus('error');
        }
      };

      fetchLiveArticles();

      client
        .from('breaking_news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const deletedBrkSet = deletedBreakingIdsRef.current;
            const mappedBreaking: BreakingNewsItem[] = data
              .filter((b: any) => !deletedBrkSet.has(b.id))
              .map((b: any) => ({
                id: b.id,
                text: b.text,
                linkUrl: b.link_url,
                linkArticleId: b.link_article_id,
                isActive: b.is_active ?? true,
                priority: b.priority || 1,
                createdAt: b.created_at || new Date().toISOString()
              }));
            setBreakingNews(prev => {
              const bMap = new Map<string, BreakingNewsItem>();
              for (const m of mappedBreaking) bMap.set(m.id, m);
              for (const p of prev) {
                if (!deletedBrkSet.has(p.id) && !bMap.has(p.id)) bMap.set(p.id, p);
              }
              const list = Array.from(bMap.values());
              list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              return deduplicateBreakingNews(list);
            });
          }
        });

      const articlesChannel = client
        .channel('public:articles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload: any) => {
          setRealtimeStatus('active');
          setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));

          if (payload.eventType === 'INSERT') {
            const d = payload.new;
            const newArt: Article = sanitizeArticleRecord({
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
              reporterName: '',
              reporterRole: '',
              status: d.status || 'published',
              publishedAt: d.published_at || new Date().toISOString(),
              updatedAt: d.updated_at || new Date().toISOString(),
              views: Number(d.views_count || 1),
              readingTimeMinutes: d.reading_time_minutes || 2,
              isBreaking: Boolean(d.is_breaking),
              isHero: Boolean(d.is_hero),
              isExclusive: Boolean(d.is_exclusive),
              videoUrl: d.video_url || undefined,
              galleryImages: Array.isArray(d.gallery_images) && d.gallery_images.length > 0 ? d.gallery_images : d.main_image ? [d.main_image] : [],
              tags: d.tags || []
            });
            setArticles(prev => {
              const next = [newArt, ...prev.filter(a => a.id !== newArt.id && a.slug !== newArt.slug)];
              next.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const d = payload.new;
            setArticles(prev => {
              const next = prev.map(a =>
                a.id === d.id
                  ? sanitizeArticleRecord({
                      ...a,
                      headline: d.headline || a.headline,
                      slug: d.slug || a.slug,
                      summary: d.summary || a.summary,
                      content: d.content || a.content,
                      category: d.category_slug || a.category,
                      district: d.district !== undefined ? d.district : a.district,
                      mainImage: d.main_image || a.mainImage,
                      videoUrl: d.video_url !== undefined ? d.video_url : a.videoUrl,
                      galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images : a.galleryImages,
                      status: d.status || a.status,
                      isBreaking: d.is_breaking !== undefined ? Boolean(d.is_breaking) : a.isBreaking,
                      isHero: d.is_hero !== undefined ? Boolean(d.is_hero) : a.isHero,
                      publishedAt: d.published_at || a.publishedAt,
                      updatedAt: d.updated_at || a.updatedAt,
                      views: Number(d.views_count || a.views)
                    })
                  : a
              );
              next.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const d = payload.old;
            if (d?.id) {
              deletedArticleIdsRef.current.add(d.id);
              setArticles(prev => prev.filter(a => a.id !== d.id));
            }
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('active');
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            setRealtimeStatus('reconnecting');
          }
        });

      const breakingChannel = client
        .channel('public:breaking_news')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'breaking_news' }, (payload: any) => {
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
              deletedBreakingIdsRef.current.add(b.id);
              setBreakingNews(prev => prev.filter(item => item.id !== b.id));
            }
          }
        })
        .subscribe();

      const handleOnline = () => {
        setRealtimeStatus('active');
        fetchLiveArticles();
      };
      const handleOffline = () => {
        setRealtimeStatus('offline');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      activeCleanup = () => {
        client.removeChannel(articlesChannel);
        client.removeChannel(breakingChannel);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    setupSupabaseRealtime();
    const handleSupabaseReady = () => setupSupabaseRealtime();
    window.addEventListener('hunkar24:supabase-ready', handleSupabaseReady);

    return () => {
      window.removeEventListener('hunkar24:supabase-ready', handleSupabaseReady);
      if (activeCleanup) activeCleanup();
    };
  }, []);

  // Multi-Device Real-Time SSE + Full State Sync across all phones, desktops & tabs
  const syncFullServerState = useCallback(async () => {
    try {
      const res = await safeFetchJson('/api/sync-state');
      if (res.success && res.data && res.data.success) {
        const data = res.data;

        if (Array.isArray(data.deletedArticleIds)) {
          for (const id of data.deletedArticleIds) {
            deletedArticleIdsRef.current.add(id);
          }
          safeLocalStorageSet('hunkar24_deleted_article_ids', Array.from(deletedArticleIdsRef.current).slice(-100));
        }
        if (Array.isArray(data.deletedBreakingIds)) {
          for (const id of data.deletedBreakingIds) {
            deletedBreakingIdsRef.current.add(id);
          }
          safeLocalStorageSet('hunkar24_deleted_breaking_ids', Array.from(deletedBreakingIdsRef.current).slice(-100));
        }

        const deletedSet = deletedArticleIdsRef.current;
        const deletedBrkSet = deletedBreakingIdsRef.current;

        if (Array.isArray(data.articles)) {
          const serverArts = (data.articles as Article[]).map(sanitizeArticleRecord);
          setArticles(prev => {
            const map = new Map<string, Article>();
            for (const a of serverArts) {
              if (!deletedSet.has(a.id)) {
                map.set(a.id, a);
              }
            }
            for (const a of prev) {
              if (deletedSet.has(a.id)) continue;
              const existing = map.get(a.id);
              if (!existing) {
                map.set(a.id, sanitizeArticleRecord(a));
              } else if (
                a.updatedAt &&
                existing.updatedAt &&
                new Date(a.updatedAt).getTime() > new Date(existing.updatedAt).getTime()
              ) {
                map.set(a.id, sanitizeArticleRecord({ ...existing, ...a }));
              }
            }
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            return deduplicateArticlesList(merged);
          });
        }

        if (Array.isArray(data.breakingNews)) {
          const serverBrk = data.breakingNews as BreakingNewsItem[];
          setBreakingNews(prev => {
            const bMap = new Map<string, BreakingNewsItem>();
            for (const b of serverBrk) {
              if (!deletedBrkSet.has(b.id)) bMap.set(b.id, b);
            }
            for (const b of prev) {
              if (!deletedBrkSet.has(b.id) && !bMap.has(b.id)) bMap.set(b.id, b);
            }
            const mergedB = Array.from(bMap.values());
            mergedB.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            return deduplicateBreakingNews(mergedB);
          });
        }

        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
        if (Array.isArray(data.promotionRequests)) {
          setPromotionRequests(data.promotionRequests);
        }
        if (Array.isArray(data.advertisements)) {
          setAdvertisements(
            data.advertisements.filter(
              (a: any) => a && !a.isDemo && a.id !== 'ad-01' && a.id !== 'ad-02' && a.id !== 'ad-03' && a.createdByAdmin && a.approved
            )
          );
        }
        if (Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
        if (Array.isArray(data.galleries)) {
          setGalleries(data.galleries);
        }
        if (Array.isArray(data.reporters)) {
          setReporters(data.reporters);
        }
        if (Array.isArray(data.businessListings)) {
          setBusinessListings(data.businessListings);
        }
        if (data.settings && typeof data.settings === 'object' && Object.keys(data.settings).length > 0) {
          safeLocalStorageSet('hunkar24_site_settings', data.settings);
          window.dispatchEvent(new CustomEvent('hunkar24:settings-updated', { detail: data.settings }));
        }

        setRealtimeStatus('active');
        setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
        return;
      }

      // Fallback for /api/articles if /api/sync-state unavailable
      const artRes = await safeFetchJson('/api/articles');
      if (artRes.success && Array.isArray(artRes.data?.articles)) {
        const deletedSet = deletedArticleIdsRef.current;
        if (Array.isArray(artRes.data?.deletedArticleIds)) {
          artRes.data.deletedArticleIds.forEach((id: string) => deletedSet.add(id));
        }
        const serverArts = (artRes.data.articles as Article[]).map(sanitizeArticleRecord);
        setArticles(prev => {
          const map = new Map<string, Article>();
          for (const a of serverArts) {
            if (!deletedSet.has(a.id)) map.set(a.id, a);
          }
          for (const a of prev) {
            if (!deletedSet.has(a.id) && !map.has(a.id)) map.set(a.id, sanitizeArticleRecord(a));
          }
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          return deduplicateArticlesList(merged);
        });
        setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
      }
    } catch (err: any) {
      console.warn('[ServerSync] State sync notice:', err?.message);
    }
  }, []);

  useEffect(() => {
    syncFullServerState();

    // Subscribe to Server-Sent Events for instant sub-second live updates across all browsers/devices
    let eventSource: EventSource | null = null;
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource('/api/realtime/stream');
        const handleStreamEvent = () => {
          setRealtimeStatus('active');
          syncFullServerState();
        };
        eventSource.addEventListener('connected', () => setRealtimeStatus('active'));
        eventSource.addEventListener('articles_updated', handleStreamEvent);
        eventSource.addEventListener('article_deleted', handleStreamEvent);
        eventSource.addEventListener('breaking_updated', handleStreamEvent);
        eventSource.addEventListener('breaking_deleted', handleStreamEvent);
        eventSource.addEventListener('ads_updated', handleStreamEvent);
        eventSource.addEventListener('state_updated', handleStreamEvent);
        eventSource.onerror = () => {
          setRealtimeStatus('reconnecting');
        };
      } catch {
        // Fallback to polling interval below
      }
    }

    const handleFocusOrOnline = () => syncFullServerState();
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    // Fallback polling every 8 seconds so mobile/remote devices stay synchronized even without SSE
    const serverSyncInterval = setInterval(syncFullServerState, 8000);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
      clearInterval(serverSyncInterval);
    };
  }, [syncFullServerState]);

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
          return deduplicateArticlesList(merged);
        });
      }
    });

    // 3. Real-time live listener for breaking news
    const unsubBreaking = subscribeToFirebaseBreakingNews((firebaseBreaking) => {
      if (Array.isArray(firebaseBreaking) && firebaseBreaking.length > 0) {
        const sorted = [...firebaseBreaking].sort((a, b) => (a.priority || 99) - (b.priority || 99));
        setBreakingNews(sorted);
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

  const syncStateKeyToServer = (key: string, value: any) => {
    safeFetchJson('/api/admin/state-sync', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ key, value })
    }).catch(() => {});
  };

  // Article Actions with Instant Two-Way Server/Supabase/Firebase Real-Time Broadcast
  const addArticle = (data: Omit<Article, 'id' | 'views' | 'publishedAt' | 'updatedAt'>): Article => {
    const now = new Date().toISOString();
    const isPublishing = (data.status || 'published') === 'published';
    const newArticle: Article = sanitizeArticleRecord({
      ...data,
      id: `art-${Date.now()}`,
      views: 0,
      likesCount: 0,
      isBreaking: isPublishing ? true : Boolean(data.isBreaking),
      isHero: isPublishing ? true : Boolean(data.isHero),
      publishedAt: now,
      updatedAt: now
    });

    setArticles(prev => {
      const demoted = isPublishing ? prev.map(a => ({ ...a, isHero: false })) : prev;
      return deduplicateArticlesList([newArticle, ...demoted]);
    });

    // Automatically publish at #1 on Breaking Ticker & Bulletin Board immediately
    if (isPublishing) {
      const autoBulletin: BreakingNewsItem = {
        id: `brk-${newArticle.id}`,
        text: newArticle.headline,
        category: newArticle.category,
        linkArticleId: newArticle.id,
        linkUrl: `/news/${newArticle.slug}`,
        priority: 1,
        isActive: true,
        createdAt: now
      };
      setBreakingNews(prev => [autoBulletin, ...prev.filter(b => b.text !== autoBulletin.text && b.linkArticleId !== newArticle.id)]);
      saveBreakingNewsToFirebase(autoBulletin);
      const clientB = getSupabase();
      if (clientB) {
        Promise.resolve(
          clientB.from('breaking_news').upsert([{
            id: autoBulletin.id,
            text: autoBulletin.text,
            category_slug: autoBulletin.category,
            link_article_id: autoBulletin.linkArticleId,
            link_url: autoBulletin.linkUrl,
            is_active: true,
            priority: 1
          }], { onConflict: 'id' })
        ).catch(() => {});
      }
    }

    const client = getSupabase();
    if (client) {
      try {
        const payload: any = {
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
          reporter_name: '',
          reporter_role: '',
          reporter_photo: '',
          status: newArticle.status || 'published',
          is_breaking: Boolean(newArticle.isBreaking),
          is_hero: Boolean(newArticle.isHero),
          is_exclusive: Boolean(newArticle.isExclusive),
          views_count: 1,
          likes_count: 0,
          reading_time_minutes: newArticle.readingTimeMinutes || 3,
          tags: newArticle.tags || [],
          video_url: newArticle.videoUrl,
          gallery_images: newArticle.galleryImages || (newArticle.mainImage ? [newArticle.mainImage] : []),
          published_at: newArticle.publishedAt
        };

        client
          .from('articles')
          .upsert([payload], { onConflict: 'id' })
          .select('id, headline, slug')
          .then(({ data: resData, error }) => {
            if (!error && resData && resData[0]?.id) {
              setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
            } else if (error) {
              console.warn('[Supabase Realtime] Article insert notice:', error.message);
            }
          });
      } catch (err) {
        console.warn('[Supabase] Insert error:', err);
      }
    }

    saveArticleToFirebase(newArticle);

    safeFetchJson('/api/articles', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(newArticle)
    }).catch(err => console.warn('[AddArticle] Server sync warning:', err));

    setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
    logAction('लेख प्रकाशित', 'News Management', `नया समाचार प्रकाशित: ${data.headline}`);
    return newArticle;
  };

  const updateArticle = (id: string, updates: Partial<Article>) => {
    const now = new Date().toISOString();
    const existing = articles.find(a => a.id === id);
    const transitioningToPublished = existing && existing.status !== 'published' && updates.status === 'published';
    const promoteToTop = Boolean(transitioningToPublished || updates.isHero);

    const cleanUpdates: Partial<Article> = {
      ...updates,
      reporterId: '',
      reporterName: '',
      reporterRole: '',
      reporterPhoto: '',
      ...(transitioningToPublished ? { publishedAt: now, isHero: true, isBreaking: true } : {}),
      updatedAt: now
    };

    let updatedObj: Article | null = existing ? sanitizeArticleRecord({ ...existing, ...cleanUpdates }) : null;

    setArticles(prev => {
      const next = prev.map(art => {
        if (art.id === id) {
          updatedObj = sanitizeArticleRecord({ ...art, ...cleanUpdates });
          return updatedObj;
        }
        return promoteToTop ? { ...art, isHero: false } : art;
      });
      next.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return next;
    });

    if (activeArticle && activeArticle.id === id) {
      setActiveArticle(prev => (prev ? sanitizeArticleRecord({ ...prev, ...cleanUpdates }) : null));
    }

    if (updatedObj) {
      safeFetchJson('/api/articles', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ...updatedObj, promoteToTop })
      }).catch(err => console.warn('[UpdateArticle] Server sync warning:', err));
    }

    const client = getSupabase();
    if (client) {
      try {
        const updatePayload: any = {
          headline: cleanUpdates.headline,
          slug: cleanUpdates.slug,
          summary: cleanUpdates.summary,
          content: cleanUpdates.content,
          category_slug: cleanUpdates.category,
          district: cleanUpdates.district,
          tehsil: cleanUpdates.tehsil,
          village: cleanUpdates.village,
          main_image: cleanUpdates.mainImage,
          image_caption: cleanUpdates.imageCaption,
          image_source: cleanUpdates.imageSource,
          reporter_name: '',
          reporter_role: '',
          reporter_photo: '',
          status: cleanUpdates.status,
          is_breaking: cleanUpdates.isBreaking,
          is_hero: cleanUpdates.isHero,
          is_exclusive: cleanUpdates.isExclusive,
          tags: cleanUpdates.tags,
          video_url: cleanUpdates.videoUrl,
          published_at: cleanUpdates.publishedAt,
          updated_at: now
        };
        if (cleanUpdates.galleryImages !== undefined) {
          updatePayload.gallery_images = cleanUpdates.galleryImages;
        }
        client
          .from('articles')
          .update(updatePayload)
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Article update notice:', error);
            else setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
          });
      } catch (err) {
        console.warn('[Supabase] Update error:', err);
      }
    }

    updateArticleInFirebase(id, cleanUpdates);
    logAction('लेख संशोधित', 'News Management', `समाचार आईडी ${id} अद्यतित किया गया`);
  };

  const deleteArticle = (id: string) => {
    const target = articles.find(a => a.id === id);
    deletedArticleIdsRef.current.add(id);
    safeLocalStorageSet('hunkar24_deleted_article_ids', Array.from(deletedArticleIdsRef.current).slice(-100));

    setArticles(prev => prev.filter(art => art.id !== id));
    setBreakingNews(prev => prev.filter(b => b.linkArticleId !== id && b.id !== `brk-${id}`));

    if (activeArticle?.id === id) {
      setActiveArticle(null);
    }

    safeFetchJson(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include'
    }).catch(err => console.warn('[DeleteArticle] Server sync warning:', err));

    const client = getSupabase();
    if (client) {
      try {
        client
          .from('articles')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Article delete notice:', error);
            else setLastSyncTime(new Date().toLocaleTimeString('hi-IN'));
          });
      } catch (err) {
        console.warn('[Supabase] Delete error:', err);
      }
    }

    deleteArticleFromFirebase(id);
    logAction('लेख विलोपित', 'News Management', `समाचार हटाया गया: ${target?.headline || id}`);
  };

  const incrementArticleViews = (_id: string) => {
    // Views tracking system disabled per editorial policy
  };

  const toggleArticleLike = (id: string) => {
    if (typeof window === 'undefined') return;
    const likeKey = `hunkar24_liked_${id}`;
    const alreadyLiked = Boolean(localStorage.getItem(likeKey));

    if (alreadyLiked) {
      localStorage.removeItem(likeKey);
    } else {
      localStorage.setItem(likeKey, '1');
    }

    setArticles(prev =>
      prev.map(art => {
        if (art.id === id) {
          const currentLikes = art.likesCount || 0;
          const nextLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
          updateArticleInFirebase(id, { likesCount: nextLikes });
          return { ...art, likesCount: nextLikes };
        }
        return art;
      })
    );

    if (activeArticle && activeArticle.id === id) {
      setActiveArticle(prev => {
        if (!prev) return null;
        const currentLikes = prev.likesCount || 0;
        const nextLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        return { ...prev, likesCount: nextLikes };
      });
    }
  };

  // Breaking News with Instant Server + Supabase + Firebase Broadcast
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

    safeFetchJson('/api/breaking-news', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(item)
    }).catch(() => {});

    const client = getSupabase();
    if (client) {
      try {
        client
          .from('breaking_news')
          .upsert([{
            id: item.id,
            text: item.text,
            link_url: item.linkUrl,
            link_article_id: item.linkArticleId,
            priority: item.priority,
            is_active: item.isActive
          }], { onConflict: 'id' })
          .then(({ error }) => {
            if (error) console.warn('[Supabase Realtime] Breaking news insert notice:', error);
          });
      } catch (err) {
        console.warn('[Supabase] Insert breaking error:', err);
      }
    }

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

    safeFetchJson(`/api/breaking-news/${id}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isActive: nextActiveState, ...(updatedItem || {}) })
    }).catch(() => {});

    const client = getSupabase();
    if (client) {
      try {
        client
          .from('breaking_news')
          .update({ is_active: nextActiveState })
          .eq('id', id)
          .then(() => {});
      } catch {}
    }

    if (updatedItem) {
      saveBreakingNewsToFirebase(updatedItem);
    }
  };

  const deleteBreakingNews = (id: string) => {
    deletedBreakingIdsRef.current.add(id);
    safeLocalStorageSet('hunkar24_deleted_breaking_ids', Array.from(deletedBreakingIdsRef.current).slice(-100));
    setBreakingNews(prev => prev.filter(item => item.id !== id));

    safeFetchJson(`/api/breaking-news/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
      credentials: 'include'
    }).catch(() => {});

    const client = getSupabase();
    if (client) {
      try {
        client
          .from('breaking_news')
          .delete()
          .eq('id', id)
          .then(() => {});
      } catch {}
    }

    deleteBreakingNewsFromFirebase(id);
  };

  // Categories
  const addCategory = (cat: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...cat,
      id: `cat-${Date.now()}`
    };
    setCategories(prev => {
      const next = [...prev, newCat];
      syncStateKeyToServer('categories', next);
      return next;
    });
    logAction('श्रेणी जोड़ी गई', 'Categories', cat.nameHi);
  };

  const updateCategory = (id: string, updates: Partial<CategoryItem>) => {
    setCategories(prev => {
      const next = prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat));
      syncStateKeyToServer('categories', next);
      return next;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const next = prev.filter(cat => cat.id !== id);
      syncStateKeyToServer('categories', next);
      return next;
    });
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
    setSubmissions(prev => {
      const next = [newSubmission, ...prev];
      syncStateKeyToServer('submissions', next);
      return next;
    });
    logAction('नागरिक समाचार प्रस्तुत', 'Public Submissions', `${sub.submitterName} द्वारा: ${sub.headline}`);
    return trackingId;
  };

  const approveSubmission = (id: string, notes?: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    const generatedArticle = addArticle({
      headline: sub.headline,
      slug: sub.headline
        .toLowerCase()
        .replace(/[^\w\u0900-\u097F]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || `sub-${Date.now()}`,
      summary: sub.description.slice(0, 180) + (sub.description.length > 180 ? '...' : ''),
      content: sub.description,
      category: 'rajasthan',
      district: sub.district,
      tehsil: sub.tehsil,
      village: sub.village,
      mainImage: sub.imageUrls[0] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `${sub.village ? sub.village + ', ' : ''}${sub.district} से ग्राउंड रिपोर्ट`,
      imageSource: 'हुंकार 24 ग्राउंड रिपोर्ट',
      reporterId: '',
      reporterName: '',
      reporterRole: '',
      reporterPhoto: '',
      isBreaking: true,
      isHero: true,
      status: 'published',
      readingTimeMinutes: 2,
      tags: ['ग्राउंड रिपोर्ट', sub.district, 'राजस्थान']
    });

    setSubmissions(prev => {
      const next = prev.map(s =>
        s.id === id ? { ...s, status: 'approved' as const, adminNotes: notes, approvedArticleId: generatedArticle.id } : s
      );
      syncStateKeyToServer('submissions', next);
      return next;
    });

    logAction('समाचार स्वीकृत व प्रकाशित', 'Public Submissions', `आईडी ${id} को लेख ${generatedArticle.id} में बदला गया`);
  };

  const rejectSubmission = (id: string, reason: string) => {
    setSubmissions(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, status: 'rejected' as const, adminNotes: reason } : s));
      syncStateKeyToServer('submissions', next);
      return next;
    });
    logAction('समाचार अस्वीकृत', 'Public Submissions', `आईडी ${id} अस्वीकृत। कारण: ${reason}`);
  };

  // Advertisements (Synced with /api/ads/manage)
  const addAdvertisement = (ad: Omit<AdvertisementCampaign, 'id' | 'impressions' | 'clicks'>) => {
    const newAd: AdvertisementCampaign = {
      ...ad,
      id: `ad-${Date.now()}`,
      impressions: 1,
      clicks: 0
    };
    setAdvertisements(prev => [newAd, ...prev]);

    safeFetchJson('/api/ads/manage', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action: 'create', ad: newAd })
    }).catch(() => {});

    logAction('विज्ञापन अभियान सृजित', 'Ad Management', ad.campaignTitle);
  };

  const toggleAdStatus = (id: string) => {
    setAdvertisements(prev =>
      prev.map(ad => (ad.id === id ? { ...ad, status: ad.status === 'active' ? 'paused' : 'active' } : ad))
    );
    safeFetchJson('/api/ads/manage', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action: 'toggle', adId: id })
    }).catch(() => {});
  };

  const deleteAdvertisement = (id: string) => {
    setAdvertisements(prev => prev.filter(ad => ad.id !== id));
    safeFetchJson('/api/ads/manage', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action: 'delete', adId: id })
    }).catch(() => {});
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
    setPromotionRequests(prev => {
      const next = [newReq, ...prev];
      syncStateKeyToServer('promotionRequests', next);
      return next;
    });
    logAction('व्यापार प्रचार आवेदन', 'Promotion Requests', `${req.businessName} द्वारा`);
    return id;
  };

  const updatePromotionStatus = (id: string, status: 'approved' | 'rejected', paymentStatus: 'completed' | 'failed' = 'completed') => {
    setPromotionRequests(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, status, paymentStatus } : p));
      syncStateKeyToServer('promotionRequests', next);
      return next;
    });
    logAction('प्रचार आवेदन समीक्षा', 'Promotion Requests', `आईडी ${id} स्थिति: ${status}`);
  };

  // Business Directory
  const addBusinessListing = (biz: Omit<BusinessListing, 'id'>) => {
    const newBiz: BusinessListing = {
      ...biz,
      id: `biz-${Date.now()}`
    };
    setBusinessListings(prev => {
      const next = [newBiz, ...prev];
      syncStateKeyToServer('businessListings', next);
      return next;
    });
  };

  // Multimedia
  const addVideo = (vid: Omit<VideoNewsItem, 'id' | 'views' | 'publishedAt'>) => {
    const newVid: VideoNewsItem = {
      ...vid,
      id: `vid-${Date.now()}`,
      views: 1,
      publishedAt: new Date().toISOString()
    };
    setVideos(prev => {
      const next = [newVid, ...prev];
      syncStateKeyToServer('videos', next);
      return next;
    });
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => {
      const next = prev.filter(v => v.id !== id);
      syncStateKeyToServer('videos', next);
      return next;
    });
    logAction('वीडियो विलोपित', 'Video News', `वीडियो आईडी ${id} हटाया गया`);
  };

  const clearAllVideos = () => {
    setVideos([]);
    syncStateKeyToServer('videos', []);
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
    setGalleries(prev => {
      const next = [newGal, ...prev];
      syncStateKeyToServer('galleries', next);
      return next;
    });
  };

  // Reporters
  const addReporter = (rep: Omit<ReporterProfile, 'id' | 'publishedArticleCount' | 'joinedDate'>) => {
    const newRep: ReporterProfile = {
      ...rep,
      id: `rep-${Date.now()}`,
      publishedArticleCount: 0,
      joinedDate: new Date().toISOString().slice(0, 10)
    };
    setReporters(prev => {
      const next = [...prev, newRep];
      syncStateKeyToServer('reporters', next);
      return next;
    });
  };

  const updateReporter = (id: string, updates: Partial<ReporterProfile>) => {
    setReporters(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, ...updates } : r));
      syncStateKeyToServer('reporters', next);
      return next;
    });
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
      name: role === 'super_admin' ? 'मुख्य प्रशासक (Super Admin)' : role === 'admin' ? 'प्रशासक (Admin)' : 'संवाददाता (Reporter)',
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
        supabaseStatus,
        realtimeStatus,
        lastSyncTime,
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
