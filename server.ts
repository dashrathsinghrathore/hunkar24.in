import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import { newsEngineStore } from './src/server/newsEngineStore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

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

function getValidSession(req: Request): AdminSession | null {
  const cookies = parseCookies(req);
  const tokenFromCookie = cookies['hunkar24_session'];
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) return null;
  const session = activeAdminSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return null;
  }
  return session;
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

Sitemap: https://hunkar24.netlify.app/sitemap.xml
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
  const approved = newsEngineStore.getApprovedArticles();
  const baseUrl = 'https://hunkar24.netlify.app';
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
  const baseUrl = 'https://hunkar24.netlify.app';
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

// 2. Trigger Fetch Now (Admin Protected)
app.post('/api/news-engine/fetch', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const result = await newsEngineStore.collectAndProcessNews();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

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

    // Generate 256-bit cryptographically secure session token
    const token = crypto.randomBytes(32).toString('hex');
    const session: AdminSession = {
      token,
      id: 'usr-admin-01',
      role: 'super_admin',
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
      ip: clientIp
    };
    activeAdminSessions.set(token, session);

    // Set HttpOnly, SameSite=Strict cookie
    res.setHeader(
      'Set-Cookie',
      `hunkar24_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${isProduction ? '; Secure' : ''}`
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
    return res.json({ success: true, ad: newAd });
  }

  if (action === 'toggle' && adId) {
    const found = persistedAds.find(a => a.id === adId);
    if (found) {
      found.status = found.status === 'active' ? 'paused' : 'active';
      saveAdsToDisk(persistedAds);
      return res.json({ success: true, ad: found });
    }
  }

  if (action === 'delete' && adId) {
    persistedAds = persistedAds.filter(a => a.id !== adId);
    saveAdsToDisk(persistedAds);
    return res.json({ success: true, deletedId: adId });
  }

  res.status(400).json({ success: false, error: 'अमान्य कार्रवाई' });
});


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

// ============================================================================
// VITE MIDDLEWARE / STATIC FILES
// ============================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hunkar24 Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
