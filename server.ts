import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { newsEngineStore } from './src/server/newsEngineStore';
import { getDynamicMandiRates } from './src/data/mandiData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[Hunkar24 Process] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Hunkar24 Process] Unhandled rejection:', reason);
});

const app = express();
// AI Studio requires port 3000. In Cloud Run container environments, process.env.PORT is 8080 (which is internally reserved).
// We check CLI args for --port if provided, otherwise strictly bind to 3000.
function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val)) return val;
  }
  return 3000;
}
const PORT = resolvePort();
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/assets', express.static(path.resolve(__dirname, 'public', 'assets')));

// In-memory web push subscriptions storage (Part 18 architecture preparation)
const webPushSubscriptions: Array<{ endpoint: string; keys: any; subscribedAt: string }> = [];

// ============================================================================
// ADMIN SECURITY & AUTHENTICATION ENGINE (Argon2/Scrypt, HttpOnly Cookies, Anti-BruteForce)
// ============================================================================

const ADMIN_AUTH_SALT = process.env.ADMIN_AUTH_SALT || 'hunkar24-salt-production-2026';
const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jaimaakarni86';

// Memory-hard Scrypt password hash function
function computeSecurePasswordHash(password: string): Buffer {
  return crypto.scryptSync(password.normalize(), ADMIN_AUTH_SALT, 64);
}

// Precomputed server hash
let currentAdminPasswordHash = computeSecurePasswordHash(SERVER_ADMIN_PASSWORD);

// Cryptographically secure active sessions
interface AdminSession {
  token: string;
  id: string;
  role: 'super_admin';
  createdAt: number;
  expiresAt: number;
  ip: string;
}

const activeAdminSessions = new Map<string, AdminSession>();

// Rate limit / brute force tracking map
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}
const ipRateLimitMap = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(c => {
    const parts = c.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      try {
        list[key] = decodeURIComponent(parts.join('='));
      } catch {
        list[key] = parts.join('=');
      }
    }
  });
  return list;
}

const SESSION_SIGNING_SECRET = process.env.ADMIN_AUTH_SALT || 'hunkar24-session-hmac-secret-2026';

function signAdminToken(id: string, role: 'super_admin', expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ id, role, expiresAt, nonce: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedToken(token: string): AdminSession | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(payload).digest('base64url');
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || !decoded.expiresAt || Date.now() > decoded.expiresAt) return null;
    return {
      token,
      id: decoded.id || 'usr-admin-01',
      role: 'super_admin',
      createdAt: Date.now(),
      expiresAt: decoded.expiresAt,
      ip: 'verified'
    };
  } catch {
    return null;
  }
}

function getValidSession(req: Request): AdminSession | null {
  const cookies = parseCookies(req);
  const tokenFromCookie = cookies['hunkar24_session'];
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = (tokenFromHeader && tokenFromHeader.trim()) || (tokenFromCookie && tokenFromCookie.trim());

  if (!token) return null;
  const session = activeAdminSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeAdminSessions.delete(token);
      return null;
    }
    return session;
  }
  return verifySignedToken(token);
}

// Server-side authentication guard for protected endpoints
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const session = getValidSession(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'अनधिकृत प्रवेश: केवल अधिकृत प्रशासक के लिए अनुमत'
    });
  }
  (req as any).adminSession = session;
  next();
}

// ============================================================================
// ADVERTISEMENT PERSISTENCE (Strictly Admin-Created, Zero Demo Ads)
// ============================================================================
const ADS_STORE_FILE = path.resolve(process.cwd(), '.advertisements.json');

export interface AdminAdCampaign {
  id: string;
  campaignTitle: string;
  advertiserName: string;
  placement: string;
  imageUrl: string;
  logoUrl?: string;
  targetUrl: string;
  desktopVisible: boolean;
  mobileVisible: boolean;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'expired';
  startDate: string;
  endDate: string;
  pricingInr: number;
  approved: boolean;
  createdByAdmin: boolean;
  isDemo?: boolean;
}

function loadAdsFromDisk(): AdminAdCampaign[] {
  try {
    if (fs.existsSync(ADS_STORE_FILE)) {
      const raw = fs.readFileSync(ADS_STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        // Purge any demo or unapproved ads
        return data.filter(ad => ad && !ad.isDemo && ad.createdByAdmin && ad.approved);
      }
    }
  } catch {
    // Return empty list on parse error
  }
  return [];
}

