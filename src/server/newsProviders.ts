import { XMLParser } from 'fast-xml-parser';

export interface RawNewsArticle {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  originalId: string;
  title: string;
  description: string;
  content: string;
  author?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  language: 'hi' | 'en' | string;
  categorySuggestion?: string;
  districtSuggestion?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'api' | 'rss' | 'custom';
  apiKey?: string;
  endpoint?: string;
  isEnabled: boolean;
  rateLimitPerDay?: number;
  lastFetchedAt?: string;
  lastStatus: 'success' | 'error' | 'pending' | 'idle';
  lastErrorMessage?: string;
  requestCountToday: number;
}

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'newsapi',
    name: 'NewsAPI.org',
    type: 'api',
    apiKey: process.env.NEWSAPI_KEY || 'a4d4a6c75ffe4ec89945f7630c6def51',
    endpoint: 'https://newsapi.org/v2',
    isEnabled: true,
    rateLimitPerDay: 100,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'newsdata',
    name: 'NewsData.io',
    type: 'api',
    apiKey: process.env.NEWSDATA_KEY || 'pub_eb74f86ee8034c1aa709628311675476',
    endpoint: 'https://newsdata.io/api/1/latest',
    isEnabled: true,
    rateLimitPerDay: 200,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'gnews',
    name: 'GNews.io',
    type: 'api',
    apiKey: process.env.GNEWS_KEY || 'f545e6f443b432ec4297d0aef0f930e6',
    endpoint: 'https://gnews.io/api/v4',
    isEnabled: true,
    rateLimitPerDay: 100,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'google_news_rss',
    name: 'Google News RSS (Rajasthan & Hindi)',
    type: 'rss',
    endpoint: 'https://news.google.com/rss',
    isEnabled: true,
    rateLimitPerDay: 1000,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'provider_5',
    name: process.env.PROVIDER_5_NAME || 'Additional News API 1 (Custom)',
    type: 'custom',
    apiKey: process.env.PROVIDER_5_API_KEY || '',
    endpoint: process.env.PROVIDER_5_ENDPOINT || '',
    isEnabled: Boolean(process.env.PROVIDER_5_ENDPOINT),
    rateLimitPerDay: 500,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'provider_6',
    name: process.env.PROVIDER_6_NAME || 'Additional News API 2 (Custom)',
    type: 'custom',
    apiKey: process.env.PROVIDER_6_API_KEY || '',
    endpoint: process.env.PROVIDER_6_ENDPOINT || '',
    isEnabled: Boolean(process.env.PROVIDER_6_ENDPOINT),
    rateLimitPerDay: 500,
    lastStatus: 'idle',
    requestCountToday: 0
  },
  {
    id: 'provider_7',
    name: process.env.PROVIDER_7_NAME || 'Additional News API 3 (Custom)',
    type: 'custom',
    apiKey: process.env.PROVIDER_7_API_KEY || '',
    endpoint: process.env.PROVIDER_7_ENDPOINT || '',
    isEnabled: Boolean(process.env.PROVIDER_7_ENDPOINT),
    rateLimitPerDay: 500,
    lastStatus: 'idle',
    requestCountToday: 0
  }
];

