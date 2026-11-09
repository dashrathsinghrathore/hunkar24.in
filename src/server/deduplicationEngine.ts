import { RawNewsArticle } from './newsProviders';

export interface ProcessedArticle {
  id: string;
  sourceArticles: Array<{
    sourceId: string;
    sourceName: string;
    url: string;
  }>;
  canonicalUrl: string;
  titleHindi: string;
  summaryHindi: string;
  contentHindi: string;
  originalTitle: string;
  originalLanguage: string;
  category: string;
  district?: string;
  tehsil?: string;
  imageUrl?: string;
  imageSource?: string;
  publishedAt: string;
  verificationLevel: 'multiple_sources' | 'single_source' | 'source_verified' | 'needs_verification' | 'sensitive_topic';
  sensitiveFlags: string[];
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  duplicateCount: number;
  similarityScore: number;
}

// Normalize text for comparison
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaccard word similarity between 0 and 1
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const wordsA = new Set(normalizeTitle(titleA).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeTitle(titleB).split(' ').filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Normalize canonical URL (strip tracking params like utm_*, ref, oc, etc.)
export function cleanCanonicalUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_campaign');
    url.searchParams.delete('oc');
    url.searchParams.delete('ref');
    url.searchParams.delete('fbclid');
    return url.origin + url.pathname;
  } catch {
    return rawUrl.split('?')[0];
  }
}

// Group and deduplicate a list of raw articles
export function deduplicateArticles(rawArticles: RawNewsArticle[]): Array<{
  primary: RawNewsArticle;
  duplicates: RawNewsArticle[];
  isDuplicate: boolean;
}> {
  const groups: Array<{
    primary: RawNewsArticle;
    duplicates: RawNewsArticle[];
    isDuplicate: boolean;
  }> = [];

  for (const current of rawArticles) {
    const currentCleanUrl = cleanCanonicalUrl(current.url);
    const currentNormTitle = normalizeTitle(current.title);

    let matchedGroup = null;

    for (const group of groups) {
      const groupCleanUrl = cleanCanonicalUrl(group.primary.url);
      const groupNormTitle = normalizeTitle(group.primary.title);

      // Exact URL match
      if (currentCleanUrl && groupCleanUrl && currentCleanUrl === groupCleanUrl) {
        matchedGroup = group;
        break;
      }

      // Title similarity match (>= 0.65 threshold)
      const similarity = calculateTitleSimilarity(currentNormTitle, groupNormTitle);
      if (similarity >= 0.65) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.duplicates.push(current);
      matchedGroup.isDuplicate = true;
    } else {
      groups.push({
        primary: current,
        duplicates: [],
        isDuplicate: false
      });
    }
  }

  return groups;
}