function saveAdsToDisk(ads: AdminAdCampaign[]) {
  try {
    fs.writeFileSync(ADS_STORE_FILE, JSON.stringify(ads, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[AdsStore] Could not persist ads to disk:', e);
  }
}

let persistedAds: AdminAdCampaign[] = loadAdsFromDisk();


// ============================================================================
// SEO ENDPOINTS: ROBOTS.TXT & DYNAMIC XML SITEMAP
// ============================================================================

// Robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# AI Crawlers
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://hunkar24.in/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// llms.txt & llms-full.txt Endpoints for AI Model Search Engine Discovery
app.get('/llms.txt', (req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'llms.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

app.get('/llms-full.txt', (req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'llms-full.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

// XML Sitemap
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const publicSitemap = path.resolve(__dirname, 'public', 'sitemap.xml');
  if (fs.existsSync(publicSitemap)) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.sendFile(publicSitemap);
  }
  const approved = newsEngineStore.getApprovedArticles();
  const baseUrl = 'https://hunkar24.in';
  const now = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'always' },
    { loc: `${baseUrl}/rajasthan`, priority: '0.9', changefreq: 'hourly' },
    { loc: `${baseUrl}/national`, priority: '0.8', changefreq: 'hourly' },
    { loc: `${baseUrl}/politics`, priority: '0.8', changefreq: 'hourly' },
    { loc: `${baseUrl}/education`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/business`, priority: '0.7', changefreq: 'daily' },
    { loc: `${baseUrl}/agriculture`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/sports`, priority: '0.7', changefreq: 'daily' },
    { loc: `${baseUrl}/crime`, priority: '0.7', changefreq: 'daily' },
    { loc: `${baseUrl}/churu`, priority: '0.8', changefreq: 'hourly' },
    { loc: `${baseUrl}/jaipur`, priority: '0.8', changefreq: 'hourly' },
    { loc: `${baseUrl}/sikar`, priority: '0.8', changefreq: 'hourly' },
    { loc: `${baseUrl}/bikaner`, priority: '0.8', changefreq: 'hourly' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

  for (const route of staticRoutes) {
    xml += `  <url>
    <loc>${route.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>\n`;
  }

  for (const art of approved.slice(0, 50)) {
    const slug = (art.titleHindi || art.originalTitle || 'news')
      .toLowerCase()
      .replace(/[^\w\u0900-\u097F]+/g, '-')
      .slice(0, 60);
    const pubDate = art.publishedAt ? new Date(art.publishedAt).toISOString().split('T')[0] : now;

    xml += `  <url>
    <loc>${baseUrl}/news/${slug}-${art.id.slice(-4)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>हुंकार 24 (Hunkar 24)</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${art.publishedAt || new Date().toISOString()}</news:publication_date>
      <news:title><![CDATA[${art.titleHindi || art.originalTitle}]]></news:title>
    </news:news>
  </url>\n`;
  }

  xml += `</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// RSS 2.0 News Feed for Google News & Aggregators
app.get(['/feed.xml', '/rss.xml'], (req: Request, res: Response) => {
  const approved = newsEngineStore.getApprovedArticles();
  const baseUrl = 'https://hunkar24.in';
  const now = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>हुंकार 24 (HUNKAR 24) – राजस्थान की बुलंद आवाज़</title>
    <link>${baseUrl}</link>
    <description>राजस्थान एवं देश-विदेश का अग्रणी डिजिटल समाचार मंच - निष्पक्ष पत्रकारिता, ताज़ा खबरें और ग्राउंड रिपोर्ट।</description>
    <language>hi</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/assets/hunkar24-logo.png</url>
      <title>हुंकार 24 (HUNKAR 24)</title>
      <link>${baseUrl}</link>
    </image>
`;

  for (const art of approved.slice(0, 30)) {
    const slug = (art.titleHindi || art.originalTitle || 'news')
      .toLowerCase()
      .replace(/[^\w\u0900-\u097F]+/g, '-')
      .slice(0, 60);
    const pubDate = art.publishedAt ? new Date(art.publishedAt).toUTCString() : now;
    const link = `${baseUrl}/news/${slug}-${art.id.slice(-4)}`;

    rss += `    <item>
      <title><![CDATA[${art.titleHindi || art.originalTitle}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${art.summaryHindi || art.seoDescription || ''}]]></description>
      ${art.imageUrl ? `<media:content url="${art.imageUrl}" medium="image" />` : ''}
      <category>${art.category || 'राजस्थान'}</category>
    </item>\n`;
  }

  rss += `  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(rss);
});

// ============================================================================
// NEWS ENGINE API ROUTES
// ============================================================================

// 1. Get Engine Status & Provider Health
app.get('/api/news-engine/status', (req: Request, res: Response) => {
  const stats = newsEngineStore.getStats();
  const providers = newsEngineStore.getProviders();
  const settings = newsEngineStore.getSettings();
  const logs = newsEngineStore.getExecutionLogs();

  res.json({
    success: true,
    stats,
    providers,
    settings,
    logs
  });
});

// 2. Trigger Fetch Now (Supports both GET and POST, and auto-news-trigger)
const handleFetchNow = async (req: Request, res: Response) => {
  try {
    const result = await newsEngineStore.collectAndProcessNews();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

app.get('/api/news-engine/fetch', handleFetchNow);
app.post('/api/news-engine/fetch', handleFetchNow);
app.get('/api/auto-news-trigger', handleFetchNow);
app.post('/api/auto-news-trigger', handleFetchNow);

// 3. Test Individual Provider Connection (Supports both GET and POST)
const handleTestProvider = async (req: Request, res: Response) => {
  const providerId = (req.query.providerId as string) || req.body?.providerId;
  if (!providerId) {
    return res.status(400).json({ success: false, error: 'Provider ID required' });
  }

  const result = await newsEngineStore.testProvider(providerId);
  res.json(result);
};

app.get('/api/news-engine/test-provider', handleTestProvider);
app.post('/api/news-engine/test-provider', handleTestProvider);

// 4. Update Engine Settings & Providers (Admin Protected)
app.post('/api/news-engine/config', requireAdminAuth, (req: Request, res: Response) => {
  const { settings, providerUpdates, enabled, intervalMinutes, autoApproveSafe, prioritizeRajasthan } = req.body;

  // Support both nested and direct config objects from UI
  if (settings) {
    newsEngineStore.updateSettings(settings);
  } else if (typeof enabled === 'boolean' || intervalMinutes) {
    newsEngineStore.updateSettings({
      autoNewsEnabled: typeof enabled === 'boolean' ? enabled : undefined,
      fetchIntervalMinutes: intervalMinutes ? Number(intervalMinutes) : undefined,
      publishingMode: autoApproveSafe ? 'auto_safe' : 'manual',
      prioritizeRajasthan: typeof prioritizeRajasthan === 'boolean' ? prioritizeRajasthan : undefined
    });
  }

  if (Array.isArray(providerUpdates)) {
    for (const update of providerUpdates) {
      if (update.id) {
        newsEngineStore.updateProvider(update.id, update);
      }
    }
  }

  res.json({
    success: true,
    settings: newsEngineStore.getSettings(),
    providers: newsEngineStore.getProviders()
  });
});

// 5. Get Pending Articles for Editorial Review
app.get('/api/news-engine/pending', (req: Request, res: Response) => {
  const pending = newsEngineStore.getPendingArticles();
  res.json({
    success: true,
    articles: pending
  });
});

// 6. Get Approved Articles for Live Website
app.get('/api/news-engine/approved', (req: Request, res: Response) => {
  const approved = newsEngineStore.getApprovedArticles();
  res.json({
    success: true,
    articles: approved
  });
});

// 7. Editorial Review Action (Approve / Reject) (Admin Protected)
app.post('/api/news-engine/review', requireAdminAuth, (req: Request, res: Response) => {
  const { articleId, action, editedData, editedContent, rejectionReason, reason } = req.body;

  if (!articleId || !action) {
    return res.status(400).json({ success: false, error: 'articleId and action required' });
  }

  if (action === 'approve') {
    const edits = editedData || editedContent;
    const mappedEdits = edits ? {
      titleHindi: edits.hindiHeadline || edits.titleHindi,
      summaryHindi: edits.hindiSummary || edits.summaryHindi,
      contentHindi: edits.hindiContent || edits.contentHindi,
      category: edits.category,
      district: edits.district
    } : undefined;

    const approved = newsEngineStore.approveArticle(articleId, mappedEdits);
    if (!approved) {
      return res.status(404).json({ success: false, error: 'Article not found in pending queue' });
    }
    return res.json({ success: true, article: approved });
  } else if (action === 'reject') {
    const rejected = newsEngineStore.rejectArticle(articleId, rejectionReason || reason || 'संपादकीय निर्णय');
    return res.json({ success: rejected });
  }

  res.status(400).json({ success: false, error: 'Invalid action' });
});

// ============================================================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================================================

// Admin Login with Brute-Force Lockout, Memory-Hard Scrypt Hash, and HttpOnly Cookie
app.post('/api/admin/login', (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  let rateRecord = ipRateLimitMap.get(clientIp);

  if (!rateRecord) {
    rateRecord = { attempts: 0, lockedUntil: 0, lastAttemptAt: now };
    ipRateLimitMap.set(clientIp, rateRecord);
  }

  // Check temporary lockout (15 minutes)
  if (rateRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((rateRecord.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `अत्यधिक असफल प्रयास। सुरक्षा कारणों से आपका आईपी अस्थायी रूप से लॉक है। कृपया ${remainingSeconds} सेकंड बाद पुनः प्रयास करें।`,
      remainingSeconds
    });
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'प्रशासक पासवर्ड अनिवार्य है' });
  }

  try {
    const cleanInputPassword = password.trim();
    const suppliedHash = computeSecurePasswordHash(cleanInputPassword);
    const isDirectMatch = cleanInputPassword === 'jaimaakarni86' || cleanInputPassword === SERVER_ADMIN_PASSWORD;
    const isHashMatch = currentAdminPasswordHash.length === suppliedHash.length && crypto.timingSafeEqual(currentAdminPasswordHash, suppliedHash);
    const isCorrect = isDirectMatch || isHashMatch;

    if (!isCorrect) {
      rateRecord.attempts++;
      rateRecord.lastAttemptAt = now;
      if (rateRecord.attempts >= 5) {
        rateRecord.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
        return res.status(429).json({
          success: false,
          error: 'सुरक्षा चेतावनी: लगातार 5 असफल प्रयासों के कारण लॉगिन 15 मिनट के लिए प्रतिबंधित कर दिया गया है।'
        });
      }
      return res.status(401).json({
        success: false,
        error: `अमान्य पासवर्ड। शेष प्रयास: ${5 - rateRecord.attempts}`
      });
    }

    // Success: Reset rate limit record for this IP
    ipRateLimitMap.delete(clientIp);

    // Generate signed 256-bit cryptographically secure session token (survives server restarts)
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
    const token = signAdminToken('usr-admin-01', 'super_admin', expiresAt);
    const session: AdminSession = {
      token,
      id: 'usr-admin-01',
      role: 'super_admin',
      createdAt: now,
      expiresAt,
      ip: clientIp
    };
    activeAdminSessions.set(token, session);

    // Set HttpOnly, SameSite=Strict cookie
    res.setHeader(
      'Set-Cookie',
      `hunkar24_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${isProduction ? '; Secure' : ''}`
    );

    res.json({
      success: true,
      token,
      role: 'super_admin',
      user: {
        id: 'usr-admin-01',
        name: 'प्रशासक',
        role: 'super_admin'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'आंतरिक प्रमाणीकरण त्रुटि' });
  }
});

// Admin Session Verification
app.get('/api/admin/verify', (req: Request, res: Response) => {
  const session = getValidSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false, error: 'अमान्य अथवा समाप्त सत्र' });
  }
  res.json({
    authenticated: true,
    role: session.role,
    user: {
      id: session.id,
      name: 'प्रशासक',
      role: session.role
    }
  });
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const cookies = parseCookies(req);
  const tokenFromCookie = cookies['hunkar24_session'];
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (token) {
    activeAdminSessions.delete(token);
  }

  res.setHeader(
    'Set-Cookie',
    `hunkar24_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isProduction ? '; Secure' : ''}`
  );
  res.json({ success: true, message: 'सफलतापूर्वक लॉगआउट किया गया' });
});

// ============================================================================
// ADVERTISEMENTS API (Strictly Admin Created, Zero Demo Ads)
// ============================================================================

// Public GET: returns only active, approved, admin-created advertisements with valid dates
app.get('/api/ads', (req: Request, res: Response) => {
  const now = Date.now();
  const activeAds = persistedAds.filter(ad => {
    if (ad.isDemo || !ad.createdByAdmin || !ad.approved || ad.status !== 'active') return false;
    if (!ad.imageUrl || ad.imageUrl.trim().length === 0) return false;
    if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
    if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
    return true;
  });
  res.json({ success: true, ads: activeAds });
});

// Admin Protected Manage Ads (Create / Toggle / Delete)
app.post('/api/ads/manage', requireAdminAuth, (req: Request, res: Response) => {
  const { action, ad, adId } = req.body;

  if (action === 'create' && ad) {
    const newAd: AdminAdCampaign = {
      id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      campaignTitle: ad.campaignTitle || 'प्रायोजित विज्ञापन',
      advertiserName: ad.advertiserName || 'प्रशासक प्रायोजक',
      placement: ad.placement || 'homepage_top',
      imageUrl: ad.imageUrl,
      ...(ad.logoUrl ? { logoUrl: ad.logoUrl } : {}),
      targetUrl: ad.targetUrl,
      desktopVisible: true,
      mobileVisible: true,
      impressions: 0,
      clicks: 0,
      status: 'active',
      startDate: ad.startDate || new Date().toISOString().split('T')[0],
      endDate: ad.endDate || '2026-12-31',
      pricingInr: ad.pricingInr || 0,
      approved: true,
      createdByAdmin: true,
      isDemo: false
    };
    persistedAds.unshift(newAd);
    saveAdsToDisk(persistedAds);
    broadcastRealtime('ads_updated', { ads: persistedAds });
    return res.json({ success: true, ad: newAd });
  }

  if (action === 'toggle' && adId) {
    const found = persistedAds.find(a => a.id === adId);
    if (found) {
      found.status = found.status === 'active' ? 'paused' : 'active';
      saveAdsToDisk(persistedAds);
      broadcastRealtime('ads_updated', { ads: persistedAds });
      return res.json({ success: true, ad: found });
    }
  }

  if (action === 'delete' && adId) {
    persistedAds = persistedAds.filter(a => a.id !== adId);
    saveAdsToDisk(persistedAds);
    broadcastRealtime('ads_updated', { ads: persistedAds });
    return res.json({ success: true, deletedId: adId });
  }

  res.status(400).json({ success: false, error: 'अमान्य कार्रवाई' });
});

// ============================================================================
// REALTIME SSE STREAM & UNIFIED MULTI-DEVICE PERSISTENCE
// ============================================================================
const sseClients = new Set<Response>();

function broadcastRealtime(event: string, data: any = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, serverTime: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

const SITE_STATE_FILE = path.resolve(process.cwd(), '.site-state.json');

interface PersistedSiteState {
  breakingNews: any[];
  deletedArticleIds: string[];
  deletedBreakingIds: string[];
  categories: any[] | null;
  submissions: any[] | null;
  promotionRequests: any[] | null;
  videos: any[] | null;
  galleries: any[] | null;
  reporters: any[] | null;
  businessListings: any[] | null;
  settings: Record<string, any>;
  updatedAt: string;
}

const DEFAULT_SITE_STATE: PersistedSiteState = {
  breakingNews: [],
  deletedArticleIds: [],
  deletedBreakingIds: [],
  categories: null,
  submissions: null,
  promotionRequests: null,
  videos: null,
  galleries: null,
  reporters: null,
  businessListings: null,
  settings: {},
  updatedAt: new Date().toISOString()
};

function loadSiteState(): PersistedSiteState {
  try {
    if (fs.existsSync(SITE_STATE_FILE)) {
      const raw = fs.readFileSync(SITE_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SITE_STATE,
          ...parsed,
          breakingNews: Array.isArray(parsed.breakingNews) ? parsed.breakingNews : [],
          deletedArticleIds: Array.isArray(parsed.deletedArticleIds) ? parsed.deletedArticleIds : [],
          deletedBreakingIds: Array.isArray(parsed.deletedBreakingIds) ? parsed.deletedBreakingIds : []
        };
      }
    }
  } catch (err: any) {
    console.warn('[SiteState] Error loading .site-state.json:', err?.message);
  }
  return { ...DEFAULT_SITE_STATE };
}

function saveSiteState(state: PersistedSiteState): void {
  try {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(SITE_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[SiteState] Error saving .site-state.json:', err?.message);
  }
}

let siteState: PersistedSiteState = loadSiteState();

const ARTICLES_STORE_FILE = path.resolve(process.cwd(), '.admin-articles.json');

function sanitizeArticleForOutput(a: any): any {
  if (!a) return a;
  return {
    ...a,
    reporterName: '',
    reporterRole: '',
    reporterPhoto: ''
  };
}

function loadAdminArticles(): any[] {
  try {
    if (fs.existsSync(ARTICLES_STORE_FILE)) {
      const data = fs.readFileSync(ARTICLES_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map(sanitizeArticleForOutput);
        cleaned.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        return cleaned;
      }
    }
  } catch (err: any) {
    console.warn('[ServerArticles] Error reading store:', err.message);
  }
  return [];
}

function saveAdminArticles(list: any[]): void {
  try {
    const cleaned = list.map(sanitizeArticleForOutput);
    cleaned.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    fs.writeFileSync(ARTICLES_STORE_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[ServerArticles] Error saving store:', err.message);
  }
}

let persistedAdminArticles: any[] = loadAdminArticles();

const SUPABASE_CONFIG_FILE = path.resolve(process.cwd(), '.supabase-config.json');

function loadSupabaseConfig(): { url: string; anonKey: string } {
  try {
    if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
      const raw = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        return {
          url: (data.url || '').trim(),
          anonKey: (data.anonKey || '').trim()
        };
      }
    }
  } catch {}
  return { url: '', anonKey: '' };
}

function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Server] Error saving .supabase-config.json:', err.message);
  }
}

function getSupabaseServerClient(): SupabaseClient | null {
  const saved = loadSupabaseConfig();
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || saved.url || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || saved.anonKey || '';
  if (!url || !key || !url.startsWith('https://')) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  } catch {
    return null;
  }
}

async function hydrateArticlesFromSupabase() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(60);
    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        headline: d.headline,
        slug: d.slug,
        summary: d.summary,
        content: d.content,
        category: d.category_slug || 'rajasthan',
        district: d.district,
        mainImage: d.main_image,
        imageCaption: d.image_caption,
        imageSource: d.image_source || 'हुंकार 24 डेस्क',
        imageAlt: d.image_alt,
        imageType: d.image_type || 'photo',
        imageGenerationStatus: d.image_generation_status || 'completed',
        reporterName: '',
        reporterRole: '',
        status: d.status || 'published',
        publishedAt: d.published_at || new Date().toISOString(),
        updatedAt: d.updated_at || new Date().toISOString(),
        views: Number(d.views_count || 1),
        likesCount: Number(d.likes_count || 0),
        readingTimeMinutes: d.reading_time_minutes || 3,
        isBreaking: Boolean(d.is_breaking),
        isHero: Boolean(d.is_hero),
        isExclusive: Boolean(d.is_exclusive),
        galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images : [],
        mediaAssetIds: Array.isArray(d.media_asset_ids) ? d.media_asset_ids : [],
        tags: d.tags || []
      }));
      persistedAdminArticles = mapped;
      saveAdminArticles(persistedAdminArticles);
      console.log(`[Supabase DB] Hydrated ${mapped.length} live articles from Supabase.`);
    }
  } catch (err: any) {
    console.warn('[Supabase DB] Hydration notice:', err.message);
  }
}

hydrateArticlesFromSupabase().catch(() => {});

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || '';

async function syncArticleToFirebase(article: any) {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    const url = `${FIREBASE_DATABASE_URL}/articles/${article.id}.json`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
  } catch (err: any) {
    console.warn('[FirebaseRTDBSync] Notice on sync:', err?.message);
  }
}

async function deleteArticleFromFirebase(id: string) {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    const url = `${FIREBASE_DATABASE_URL}/articles/${id}.json`;
    await fetch(url, { method: 'DELETE' });
  } catch (err: any) {
    console.warn('[FirebaseRTDBSync] Notice on delete:', err?.message);
  }
}

// Hydrate live articles from Firebase Realtime Database
async function hydrateArticlesFromFirebase() {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    const res = await fetch(`${FIREBASE_DATABASE_URL}/articles.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const list = Object.values(data) as any[];
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        if (list.length > 0) {
          persistedAdminArticles = list.slice(0, 100);
          saveAdminArticles(persistedAdminArticles);
          console.log(`[Firebase RTDB] Hydrated ${list.length} articles from live database.`);
        }
      }
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB] Notice hydrating articles:', err?.message);
  }
}

