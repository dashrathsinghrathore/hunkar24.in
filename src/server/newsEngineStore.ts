import fs from 'fs';
import path from 'path';
import {
  DEFAULT_PROVIDERS,
  ProviderConfig,
  RawNewsArticle,
  fetchFromNewsApi,
  fetchFromNewsData,
  fetchFromGNews,
  fetchFromGoogleNewsRss,
  fetchFromCurrents,
  fetchFromMediastack,
  fetchFromCustomProvider
} from './newsProviders';
import { deduplicateArticles, ProcessedArticle } from './deduplicationEngine';
import { processArticleWithAI } from './aiNewsEngine';

export type PublishingMode = 'manual' | 'auto_safe' | 'paused' | 'emergency_stop';

export interface EngineSettings {
  autoNewsEnabled: boolean;
  fetchIntervalMinutes: number;
  publishingMode: PublishingMode;
  hindiTranslationEnabled: boolean;
  aiSummaryEnabled: boolean;
  deduplicationEnabled: boolean;
  prioritizeRajasthan: boolean;
}

export interface EngineStats {
  totalImported: number;
  publishedCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
  duplicateCount: number;
  apiRequestsToday: number;
  lastSuccessfulFetch: string | null;
  nextScheduledFetch: string | null;
  isJobRunning: boolean;
}

const STORE_FILE = path.resolve(process.cwd(), '.auto-news-store.json');

class NewsEngineStore {
  private providers: ProviderConfig[] = [...DEFAULT_PROVIDERS];
  private pendingArticles: ProcessedArticle[] = [];
  private approvedArticles: ProcessedArticle[] = [];
  private rejectedArticles: Array<ProcessedArticle & { rejectReason: string }> = [];
  private duplicateArticles: RawNewsArticle[] = [];
  private executionLogs: Array<{
    id: string;
    timestamp: string;
    providerId: string;
    articlesFetched: number;
    status: 'success' | 'error';
    message: string;
  }> = [];

  private settings: EngineSettings = {
    autoNewsEnabled: true,
    fetchIntervalMinutes: 30,
    publishingMode: 'auto_safe',
    hindiTranslationEnabled: true,
    aiSummaryEnabled: true,
    deduplicationEnabled: true,
    prioritizeRajasthan: true
  };

  private timer: NodeJS.Timeout | null = null;
  private isRunningMutex = false;
  private lastFetchTime: string | null = null;

