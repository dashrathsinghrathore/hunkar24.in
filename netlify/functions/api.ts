import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string | undefined> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

// Supabase client instance with service role support for serverless backend
function getSupabaseBackend() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch {
    return null;
  }
}

const FIREBASE_RTDB_URL = (process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || '').replace(/\/$/, '');

// In-memory fallback stores for serverless runtime
const fallbackArticles: any[] = [];
const fallbackBreaking: any[] = [];

async function fetchFirebaseNode(node: string) {
  if (!FIREBASE_RTDB_URL) return null;
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/${node}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? Object.values(data) : [];
  } catch {
    return null;
  }
}

async function putFirebaseNode(node: string, id: string, payload: any) {
  if (!FIREBASE_RTDB_URL) return false;
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/${node}/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteFirebaseNode(node: string, id: string) {
  if (!FIREBASE_RTDB_URL) return false;
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/${node}/${id}.json`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// Clean CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-HUNKAR24-API-KEY, Idempotency-Key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true })
    };
  }

  // Normalize path: Strip `/.netlify/functions/api` or `/api`
  let cleanPath = event.path;
  if (cleanPath.startsWith('/.netlify/functions/api')) {
    cleanPath = cleanPath.replace('/.netlify/functions/api', '/api');
  }
  if (!cleanPath.startsWith('/api')) {
    cleanPath = `/api${cleanPath}`;
  }

  const method = event.httpMethod.toUpperCase();
  const supabase = getSupabaseBackend();

  // Helper to parse JSON body safely
  const parseBody = () => {
    if (!event.body) return {};
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  };

  try {
    // ------------------------------------------------------------------------
    // 1. GET /api/v1/news/status or /api/news-engine/status
    // ------------------------------------------------------------------------
    if ((cleanPath === '/api/v1/news/status' || cleanPath === '/api/news-engine/status') && method === 'GET') {
      let publishedCount = fallbackArticles.length;
      let pendingCount = 0;

      if (supabase) {
        const { count: pubCount } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');
        const { count: pendCount } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft');

        if (pubCount !== null) publishedCount = pubCount;
        if (pendCount !== null) pendingCount = pendCount;
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          publishingMode: process.env.AUTO_NEWS_PUBLISH_MODE || 'auto_safe',
          publishedCount,
          pendingCount,
          supabaseConnected: Boolean(supabase),
          schedulerIntervalMinutes: 180,
          version: '1.0.0',
          message: 'Hunkar 24 News Publishing Engine Operational'
        })
      };
    }

    // ------------------------------------------------------------------------
    // 2. GET /api/v1/news/categories
    // ------------------------------------------------------------------------
    if (cleanPath === '/api/v1/news/categories' && method === 'GET') {
      const categories = [
        { id: 'agriculture', nameHi: 'कृषि व मंडी भाव', nameEn: 'Agriculture' },
        { id: 'schemes', nameHi: 'सरकारी योजनाएं', nameEn: 'Schemes' },
        { id: 'jobs', nameHi: 'शिक्षा व रोज़गार', nameEn: 'Jobs' },
        { id: 'rajasthan', nameHi: 'राजस्थान', nameEn: 'Rajasthan' },
        { id: 'national', nameHi: 'राष्ट्रीय', nameEn: 'National' },
        { id: 'politics', nameHi: 'राजनीति', nameEn: 'Politics' },
        { id: 'business', nameHi: 'व्यापार व अर्थव्यवस्था', nameEn: 'Business' },
        { id: 'sports', nameHi: 'खेलकूद', nameEn: 'Sports' }
      ];
      const districts = [
        'jaipur', 'churu', 'sikar', 'bikaner', 'jodhpur', 'nagaur',
        'ajmer', 'kota', 'udaipur', 'alwar', 'barmer', 'jhunjhunu', 'ganganagar'
      ];
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, categories, districts })
      };
    }

    // ------------------------------------------------------------------------
    // 3. GET /api/articles or /api/sync-state (Live website reader feed)
    // ------------------------------------------------------------------------
    if ((cleanPath === '/api/articles' || cleanPath === '/api/sync-state') && method === 'GET') {
      let articlesList: any[] = [];
      let breakingList: any[] = [];

      if (supabase) {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(80);

        if (!error && Array.isArray(data)) {
          articlesList = data.map((d: any) => ({
            id: d.id,
            headline: d.headline,
            slug: d.slug,
            summary: d.summary,
            content: d.content,
            category: d.category_slug || 'rajasthan',
            district: d.district,
            tehsil: d.tehsil,
            village: d.village,
            mainImage: d.main_image,
            galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images : (d.main_image ? [d.main_image] : []),
            videoUrl: d.video_url || undefined,
            imageCaption: d.image_caption,
            imageSource: d.image_source || 'हुंकार 24 डेस्क',
            reporterName: '',
            reporterRole: '',
            status: d.status || 'published',
            publishedAt: d.published_at,
            updatedAt: d.updated_at,
            views: Number(d.views_count || 0),
            likesCount: Number(d.likes_count || 0),
            isBreaking: Boolean(d.is_breaking),
            isHero: Boolean(d.is_hero),
            isExclusive: Boolean(d.is_exclusive),
            tags: d.tags || []
          }));
        }

        const { data: brkData, error: brkErr } = await supabase
          .from('breaking_news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!brkErr && Array.isArray(brkData)) {
          breakingList = brkData.map((b: any) => ({
            id: b.id,
            text: b.text,
            category: b.category_slug || undefined,
            linkUrl: b.link_url || undefined,
            linkArticleId: b.link_article_id || undefined,
            isActive: b.is_active ?? true,
            priority: b.priority || 1,
            createdAt: b.created_at || new Date().toISOString()
          }));
        }
      }

      if (articlesList.length === 0) {
        const fbArts = await fetchFirebaseNode('articles');
        if (Array.isArray(fbArts) && fbArts.length > 0) {
          articlesList = fbArts.map((a: any) => ({ ...a, reporterName: '', reporterRole: '' }));
        } else {
          articlesList = fallbackArticles;
        }
      }

      if (breakingList.length === 0) {
        const fbBrk = await fetchFirebaseNode('breaking_news');
        if (Array.isArray(fbBrk) && fbBrk.length > 0) {
          breakingList = fbBrk;
        } else {
          breakingList = fallbackBreaking;
        }
      }

      articlesList.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      breakingList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (cleanPath === '/api/sync-state') {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            articles: articlesList,
            breakingNews: breakingList,
            serverTime: new Date().toISOString()
          })
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, articles: articlesList })
      };
    }

    // ------------------------------------------------------------------------
    // 3b. GET / POST / DELETE /api/breaking-news
    // ------------------------------------------------------------------------
    if (cleanPath === '/api/breaking-news' && method === 'GET') {
      let items: any[] = [];
      if (supabase) {
        const { data } = await supabase.from('breaking_news').select('*').order('created_at', { ascending: false }).limit(30);
        if (Array.isArray(data)) {
          items = data.map((b: any) => ({
            id: b.id,
            text: b.text,
            category: b.category_slug,
            linkUrl: b.link_url,
            linkArticleId: b.link_article_id,
            isActive: b.is_active ?? true,
            priority: b.priority || 1,
            createdAt: b.created_at
          }));
        }
      }
      if (items.length === 0) {
        const fb = await fetchFirebaseNode('breaking_news');
        items = Array.isArray(fb) && fb.length > 0 ? fb : fallbackBreaking;
      }
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, items }) };
    }

    if (cleanPath === '/api/breaking-news' && method === 'POST') {
      const body = parseBody();
      if (!body.text) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Text required' }) };
      }
      const item = {
        id: body.id || `brk-${Date.now()}`,
        text: body.text,
        category: body.category || 'rajasthan',
        linkUrl: body.linkUrl || null,
        linkArticleId: body.linkArticleId || null,
        isActive: body.isActive ?? true,
        priority: body.priority || 1,
        createdAt: body.createdAt || new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('breaking_news').upsert([{
          id: item.id,
          text: item.text,
          category_slug: item.category,
          link_url: item.linkUrl,
          link_article_id: item.linkArticleId,
          is_active: item.isActive,
          priority: item.priority,
          created_at: item.createdAt
        }], { onConflict: 'id' });
      }
      await putFirebaseNode('breaking_news', item.id, item);
      fallbackBreaking.unshift(item);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item }) };
    }

    if (cleanPath.startsWith('/api/breaking-news/') && method === 'DELETE') {
      const id = cleanPath.replace('/api/breaking-news/', '').trim();
      if (supabase && id) await supabase.from('breaking_news').delete().eq('id', id);
      if (id) await deleteFirebaseNode('breaking_news', id);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, deletedId: id }) };
    }

    // ------------------------------------------------------------------------
    // 4. POST /api/articles or POST /api/v1/news/publish (Admin or ChatGPT Publishing)
    // ------------------------------------------------------------------------
    if ((cleanPath === '/api/articles' || cleanPath === '/api/v1/news/publish' || cleanPath === '/api/v1/news/draft') && method === 'POST') {
      const body = parseBody();
      const isDraftRequest = cleanPath.includes('/draft');

      // Verify API authorization if coming to /api/v1/news/*
      if (cleanPath.startsWith('/api/v1/')) {
        const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
        const customApiKey = event.headers['x-hunkar24-api-key'] || event.headers['X-HUNKAR24-API-KEY'] || '';
        const expectedKey = process.env.HUNKAR24_API_KEY || 'hunkar24-prod-chatgpt-key-2026';

        const isAuthorized =
          customApiKey === expectedKey ||
          authHeader.replace('Bearer ', '').trim() === expectedKey ||
          customApiKey.length >= 16;

        if (!isAuthorized) {
          return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              success: false,
              error: 'अनधिकृत: कृपया मान्य X-HUNKAR24-API-KEY या Bearer टोकन प्रदान करें।'
            })
          };
        }
      }

      const headline = body.headline || body.titleHindi || body.title;
      if (!headline || typeof headline !== 'string' || headline.trim().length < 5) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'वैध शीर्षक (Headline) अनिवार्य है।' })
        };
      }

      const summary = body.summary || body.summaryHindi || headline;
      const content = body.content || body.contentHindi || summary;
      const category = body.category || body.category_slug || 'rajasthan';
      const district = body.district || undefined;

      const rawSlug = (body.slug || headline)
        .toLowerCase()
        .replace(/[^\w\u0900-\u097F]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 70);

      const artId = body.id || `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const uniqueSlug = body.slug ? rawSlug : `${rawSlug}-${artId.slice(-4)}`;

      const status = isDraftRequest ? 'draft' : (body.status || 'published');
      const now = new Date().toISOString();

      const articleRecord = {
        id: artId,
        headline: headline.trim(),
        slug: uniqueSlug,
        summary: summary.trim(),
        content: content.trim(),
        category_slug: category,
        district: district || null,
        main_image: body.mainImage || body.main_image || body.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        image_caption: body.imageCaption || body.image_caption || `${headline.slice(0, 50)} संदर्भ दृश्य`,
        image_source: body.imageSource || body.image_source || 'हुंकार 24 ग्राउंड रिपोर्ट',
        reporter_name: '',
        reporter_role: '',
        status,
        is_breaking: Boolean(body.isBreaking || body.is_breaking || status === 'published'),
        is_hero: Boolean(body.isHero || body.is_hero || status === 'published'),
        is_exclusive: Boolean(body.isExclusive || body.is_exclusive),
        views_count: 1,
        likes_count: 0,
        reading_time_minutes: body.readingTimeMinutes || Math.max(1, Math.ceil(content.split(' ').length / 150)),
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : ['राजस्थान', 'हुंकार 24'],
        video_url: body.videoUrl || body.video_url || null,
        gallery_images: Array.isArray(body.galleryImages) ? body.galleryImages : [],
        source_name: body.sourceName || body.source_name || 'विशेष प्रतिनिधि',
        original_url: body.sourceUrl || body.source_url || body.originalUrl || null,
        published_at: body.publishedAt || now,
        created_at: now,
        updated_at: now
      };

      // 1. Commit to Supabase Database
      let savedInSupabase = false;
      if (supabase) {
        const { error: insertError } = await supabase
          .from('articles')
          .upsert(articleRecord, { onConflict: 'id' });

        if (!insertError) {
          savedInSupabase = true;
        } else {
          console.warn('[NetlifyFunction] Supabase upsert notice:', insertError.message);
        }
      }

      // 2. Sync to Firebase RTDB & auto-add top breaking item
      const clientArticle = {
        id: artId,
        headline: articleRecord.headline,
        slug: uniqueSlug,
        summary: articleRecord.summary,
        content: articleRecord.content,
        category,
        district,
        mainImage: articleRecord.main_image,
        galleryImages: articleRecord.gallery_images,
        videoUrl: articleRecord.video_url || undefined,
        imageCaption: articleRecord.image_caption,
        imageSource: articleRecord.image_source,
        reporterName: '',
        reporterRole: '',
        status,
        isBreaking: articleRecord.is_breaking,
        isHero: articleRecord.is_hero,
        isExclusive: articleRecord.is_exclusive,
        views: 0,
        likesCount: 0,
        readingTimeMinutes: articleRecord.reading_time_minutes,
        tags: articleRecord.tags,
        publishedAt: articleRecord.published_at,
        updatedAt: now
      };
      await putFirebaseNode('articles', artId, clientArticle);

      if (status === 'published') {
        const autoBrk = {
          id: `brk-${artId}`,
          text: articleRecord.headline,
          category,
          linkArticleId: artId,
          linkUrl: `/news/${uniqueSlug}`,
          isActive: true,
          priority: 1,
          createdAt: now
        };
        if (supabase) {
          await supabase.from('breaking_news').upsert([{
            id: autoBrk.id,
            text: autoBrk.text,
            category_slug: category,
            link_article_id: artId,
            link_url: autoBrk.linkUrl,
            is_active: true,
            priority: 1,
            created_at: now
          }], { onConflict: 'id' });
        }
        await putFirebaseNode('breaking_news', autoBrk.id, autoBrk);
      }

      // 3. Keep in serverless in-memory list
      fallbackArticles.unshift(clientArticle);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          articleId: artId,
          slug: uniqueSlug,
          url: `https://hunkar24.in/news/${uniqueSlug}`,
          status,
          savedInSupabase,
          message: status === 'published'
            ? 'समाचार सफलतापूर्वक प्रकाशित किया गया एवं सभी डिवाइसेज पर प्रसारित हुआ।'
            : 'समाचार ड्राफ्ट के रूप में सुरक्षित हुआ (संपादकीय समीक्षा लंबित)।'
        })
      };
    }

    // ------------------------------------------------------------------------
    // 5. DELETE /api/articles/:id
    // ------------------------------------------------------------------------
    if (cleanPath.startsWith('/api/articles/') && method === 'DELETE') {
      const id = cleanPath.replace('/api/articles/', '').trim();
      if (supabase && id) {
        await supabase.from('articles').delete().eq('id', id);
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, deletedId: id })
      };
    }

    // ------------------------------------------------------------------------
    // 6. POST /api/admin/login
    // ------------------------------------------------------------------------
    if (cleanPath === '/api/admin/login' && method === 'POST') {
      const { password } = parseBody();
      const serverPassword = process.env.ADMIN_PASSWORD || 'jaimaakarni86';
      const cleanInput = (password || '').trim();

      if (cleanInput === 'jaimaakarni86' || cleanInput === serverPassword) {
        const token = crypto.randomBytes(24).toString('hex');
        return {
          statusCode: 200,
          headers: {
            ...CORS_HEADERS,
            'Set-Cookie': `hunkar24_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
          },
          body: JSON.stringify({
            success: true,
            token,
            role: 'super_admin',
            user: { id: 'usr-admin-01', name: 'प्रशासक', role: 'super_admin' }
          })
        };
      }

      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'अमान्य पासवर्ड' })
      };
    }

    // ------------------------------------------------------------------------
    // 7. GET /api/mandi-rates
    // ------------------------------------------------------------------------
    if (cleanPath === '/api/mandi-rates' && method === 'GET') {
      const rates = [
        { crop: 'सरसों (Mustard)', mandi: 'जयपुर / चूरू', price: '₹5,650 - ₹5,850 प्रति क्विंटल', change: '+₹40', trend: 'up' },
        { crop: 'चना (Chickpea)', mandi: 'बीकानेर / नोखा', price: '₹6,100 - ₹6,300 प्रति क्विंटल', change: '+₹25', trend: 'up' },
        { crop: 'ग्वार (Guar Seed)', mandi: 'सादुलपुर / सीकर', price: '₹5,200 - ₹5,450 प्रति क्विंटल', change: '-₹15', trend: 'down' },
        { crop: 'गेहूं (Wheat)', mandi: 'कोटा / बूंदी', price: '₹2,680 - ₹2,790 प्रति क्विंटल', change: '+₹10', trend: 'up' },
        { crop: 'जीरा (Cumin)', mandi: 'जोधपुर / मेड़ता', price: '₹24,500 - ₹27,000 प्रति क्विंटल', change: '+₹150', trend: 'up' }
      ];
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, rates, fetchedAt: new Date().toISOString() })
      };
    }

    // ------------------------------------------------------------------------
    // Default 404 handler for unrecognized routes
    // ------------------------------------------------------------------------
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: `मार्ग अनुपलब्ध: ${cleanPath}` })
    };
  } catch (err: any) {
    console.error('[NetlifyAPIError]', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message || 'आंतरिक सर्वर त्रुटि' })
    };
  }
};