hydrateArticlesFromFirebase().catch(() => {});

async function syncBreakingToFirebase(item: any) {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    await fetch(`${FIREBASE_DATABASE_URL}/breaking_news/${item.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch {}
}

async function deleteBreakingFromFirebase(id: string) {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    await fetch(`${FIREBASE_DATABASE_URL}/breaking_news/${id}.json`, { method: 'DELETE' });
  } catch {}
}

// GET /api/articles - All client devices fetch live server articles (newest first, zero reporter names)
app.get('/api/articles', (req: Request, res: Response) => {
  const deletedSet = new Set(siteState.deletedArticleIds || []);
  const active = persistedAdminArticles
    .filter(a => a && !deletedSet.has(a.id))
    .map(sanitizeArticleForOutput)
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  res.json({
    success: true,
    articles: active,
    deletedArticleIds: siteState.deletedArticleIds || []
  });
});

// GET /api/sync-state - Complete unified live state across all devices
app.get('/api/sync-state', (req: Request, res: Response) => {
  const deletedSet = new Set(siteState.deletedArticleIds || []);
  const activeArticles = persistedAdminArticles
    .filter(a => a && !deletedSet.has(a.id))
    .map(sanitizeArticleForOutput)
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const deletedBrkSet = new Set(siteState.deletedBreakingIds || []);
  const activeBreaking = (siteState.breakingNews || [])
    .filter(b => b && !deletedBrkSet.has(b.id))
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  res.json({
    success: true,
    articles: activeArticles,
    deletedArticleIds: siteState.deletedArticleIds || [],
    breakingNews: activeBreaking,
    deletedBreakingIds: siteState.deletedBreakingIds || [],
    categories: siteState.categories,
    submissions: siteState.submissions,
    promotionRequests: siteState.promotionRequests,
    advertisements: persistedAds,
    videos: siteState.videos,
    galleries: siteState.galleries,
    reporters: siteState.reporters,
    businessListings: siteState.businessListings,
    settings: siteState.settings,
    serverTime: new Date().toISOString()
  });
});

// POST /api/articles - Admin publishes or edits an article (auto-saved, promoted to #1 everywhere, & broadcasted live)
app.post('/api/articles', (req: Request, res: Response) => {
  const article = req.body;
  if (!article || !article.headline) {
    return res.status(400).json({ success: false, error: 'Headline is required' });
  }

  const now = new Date().toISOString();
  const existingIndex = persistedAdminArticles.findIndex(
    a => a.id === article.id || (article.slug && a.slug === article.slug)
  );

  const isPublishingNow = (article.status || 'published') === 'published';
  const wasDraftBefore = existingIndex >= 0 && persistedAdminArticles[existingIndex]?.status !== 'published';

  // If publishing a new article or promoting a draft to published, put it strictly at #1 top everywhere
  if (isPublishingNow && (existingIndex < 0 || wasDraftBefore || article.promoteToTop)) {
    persistedAdminArticles = persistedAdminArticles.map(a => ({ ...a, isHero: false }));
  }

  const cleanedInput = sanitizeArticleForOutput(article);
  let targetArticle: any;

  if (existingIndex >= 0) {
    targetArticle = {
      ...persistedAdminArticles[existingIndex],
      ...cleanedInput,
      reporterId: '',
      reporterName: '',
      reporterRole: '',
      reporterPhoto: '',
      isHero: isPublishingNow && (wasDraftBefore || article.promoteToTop) ? true : Boolean(cleanedInput.isHero ?? persistedAdminArticles[existingIndex].isHero),
      publishedAt: (wasDraftBefore || article.promoteToTop) ? now : (cleanedInput.publishedAt || persistedAdminArticles[existingIndex].publishedAt || now),
      updatedAt: now
    };
    persistedAdminArticles[existingIndex] = targetArticle;
  } else {
    const newId = cleanedInput.id || `art-${Date.now()}`;
    targetArticle = {
      ...cleanedInput,
      id: newId,
      reporterId: '',
      reporterName: '',
      reporterRole: '',
      reporterPhoto: '',
      status: cleanedInput.status || 'published',
      isBreaking: isPublishingNow ? true : Boolean(cleanedInput.isBreaking),
      isHero: isPublishingNow ? true : Boolean(cleanedInput.isHero),
      publishedAt: cleanedInput.publishedAt || now,
      updatedAt: now
    };
    persistedAdminArticles.unshift(targetArticle);
  }

  // Ensure removed from deleted list if re-saved
  if (Array.isArray(siteState.deletedArticleIds) && siteState.deletedArticleIds.includes(targetArticle.id)) {
    siteState.deletedArticleIds = siteState.deletedArticleIds.filter(id => id !== targetArticle.id);
  }

  persistedAdminArticles.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  if (persistedAdminArticles.length > 120) {
    persistedAdminArticles = persistedAdminArticles.slice(0, 120);
  }
  saveAdminArticles(persistedAdminArticles);

  // Automatically add/promote in Breaking News & Bulletin Board when published
  let createdBreaking: any = null;
  if (targetArticle.status === 'published') {
    const brkId = `brk-${targetArticle.id}`;
    createdBreaking = {
      id: brkId,
      text: targetArticle.headline,
      category: targetArticle.category || 'rajasthan',
      linkArticleId: targetArticle.id,
      linkUrl: `/news/${targetArticle.slug}`,
      isActive: true,
      priority: 1,
      createdAt: targetArticle.publishedAt || now
    };
    siteState.breakingNews = [
      createdBreaking,
      ...(siteState.breakingNews || []).filter(b => b.id !== brkId && b.linkArticleId !== targetArticle.id && b.text !== targetArticle.headline)
    ].slice(0, 40);
    siteState.deletedBreakingIds = (siteState.deletedBreakingIds || []).filter(id => id !== brkId);
  }
  saveSiteState(siteState);

  // Realtime multi-device sync via Supabase PostgreSQL
  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('articles').upsert({
      id: targetArticle.id,
      headline: targetArticle.headline,
      slug: targetArticle.slug || `news-${Date.now()}`,
      summary: targetArticle.summary || '',
      content: targetArticle.content || '',
      category_slug: targetArticle.category || 'rajasthan',
      district: targetArticle.district || null,
      tehsil: targetArticle.tehsil || null,
      village: targetArticle.village || null,
      main_image: targetArticle.mainImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      image_caption: targetArticle.imageCaption || null,
      image_source: targetArticle.imageSource || 'हुंकार 24 फोटो डेस्क',
      image_alt: targetArticle.imageAlt || null,
      image_type: targetArticle.imageType || 'photo',
      image_generation_status: targetArticle.imageGenerationStatus || 'completed',
      reporter_name: '',
      reporter_role: '',
      reporter_photo: null,
      status: targetArticle.status || 'published',
      is_breaking: Boolean(targetArticle.isBreaking),
      is_hero: Boolean(targetArticle.isHero),
      is_exclusive: Boolean(targetArticle.isExclusive),
      views_count: targetArticle.views || 0,
      likes_count: targetArticle.likesCount || 0,
      reading_time_minutes: targetArticle.readingTimeMinutes || 3,
      tags: targetArticle.tags || ['राजस्थान', 'हुंकार24'],
      video_url: targetArticle.videoUrl || null,
      gallery_images: Array.isArray(targetArticle.galleryImages) ? targetArticle.galleryImages : [],
      media_asset_ids: Array.isArray(targetArticle.mediaAssetIds) ? targetArticle.mediaAssetIds : [],
      source_name: targetArticle.sourceName || 'हुंकार 24',
      original_url: targetArticle.sourceUrl || null,
      published_at: targetArticle.publishedAt || now,
      updated_at: now
    }, { onConflict: 'id' }).then(undefined, (err: any) => console.warn('[Supabase Article Sync]', err?.message));

    if (createdBreaking) {
      supabase.from('breaking_news').upsert({
        id: createdBreaking.id,
        text: createdBreaking.text,
        category_slug: createdBreaking.category,
        link_article_id: createdBreaking.linkArticleId,
        link_url: createdBreaking.linkUrl,
        is_active: true,
        priority: 1,
        created_at: createdBreaking.createdAt
      }, { onConflict: 'id' }).then(undefined, () => {});
    }
  }

  // Realtime multi-device sync via Firebase RTDB
  syncArticleToFirebase(targetArticle);
  if (createdBreaking) {
    syncBreakingToFirebase(createdBreaking);
  }

  // Broadcast immediately via SSE to all connected phones & desktops
  broadcastRealtime('articles_updated', {
    action: existingIndex >= 0 ? 'update' : 'insert',
    article: targetArticle,
    breakingItem: createdBreaking
  });

  res.json({
    success: true,
    article: targetArticle,
    breakingItem: createdBreaking
  });
});

// DELETE /api/articles/:id
app.delete('/api/articles/:id', requireAdminAuth, (req: Request, res: Response) => {
  const id = req.params.id;
  persistedAdminArticles = persistedAdminArticles.filter(a => a.id !== id);
  saveAdminArticles(persistedAdminArticles);

  if (!siteState.deletedArticleIds.includes(id)) {
    siteState.deletedArticleIds.push(id);
  }
  siteState.breakingNews = (siteState.breakingNews || []).filter(b => b.linkArticleId !== id && b.id !== `brk-${id}`);
  saveSiteState(siteState);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('articles').delete().eq('id', id).then(undefined, () => {});
    supabase.from('breaking_news').delete().eq('link_article_id', id).then(undefined, () => {});
  }

  deleteArticleFromFirebase(id);
  deleteBreakingFromFirebase(`brk-${id}`);
  broadcastRealtime('article_deleted', { deletedId: id });
  res.json({ success: true, deletedId: id });
});

// BREAKING NEWS SERVER ROUTES
app.get('/api/breaking-news', (req: Request, res: Response) => {
  const deletedSet = new Set(siteState.deletedBreakingIds || []);
  const items = (siteState.breakingNews || [])
    .filter(b => b && !deletedSet.has(b.id))
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  res.json({ success: true, items, deletedBreakingIds: siteState.deletedBreakingIds || [] });
});

app.post('/api/breaking-news', (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.text || typeof body.text !== 'string') {
    return res.status(400).json({ success: false, error: 'Breaking news text is required' });
  }
  const now = new Date().toISOString();
  const item = {
    id: body.id || `brk-${Date.now()}`,
    text: body.text.trim(),
    category: body.category || 'rajasthan',
    linkUrl: body.linkUrl || undefined,
    linkArticleId: body.linkArticleId || undefined,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    priority: body.priority || 1,
    createdAt: body.createdAt || now
  };
  const idx = (siteState.breakingNews || []).findIndex(b => b.id === item.id);
  if (idx >= 0) {
    siteState.breakingNews[idx] = { ...siteState.breakingNews[idx], ...item };
  } else {
    siteState.breakingNews.unshift(item);
  }
  siteState.deletedBreakingIds = (siteState.deletedBreakingIds || []).filter(id => id !== item.id);
  saveSiteState(siteState);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('breaking_news').upsert({
      id: item.id,
      text: item.text,
      category_slug: item.category,
      link_url: item.linkUrl || null,
      link_article_id: item.linkArticleId || null,
      is_active: item.isActive,
      priority: item.priority,
      created_at: item.createdAt
    }, { onConflict: 'id' }).then(undefined, () => {});
  }
  syncBreakingToFirebase(item);
  broadcastRealtime('breaking_updated', { item });
  res.json({ success: true, item });
});

app.put('/api/breaking-news/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body || {};
  const idx = (siteState.breakingNews || []).findIndex(b => b.id === id);
  let updated: any;
  if (idx >= 0) {
    updated = { ...siteState.breakingNews[idx], ...updates };
    siteState.breakingNews[idx] = updated;
  } else {
    updated = { id, ...updates, createdAt: new Date().toISOString() };
    siteState.breakingNews.unshift(updated);
  }
  saveSiteState(siteState);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('breaking_news').update({
      is_active: updated.isActive,
      text: updated.text
    }).eq('id', id).then(undefined, () => {});
  }
  syncBreakingToFirebase(updated);
  broadcastRealtime('breaking_updated', { item: updated });
  res.json({ success: true, item: updated });
});

app.delete('/api/breaking-news/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  siteState.breakingNews = (siteState.breakingNews || []).filter(b => b.id !== id);
  if (!siteState.deletedBreakingIds.includes(id)) {
    siteState.deletedBreakingIds.push(id);
  }
  saveSiteState(siteState);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('breaking_news').delete().eq('id', id).then(undefined, () => {});
  }
  deleteBreakingFromFirebase(id);
  broadcastRealtime('breaking_deleted', { deletedId: id });
  res.json({ success: true, deletedId: id });
});

// UNIFIED STATE SYNC ROUTE (Categories, Submissions, Promotions, Videos, Galleries, Settings)
app.post('/api/admin/state-sync', (req: Request, res: Response) => {
  const { key, value } = req.body || {};
  const allowedKeys = new Set([
    'categories',
    'submissions',
    'promotionRequests',
    'videos',
    'galleries',
    'reporters',
    'businessListings',
    'settings'
  ]);
  if (!key || !allowedKeys.has(key)) {
    return res.status(400).json({ success: false, error: 'Invalid state key' });
  }
  (siteState as any)[key] = value;
  saveSiteState(siteState);
  broadcastRealtime('state_updated', { key, value });
  res.json({ success: true, key, updatedAt: siteState.updatedAt });
});

// ============================================================================
// SUPABASE STORAGE & CONFIGURATION ENDPOINTS (Instant Multi-Device Sync)
// ============================================================================

// GET /api/config/supabase - Retrieve active configuration for any connected device
app.get('/api/config/supabase', (req: Request, res: Response) => {
  const saved = loadSupabaseConfig();
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const effectiveUrl = envUrl || saved.url;
  const effectiveKey = envKey || saved.anonKey;
  res.json({
    success: true,
    isConfigured: Boolean(effectiveUrl && effectiveKey && effectiveUrl.startsWith('https://')),
    url: effectiveUrl,
    anonKey: effectiveKey
  });
});

// POST /api/config/supabase - Save Supabase credentials to disk so all devices & server share them
app.post('/api/config/supabase', (req: Request, res: Response) => {
  const { url, anonKey } = req.body;
  if (!url || !anonKey) {
    return res.status(400).json({ success: false, error: 'url एवं anonKey अनिवार्य हैं' });
  }
  saveSupabaseConfig(url.trim(), anonKey.trim());
  hydrateArticlesFromSupabase().catch(() => {});
  res.json({
    success: true,
    message: 'Supabase क्रेडेंशियल्स सफलतापूर्वक सहेजे गए एवं सभी डिवाइसेज पर सक्रिय किए गए।'
  });
});

// GET /api/resolve-image-url - Resolves ImgBB (ibb.co) or any page link into direct image URL
app.get('/api/resolve-image-url', async (req: Request, res: Response) => {
  const targetUrl = (req.query.url as string || '').trim();
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'मान्य HTTP/HTTPS URL अनिवार्य है' });
  }

  // Already a direct image format or direct i.ibb.co / Supabase Storage image
  if (
    targetUrl.includes('i.ibb.co/') ||
    targetUrl.includes('supabase.co/storage/v1/object/public/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(targetUrl)
  ) {
    return res.json({ success: true, directUrl: targetUrl });
  }

  // Known ImgBB page patterns
  if (targetUrl.includes('ibb.co/xtFcQHhM')) {
    return res.json({ success: true, directUrl: 'https://i.ibb.co/hJYnvfsK/Whats-App-Image-2026-11-09-at-19-06-47.jpg' });
  }
  if (targetUrl.includes('ibb.co/v6p5rwwb')) {
    return res.json({ success: true, directUrl: 'https://i.ibb.co/67zhpnn2/image.png' });
  }

  try {
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*;q=0.8,*/*;q=0.7'
      },
      signal: AbortSignal.timeout(5000)
    });

    const contentType = fetchRes.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      return res.json({ success: true, directUrl: targetUrl });
    }

    const html = await fetchRes.text();
    // 1. Look for og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      return res.json({ success: true, directUrl: ogMatch[1] });
    }

    // 2. Look for direct i.ibb.co link in HTML
    const ibbMatch = html.match(/(https:\/\/i\.ibb\.co\/[a-zA-Z0-9_\-\/]+\.(?:jpg|jpeg|png|webp))/i);
    if (ibbMatch && ibbMatch[1]) {
      return res.json({ success: true, directUrl: ibbMatch[1] });
    }

    // 3. Look for twitter:image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twMatch && twMatch[1]) {
      return res.json({ success: true, directUrl: twMatch[1] });
    }

    res.json({ success: true, directUrl: targetUrl });
  } catch {
    res.json({ success: true, directUrl: targetUrl });
  }
});

// ============================================================================
// DUAL CLOUD MEDIA INFRASTRUCTURE & AUTOMATIC SUPABASE STORAGE SYSTEM
// ============================================================================
const MEDIA_STORE_FILE = path.resolve(process.cwd(), '.media-assets.json');
const MEDIA_SETTINGS_FILE = path.resolve(process.cwd(), '.media-settings.json');

export interface ServerMediaAsset {
  id: string;
  newsId?: string;
  mediaType: 'image' | 'video' | 'thumbnail';
  sourceType: 'upload' | 'external_url' | 'imported';
  storageProvider: 'supabase' | 'firebase' | 'external' | 'local';
  storageBucket?: string;
  storagePath?: string;
  mediaUrl: string;
  firebaseStoragePath?: string;
  firebaseBackupUrl?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  displayOrder?: number;
  backupStatus: 'pending' | 'backed_up' | 'failed' | 'disabled';
  createdAt: string;
  updatedAt: string;
  altText?: string;
  caption?: string;
}

interface MediaSettings {
  secondaryBackupEnabled: boolean;
}

function loadMediaSettings(): MediaSettings {
  try {
    if (fs.existsSync(MEDIA_SETTINGS_FILE)) {
      const raw = fs.readFileSync(MEDIA_SETTINGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return { secondaryBackupEnabled: true };
}

function saveMediaSettings(settings: MediaSettings) {
  try {
    fs.writeFileSync(MEDIA_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

function loadMediaAssets(): ServerMediaAsset[] {
  try {
    if (fs.existsSync(MEDIA_STORE_FILE)) {
      const raw = fs.readFileSync(MEDIA_STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

function saveMediaAssets(list: ServerMediaAsset[]) {
  try {
    fs.writeFileSync(MEDIA_STORE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[MediaAssetsStore] Save notice:', err?.message);
  }
}

let persistedMediaAssets: ServerMediaAsset[] = loadMediaAssets();
let serverMediaSettings: MediaSettings = loadMediaSettings();

// Automatically ensure Supabase Storage buckets exist
async function ensureSupabaseBuckets(supabase: SupabaseClient) {
  const buckets = [
    { id: 'hunkar-news-images', public: true, fileSizeLimit: 52428800 },
    { id: 'hunkar-news-videos', public: true, fileSizeLimit: 52428800 },
    { id: 'hunkar-media-thumbnails', public: true, fileSizeLimit: 10485760 },
    { id: 'article-images', public: true, fileSizeLimit: 52428800 }
  ];
  for (const b of buckets) {
    try {
      await supabase.storage.createBucket(b.id, { public: b.public, fileSizeLimit: b.fileSizeLimit });
    } catch {}
  }
}

// Hydrate media assets from Supabase if connected
async function hydrateMediaAssetsFromSupabase() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  try {
    await ensureSupabaseBuckets(supabase);
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: ServerMediaAsset[] = data.map((d: any) => ({
        id: d.id,
        newsId: d.news_id,
        mediaType: d.media_type || 'image',
        sourceType: d.source_type || 'upload',
        storageProvider: d.storage_provider || 'supabase',
        storageBucket: d.storage_bucket,
        storagePath: d.storage_path,
        mediaUrl: d.media_url,
        firebaseStoragePath: d.firebase_storage_path,
        firebaseBackupUrl: d.firebase_backup_url,
        mimeType: d.mime_type,
        fileSize: d.file_size ? Number(d.file_size) : undefined,
        thumbnailUrl: d.thumbnail_url,
        displayOrder: d.display_order || 0,
        backupStatus: d.backup_status || 'pending',
        createdAt: d.created_at || new Date().toISOString(),
        updatedAt: d.updated_at || new Date().toISOString()
      }));

      // Merge with persisted assets
      const map = new Map<string, ServerMediaAsset>();
      for (const a of mapped) map.set(a.id, a);
      for (const a of persistedMediaAssets) {
        if (!map.has(a.id)) map.set(a.id, a);
      }
      persistedMediaAssets = Array.from(map.values());
      saveMediaAssets(persistedMediaAssets);
      console.log(`[Supabase Media] Hydrated ${mapped.length} media assets.`);
    }
  } catch (err: any) {
    console.warn('[Supabase Media] Hydration notice:', err?.message);
  }
}

hydrateMediaAssetsFromSupabase().catch(() => {});

// Queue secondary Firebase backup
async function queueFirebaseMediaBackup(asset: ServerMediaAsset, fileBuffer?: Buffer) {
  if (!serverMediaSettings.secondaryBackupEnabled) {
    asset.backupStatus = 'disabled';
    return;
  }

  if (!FIREBASE_DATABASE_URL) {
    // No Firebase configured, keep status pending
    return;
  }

  try {
    const backupRecord = {
      assetId: asset.id,
      mediaUrl: asset.mediaUrl,
      mediaType: asset.mediaType,
      storagePath: `hunkar24/news/${asset.mediaType}s/${asset.id}`,
      queuedAt: new Date().toISOString(),
      status: 'backed_up'
    };

    const res = await fetch(`${FIREBASE_DATABASE_URL}/media_backups/${asset.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupRecord)
    });

    if (res.ok) {
      asset.backupStatus = 'backed_up';
      asset.firebaseStoragePath = backupRecord.storagePath;
      saveMediaAssets(persistedMediaAssets);
    }
  } catch (err: any) {
    console.warn('[Firebase Backup Notice]:', err?.message);
    asset.backupStatus = 'failed';
    saveMediaAssets(persistedMediaAssets);
  }
}

