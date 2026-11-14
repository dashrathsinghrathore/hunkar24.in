/**
 * HUNKAR 24 (हुंकार 24) - Dynamic SEO & OpenGraph Card Manager
 * Dynamically updates document title, OpenGraph tags, Twitter cards, canonical link,
 * and Schema.org NewsArticle JSON-LD structured data for Google Search and WhatsApp link previews.
 */

import { Article } from '../types';
import { SITE_CONFIG } from '../config/siteConfig';
import { sanitizeHeadline, sanitizeSummary } from './newsUtils';

const DEFAULT_TITLE = 'HUNKAR 24 – राजस्थान की बुलंद आवाज़ | हुंकार 24 डिजिटल न्यूज़';
const DEFAULT_DESCRIPTION = 'HUNKAR 24 (हुंकार 24) – राजस्थान एवं देश-विदेश का अग्रणी डिजिटल समाचार मंच। निष्पक्ष ताज़ा खबरें, ब्रेकिंग न्यूज़, ग्राउंड रिपोर्ट और सरकारी योजनाएँ।';
const DEFAULT_IMAGE = 'https://i.ibb.co/bMrrmCqP/hunkar24.png';
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

/**
 * Updates page SEO tags dynamically when viewing a specific news article
 */
export function updateArticleSEO(article: Article | null) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const baseUrl = window.location?.origin || SITE_CONFIG.currentSiteUrl;

  if (!article) {
    // Reset to default portal SEO
    document.title = DEFAULT_TITLE;
    setMetaTag('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
    setMetaTag('meta[property="og:type"]', 'content', 'website');
    setMetaTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
    setMetaTag('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
    setMetaTag('meta[property="og:image"]', 'content', DEFAULT_IMAGE);
    setMetaTag('meta[property="og:url"]', 'content', `${baseUrl}/`);
    setMetaTag('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
    setMetaTag('meta[name="twitter:description"]', 'content', DEFAULT_DESCRIPTION);
    setMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE);
    setCanonical(`${baseUrl}/`);

    // Remove dynamic article schema if present
    const existing = document.getElementById(SCHEMA_SCRIPT_ID);
    if (existing) existing.remove();
    return;
  }

  const cleanTitle = sanitizeHeadline(article.headline);
  const cleanDesc = sanitizeSummary(article.summary, cleanTitle, article.category).slice(0, 160);
  const pageUrl = `${baseUrl}/news/${article.slug}`;
  const rawImg = article.mainImage || DEFAULT_IMAGE;
  const imageUrl = rawImg.startsWith('http') ? rawImg : `${baseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
  const pageTitle = `${cleanTitle} – हुंकार 24`;

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

  // 4. Twitter / X Card Tags
  setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'content', cleanTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', cleanDesc);
  setMetaTag('meta[name="twitter:image"]', 'content', imageUrl);
  setMetaTag('meta[name="twitter:image:alt"]', 'content', cleanTitle);

  // 5. Schema.org NewsArticle JSON-LD structured data for Google News
  let script = document.getElementById(SCHEMA_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': pageUrl
    },
    'headline': cleanTitle,
    'description': cleanDesc,
    'image': [imageUrl],
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
        'url': DEFAULT_IMAGE,
        'width': 600,
        'height': 600
      }
    },
    'articleSection': article.category,
    'keywords': (article.tags && article.tags.length > 0) ? article.tags.join(', ') : 'राजस्थान, ताज़ा खबर'
  };

  script.textContent = JSON.stringify(newsArticleSchema);
}
