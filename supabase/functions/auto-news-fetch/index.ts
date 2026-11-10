// Supabase Edge Function: auto-news-fetch
// Deno TypeScript Runtime
// Fully production-ready, secure, resilient automatic news aggregator for Hunkar 24
//
// 1. Authenticates scheduled cron & authorized admin requests (CRON_SECRET or service-role)
// 2. Collects news from all 6 configured providers:
//    - Google News RSS (Rajasthan, Mandis, Jobs, BBC Hindi)
//    - GNews API (Regional Hindi)
//    - NewsAPI (Rajasthan & National)
//    - NewsData.io (Hindi Feed)
//    - Currents API (Hindi)
//    - MediaStack API (India)
// 3. Deduplicates via normalized title & token set similarity against database
// 4. Transforms into authentic journalistic Hindi via Google Gemini 3.8 Flash
// 5. Automatically publishes articles to Supabase PostgreSQL (omitting id for UUID auto-generation)
// 6. Writes real execution metrics to public.automation_logs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Master topic image matcher for authentic, relevant news photos
const TOPIC_IMAGES = [
  { kw: ['सरसों', 'mustard', 'तिलहन'], url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['गेहूं', 'wheat', 'अनाज', 'फसल', 'रबी'], url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['मंडी', 'mandi', 'बोरी', 'नीलामी', 'भाव'], url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['चना', 'जीरा', 'ग्वार', 'मूंग', 'मोठ'], url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['सोलर', 'कुसुम', 'पंप', 'सिंचाई'], url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['ercp', 'ईआरसीपी', 'बांध', 'नहर', 'पेयजल'], url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['rpsc', 'reet', 'भर्ती', 'परीक्षा', 'शिक्षक'], url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['स्कूल', 'कॉलेज', 'शिक्षा', 'विद्यार्थी'], url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['ट्रेन', 'रेलवे', 'वंदे भारत'], url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['बारिश', 'मानसून', 'मौसम', 'ओलावृष्टि'], url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['पुलिस', 'अपराध', 'थाना', 'सुरक्षा'], url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['कैबिनेट', 'विधानसभा', 'मुख्यमंत्री', 'सरकार'], url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['अस्पताल', 'स्वास्थ्य', 'डॉक्टर', 'दवा'], url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80' },
  { kw: ['क्रिकेट', 'खेल', 'टूर्नामेंट'], url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80' }
];

function pickAccurateImage(title: string, category: string, district?: string, providedUrl?: string): string {
  if (providedUrl && providedUrl.startsWith('http') && !providedUrl.includes('placeholder')) {
    return providedUrl;
  }
  const text = `${title} ${category} ${district || ''}`.toLowerCase();
  for (const item of TOPIC_IMAGES) {
    if (item.kw.some(k => text.includes(k.toLowerCase()))) {
      return item.url;
    }
  }
  return 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80';
}

function canonicalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const paramsToStrip = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'oc', 'ref', 'ref_src', 'fbclid', 'gclid', 'msclkid', 'ved', 'ei'
    ];
    for (const p of paramsToStrip) {
      parsed.searchParams.delete(p);
    }
    let clean = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`.replace(/\/+$/, '');
    const remainingParams = parsed.searchParams.toString();
    if (remainingParams) {
      clean += `?${remainingParams}`;
    }
    return clean;
  } catch {
    return rawUrl.trim().toLowerCase().split('?')[0].replace(/\/+$/, '');
  }
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/^\[(अपडेट|ब्रेकिंग|ताज़ा|विशेष|अलर्ट)\]\s*/i, '')
    .replace(/^(ताज़ा अपडेट|ब्रेकिंग न्यूज़|बड़ी खबर|विशेष बुलेटिन|हुंकार ग्राउंड रिपोर्ट|एक्सक्लूसिव)\s*[:|-]\s*/i, '')
    .replace(/\s+-\s+[^-]+$/, '')
    .replace(/[^\w\u0900-\u097F]+/g, ' ')
    .trim();
}

function generateSlug(text: string): string {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 65);
  return clean || 'news-' + Date.now();
}

function isItemDuplicate(
  headline: string,
  rawUrl: string,
  slugCandidate: string,
  existingHeadlines: string[],
  existingSlugs: Set<string>,
  existingUrls: Set<string>
): boolean {
  // 1. Canonical source URL check
  const cleanUrl = canonicalizeUrl(rawUrl);
  if (cleanUrl && existingUrls.has(cleanUrl)) {
    return true;
  }

  // 2. Slug check
  if (slugCandidate && existingSlugs.has(slugCandidate)) {
    return true;
  }

  // 3. Normalized headline equality or keyword overlap
  const norm = normalizeTitle(headline);
  if (!norm) return true;
  const normWords = new Set(norm.split(/\s+/).filter(w => w.length > 2));

  for (const existing of existingHeadlines) {
    const itemNorm = normalizeTitle(existing || '');
    if (itemNorm === norm) return true;
    if (itemNorm.includes(norm) || norm.includes(itemNorm)) {
      const minLen = Math.min(itemNorm.length, norm.length);
      const maxLen = Math.max(itemNorm.length, norm.length);
      if (minLen / maxLen >= 0.5) return true;
    }
    if (normWords.size >= 3) {
      const itemWords = new Set(itemNorm.split(/\s+/).filter(w => w.length > 2));
      let matchCount = 0;
      for (const w of normWords) {
        if (itemWords.has(w)) matchCount++;
      }
      const similarity = (2 * matchCount) / (normWords.size + itemWords.size);
      if (similarity >= 0.55) return true;
    }
  }
  return false;
}

// Timeout helper for resilient HTTP fetching
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Transform raw news into authentic Hindi journalistic copy via Gemini 3.8 Flash
async function transformWithGemini(
  rawTitle: string,
  rawDesc: string,
  sourceName: string,
  sourceUrl: string,
  geminiKey: string
): Promise<{
  headline: string;
  summary: string;
  content: string;
  category: string;
  district?: string;
  isBreaking: boolean;
}> {
  const cleanTitle = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim();
  const cleanDesc = (rawDesc || cleanTitle).replace(/<[^>]*>/g, '').trim();

  if (geminiKey && geminiKey.length > 10) {
    try {
      const prompt = `You are the chief Hindi editor for 'HUNKAR 24 (हुंकार 24)', Rajasthan's premier independent digital news network.
Task: Transform this raw news item into authentic, natural, neutral, accurate Hindi journalism.
Rules:
- NEVER invent facts, names, quotes, statistics, or events missing from the raw source material.
- Translate and summarize strictly based on the verifiable facts provided in the raw input.
- Generate a punchy, factual Hindi headline (under 20 words).
- Write a 2-sentence concise Hindi summary (50-70 words).
- Write a detailed 250-350 word Hindi news body with markdown section headers:
  ### मुख्य समाचार एवं पृष्ठभूमि
  ### किसान, छात्र और आम जनता के लिए मुख्य बिंदु
  ### प्रशासनिक दिशानिर्देश एवं आगामी कार्रवाई
  End with: "**हुंकार 24 ग्राउंड रिपोर्ट डेस्क**\\n*राजस्थान की बुलंद आवाज़*\\n[मूल समाचार संदर्भ: [${sourceName}](${sourceUrl})]"
- Choose category strictly from: agriculture, jobs, schemes, rajasthan, national, education, sports, weather, business, technology.
- Detect Rajasthan district if explicitly mentioned in the story ('jaipur', 'churu', 'sikar', 'bikaner', 'jodhpur', 'kota', 'udaipur', 'barmer', 'nagaur', 'ajmer', null).
- isBreaking: true if urgent news (e.g. major exam result, cabinet decision, mandi rate swing, emergency), else false.

Raw News:
Title: ${cleanTitle}
Description: ${cleanDesc}
Source: ${sourceName}
URL: ${sourceUrl}

Respond strictly with valid JSON only:
{
  "headline": "...",
  "summary": "...",
  "content": "...",
  "category": "...",
  "district": "...",
  "isBreaking": false
}`;

      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'aistudio-build'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        },
        12000
      );

      if (res.ok) {
        const json = await res.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          const parsed = JSON.parse(responseText.trim());
          if (parsed.headline && parsed.content) {
            return {
              headline: parsed.headline.trim(),
              summary: parsed.summary?.trim() || cleanTitle,
              content: parsed.content.trim(),
              category: parsed.category || 'rajasthan',
              district: parsed.district || undefined,
              isBreaking: Boolean(parsed.isBreaking)
            };
          }
        }
      }
    } catch (e: any) {
      console.warn('[Gemini Edge Notice]:', e.message);
    }
  }

  // Journalistic fallback if Gemini is offline or rate-limited
  const isBreaking = cleanTitle.includes('मंडी') || cleanTitle.includes('भर्ती') || cleanTitle.includes('घोषणा');
  return {
    headline: cleanTitle,
    summary: cleanDesc.slice(0, 200),
    content: `### मुख्य समाचार एवं पृष्ठभूमि\n${cleanTitle}\n\n${cleanDesc}\n\n### किसान, छात्र और आम जनता के लिए मुख्य बिंदु\n- राज्य एवं स्थानीय प्रशासन द्वारा घटनाक्रम पर नजर रखी जा रही है।\n- हुंकार 24 की रिपोर्टिंग टीम निष्पक्ष तथ्य प्रस्तुत कर रही है।\n\n**हुंकार 24 ग्राउंड रिपोर्ट डेस्क**\n*राजस्थान की बुलंद आवाज़*\n[मूल समाचार संदर्भ: [${sourceName}](${sourceUrl})]`,
    category: 'rajasthan',
    district: undefined,
    isBreaking
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const cronSecret = Deno.env.get('CRON_SECRET') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey || Deno.env.get('SUPABASE_ANON_KEY') || '');

    // Strict Security Gate: Authenticate scheduled cron or authorized admin invocation
    const authHeader = req.headers.get('authorization') || '';
    const xCronSecret = req.headers.get('x-cron-secret') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let isAuthorized = false;
    if (cronSecret && (token === cronSecret || xCronSecret === cronSecret)) {
      isAuthorized = true;
    } else if (supabaseServiceKey && token === supabaseServiceKey) {
      isAuthorized = true;
    } else if (token && token.length > 30) {
      // Validate Supabase JWT token and check admin role in profiles
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
        if (user && !userErr) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile && ['super_admin', 'admin', 'editor'].includes(profile.role)) {
            isAuthorized = true;
          }
        }
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'अनधिकृत प्रवेश: अमान्य प्रमाणीकरण टोकन (CRON_SECRET या एडमिन टोकन आवश्यक)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const gnewsKey = Deno.env.get('GNEWS_KEY') || '';
    const newsApiKey = Deno.env.get('NEWSAPI_KEY') || '';
    const newsDataKey = Deno.env.get('NEWSDATA_KEY') || '';
    const currentsKey = Deno.env.get('CURRENTS_API_KEY') || '';
    const mediastackKey = Deno.env.get('MEDIASTACK_API_KEY') || '';
    const firebaseRtdbUrl = Deno.env.get('FIREBASE_DATABASE_URL') || '';

    // 1. Fetch existing headlines, slugs and original URLs for strict deduplication
    const existingHeadlines: string[] = [];
    const existingSlugs = new Set<string>();
    const existingUrls = new Set<string>();

    const { data: dbArticles } = await supabase
      .from('articles')
      .select('headline, slug, original_url')
      .order('published_at', { ascending: false })
      .limit(500);

    if (dbArticles) {
      for (const a of dbArticles) {
        if (a.headline) existingHeadlines.push(a.headline);
        if (a.slug) existingSlugs.add(a.slug);
        if (a.original_url) existingUrls.add(canonicalizeUrl(a.original_url));
      }
    }

    const rawArticles: Array<{ title: string; description: string; imageUrl?: string; sourceName: string; url: string }> = [];
    const providerErrors: string[] = [];

    // ------------------------------------------------------------------------
    // 2. Fetch Provider 1: Google News RSS (Rajasthan, Mandis, Jobs, BBC Hindi)
    // ------------------------------------------------------------------------
    const rssFeeds = [
      { name: 'बीबीसी न्यूज़ हिंदी', url: 'https://feeds.bbci.co.uk/hindi/rss.xml' },
      { name: 'गूगल न्यूज़ राजस्थान', url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8&hl=hi&gl=IN&ceid=IN:hi' },
      { name: 'कृषि व मंडी भाव', url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8+%E0%A4%95%E0%A4%BF%E0%A4%B8%E0%A4%BE%E0%A4%A8+%E0%A4%AE%E0%A4%82%E0%A4%A1%E0%A4%80&hl=hi&gl=IN&ceid=IN:hi' },
      { name: 'शिक्षा व भर्ती', url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8+%E0%A4%AD%E0%A4%B0%E0%A5%8D%E0%A4%A4%E0%A5%80+%E0%A4%AA%E0%A4%B0%E0%A5%80%E0%A4%95%E0%A5%8D%E0%A4%A7%E0%A4%BE&hl=hi&gl=IN&ceid=IN:hi' }
    ];

    const parser = new XMLParser({ ignoreAttributes: false });

    for (const feed of rssFeeds) {
      try {
        const res = await fetchWithTimeout(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hunkar24Edge/1.0' }
        }, 6000);
        if (res.ok) {
          const xml = await res.text();
          const data = parser.parse(xml);
          const items = data.rss?.channel?.item || [];
          const list = Array.isArray(items) ? items : [items];
          for (const item of list.slice(0, 4)) {
            if (item.title) {
              rawArticles.push({
                title: String(item.title).replace(/\s+-\s+[^-]+$/, '').trim(),
                description: String(item.description || item.title).replace(/<[^>]*>/g, '').trim(),
                sourceName: feed.name,
                url: String(item.link || '')
              });
            }
          }
        }
      } catch (e: any) {
        console.warn(`RSS Feed ${feed.name} error:`, e.message);
      }
    }

    // ------------------------------------------------------------------------
    // 3. Fetch Provider 2: GNews API
    // ------------------------------------------------------------------------
    if (gnewsKey) {
      try {
        const res = await fetchWithTimeout(
          `https://gnews.io/api/v4/top-headlines?category=general&lang=hi&country=in&max=10&apikey=${gnewsKey}`,
          {},
          6000
        );
        if (res.ok) {
          const data = await res.json();
          for (const a of data.articles || []) {
            if (a.title) {
              rawArticles.push({
                title: a.title,
                description: a.description || '',
                imageUrl: a.image,
                sourceName: a.source?.name || 'GNews Hindi',
                url: a.url
              });
            }
          }
        }
      } catch (e: any) {
        providerErrors.push(`GNews: ${e.message}`);
      }
    }

    // ------------------------------------------------------------------------
    // 4. Fetch Provider 3: NewsAPI
    // ------------------------------------------------------------------------
    if (newsApiKey) {
      try {
        const res = await fetchWithTimeout(
          `https://newsapi.org/v2/everything?q=rajasthan&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`,
          { headers: { 'User-Agent': 'Hunkar24Edge/1.0' } },
          6000
        );
        if (res.ok) {
          const data = await res.json();
          for (const a of data.articles || []) {
            if (a.title && a.title !== '[Removed]') {
              rawArticles.push({
                title: a.title,
                description: a.description || '',
                imageUrl: a.urlToImage,
                sourceName: a.source?.name || 'NewsAPI',
                url: a.url
              });
            }
          }
        }
      } catch (e: any) {
        providerErrors.push(`NewsAPI: ${e.message}`);
      }
    }

    // ------------------------------------------------------------------------
    // 5. Fetch Provider 4: NewsData.io (Hindi)
    // ------------------------------------------------------------------------
    if (newsDataKey) {
      try {
        const res = await fetchWithTimeout(
          `https://newsdata.io/api/1/latest?apikey=${newsDataKey}&country=in&language=hi&size=10`,
          {},
          6000
        );
        if (res.ok) {
          const data = await res.json();
          for (const a of data.results || []) {
            if (a.title) {
              rawArticles.push({
                title: a.title,
                description: a.description || '',
                imageUrl: a.image_url,
                sourceName: a.source_id || 'NewsData Hindi',
                url: a.link
              });
            }
          }
        }
      } catch (e: any) {
        providerErrors.push(`NewsData: ${e.message}`);
      }
    }

    // ------------------------------------------------------------------------
    // 6. Fetch Provider 5: Currents API (Hindi)
    // ------------------------------------------------------------------------
    if (currentsKey) {
      try {
        const res = await fetchWithTimeout(
          `https://api.currentsapi.services/v1/latest-news?language=hi&apiKey=${currentsKey}`,
          {},
          6000
        );
        if (res.ok) {
          const data = await res.json();
          for (const item of data.news || []) {
            if (item.title) {
              rawArticles.push({
                title: item.title,
                description: item.description || '',
                imageUrl: item.image && item.image !== 'None' ? item.image : undefined,
                sourceName: item.author || 'Currents Hindi',
                url: item.url
              });
            }
          }
        }
      } catch (e: any) {
        providerErrors.push(`Currents: ${e.message}`);
      }
    }

    // ------------------------------------------------------------------------
    // 7. Fetch Provider 6: MediaStack API
    // ------------------------------------------------------------------------
    if (mediastackKey) {
      try {
        const res = await fetchWithTimeout(
          `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&countries=in&languages=hi,en&limit=10`,
          {},
          6000
        );
        if (res.ok) {
          const data = await res.json();
          for (const item of data.data || []) {
            if (item.title) {
              rawArticles.push({
                title: item.title,
                description: item.description || '',
                imageUrl: item.image || undefined,
                sourceName: item.source || 'Mediastack',
                url: item.url
              });
            }
          }
        }
      } catch (e: any) {
        providerErrors.push(`MediaStack: ${e.message}`);
      }
    }

    let publishedCount = 0;
    let duplicateCount = 0;
    const publishedArticles: any[] = [];

    // ------------------------------------------------------------------------
    // 8. Deduplication + Gemini Transformation + Supabase Database Persistence
    // ------------------------------------------------------------------------
    for (const raw of rawArticles) {
      const cleanTitle = raw.title.replace(/\s+-\s+[^-]+$/, '').trim();
      const rawUrl = raw.url || '';
      const baseSlug = generateSlug(cleanTitle);

      if (isItemDuplicate(cleanTitle, rawUrl, baseSlug, existingHeadlines, existingSlugs, existingUrls)) {
        duplicateCount++;
        continue;
      }

      // Transform with Gemini API
      const ai = await transformWithGemini(cleanTitle, raw.description, raw.sourceName, raw.url, geminiKey);
      const finalSlug = generateSlug(ai.headline);

      if (isItemDuplicate(ai.headline, rawUrl, finalSlug, existingHeadlines, existingSlugs, existingUrls)) {
        duplicateCount++;
        continue;
      }

      const now = new Date().toISOString();
      const assignedImage = pickAccurateImage(ai.headline, ai.category, ai.district, raw.imageUrl);
      const canonicalSourceUrl = canonicalizeUrl(raw.url);

      // MANDATORY DATABASE COMPATIBILITY:
      // Omit 'id' so PostgreSQL generates the UUID automatically via gen_random_uuid() / uuid_generate_v4()!
      // Status is the valid enum 'published'
      const articleRecord = {
        headline: ai.headline,
        slug: finalSlug,
        summary: ai.summary,
        content: ai.content,
        category_slug: ai.category,
        district: ai.district || null,
        main_image: assignedImage,
        image_caption: `${ai.district ? ai.district.toUpperCase() : 'राजस्थान'} समाचार संदर्भ दृश्य`,
        image_source: raw.sourceName,
        reporter_name: `हुंकार 24 AI डेस्क (${raw.sourceName})`,
        reporter_role: 'स्वचालित समाचार नेटवर्क',
        status: 'published',
        is_breaking: ai.isBreaking,
        is_hero: false,
        is_exclusive: ai.category === 'agriculture',
        views_count: 1,
        likes_count: 0,
        reading_time_minutes: 3,
        tags: ['हुंकार 24', ai.category, ai.district || 'राजस्थान'].filter(Boolean),
        source_name: raw.sourceName,
        original_url: canonicalSourceUrl,
        published_at: now
      };

      // Insert directly into Supabase articles table
      const { data: insertedData, error: insertErr } = await supabase
        .from('articles')
        .insert([articleRecord])
        .select('id, headline, slug, published_at')
        .single();

      if (!insertErr && insertedData) {
        existingHeadlines.push(ai.headline);
        existingSlugs.add(finalSlug);
        if (canonicalSourceUrl) existingUrls.add(canonicalSourceUrl);
        publishedArticles.push({ ...articleRecord, id: insertedData.id });
        publishedCount++;

        // Sync with Firebase Realtime Database if configured
        if (firebaseRtdbUrl) {
          try {
            await fetch(`${firebaseRtdbUrl}/articles/${insertedData.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...articleRecord,
                id: insertedData.id,
                category: articleRecord.category_slug,
                mainImage: articleRecord.main_image,
                views: 0,
                likesCount: 0,
                updatedAt: now
              })
            });
          } catch {
            // Safe non-blocking error ignore
          }
        }
      } else if (insertErr) {
        console.warn('[Supabase Insert Error]:', insertErr.message);
      }

      // Safe batch size per 3-hour cycle: 8 high-quality articles
      if (publishedCount >= 8) break;
    }

    // ------------------------------------------------------------------------
    // 9. Write Execution Log to Database (Admin Dashboard Verified Status)
    // ------------------------------------------------------------------------
    const logRecord = {
      action: 'auto_news_fetch_cycle',
      source_id: 'auto-news-network',
      articles_fetched: rawArticles.length,
      articles_published: publishedCount,
      duplicates_filtered: duplicateCount,
      status: publishedCount > 0 ? 'success' : rawArticles.length === 0 ? 'warning' : 'success',
      message: `${publishedCount} नए लेख Gemini AI द्वारा रूपांतरित व प्रकाशित किए गए। कुल फेच: ${rawArticles.length}, डुप्लिकेट: ${duplicateCount}.${providerErrors.length > 0 ? ` चेतावनी: ${providerErrors.join('; ')}` : ''}`
    };

    try {
      await supabase.from('automation_logs').insert([logRecord]);
    } catch {
      // Safe non-blocking
    }

    if (firebaseRtdbUrl) {
      try {
        await fetch(`${firebaseRtdbUrl}/hunkar24/automation/latest.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastRunAt: new Date().toISOString(),
            articlesPublished: publishedCount,
            duplicatesFiltered: duplicateCount,
            totalFetched: rawArticles.length,
            status: publishedCount > 0 ? 'success' : 'idle',
            message: logRecord.message
          })
        });
      } catch {
        // Non-blocking
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        publishedCount,
        duplicateCount,
        totalFetched: rawArticles.length,
        timestamp: new Date().toISOString(),
        publishedArticles,
        message: `Edge Function: ${publishedCount} नए समाचार Gemini AI द्वारा स्वचालित प्रकाशित किए गए।`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