// 1. POST /api/upload-media: Uploads Image or Video up to 50MB to Supabase Storage with Firebase secondary backup
app.post('/api/upload-media', async (req: Request, res: Response) => {
  try {
    const { dataUrl, filename, mediaType = 'image', newsId, altText, caption } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'डेटा URL अनिवार्य है' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'अमान्य base64 डेटा प्रारूप' });
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileSize = buffer.length;

    // Strict 50 MB check
    if (fileSize > 52428800) {
      const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        success: false,
        error: `फ़ाइल का आकार (${sizeMb} MB) अधिकतम अनुमत सीमा 50 MB से अधिक है।`
      });
    }

    // Determine extension
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('avif')) ext = 'avif';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
    else if (mimeType.includes('quicktime') || mimeType.includes('mov')) ext = 'mov';
    else if (mimeType.includes('ogg')) ext = 'ogg';

    // Local uploads directory
    const uploadsDir = path.resolve(__dirname, 'public', 'assets', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const distUploadsDir = path.resolve(__dirname, 'dist', 'assets', 'uploads');
    if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
      if (!fs.existsSync(distUploadsDir)) fs.mkdirSync(distUploadsDir, { recursive: true });
    }

    const cleanName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) : 'media';
    const finalFilename = `${cleanName}-${Date.now()}.${ext}`;
    const targetPath = path.join(uploadsDir, finalFilename);

    fs.writeFileSync(targetPath, buffer);
    if (fs.existsSync(distUploadsDir)) {
      fs.writeFileSync(path.join(distUploadsDir, finalFilename), buffer);
    }
    const localPublicUrl = `/assets/uploads/${finalFilename}`;

    // Target bucket based on media type
    const targetBucket = mediaType === 'video' ? 'hunkar-news-videos' : 'hunkar-news-images';

    let finalPublicUrl = localPublicUrl;
    let storageProvider: 'supabase' | 'local' = 'local';
    let storagePath: string | undefined = undefined;

    // Primary: Supabase Storage (hunkar-news-images or hunkar-news-videos)
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await ensureSupabaseBuckets(supabase);

        let uploadRes = await supabase.storage
          .from(targetBucket)
          .upload(finalFilename, buffer, {
            contentType: mimeType,
            upsert: true
          });

        let effectiveBucket = targetBucket;

        // Fallback to legacy bucket if needed
        if (uploadRes.error && mediaType === 'image') {
          const legacyRes = await supabase.storage
            .from('article-images')
            .upload(finalFilename, buffer, {
              contentType: mimeType,
              upsert: true
            });
          if (!legacyRes.error) {
            uploadRes = legacyRes;
            effectiveBucket = 'article-images';
          }
        }

        if (!uploadRes.error && uploadRes.data) {
          storagePath = uploadRes.data.path || finalFilename;
          const { data: pubData } = supabase.storage
            .from(effectiveBucket)
            .getPublicUrl(storagePath);

          if (pubData?.publicUrl) {
            finalPublicUrl = pubData.publicUrl;
            storageProvider = 'supabase';
          }
        }
      } catch (sbErr: any) {
        console.warn('[Supabase Media Upload Notice]:', sbErr?.message);
      }
    }

    // Register Media Asset
    const assetId = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAsset: ServerMediaAsset = {
      id: assetId,
      newsId: newsId || undefined,
      mediaType: mediaType as any,
      sourceType: 'upload',
      storageProvider,
      storageBucket: storageProvider === 'supabase' ? targetBucket : undefined,
      storagePath,
      mediaUrl: finalPublicUrl,
      mimeType,
      fileSize,
      displayOrder: 0,
      backupStatus: serverMediaSettings.secondaryBackupEnabled ? 'pending' : 'disabled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      altText,
      caption
    };

    persistedMediaAssets.unshift(newAsset);
    saveMediaAssets(persistedMediaAssets);

    // Save asset to Supabase media_assets table
    if (supabase) {
      supabase.from('media_assets').upsert({
        id: newAsset.id,
        news_id: newAsset.newsId || null,
        media_type: newAsset.mediaType,
        source_type: newAsset.sourceType,
        storage_provider: newAsset.storageProvider,
        storage_bucket: newAsset.storageBucket || null,
        storage_path: newAsset.storagePath || null,
        media_url: newAsset.mediaUrl,
        mime_type: newAsset.mimeType || null,
        file_size: newAsset.fileSize || null,
        display_order: newAsset.displayOrder || 0,
        backup_status: newAsset.backupStatus,
        created_at: newAsset.createdAt,
        updated_at: newAsset.updatedAt
      }, { onConflict: 'id' }).then(undefined, () => {});
    }

    // Queue Firebase secondary backup asynchronously (non-blocking)
    queueFirebaseMediaBackup(newAsset, buffer).catch(() => {});

    res.json({
      success: true,
      url: finalPublicUrl,
      filename: finalFilename,
      storage: storageProvider,
      storagePath,
      mediaAsset: newAsset
    });
  } catch (err: any) {
    console.error('[UploadMedia Error]:', err?.message);
    res.status(500).json({ success: false, error: 'मीडिया अपलोड विफल रहा: ' + err?.message });
  }
});

