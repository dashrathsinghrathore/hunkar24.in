/**
 * HUNKAR 24 (हुंकार 24) - Dynamic Google SEO & Premium OpenGraph Card Manager
 * Dynamically updates document title, OpenGraph tags, Twitter cards, canonical link,
 * and Schema.org JSON-LD (NewsArticle / CollectionPage / BreadcrumbList) for Google Search & social cards.
 */

import { Article } from '../types';
import { SITE_CONFIG } from '../config/siteConfig';
import { sanitizeHeadline, sanitizeSummary } from './newsUtils';

const DEFAULT_TITLE = 'HUNKAR 24 – राजस्थान की बुलंद आवाज़ | ताज़ा हिंदी समाचार';
const DEFAULT_DESCRIPTION =
  'राजस्थान एवं देश-विदेश की निष्पक्ष ताज़ा खबरें, ब्रेकिंग न्यूज़, ग्राउंड रिपोर्ट, सरकारी योजनाएं, RPSC/REET रोज़गार व मंडी भाव पढ़ें HUNKAR 24 (हुंकार 24) पर।';
const SHARE_CARD_PATH = '/assets/hunkar24-share-card.jpg';
const BRAND_LOGO_PATH = '/assets/hunkar24-logo.png';
const SCHEMA_SCRIPT_ID = 'hunkar24-dynamic-article-schema';

