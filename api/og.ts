/**
 * Zero-dependency Vercel Serverless Function for Social Link Preview Cards (WhatsApp, Telegram, Facebook, X, LinkedIn)
 * Serves rich OpenGraph & Twitter Card HTML when crawlers request /, /<category>, or /news/<slug> on Vercel.
 * Strictly code-only — adds zero visible UI buttons or links.
 */

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getOrigin(req: any): string {
  const protoHeader = (req?.headers?.['x-forwarded-proto'] as string) || 'https';
  const proto = protoHeader.split(',')[0].trim();
  const hostHeader = (req?.headers?.['x-forwarded-host'] as string) || req?.headers?.host || 'hunkar24.in';
  const host = hostHeader.split(',')[0].trim();
  return `${proto}://${host}`;
}

interface ResolvedMeta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
  type: 'website' | 'article';
  publishedTime?: string;
  section?: string;
}

async function resolveFromSupabase(slug: string): Promise<any | null> {
  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey || !slug) return null;

  try {
    const cleanUrl = supaUrl.replace(/\/+$/, '');
    const query = `${cleanUrl}/rest/v1/articles?select=id,headline,slug,summary,main_image,image_alt,category_slug,published_at&or=(slug.eq.${encodeURIComponent(slug)},id.eq.${encodeURIComponent(slug)})&limit=1`;
    const resp = await fetch(query, {
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`
      }
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

async function resolveFromFirebase(slug: string): Promise<any | null> {
  const dbUrl = process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl || !slug) return null;

  try {
    const cleanDb = dbUrl.replace(/\/+$/, '');
    const resp = await fetch(`${cleanDb}/articles.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data || typeof data !== 'object') return null;

    const lower = slug.toLowerCase();
    const values = Object.values(data) as any[];
    return (
      values.find(a => a && ((a.slug && String(a.slug).toLowerCase() === lower) || (a.id && String(a.id).toLowerCase() === lower))) ||
      null
    );
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const origin = getOrigin(req);
  const shareCardUrl = `${origin}/assets/hunkar24-share-card.jpg`;
  const logoUrl = `${origin}/assets/hunkar24-logo.png`;

  const rawPath = typeof req?.query?.path === 'string' ? req.query.path : '/';
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  let meta: ResolvedMeta = {
    title: 'HUNKAR 24 (हुंकार 24) – राजस्थान की बुलंद आवाज़',
    description:
      'राजस्थान एवं देश-विदेश की निष्पक्ष ताज़ा खबरें, ब्रेकिंग न्यूज़, ग्राउंड रिपोर्ट, सरकारी योजनाएं व मंडी भाव। अभी पढ़ें हुंकार 24 पर।',
    image: shareCardUrl,
    imageAlt: 'HUNKAR 24 (हुंकार 24) – राजस्थान की बुलंद आवाज़ आधिकारिक लोगो कार्ड',
    url: `${origin}${normalizedPath === '/' ? '/' : normalizedPath}`,
    type: 'website'
  };

  if (normalizedPath.startsWith('/news/')) {
    const rawSlug = normalizedPath.slice('/news/'.length).split('?')[0].replace(/\/+$/, '');
    let decodedSlug = rawSlug;
    try {
      decodedSlug = decodeURIComponent(rawSlug);
    } catch {
      decodedSlug = rawSlug;
    }

    const row = (await resolveFromSupabase(decodedSlug)) || (await resolveFromFirebase(decodedSlug));
    if (row) {
      const rawImg = row.main_image || row.mainImage || '';
      const resolvedImg =
        !rawImg || rawImg.startsWith('data:')
          ? shareCardUrl
          : rawImg.startsWith('http://') || rawImg.startsWith('https://')
          ? rawImg
          : `${origin}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

      meta = {
        title: `${row.headline} | HUNKAR 24 (हुंकार 24)`,
        description: String(row.summary || row.headline || '').slice(0, 260),
        image: resolvedImg,
        imageAlt: row.image_alt || row.imageAlt || row.headline || 'HUNKAR 24 समाचार',
        url: `${origin}/news/${encodeURIComponent(row.slug || row.id)}`,
        type: 'article',
        publishedTime: row.published_at || row.publishedAt,
        section: row.category_slug || row.category
      };
    }
  }

  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeImage = escapeHtml(meta.image);
  const safeImageAlt = escapeHtml(meta.imageAlt);
  const safeUrl = escapeHtml(meta.url);
  const safeLogo = escapeHtml(logoUrl);

  const html = `<!doctype html>
<html lang="hi">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeUrl}" />
    <link rel="icon" type="image/png" href="${safeLogo}" />
    <link rel="alternate" type="text/plain" title="LLMs Context" href="${escapeHtml(origin)}/llms.txt" />
    <link rel="alternate" type="text/plain" title="LLM Context" href="${escapeHtml(origin)}/llm.txt" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:site_name" content="HUNKAR 24 (हुंकार 24)" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:secure_url" content="${safeImage}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="675" />
    <meta property="og:image:alt" content="${safeImageAlt}" />
    <meta property="og:logo" content="${safeLogo}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:locale" content="hi_IN" />
    ${meta.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />` : ''}
    ${meta.section ? `<meta property="article:section" content="${escapeHtml(meta.section)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@Hunkar24News" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:image:alt" content="${safeImageAlt}" />
  </head>
  <body>
    <noscript><a href="${safeUrl}">${safeTitle}</a></noscript>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}