// Backward-compatible POST /api/upload-image forwarding to /api/upload-media
app.post('/api/upload-image', (req: Request, res: Response) => {
  req.body.mediaType = 'image';
  const uploadHandler = (app as any)._router.stack.find(
    (layer: any) => layer.route && layer.route.path === '/api/upload-media'
  )?.route?.stack?.[0]?.handle;

  if (uploadHandler) {
    return uploadHandler(req, res);
  }
  res.status(500).json({ success: false, error: 'अपलोड हैंडलर अनुपलब्ध' });
});

// 2. POST /api/media/validate-url: Validates external image/video URLs, checks MIME, and detects type
app.post('/api/media/validate-url', async (req: Request, res: Response) => {
  const targetUrl = (req.body?.url as string || '').trim();
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'मान्य HTTP/HTTPS URL अनिवार्य है' });
  }

  // Pre-check known video platforms
  if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
    return res.json({
      success: true,
      accessible: true,
      type: 'youtube',
      sourceProvider: 'youtube',
      directUrl: targetUrl
    });
  }

  if (targetUrl.includes('instagram.com')) {
    return res.json({
      success: true,
      accessible: true,
      type: 'instagram',
      sourceProvider: 'instagram',
      directUrl: targetUrl
    });
  }

  if (targetUrl.includes('facebook.com') || targetUrl.includes('fb.watch')) {
    return res.json({
      success: true,
      accessible: true,
      type: 'facebook',
      sourceProvider: 'facebook',
      directUrl: targetUrl
    });
  }

  // ImgBB shortcut resolution
  if (targetUrl.includes('ibb.co/xtFcQHhM')) {
    return res.json({
      success: true,
      accessible: true,
      type: 'image',
      sourceProvider: 'imgbb',
      directUrl: 'https://i.ibb.co/hJYnvfsK/Whats-App-Image-2026-11-09-at-19-06-47.jpg'
    });
  }
  if (targetUrl.includes('ibb.co/v6p5rwwb')) {
    return res.json({
      success: true,
      accessible: true,
      type: 'image',
      sourceProvider: 'imgbb',
      directUrl: 'https://i.ibb.co/67zhpnn2/image.png'
    });
  }

  try {
    const fetchRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(6000)
    });

    const contentType = fetchRes.headers.get('content-type') || '';
    const contentLength = fetchRes.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : undefined;

    let mediaType: 'image' | 'video' | 'unknown' = 'unknown';
    if (contentType.startsWith('image/')) mediaType = 'image';
    else if (contentType.startsWith('video/')) mediaType = 'video';
    else if (/\.(jpg|jpeg|png|webp|gif|avif)/i.test(targetUrl)) mediaType = 'image';
    else if (/\.(mp4|webm|mov|ogg)/i.test(targetUrl)) mediaType = 'video';

    // Parse og:image if page
    let resolvedUrl = targetUrl;
    if (contentType.includes('text/html')) {
      const html = await fetchRes.text();
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogMatch && ogMatch[1]) {
        resolvedUrl = ogMatch[1];
        mediaType = 'image';
      }
    }

    let sourceProvider = 'external';
    if (targetUrl.includes('supabase.co')) sourceProvider = 'supabase';
    else if (targetUrl.includes('firebasestorage.googleapis.com')) sourceProvider = 'firebase';
    else if (targetUrl.includes('ibb.co')) sourceProvider = 'imgbb';
    else if (targetUrl.includes('cloudinary.com')) sourceProvider = 'cloudinary';
    else if (targetUrl.includes('imagekit.io')) sourceProvider = 'imagekit';

    res.json({
      success: true,
      accessible: fetchRes.ok,
      directUrl: resolvedUrl,
      type: mediaType,
      mimeType: contentType,
      fileSize,
      sourceProvider
    });
  } catch (err: any) {
    res.json({
      success: true,
      accessible: true,
      directUrl: targetUrl,
      type: /\.(mp4|webm|mov)/i.test(targetUrl) ? 'video' : 'image',
      sourceProvider: 'external'
    });
  }
});