  constructor() {
    this.loadFromDisk();
    this.startScheduler();

    // If store is empty on launch, trigger initial background collect
    if (this.pendingArticles.length === 0 && this.approvedArticles.length === 0) {
      setTimeout(() => {
        this.collectAndProcessNews().catch(err => {
          console.warn('[NewsEngine] Initial background harvest warning:', err.message);
        });
      }, 2000);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.pendingArticles)) this.pendingArticles = data.pendingArticles;
        if (Array.isArray(data.approvedArticles)) this.approvedArticles = data.approvedArticles;
        if (Array.isArray(data.rejectedArticles)) this.rejectedArticles = data.rejectedArticles;
        if (Array.isArray(data.executionLogs)) this.executionLogs = data.executionLogs;
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (data.lastFetchTime) this.lastFetchTime = data.lastFetchTime;
      }
    } catch (e) {
      console.warn('[NewsEngine] Could not read cache store, initializing fresh in-memory state.');
    }
  }

  private saveToDisk() {
    try {
      const data = {
        pendingArticles: this.pendingArticles.slice(0, 100),
        approvedArticles: this.approvedArticles.slice(0, 100),
        rejectedArticles: this.rejectedArticles.slice(0, 50),
        executionLogs: this.executionLogs.slice(-100),
        settings: this.settings,
        lastFetchTime: this.lastFetchTime
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in restricted environments
    }
  }

  public getSettings(): EngineSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<EngineSettings>): EngineSettings {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.fetchIntervalMinutes) {
      this.startScheduler();
    }
    this.saveToDisk();
    return this.getSettings();
  }

  public getProviders(): ProviderConfig[] {
    // Mask API keys for security before returning
    return this.providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 4)}...${p.apiKey.slice(-4)}` : undefined
    }));
  }

  public updateProvider(id: string, updates: Partial<ProviderConfig>): ProviderConfig | null {
    const idx = this.providers.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.providers[idx] = { ...this.providers[idx], ...updates };
    return this.providers[idx];
  }

  public getStats(): EngineStats {
    const nextFetch = this.lastFetchTime
      ? new Date(new Date(this.lastFetchTime).getTime() + this.settings.fetchIntervalMinutes * 60000).toISOString()
      : new Date(Date.now() + this.settings.fetchIntervalMinutes * 60000).toISOString();

    return {
      totalImported: this.pendingArticles.length + this.approvedArticles.length + this.rejectedArticles.length,
      publishedCount: this.approvedArticles.length,
      pendingReviewCount: this.pendingArticles.length,
      rejectedCount: this.rejectedArticles.length,
      duplicateCount: this.duplicateArticles.length,
      apiRequestsToday: this.providers.reduce((sum, p) => sum + p.requestCountToday, 0),
      lastSuccessfulFetch: this.lastFetchTime,
      nextScheduledFetch: this.settings.autoNewsEnabled && this.settings.publishingMode !== 'emergency_stop' ? nextFetch : 'पॉज किया गया (Paused)',
      isJobRunning: this.isRunningMutex
    };
  }

  public getPendingArticles(): ProcessedArticle[] {
    return [...this.pendingArticles];
  }

  public getApprovedArticles(): ProcessedArticle[] {
    return [...this.approvedArticles];
  }

  public getExecutionLogs() {
    return [...this.executionLogs].slice(-50);
  }

  public approveArticle(id: string, editedContent?: Partial<ProcessedArticle>): ProcessedArticle | null {
    const idx = this.pendingArticles.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const article = { ...this.pendingArticles[idx], ...editedContent };
    this.pendingArticles.splice(idx, 1);
    this.approvedArticles.unshift(article);
    this.saveToDisk();
    return article;
  }

  public rejectArticle(id: string, reason: string): boolean {
    const idx = this.pendingArticles.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const [article] = this.pendingArticles.splice(idx, 1);
    this.rejectedArticles.unshift({ ...article, rejectReason: reason });
    this.saveToDisk();
    return true;
  }

  // Test single provider connection
  public async testProvider(id: string): Promise<{
    success: boolean;
    providerName: string;
    count: number;
    sampleTitle?: string;
    latencyMs: number;
    error?: string;
  }> {
    const provider = this.providers.find(p => p.id === id);
    if (!provider) {
      return { success: false, providerName: id, count: 0, latencyMs: 0, error: 'Provider not found' };
    }

    const start = Date.now();
    try {
      let articles: RawNewsArticle[] = [];
      if (id === 'newsapi') articles = await fetchFromNewsApi(provider);
      else if (id === 'newsdata') articles = await fetchFromNewsData(provider);
      else if (id === 'gnews') articles = await fetchFromGNews(provider);
      else if (id === 'google_news_rss') articles = await fetchFromGoogleNewsRss();
      else articles = await fetchFromCustomProvider(provider);

      const latencyMs = Date.now() - start;
      provider.lastStatus = 'success';
      provider.lastFetchedAt = new Date().toISOString();
      provider.requestCountToday++;

      return {
        success: true,
        providerName: provider.name,
        count: articles.length,
        sampleTitle: articles[0]?.title || 'सफलतापूर्वक कनेक्टेड',
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      provider.lastStatus = 'error';
      provider.lastErrorMessage = err.message;
      return {
        success: false,
        providerName: provider.name,
        count: 0,
        latencyMs,
        error: err.message
      };
    }
  }

  // Master harvest job with failure isolation and Rajasthan prioritization
  public async collectAndProcessNews(): Promise<{
    success: boolean;
    importedCount: number;
    duplicateCount: number;
    approvedCount: number;
    approvedArticles?: ProcessedArticle[];
    stats?: EngineStats;
    errors: string[];
  }> {
    if (this.isRunningMutex) {
      return {
        success: false,
        importedCount: 0,
        duplicateCount: 0,
        approvedCount: 0,
        errors: ['Job already running']
      };
    }

    if (this.settings.publishingMode === 'emergency_stop') {
      return {
        success: false,
        importedCount: 0,
        duplicateCount: 0,
        approvedCount: 0,
        errors: ['इमरजेंसी स्टॉप सक्रिय है। ऑटोमेशन रोका गया।']
      };
    }

    this.isRunningMutex = true;
    const errors: string[] = [];
    const allRawArticles: RawNewsArticle[] = [];

    try {
      // 1. Fetch from active providers in parallel with failure isolation
      for (const provider of this.providers) {
        if (!provider.isEnabled) continue;

        try {
          let fetched: RawNewsArticle[] = [];
          if (provider.id === 'newsapi') fetched = await fetchFromNewsApi(provider);
          else if (provider.id === 'newsdata') fetched = await fetchFromNewsData(provider);
          else if (provider.id === 'gnews') fetched = await fetchFromGNews(provider);
          else if (provider.id === 'google_news_rss') fetched = await fetchFromGoogleNewsRss();
          else if (provider.id === 'currents') fetched = await fetchFromCurrents(provider);
          else if (provider.id === 'mediastack') fetched = await fetchFromMediastack(provider);
          else fetched = await fetchFromCustomProvider(provider);

          provider.lastStatus = 'success';
          provider.lastFetchedAt = new Date().toISOString();
          provider.requestCountToday++;
          allRawArticles.push(...fetched);

          this.executionLogs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            providerId: provider.id,
            articlesFetched: fetched.length,
            status: 'success',
            message: `${provider.name} से ${fetched.length} समाचार सफलता से संकलित`
          });
        } catch (err: any) {
          provider.lastStatus = 'error';
          provider.lastErrorMessage = err.message;
          errors.push(`${provider.name}: ${err.message}`);

          this.executionLogs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            providerId: provider.id,
            articlesFetched: 0,
            status: 'error',
            message: `${provider.name} त्रुटि: ${err.message}`
          });
        }
      }

      // 2. Deduplication Engine
      const deduplicatedGroups = deduplicateArticles(allRawArticles);
      let newDuplicates = 0;
      for (const group of deduplicatedGroups) {
        if (group.duplicates.length > 0) {
          this.duplicateArticles.push(...group.duplicates);
          newDuplicates += group.duplicates.length;
        }
      }

      // 3. Process eligible articles through AI Hindi Engine with Rajasthan Scoring
      let newlyImported = 0;
      let newlyApproved = 0;

      for (const group of deduplicatedGroups.slice(0, 20)) {
        // Prevent duplicate re-import of existing canonical URLs
        const alreadyExists =
          this.pendingArticles.some(p => p.canonicalUrl === group.primary.url) ||
          this.approvedArticles.some(a => a.canonicalUrl === group.primary.url);

        if (alreadyExists) continue;

        const processed = await processArticleWithAI(group.primary, group.duplicates);

        // Immediate Live Auto-Publish: Any news fetched within the cycle goes live immediately
        this.approvedArticles.unshift(processed);
        newlyApproved++;

        // Push to Firebase Realtime Database if configured
        const firebaseRtdbUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;
        if (firebaseRtdbUrl) {
          const slug = processed.titleHindi
            .toLowerCase()
            .replace(/[^\w\u0900-\u097F]+/g, '-')
            .slice(0, 50);
          const artId = `art-${processed.id}`;
          const isBreaking = processed.tags.includes('ब्रेकिंग') || processed.verificationLevel === 'multiple_sources';
          const rtdbPayload = {
            id: artId,
            headline: processed.titleHindi,
            slug: `${slug}-${artId.slice(-4)}`,
            summary: processed.summaryHindi,
            content: processed.contentHindi,
            category: processed.category || 'rajasthan',
            district: processed.district,
            mainImage: processed.imageUrl,
            imageCaption: `${processed.district ? processed.district.toUpperCase() : 'राजस्थान'} समाचार संदर्भ दृश्य`,
            imageSource: processed.imageSource || 'हुंकार 24 डिजिटल डेस्क',
            reporterName: `हुंकार 24 ब्यूरो (${processed.sourceArticles[0]?.sourceName || 'विशेष प्रतिनिधि'})`,
            reporterRole: 'स्वचालित समाचार नेटवर्क',
            status: 'published',
            isBreaking,
            isHero: false,
            isExclusive: false,
            views: Math.floor(120 + Math.random() * 250),
            likesCount: Math.floor(10 + Math.random() * 45),
            readingTimeMinutes: 3,
            tags: processed.tags,
            publishedAt: processed.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          fetch(`${firebaseRtdbUrl}/articles/${artId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rtdbPayload)
          }).catch(err => console.warn('[Firebase RTDB sync warning]:', err.message));
        }
      }

      this.lastFetchTime = new Date().toISOString();
      this.saveToDisk();

      return {
        success: true,
        importedCount: newlyImported,
        duplicateCount: newDuplicates,
        approvedCount: newlyApproved,
        approvedArticles: this.approvedArticles.slice(0, 30),
        stats: this.getStats(),
        errors
      };
    } finally {
      this.isRunningMutex = false;
    }
  }

  private startScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const intervalMs = Math.max(15, this.settings.fetchIntervalMinutes) * 60 * 1000;
    this.timer = setInterval(() => {
      if (this.settings.autoNewsEnabled && this.settings.publishingMode !== 'emergency_stop') {
        console.log(`[AutoNewsScheduler] Triggering scheduled fetch (${this.settings.fetchIntervalMinutes}m interval)...`);
        this.collectAndProcessNews().catch(err => console.error('[AutoNewsScheduler Error]:', err));
      }
    }, intervalMs);
  }
}

export const newsEngineStore = new NewsEngineStore();
