import { Article, BreakingNewsItem } from '../types';

/**
 * Normalizes a headline by removing punctuation, extra whitespace,
 * lowercase conversion, and stripping common noisy prefix words.
 */
export function normalizeHeadline(headline: string): string {
  if (!headline) return '';
  return headline
    .toLowerCase()
    .replace(/^\[(अपडेट|ब्रेकिंग|ताज़ा|विशेष|अलर्ट)\]\s*/i, '')
    .replace(/^(ताज़ा अपडेट|ब्रेकिंग न्यूज़|बड़ी खबर|विशेष बुलेटिन)\s*[:|-]\s*/i, '')
    .replace(/[^\w\u0900-\u097F\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Jaccard token similarity between two headlines.
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
    if (minLen / maxLen >= 0.6) return 0.95;
  }

  // Tokenization (words >= 3 characters)
  const tokens1 = norm1.split(' ').filter(w => w.length >= 3);
  const tokens2 = norm2.split(' ').filter(w => w.length >= 3);
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Returns true if two headlines refer to the exact same news story.
 */
export function areHeadlinesDuplicate(h1: string, h2: string): boolean {
  const sim = calculateTitleSimilarity(h1, h2);
  return sim >= 0.55; // High confidence deduplication threshold
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
  const seenIds = new Set<string>();
  const seenSourceUrls = new Set<string>();

  for (const art of articles) {
    if (!art || !art.id || !art.headline) continue;

    // 1. Exact ID check
    if (seenIds.has(art.id)) continue;

    // 2. Exact Slug check
    if (art.slug && seenSlugs.has(art.slug)) continue;

    // 3. Exact Source URL check
    if (art.sourceUrl && seenSourceUrls.has(art.sourceUrl)) continue;

    // 4. Headline similarity check against all accepted canonical stories
    const isDuplicate = seenHeadlines.some(existingHeadline =>
      areHeadlinesDuplicate(existingHeadline, art.headline)
    );

    if (isDuplicate) {
      continue; // Discard duplicate story!
    }

    // Mark as seen
    seenIds.add(art.id);
    if (art.slug) seenSlugs.add(art.slug);
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