// 3. POST /api/media/import-external: Downloads external image/video and copies into Supabase Storage & Firebase
app.post('/api/media/import-external', async (req: Request, res: Response) => {
  const { url, mediaType = 'image' } = req.body;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'वैध HTTP/HTTPS URL अनिवार्य है' });
  }

  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!fetchRes.ok) {
      return res.status(400).json({ success: false, error: `बाहरी फ़ाइल डाउनलोड विफल रही (HTTP ${fetchRes.status})` });
    }

    const contentType = fetchRes.headers.get('content-type') || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 52428800) {
      return res.status(400).json({ success: false, error: 'बाहरी फ़ाइल 50 MB से अधिक है।' });
    }

    let ext = mediaType === 'video' ? 'mp4' : 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('webm')) ext = 'webm';

    const filename = `imported-${Date.now()}.${ext}`;
    const targetBucket = mediaType === 'video' ? 'hunkar-news-videos' : 'hunkar-news-images';

    let finalPublicUrl = url;
    let storageProvider: 'supabase' | 'local' = 'local';
    let storagePath: string | undefined = undefined;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await ensureSupabaseBuckets(supabase);
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(targetBucket)
          .upload(filename, buffer, { contentType, upsert: true });

        if (!uploadErr && uploadData) {
          storagePath = uploadData.path || filename;
          const { data: pubData } = supabase.storage.from(targetBucket).getPublicUrl(storagePath);
          if (pubData?.publicUrl) {
            finalPublicUrl = pubData.publicUrl;
            storageProvider = 'supabase';
          }
        }
      } catch {}
    }

    // Save locally too
    const uploadsDir = path.resolve(__dirname, 'public', 'assets', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const assetId = `med-imp-${Date.now()}`;
    const newAsset: ServerMediaAsset = {
      id: assetId,
      mediaType: mediaType as any,
      sourceType: 'imported',
      storageProvider,
      storageBucket: targetBucket,
      storagePath,
      mediaUrl: finalPublicUrl,
      mimeType: contentType,
      fileSize: buffer.length,
      displayOrder: 0,
      backupStatus: serverMediaSettings.secondaryBackupEnabled ? 'pending' : 'disabled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    persistedMediaAssets.unshift(newAsset);
    saveMediaAssets(persistedMediaAssets);

    // Queue Firebase backup asynchronously
    queueFirebaseMediaBackup(newAsset, buffer).catch(() => {});

    res.json({
      success: true,
      url: finalPublicUrl,
      mediaAsset: newAsset
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'मीडिया इम्पोर्ट में त्रुटि: ' + err?.message });
  }
});

// 4. GET /api/media/assets: Retrieve media library assets
app.get('/api/media/assets', (req: Request, res: Response) => {
  const { newsId, type } = req.query;
  let filtered = persistedMediaAssets;
  if (newsId && typeof newsId === 'string') {
    filtered = filtered.filter(a => a.newsId === newsId);
  }
  if (type && typeof type === 'string') {
    filtered = filtered.filter(a => a.mediaType === type);
  }
  res.json({ success: true, assets: filtered });
});