function setMetaTag(selector: string, attr: string, value: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const [attrName, attrVal] = selector.replace(/[\[\]']/g, '').split('=');
    if (attrName && attrVal) {
      element.setAttribute(attrName, attrVal);
      document.head.appendChild(element);
    }
  }
  element.setAttribute(attr, value);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function upsertDynamicSchema(data: object | null) {
  const existing = document.getElementById(SCHEMA_SCRIPT_ID);
  if (!data) {
    if (existing) existing.remove();
    return;
  }
  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Updates Google SEO, OpenGraph, Twitter Card, and Schema.org JSON-LD for category / district / homepage views
 */
export function updateCategorySEO(categorySlug: string, categoryTitleHi: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const baseUrl = window.location?.origin || SITE_CONFIG.currentSiteUrl;
  const shareCardUrl = `${baseUrl}${SHARE_CARD_PATH}`;
  const isHome = !categorySlug || categorySlug === 'all' || categorySlug === 'home';

  const pageUrl = isHome ? `${baseUrl}/` : `${baseUrl}/${encodeURIComponent(categorySlug)}`;
  const pageTitle = isHome
    ? DEFAULT_TITLE
    : `${categoryTitleHi} समाचार – ताज़ा खबरें व अपडेट्स | HUNKAR 24 (हुंकार 24)`;
  const pageDesc = isHome
    ? DEFAULT_DESCRIPTION
    : `${categoryTitleHi} से जुड़ी ताज़ा खबरें, ब्रेकिंग न्यूज़, ग्राउंड रिपोर्ट, प्रशासनिक अपडेट्स व स्थानीय समाचार पढ़ें HUNKAR 24 (हुंकार 24) पर।`;

  document.title = pageTitle;
  setCanonical(pageUrl);

  setMetaTag('meta[name="description"]', 'content', pageDesc);
  setMetaTag('meta[property="og:type"]', 'content', 'website');
  setMetaTag('meta[property="og:site_name"]', 'content', 'HUNKAR 24 (हुंकार 24)');
  setMetaTag('meta[property="og:title"]', 'content', pageTitle);
  setMetaTag('meta[property="og:description"]', 'content', pageDesc);
  setMetaTag('meta[property="og:image"]', 'content', shareCardUrl);
  setMetaTag('meta[property="og:image:secure_url"]', 'content', shareCardUrl);
  setMetaTag('meta[property="og:image:alt"]', 'content', 'HUNKAR 24 (हुंकार 24) – राजस्थान की बुलंद आवाज़');
  setMetaTag('meta[property="og:url"]', 'content', pageUrl);

  setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'content', pageTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', pageDesc);
  setMetaTag('meta[name="twitter:image"]', 'content', shareCardUrl);
  setMetaTag('meta[name="twitter:image:alt"]', 'content', 'HUNKAR 24 (हुंकार 24) – राजस्थान की बुलंद आवाज़');

  if (isHome) {
    upsertDynamicSchema(null);
    return;
  }

  upsertDynamicSchema({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': pageTitle,
        'description': pageDesc,
        'inLanguage': 'hi-IN',
        'isPartOf': { '@id': `${baseUrl}/#website` }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'होम (Home)',
            'item': `${baseUrl}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': `${categoryTitleHi} समाचार`,
            'item': pageUrl
          }
        ]
      }
    ]
  });
}

/**
 * Updates page SEO tags dynamically when viewing a specific news article
 */
export function updateArticleSEO(article: Article | null) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const baseUrl = window.location?.origin || SITE_CONFIG.currentSiteUrl;
  const shareCardUrl = `${baseUrl}${SHARE_CARD_PATH}`;
  const brandLogoUrl = `${baseUrl}${BRAND_LOGO_PATH}`;

  if (!article) {
    updateCategorySEO('all', 'सभी');
    return;
  }

  const cleanTitle = sanitizeHeadline(article.headline);
  const cleanDesc = sanitizeSummary(article.summary, cleanTitle, article.category).slice(0, 160);
  const pageUrl = `${baseUrl}/news/${article.slug}`;
  const rawImg = article.mainImage || shareCardUrl;
  const imageUrl =
    rawImg.startsWith('data:')
      ? shareCardUrl
      : rawImg.startsWith('http')
      ? rawImg
      : `${baseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
  const pageTitle = `${cleanTitle} | HUNKAR 24 (हुंकार 24)`;

  // 1. Update Title and Canonical
  document.title = pageTitle;
  setCanonical(pageUrl);

  // 2. Standard Meta Description
  setMetaTag('meta[name="description"]', 'content', cleanDesc);

  // 3. OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Telegram)
  setMetaTag('meta[property="og:type"]', 'content', 'article');
  setMetaTag('meta[property="og:site_name"]', 'content', 'HUNKAR 24 (हुंकार 24)');
  setMetaTag('meta[property="og:title"]', 'content', cleanTitle);
  setMetaTag('meta[property="og:description"]', 'content', cleanDesc);
  setMetaTag('meta[property="og:image"]', 'content', imageUrl);
  setMetaTag('meta[property="og:image:secure_url"]', 'content', imageUrl);
  setMetaTag('meta[property="og:image:alt"]', 'content', cleanTitle);
  setMetaTag('meta[property="og:url"]', 'content', pageUrl);
  if (article.publishedAt) {
    setMetaTag('meta[property="article:published_time"]', 'content', article.publishedAt);
  }
  if (article.updatedAt || article.publishedAt) {
    setMetaTag('meta[property="article:modified_time"]', 'content', article.updatedAt || article.publishedAt);
  }
  if (article.category) {
    setMetaTag('meta[property="article:section"]', 'content', article.category);
  }

  // 4. Twitter / X Card Tags
  setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'content', cleanTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', cleanDesc);
  setMetaTag('meta[name="twitter:image"]', 'content', imageUrl);
  setMetaTag('meta[name="twitter:image:alt"]', 'content', cleanTitle);

  // 5. Schema.org NewsArticle + BreadcrumbList JSON-LD structured data for Google Search & Google News
  upsertDynamicSchema({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': pageUrl
        },
        'headline': cleanTitle,
        'description': cleanDesc,
        'image': [imageUrl, shareCardUrl],
        'datePublished': article.publishedAt,
        'dateModified': article.updatedAt || article.publishedAt,
        'inLanguage': 'hi-IN',
        'author': {
          '@type': 'NewsMediaOrganization',
          'name': 'HUNKAR 24',
          'url': baseUrl
        },
        'publisher': {
          '@type': 'NewsMediaOrganization',
          'name': 'HUNKAR 24',
          'alternateName': 'हुंकार 24',
          'url': baseUrl,
          'logo': {
            '@type': 'ImageObject',
            'url': brandLogoUrl,
            'width': 600,
            'height': 600
          }
        },
        'articleSection': article.category,
        'keywords': article.tags && article.tags.length > 0 ? article.tags.join(', ') : 'राजस्थान, ताज़ा खबर'
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'होम (Home)',
            'item': `${baseUrl}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': article.category || 'राजस्थान',
            'item': `${baseUrl}/${encodeURIComponent(article.category || 'rajasthan')}`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': cleanTitle,
            'item': pageUrl
          }
        ]
      }
    ]
  });
}
