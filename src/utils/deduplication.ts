import { Article, BreakingNewsItem } from '../types';

const HINDI_STOP_WORDS = new Set([
  'में', 'को', 'का', 'के', 'की', 'पर', 'से', 'है', 'हैं', 'और', 'ने', 'हो', 'हुए',
  'गया', 'गई', 'दिया', 'लिए', 'बड़ा', 'बड़ी', 'ताज़ा', 'अपडेट', 'ब्रेकिंग', 'खबर',
  'न्यूज़', 'राजस्थान', 'हुंकार', 'इस', 'यह', 'वह', 'भी', 'तो', 'था', 'थे', 'थी',
  'कर', 'रहा', 'रही', 'रहे', 'द्वारा', 'किया', 'हुई', 'तक', 'एवं', 'व'
]);

/**
 * Normalizes a headline by removing punctuation, extra whitespace,
 * lowercase conversion, and stripping common noisy prefix words.
 */
export function normalizeHeadline(headline: string): string {
  if (!headline) return '';
  return headline
    .toLowerCase()
    .replace(/^\[(अपडेट|ब्रेकिंग|ताज़ा|विशेष|अलर्ट)\]\s*/i, '')
    .replace(/^(ताज़ा अपडेट|ब्रेकिंग न्यूज़|बड़ी खबर|विशेष बुलेटिन|हुंकार ग्राउंड रिपोर्ट|एक्सक्लूसिव)\s*[:|-]\s*/i, '')
    .replace(/[^\w\u0900-\u097F\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts key substantive words from a Hindi headline (ignoring grammar particles)
 */
export function extractHeadlineKeywords(headline: string): string[] {
  const norm = normalizeHeadline(headline);
  return norm
    .split(' ')
    .filter(word => word.length >= 2 && !HINDI_STOP_WORDS.has(word));
}

/**
 * Calculates keyword and token similarity between two headlines.
 */
export function calculateTitleSimilarity(h1: string, h2: string): number {
  const norm1 = normalizeHeadline(h1);
  const norm2 = normalizeHeadline(h2);
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  // Direct substring inclusion check with length threshold
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    if (minLen / maxLen >= 0.5) return 0.95;
  }

  // Substantive keyword overlap
  const kw1 = extractHeadlineKeywords(h1);
  const kw2 = extractHeadlineKeywords(h2);
  if (kw1.length === 0 || kw2.length === 0) return 0;

  const set1 = new Set(kw1);
  const set2 = new Set(kw2);

  let match = 0;
  for (const w of set1) {
    if (set2.has(w)) match++;
  }

  const union = new Set([...kw1, ...kw2]).size;
  const jaccard = union === 0 ? 0 : match / union;
  const minOverlap = match / Math.min(set1.size, set2.size);

  return Math.max(jaccard, minOverlap * 0.85);
}

/**
 * Returns true if two headlines refer to the exact same news story.
 */
export function areHeadlinesDuplicate(h1: string, h2: string): boolean {
  if (!h1 || !h2) return false;
  const n1 = normalizeHeadline(h1);
  const n2 = normalizeHeadline(h2);
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  const sim = calculateTitleSimilarity(h1, h2);
  return sim >= 0.42; // Robust journalistic deduplication threshold
}

/**
 * Deduplicates a list of articles, keeping ONLY THE SINGLE BEST CANONICAL COPY.
 * Discards all clones, identical stories, and duplicate URLs.
 */
export function deduplicateArticlesList(articles: Article[]): Article[] {
  if (!Array.isArray(articles)) return [];

  const canonicalList: Article[] = [];
  const seenHeadlines: string[] = [];
  const seenSlugs = new Set<string>();
  const seenBaseSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const seenSourceUrls = new Set<string>();

  for (const art of articles) {
    if (!art || !art.id || !art.headline) continue;

    // 1. Exact ID check
    if (seenIds.has(art.id)) continue;

    // 2. Exact Slug check
    if (art.slug && seenSlugs.has(art.slug)) continue;

    // 3. Base slug check (prevents identical stories with random ID suffix)
    const baseSlug = art.slug ? art.slug.replace(/-\d{3,}$/, '').replace(/-[a-f0-9]{4,}$/, '') : '';
    if (baseSlug && baseSlug.length > 8 && seenBaseSlugs.has(baseSlug)) continue;

    // 4. Exact Source URL check
    if (art.sourceUrl && seenSourceUrls.has(art.sourceUrl)) continue;

    // 5. Headline similarity check against all accepted canonical stories
    const isDuplicate = seenHeadlines.some(existingHeadline =>
      areHeadlinesDuplicate(existingHeadline, art.headline)
    );

    if (isDuplicate) {
      continue; // Discard duplicate story!
    }

    // Mark as seen
    seenIds.add(art.id);
    if (art.slug) seenSlugs.add(art.slug);
    if (baseSlug) seenBaseSlugs.add(baseSlug);
    if (art.sourceUrl) seenSourceUrls.add(art.sourceUrl);
    seenHeadlines.push(art.headline);

    canonicalList.push(art);
  }

  return canonicalList;
}

/**
 * Deduplicates Breaking News items, keeping only unique, active announcements.
 */
export function deduplicateBreakingNews(items: BreakingNewsItem[]): BreakingNewsItem[] {
  if (!Array.isArray(items)) return [];

  const canonical: BreakingNewsItem[] = [];
  const seenTexts: string[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item || !item.text) continue;
    if (seenIds.has(item.id)) continue;

    const norm = normalizeHeadline(item.text);
    if (!norm) continue;

    const isDuplicate = seenTexts.some(existing => {
      const sim = calculateTitleSimilarity(existing, item.text);
      return sim >= 0.55;
    });

    if (isDuplicate) continue;

    seenIds.add(item.id);
    seenTexts.push(item.text);
    canonical.push(item);
  }

  return canonical;
}