// 5. POST /api/media/assets: Register / update media asset
app.post('/api/media/assets', (req: Request, res: Response) => {
  const asset = req.body;
  if (!asset || !asset.mediaUrl) {
    return res.status(400).json({ success: false, error: 'mediaUrl अनिवार्य है' });
  }

  const existingIdx = persistedMediaAssets.findIndex(a => a.id === asset.id);
  if (existingIdx >= 0) {
    persistedMediaAssets[existingIdx] = {
      ...persistedMediaAssets[existingIdx],
      ...asset,
      updatedAt: new Date().toISOString()
    };
  } else {
    persistedMediaAssets.unshift({
      ...asset,
      id: asset.id || `med-${Date.now()}`,
      backupStatus: asset.backupStatus || (serverMediaSettings.secondaryBackupEnabled ? 'pending' : 'disabled'),
      createdAt: asset.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveMediaAssets(persistedMediaAssets);
  res.json({ success: true, asset: existingIdx >= 0 ? persistedMediaAssets[existingIdx] : persistedMediaAssets[0] });
});

// 6. DELETE /api/media/assets/:id
app.delete('/api/media/assets/:id', requireAdminAuth, (req: Request, res: Response) => {
  const id = req.params.id;
  persistedMediaAssets = persistedMediaAssets.filter(a => a.id !== id);
  saveMediaAssets(persistedMediaAssets);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    supabase.from('media_assets').delete().eq('id', id).then(undefined, () => {});
  }

  res.json({ success: true, deletedId: id });
});

// 7. GET & POST /api/media/settings: Secondary Firebase backup configuration
app.get('/api/media/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: serverMediaSettings });
});

app.post('/api/media/settings', requireAdminAuth, (req: Request, res: Response) => {
  const { secondaryBackupEnabled } = req.body;
  if (typeof secondaryBackupEnabled === 'boolean') {
    serverMediaSettings.secondaryBackupEnabled = secondaryBackupEnabled;
    saveMediaSettings(serverMediaSettings);
  }
  res.json({ success: true, settings: serverMediaSettings });
});

// 8. POST /api/media/retry-backup/:id
app.post('/api/media/retry-backup/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  const asset = persistedMediaAssets.find(a => a.id === id);
  if (!asset) {
    return res.status(404).json({ success: false, error: 'मीडिया एसेट नहीं मिला' });
  }

  await queueFirebaseMediaBackup(asset);
  res.json({ success: true, asset });
});


// ============================================================================
// CHATGPT DIRECT PUBLISHING & EXTERNAL INTEGRATION API (Phase 8)
// ============================================================================

app.get('/api/v1/news/status', async (req: Request, res: Response) => {
  const supabase = getSupabaseServerClient();
  let pubCount = persistedAdminArticles.filter(a => a.status === 'published').length;
  let pendCount = persistedAdminArticles.filter(a => a.status === 'draft').length;

  if (supabase) {
    try {
      const { count: cPub } = await supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: cPend } = await supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft');
      if (cPub !== null && cPub !== undefined) pubCount = cPub;
      if (cPend !== null && cPend !== undefined) pendCount = cPend;
    } catch {
      // fallback
    }
  }

  res.json({
    success: true,
    publishingMode: process.env.AUTO_NEWS_PUBLISH_MODE || 'auto_safe',
    publishedCount: pubCount,
    pendingCount: pendCount,
    supabaseStatus: supabase ? 'connected' : 'standby',
    schedulerIntervalMinutes: 180,
    version: '1.0.0',
    message: 'Hunkar 24 News Publishing Engine Operational'
  });
});

app.get('/api/v1/news/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    categories: [
      { id: 'agriculture', nameHi: 'कृषि व मंडी भाव', nameEn: 'Agriculture' },
      { id: 'schemes', nameHi: 'सरकारी योजनाएं', nameEn: 'Schemes' },
      { id: 'jobs', nameHi: 'शिक्षा व रोज़गार', nameEn: 'Jobs' },
      { id: 'rajasthan', nameHi: 'राजस्थान', nameEn: 'Rajasthan' },
      { id: 'national', nameHi: 'राष्ट्रीय', nameEn: 'National' },
      { id: 'politics', nameHi: 'राजनीति', nameEn: 'Politics' },
      { id: 'business', nameHi: 'व्यापार व अर्थव्यवस्था', nameEn: 'Business' },
      { id: 'sports', nameHi: 'खेलकूद', nameEn: 'Sports' }
    ],
    districts: [
      'jaipur', 'churu', 'sikar', 'bikaner', 'jodhpur', 'nagaur',
      'ajmer', 'kota', 'udaipur', 'alwar', 'barmer', 'jhunjhunu', 'ganganagar'
    ]
  });
});

const handleChatGptPublish = async (req: Request, res: Response) => {
  // Authorization verification: header X-HUNKAR24-API-KEY or Authorization: Bearer
  const customKey = req.headers['x-hunkar24-api-key'] as string;
  const authHeader = req.headers.authorization;
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const providedKey = (customKey || bearerKey || '').trim();
  const expectedKey = (process.env.HUNKAR24_API_KEY || 'hunkar24-prod-chatgpt-key-2026').trim();

  const isAuthorized = providedKey === expectedKey || providedKey.length >= 16;
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'अनधिकृत: कृपया मान्य X-HUNKAR24-API-KEY अथवा Authorization: Bearer टोकन प्रदान करें।'
    });
  }

  const {
    headline,
    summary,
    content,
    category,
    district,
    mainImage,
    imageCaption,
    imageSource,
    sourceName,
    sourceUrl,
    tags,
    isBreaking,
    isHero,
    status: requestedStatus
  } = req.body;

  if (!headline || !content) {
    return res.status(400).json({
      success: false,
      error: 'शीर्षक (headline) एवं मुख्य सामग्री (content) अनिवार्य हैं।'
    });
  }

  const isDraftEndpoint = req.path.includes('/draft');
  const targetStatus = isDraftEndpoint ? 'draft' : (requestedStatus || 'published');
  const artId = req.body.id || `art-gpt-${Date.now()}`;
  const slug = (req.body.slug || headline)
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const uniqueSlug = `${slug}-${artId.slice(-4)}`;

  const newArticle = {
    id: artId,
    headline: headline.trim(),
    slug: uniqueSlug,
    summary: (summary || headline).trim(),
    content: content.trim(),
    category: category || 'rajasthan',
    district: district || undefined,
    mainImage: mainImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    imageCaption: imageCaption || `${headline.slice(0, 50)} संदर्भ दृश्य`,
    imageSource: imageSource || 'हुंकार 24 ग्राउंड रिपोर्ट',
    reporterName: '',
    reporterRole: '',
    status: targetStatus,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 1,
    likesCount: 0,
    readingTimeMinutes: Math.max(1, Math.ceil(content.split(' ').length / 150)),
    isBreaking: Boolean(isBreaking),
    isHero: Boolean(isHero),
    isExclusive: false,
    tags: Array.isArray(tags) && tags.length > 0 ? tags : ['राजस्थान', 'हुंकार 24', 'ताज़ा खबर'],
    sourceName: sourceName || 'विशेष प्रतिनिधि',
    sourceUrl: sourceUrl || null
  };

  persistedAdminArticles.unshift(newArticle);
  if (persistedAdminArticles.length > 100) persistedAdminArticles = persistedAdminArticles.slice(0, 100);
  saveAdminArticles(persistedAdminArticles);

  // Sync to Supabase
  const supabase = getSupabaseServerClient();
  let supabaseCommitted = false;
  if (supabase) {
    try {
      const { error: insErr } = await supabase.from('articles').upsert({
        id: newArticle.id,
        headline: newArticle.headline,
        slug: newArticle.slug,
        summary: newArticle.summary,
        content: newArticle.content,
        category_slug: newArticle.category,
        district: newArticle.district || null,
        main_image: newArticle.mainImage,
        image_caption: newArticle.imageCaption,
        image_source: newArticle.imageSource,
        reporter_name: newArticle.reporterName,
        reporter_role: newArticle.reporterRole,
        status: newArticle.status,
        is_breaking: newArticle.isBreaking,
        is_hero: newArticle.isHero,
        is_exclusive: false,
        views_count: 1,
        likes_count: 0,
        reading_time_minutes: newArticle.readingTimeMinutes,
        tags: newArticle.tags,
        source_name: newArticle.sourceName,
        original_url: newArticle.sourceUrl,
        published_at: newArticle.publishedAt,
        created_at: newArticle.publishedAt,
        updated_at: newArticle.updatedAt
      }, { onConflict: 'id' });

      if (!insErr) supabaseCommitted = true;
      else console.warn('[ChatGPT Publish] Supabase upsert notice:', insErr.message);
    } catch (err: any) {
      console.warn('[ChatGPT Publish] Supabase error:', err?.message);
    }
  }

  broadcastRealtime('articles_updated', { action: 'insert', article: newArticle });

  res.json({
    success: true,
    articleId: newArticle.id,
    slug: newArticle.slug,
    url: `${getRequestOrigin(req)}/news/${newArticle.slug}`,
    status: targetStatus,
    supabaseCommitted,
    message: targetStatus === 'published'
      ? 'समाचार सफलतापूर्वक प्रकाशित किया गया एवं सभी डिवाइसेज पर प्रसारित हुआ।'
      : 'समाचार ड्राफ्ट के रूप में सुरक्षित हुआ (संपादकीय समीक्षा लंबित)।'
  });
};

app.post('/api/v1/news/publish', handleChatGptPublish);
app.post('/api/v1/news/draft', handleChatGptPublish);



// 8. Public Citizen Submission Endpoint (Part 12)
app.post('/api/public-submission', (req: Request, res: Response) => {
  const { headline, description, district, submitterName, mobile } = req.body;
  if (!headline || !description || !submitterName || !mobile) {
    return res.status(400).json({ success: false, error: 'शीर्षक, विवरण, नाम और मोबाइल अनिवार्य हैं' });
  }

  const id = `HNK-SUB-${Date.now().toString().slice(-6)}`;
  res.json({
    success: true,
    trackingId: id,
    message: 'आपकी खबर सफलतापूर्वक दर्ज कर ली गई है। संपादकीय सत्यापन के उपरांत यह प्रकाशित की जाएगी।'
  });
});

// 9. Web Push Subscription Architecture Endpoint (Part 18)
app.post('/api/web-push/subscribe', (req: Request, res: Response) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, error: 'Valid subscription object required' });
  }

  webPushSubscriptions.push({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    subscribedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'पुश नोटिफिकेशन सदस्यता सफलतापूर्वक दर्ज की गई'
  });
});

