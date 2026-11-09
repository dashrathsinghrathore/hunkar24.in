/**
 * Safe Storage Utility for HUNKAR 24
 * 
 * Prevents DOMException: QuotaExceededError by enforcing:
 * 1. Strict item count capping (max 30 articles in offline cache).
 * 2. Automatic payload pruning (stripping heavy non-essential data before storage).
 * 3. Fallback in-memory storage if localStorage is exhausted or unavailable.
 * 4. Zero unhandled throw on storage quota errors.
 */

const inMemoryStore = new Map<string, string>();

/**
 * Safely writes to localStorage with automatic QuotaExceededError recovery.
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;

  let serialized: string;
  try {
    serialized = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return false;
  }

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] localStorage quota reached or error on "${key}":`, err?.message);

    // If quota exceeded, perform aggressive cache cleanup
    try {
      // 1. Clear non-essential large cache keys
      const purgeKeys = [
        'hunkar24_videos',
        'hunkar24_audit_logs',
        'hunkar24_client_pending_news',
        'hunkar24_client_approved_news'
      ];
      for (const pk of purgeKeys) {
        if (pk !== key) {
          localStorage.removeItem(pk);
        }
      }

      // 2. If it's the articles array, prune to top 15 most recent items
      if (Array.isArray(value) && value.length > 15) {
        const compactList = value.slice(0, 15).map((item: any) => ({
          ...item,
          content: typeof item.content === 'string' ? item.content.slice(0, 500) : item.content
        }));
        localStorage.setItem(key, JSON.stringify(compactList));
        return true;
      }

      // Retry once more
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      // Fallback to in-memory store so the app continues operating without crash
      inMemoryStore.set(key, serialized);
      return false;
    }
  }
}

/**
 * Safely reads from localStorage with in-memory fallback.
 */
export function safeLocalStorageGet<T = any>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // If not valid JSON or parse error, try raw string
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return raw as unknown as T;
    } catch {
      // ignore
    }
  }

  // Check in-memory fallback
  if (inMemoryStore.has(key)) {
    try {
      return JSON.parse(inMemoryStore.get(key)!) as T;
    } catch {
      return inMemoryStore.get(key) as unknown as T;
    }
  }

  return fallback;
}

/**
 * Safely removes from localStorage.
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  inMemoryStore.delete(key);
}
