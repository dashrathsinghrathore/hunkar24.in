/**
 * Firebase Realtime Database Client for Hunkar 24 (हुंकार 24)
 * Project: hunkar24
 * Realtime Database URL: https://hunkar24-default-rtdb.asia-southeast1.firebasedatabase.app
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  Database,
  DataSnapshot
} from 'firebase/database';
import { Article, BreakingNewsItem } from '../types';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvSh0pBO6rxxlkjnQ9K4OCu9qGZSIcn1E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hunkar24.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hunkar24-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hunkar24",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hunkar24.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "296053970998",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:296053970998:web:ae4f7bccd02818c1042097",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QQKTFVD6SQ"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  !firebaseConfig.databaseURL.includes('your-project')
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Database | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getDatabase(appInstance);
  } catch (err) {
    console.warn('[Firebase] App initialization notice:', err);
  }
}

export const firebaseApp = appInstance;
export const firebaseDb = dbInstance;

// Optional Analytics initialization (browser only)
if (typeof window !== 'undefined' && firebaseConfig.measurementId && firebaseApp) {
  import('firebase/analytics')
    .then(({ getAnalytics, isSupported }) => {
      isSupported().then(yes => {
        if (yes && firebaseApp) getAnalytics(firebaseApp);
      }).catch(() => {});
    })
    .catch(() => {});
}

/**
 * Save or publish an article in Firebase Realtime Database
 */
export async function saveArticleToFirebase(article: Article): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb) return false;
  try {
    const articleRef = ref(firebaseDb, `articles/${article.id}`);
    await set(articleRef, {
      ...article,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.warn('[Firebase RTDB] Failed to save article:', error);
    return false;
  }
}

/**
 * Update an existing article in Firebase Realtime Database
 */
export async function updateArticleInFirebase(id: string, updates: Partial<Article>): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb) return false;
  try {
    const articleRef = ref(firebaseDb, `articles/${id}`);
    await update(articleRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.warn('[Firebase RTDB] Failed to update article:', error);
    return false;
  }
}

/**
 * Delete an article from Firebase Realtime Database
 */
export async function deleteArticleFromFirebase(id: string): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb) return false;
  try {
    const articleRef = ref(firebaseDb, `articles/${id}`);
    await remove(articleRef);
    return true;
  } catch (error) {
    console.warn('[Firebase RTDB] Failed to delete article:', error);
    return false;
  }
}

/**
 * Save breaking news item in Firebase Realtime Database
 */
export async function saveBreakingNewsToFirebase(item: BreakingNewsItem): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb) return false;
  try {
    const newsRef = ref(firebaseDb, `breaking_news/${item.id}`);
    await set(newsRef, item);
    return true;
  } catch (error) {
    console.warn('[Firebase RTDB] Failed to save breaking news:', error);
    return false;
  }
}

/**
 * Delete breaking news item from Firebase Realtime Database
 */
export async function deleteBreakingNewsFromFirebase(id: string): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb) return false;
  try {
    const newsRef = ref(firebaseDb, `breaking_news/${id}`);
    await remove(newsRef);
    return true;
  } catch (error) {
    console.warn('[Firebase RTDB] Failed to delete breaking news:', error);
    return false;
  }
}

/**
 * Real-time listener for articles. Automatically fires callback when any device writes.
 */
export function subscribeToFirebaseArticles(callback: (articles: Article[]) => void): () => void {
  if (!isFirebaseConfigured || !firebaseDb) return () => {};

  const articlesRef = ref(firebaseDb, 'articles');
  const unsubscribe = onValue(
    articlesRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const list: Article[] = Object.values(data);
      // Sort newest first
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('[Firebase RTDB] Articles subscription notice:', err.message);
    }
  );

  return () => {
    try {
      off(articlesRef, 'value', unsubscribe);
    } catch {
      // ignore
    }
  };
}

/**
 * Real-time listener for breaking news
 */
export function subscribeToFirebaseBreakingNews(callback: (items: BreakingNewsItem[]) => void): () => void {
  if (!isFirebaseConfigured || !firebaseDb) return () => {};

  const breakingRef = ref(firebaseDb, 'breaking_news');
  const unsubscribe = onValue(
    breakingRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const list: BreakingNewsItem[] = Object.values(data);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('[Firebase RTDB] Breaking news subscription notice:', err.message);
    }
  );

  return () => {
    try {
      off(breakingRef, 'value', unsubscribe);
    } catch {
      // ignore
    }
  };
}

/**
 * Populate initial articles into Firebase Realtime Database if empty
 */
export async function seedFirebaseIfEmpty(initialArticles: Article[], initialBreaking: BreakingNewsItem[]): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  try {
    const articlesRef = ref(firebaseDb, 'articles');
    const snapshot = await get(articlesRef);
    const existingVal = snapshot.val() || {};

    if (!snapshot.exists() || Object.keys(existingVal).length === 0) {
      console.log('[Firebase RTDB] Seeding initial articles to Realtime Database...');
      const seedMap: Record<string, Article> = {};
      for (const a of initialArticles) {
        seedMap[a.id] = {
          ...a,
          views: a.views || 0,
          likesCount: a.likesCount || 0
        };
      }
      await set(articlesRef, seedMap);
    } else {
      // Ensure the important featured articles (like Katar Kabaddi) exist in RTDB
      for (const a of initialArticles) {
        if (!existingVal[a.id]) {
          console.log(`[Firebase RTDB] Syncing featured article ${a.id} to Realtime Database...`);
          await set(ref(firebaseDb, `articles/${a.id}`), {
            ...a,
            views: 0,
            likesCount: 0
          });
        }
      }
    }

    const breakingRef = ref(firebaseDb, 'breaking_news');
    const breakingSnap = await get(breakingRef);
    const existingBreaking = breakingSnap.val() || {};

    if (!breakingSnap.exists() || Object.keys(existingBreaking).length === 0) {
      const seedBreakingMap: Record<string, BreakingNewsItem> = {};
      for (const b of initialBreaking) {
        seedBreakingMap[b.id] = b;
      }
      await set(breakingRef, seedBreakingMap);
    } else {
      for (const b of initialBreaking) {
        if (!existingBreaking[b.id]) {
          await set(ref(firebaseDb, `breaking_news/${b.id}`), b);
        }
      }
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB] Seeding notice (check security rules):', err.message);
  }
}