// Helper: fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ----------------------------------------------------------------------------
// PROVIDER 1: NewsAPI.org
// ----------------------------------------------------------------------------
export async function fetchFromNewsApi(config: ProviderConfig): Promise<RawNewsArticle[]> {
  const apiKey = config.apiKey || process.env.NEWSAPI_KEY || 'a4d4a6c75ffe4ec89945f7630c6def51';
  if (!apiKey) return [];

  // Query Rajasthan and Hindi news keywords
  const queries = ['rajasthan', 'jaipur', 'churu'];
  const results: RawNewsArticle[] = [];

  for (const q of queries.slice(0, 1)) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`NewsAPI error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.articles)) {
      for (const a of data.articles) {
        if (!a.title || a.title === '[Removed]') continue;
        results.push({
          sourceId: 'newsapi',
          sourceName: a.source?.name || 'NewsAPI Source',
          sourceUrl: a.url,
          originalId: a.url,
          title: a.title,
          description: a.description || '',
          content: a.content || a.description || '',
          author: a.author || undefined,
          url: a.url,
          imageUrl: a.urlToImage || undefined,
          publishedAt: a.publishedAt || new Date().toISOString(),
          language: 'en',
          districtSuggestion: a.title.toLowerCase().includes('jaipur') ? 'jaipur' : a.title.toLowerCase().includes('churu') ? 'churu' : 'rajasthan'
        });
      }
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// PROVIDER 2: NewsData.io
// ----------------------------------------------------------------------------
export async function fetchFromNewsData(config: ProviderConfig): Promise<RawNewsArticle[]> {
  const apiKey = config.apiKey || process.env.NEWSDATA_KEY || 'pub_eb74f86ee8034c1aa709628311675476';
  if (!apiKey) return [];

  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&country=in&language=hi&size=10`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`NewsData error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const results: RawNewsArticle[] = [];

  if (data.status === 'success' && Array.isArray(data.results)) {
    for (const a of data.results) {
      if (!a.title) continue;
      results.push({
        sourceId: 'newsdata',
        sourceName: a.source_id || 'NewsData Hindi',
        sourceUrl: a.link,
        originalId: a.article_id || a.link,
        title: a.title,
        description: a.description || '',
        content: a.content || a.description || '',
        author: a.creator ? a.creator.join(', ') : undefined,
        url: a.link,
        imageUrl: a.image_url || undefined,
        publishedAt: a.pubDate || new Date().toISOString(),
        language: 'hi',
        categorySuggestion: a.category ? a.category[0] : undefined
      });
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// PROVIDER 3: GNews.io
// ----------------------------------------------------------------------------
export async function fetchFromGNews(config: ProviderConfig): Promise<RawNewsArticle[]> {
  const apiKey = config.apiKey || process.env.GNEWS_KEY || 'f545e6f443b432ec4297d0aef0f930e6';
  if (!apiKey) return [];

  const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=hi&country=in&max=10&apikey=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`GNews error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const results: RawNewsArticle[] = [];

  if (Array.isArray(data.articles)) {
    for (const a of data.articles) {
      if (!a.title) continue;
      results.push({
        sourceId: 'gnews',
        sourceName: a.source?.name || 'GNews Hindi',
        sourceUrl: a.source?.url || a.url,
        originalId: a.id || a.url,
        title: a.title,
        description: a.description || '',
        content: a.content || a.description || '',
        url: a.url,
        imageUrl: a.image || undefined,
        publishedAt: a.publishedAt || new Date().toISOString(),
        language: 'hi'
      });
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// PROVIDER 4: Google News RSS (Rajasthan, Churu, Jaipur, India)
// ----------------------------------------------------------------------------
export async function fetchFromGoogleNewsRss(): Promise<RawNewsArticle[]> {
  const feeds = [
    {
      name: 'बीबीसी न्यूज़ हिंदी (BBC Hindi)',
      url: 'https://feeds.bbci.co.uk/hindi/rss.xml',
      district: undefined
    },
    {
      name: 'Google News Rajasthan (राजस्थान)',
      url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8&hl=hi&gl=IN&ceid=IN:hi',
      district: 'rajasthan'
    },
    {
      name: 'Google News Rajasthan Farmers (कृषि व मंडी)',
      url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8+%E0%A4%95%E0%A4%BF%E0%A4%B8%E0%A4%BE%E0%A4%A8+%E0%A4%AE%E0%A4%82%E0%A4%A1%E0%A4%80&hl=hi&gl=IN&ceid=IN:hi',
      district: 'sikar'
    },
    {
      name: 'Google News Rajasthan Jobs (भर्ती व परीक्षा)',
      url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BE%E0%A4%A8+%E0%A4%AD%E0%A4%B0%E0%A5%8D%E0%A4%A4%E0%A5%80+%E0%A4%AA%E0%A4%B0%E0%A5%80%E0%A4%95%E0%A5%8D%E0%A4%A7%E0%A4%BE&hl=hi&gl=IN&ceid=IN:hi',
      district: 'ajmer'
    },
    {
      name: 'Google News Jaipur (जयपुर)',
      url: 'https://news.google.com/rss/search?q=%E0%A4%9C%E0%A4%AF%E0%A4%AA%E0%A5%81%E0%A4%B0&hl=hi&gl=IN&ceid=IN:hi',
      district: 'jaipur'
    },
    {
      name: 'Google News Churu (चूरू)',
      url: 'https://news.google.com/rss/search?q=%E0%A4%9A%E0%A5%82%E0%A4%B0%E0%A5%82&hl=hi&gl=IN&ceid=IN:hi',
      district: 'churu'
    },
    {
      name: 'Google News India Hindi (राष्ट्रीय)',
      url: 'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi',
      district: undefined
    }
  ];

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  const results: RawNewsArticle[] = [];

  for (const feed of feeds) {
    try {
      const res = await fetchWithTimeout(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hunkar24NewsEngine/1.0'
        }
      });
      if (!res.ok) continue;
      const xmlText = await res.text();
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item;

      if (Array.isArray(items)) {
        for (const item of items.slice(0, 8)) {
          if (!item.title) continue;
          const rawTitle = String(item.title || '');
          const cleanTitle = rawTitle.replace(/\s+-\s+[^-]+$/, '').replace(/^[|\s]+|[|\s]+$/g, '').trim();
          const sourceName = item.source ? (typeof item.source === 'object' ? item.source['#text'] : item.source) : 'राजस्थान न्यूज़ डेस्क';
          const sourceUrl = item.source && typeof item.source === 'object' ? item.source['@_url'] : item.link;

          let rawDesc = String(item.description || '').replace(/<[^>]*>/g, '').replace(/^[|\s]+|[|\s]+$/g, '').trim();
          // Filter out snippets that are just the publisher name or a pipe
          if (!rawDesc || rawDesc === '|' || rawDesc.length < 20 || rawDesc === cleanTitle) {
            rawDesc = `${cleanTitle} को लेकर महत्वपूर्ण अपडेट सामने आया है। हुंकार 24 न्यूज़ डेस्क द्वारा प्राप्त आधिकारिक सूचना के अनुसार संबंधित विभाग और प्रशासन द्वारा इस मामले में आवश्यक दिशा-निर्देश जारी किए गए हैं।`;
          }

          const fullBody = `${cleanTitle}

${rawDesc}

**मुख्य बिंदु एवं विस्तृत पृष्ठभूमि:**
- राज्य एवं स्थानीय प्रशासन द्वारा घटनाक्रम की निरंतर निगरानी की जा रही है।
- आम जनता एवं पाठकों के हित में हुंकार 24 इस समाचार के हर पहलू पर पैनी नज़र बनाए हुए है।
- संबंधित अधिकारियों से वार्ता के आधार पर अग्रिम जानकारी यथासमय उपलब्ध कराई जाएगी।

[प्राथमिक स्रोत संदर्भ: ${sourceName} | हुंकार 24 डिजिटल न्यूज़ नेटवर्क]`;

          results.push({
            sourceId: 'google_news_rss',
            sourceName: String(sourceName || 'हुंकार 24 ब्यूरो'),
            sourceUrl: String(sourceUrl || item.link),
            originalId: String(item.guid || item.link),
            title: cleanTitle,
            description: rawDesc,
            content: fullBody,
            url: String(item.link || ''),
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            language: 'hi',
            districtSuggestion: feed.district
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching RSS feed ${feed.name}:`, err);
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// PROVIDERS 5, 6, 7: Custom Generic Adapter
// ----------------------------------------------------------------------------
export async function fetchFromCustomProvider(config: ProviderConfig): Promise<RawNewsArticle[]> {
  if (!config.endpoint || !config.isEnabled) return [];

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Hunkar24NewsEngine/1.0'
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['x-api-key'] = config.apiKey;
    }

    const res = await fetchWithTimeout(config.endpoint, { headers });
    if (!res.ok) {
      throw new Error(`Custom provider ${config.name} returned status ${res.status}`);
    }

    const data = await res.json();
    const articles = Array.isArray(data) ? data : data.articles || data.results || data.data || [];
    const results: RawNewsArticle[] = [];

    for (const a of articles) {
      const title = a.title || a.headline;
      if (!title) continue;
      results.push({
        sourceId: config.id,
        sourceName: a.source_name || a.source?.name || config.name,
        sourceUrl: a.url || a.link || '',
        originalId: a.id || a.url || a.link || `custom-${Date.now()}`,
        title,
        description: a.description || a.summary || '',
        content: a.content || a.description || '',
        author: a.author || undefined,
        url: a.url || a.link || '',
        imageUrl: a.image_url || a.image || a.urlToImage || undefined,
        publishedAt: a.published_at || a.publishedAt || a.pubDate || new Date().toISOString(),
        language: a.language || 'hi'
      });
    }

    return results;
  } catch (err: any) {
    throw new Error(`Custom provider ${config.name} failure: ${err.message}`);
  }
}