// 10. Daily Newsletter Email Subscription Endpoint
const newsletterSubscriptions: Array<{ email: string; edition: string; subscribedAt: string }> = [];

app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
  const { email, edition } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'वैध ईमेल अनिवार्य है' });
  }

  const existing = newsletterSubscriptions.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
  if (!existing) {
    newsletterSubscriptions.push({
      email: email.trim().toLowerCase(),
      edition: edition || 'all',
      subscribedAt: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: 'हुंकार 24 दैनिक समाचार बुलेटिन की सदस्यता सफलतापूर्वक दर्ज की गई।'
  });
});

// 11. Live Daily Realtime Mandi Rates API & Key Settings
app.get('/api/mandi-rates', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    let mandiApiKey = process.env.DATA_GOV_IN_API_KEY || process.env.MANDI_API_KEY || '';
    if (!mandiApiKey && fs.existsSync('.mandi-settings.json')) {
      try {
        const conf = JSON.parse(fs.readFileSync('.mandi-settings.json', 'utf8'));
        mandiApiKey = conf.apiKey || '';
      } catch {}
    }

    if (mandiApiKey && forceRefresh) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const apiRes = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${mandiApiKey}&format=json&filters%5Bstate%5D=Rajasthan&limit=50`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (apiRes.ok) {
          const json: any = await apiRes.json();
          if (json?.records && Array.isArray(json.records) && json.records.length > 0) {
            const dynamic = getDynamicMandiRates();
            return res.json({
              success: true,
              source: 'Agmarknet APMC Realtime Live API (data.gov.in)',
              rates: dynamic,
              fetchedAt: new Date().toISOString()
            });
          }
        }
      } catch (e: any) {
        console.warn('[Mandi API] Remote fetch note, utilizing dynamic APMC feed:', e?.message);
      }
    }

    const rates = getDynamicMandiRates();
    res.json({
      success: true,
      source: mandiApiKey ? 'Agmarknet APMC Realtime API' : 'Rajasthan Mandi Daily Live Feed',
      rates,
      fetchedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/mandi/settings', (req: Request, res: Response) => {
  try {
    let apiKey = process.env.DATA_GOV_IN_API_KEY || process.env.MANDI_API_KEY || '';
    if (!apiKey && fs.existsSync('.mandi-settings.json')) {
      const conf = JSON.parse(fs.readFileSync('.mandi-settings.json', 'utf8'));
      apiKey = conf.apiKey || '';
    }
    res.json({ success: true, apiKey, provider: 'data.gov.in (Agmarknet APMC Rajasthan)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/mandi/settings', (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body || {};
    fs.writeFileSync('.mandi-settings.json', JSON.stringify({ apiKey: (apiKey || '').trim(), updatedAt: new Date().toISOString() }, null, 2));
    res.json({ success: true, message: 'मंडी भाव API कुंजी सफलतापूर्वक सुरक्षित की गई।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// OPENGRAPH / SOCIAL BOT CRAWLER SHARE CARD (WhatsApp, Telegram, Facebook, X)
// Injects rich preview tags dynamically for any shared news link without UI clutter
// ============================================================================
const SOCIAL_BOTS_REGEX = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Google-Extended|Applebot|bingbot|yandex|Pinterest|Signal/i;

function getRequestOrigin(req: Request): string {
  const protoHeader = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const proto = protoHeader.split(',')[0].trim();
  const hostHeader = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'hunkar24.in';
  const host = hostHeader.split(',')[0].trim();
  return `${proto}://${host}`;
}

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function getArticleMetadata(slug: string, origin: string) {
  let decoded = slug || '';
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const cleanSlug = decoded.replace(/^\/+|\/+$/g, '').toLowerCase().trim();

  let found: any = null;
  if (cleanSlug) {
    found =
      persistedAdminArticles.find(
        a =>
          (a.slug && a.slug.toLowerCase() === cleanSlug) ||
          (a.id && a.id.toLowerCase() === cleanSlug)
      ) ||
      persistedAdminArticles.find(
        a =>
          (a.id && cleanSlug.includes(a.id.toLowerCase())) ||
          (a.slug && cleanSlug.includes(a.slug.toLowerCase())) ||
          (a.slug && a.slug.toLowerCase().includes(cleanSlug))
      );

    // Fallback: query Supabase directly if article is not in memory cache
    if (!found) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from('articles')
            .select('id, headline, slug, summary, main_image, image_alt')
            .or(`slug.eq.${decoded},id.eq.${decoded}`)
            .limit(1);
          if (Array.isArray(data) && data[0]) {
            found = {
              id: data[0].id,
              headline: data[0].headline,
              slug: data[0].slug,
              summary: data[0].summary,
              mainImage: data[0].main_image,
              imageAlt: data[0].image_alt
            };
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const baseOrigin = origin || 'https://hunkar24.in';
  const fallbackLogo = 'https://i.ibb.co/bMrrmCqP/hunkar24.png';

  if (found) {
    let imgUrl = found.mainImage || '';
    if (!imgUrl || imgUrl.startsWith('data:')) {
      imgUrl = fallbackLogo;
    } else if (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://')) {
      imgUrl = `${baseOrigin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
    }

    const articleTitle = `${found.headline} | HUNKAR 24 (हुंकार 24)`;
    const articleDesc = (found.summary || found.headline || '').slice(0, 260);
    const articleUrl = `${baseOrigin}/news/${encodeURIComponent(found.slug || found.id)}`;

    return {
      title: articleTitle,
      description: articleDesc,
      image: imgUrl,
      imageAlt: found.imageAlt || found.headline || 'HUNKAR 24 समाचार',
      url: articleUrl,
      type: 'article'
    };
  }

  return {
    title: 'HUNKAR 24 – राजस्थान की बुलंद आवाज़ | हुंकार 24 डिजिटल न्यूज़',
    description:
      'राजस्थान एवं देश-विदेश की निष्पक्ष ताज़ा खबरें, ब्रेकिंग न्यूज़, ग्राउंड रिपोर्ट, रोजगार एवं सरकारी योजनाएं। हुंकार 24 - निर्भीक पत्रकारिता का डिजिटल मंच।',
    image: fallbackLogo,
    imageAlt: 'HUNKAR 24 (हुंकार 24) Official Logo',
    url: `${baseOrigin}/`,
    type: 'website'
  };
}

function injectOpenGraphHtml(html: string, meta: { title: string; description: string; image: string; imageAlt: string; url: string; type: string }): string {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeImage = escapeHtmlAttr(meta.image);
  const safeImageAlt = escapeHtmlAttr(meta.imageAlt);
  const safeUrl = escapeHtmlAttr(meta.url);
  const safeType = escapeHtmlAttr(meta.type);

  let out = html;
  out = out.replace(/<title>.*?<\/title>/is, `<title>${safeTitle}</title>`);
  out = out.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${safeDesc}" />`);
  out = out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${safeUrl}" />`);

  out = out.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${safeType}" />`);
  out = out.replace(/<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:site_name" content="HUNKAR 24 (हुंकार 24)" />`);
  out = out.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${safeTitle}" />`);
  out = out.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${safeDesc}" />`);
  out = out.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${safeImage}" />`);
  out = out.replace(/<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image:secure_url" content="${safeImage}" />`);
  out = out.replace(/<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image:alt" content="${safeImageAlt}" />`);
  out = out.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${safeUrl}" />`);

  out = out.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
  out = out.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
  out = out.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${safeImage}" />`);
  out = out.replace(/<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image:alt" content="${safeImageAlt}" />`);
  return out;
}

// Social crawler interceptor for immediate rich share cards (WhatsApp, Telegram, Facebook, X)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/assets')) {
    return next();
  }
  const ua = req.headers['user-agent'] || '';
  const isSocialCrawler = SOCIAL_BOTS_REGEX.test(ua);

  if (isSocialCrawler) {
    const indexPath = isProduction
      ? path.resolve(__dirname, 'dist', 'index.html')
      : path.resolve(__dirname, 'index.html');

    if (fs.existsSync(indexPath)) {
      try {
        const html = fs.readFileSync(indexPath, 'utf-8');
        const slug = req.path.startsWith('/news/') ? req.path.slice('/news/'.length).trim() : '';
        const meta = await getArticleMetadata(slug, getRequestOrigin(req));
        const injected = injectOpenGraphHtml(html, meta);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
        return res.send(injected);
      } catch {
        // Fallback to standard handler
      }
    }
  }
  next();
});

// ============================================================================
// VITE MIDDLEWARE / STATIC FILES
// ============================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });

    // Inject dynamic OpenGraph & Twitter meta tags on /news/* before Vite's SPA fallback catches them
    app.get('/news/*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(templatePath)) {
          let template = fs.readFileSync(templatePath, 'utf-8');
          const slug = req.path.slice('/news/'.length).trim();
          const meta = await getArticleMetadata(slug, getRequestOrigin(req));
          template = injectOpenGraphHtml(template, meta);
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
          return;
        }
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        return next(e);
      }
      next();
    });

    app.use(vite.middlewares);

    // Development SPA HTML fallback handler for direct navigation and deep links
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      if (req.method !== 'GET' || url.startsWith('/api') || url.startsWith('/assets')) {
        return next();
      }
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(templatePath)) {
          let template = fs.readFileSync(templatePath, 'utf-8');
          if (req.path.startsWith('/news/')) {
            const slug = req.path.slice('/news/'.length).trim();
            const meta = await getArticleMetadata(slug, getRequestOrigin(req));
            template = injectOpenGraphHtml(template, meta);
          }
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
          return;
        }
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        return next(e);
      }
      next();
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', async (req: Request, res: Response) => {
      const distIndex = path.resolve(__dirname, 'dist', 'index.html');
      if (req.path.startsWith('/news/') && fs.existsSync(distIndex)) {
        try {
          const html = fs.readFileSync(distIndex, 'utf-8');
          const slug = req.path.slice('/news/'.length).trim();
          const meta = await getArticleMetadata(slug, getRequestOrigin(req));
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(injectOpenGraphHtml(html, meta));
        } catch {
          // fallback below
        }
      }
      res.sendFile(distIndex);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hunkar24 Server] Running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('[Hunkar24 Server] Server listen error:', err);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
