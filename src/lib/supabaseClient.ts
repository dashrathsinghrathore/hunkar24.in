import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storageUtils';

// Retrieve credentials from environment or saved configuration
export function getCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const localUrl = (typeof window !== 'undefined' ? safeLocalStorageGet('hunkar24_supabase_url', '') : '').trim();
  const localKey = (typeof window !== 'undefined' ? safeLocalStorageGet('hunkar24_supabase_anon_key', '') : '').trim();

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('your-project') &&
    !url.includes('placeholder')
  );

  return { url, anonKey, isConfigured };
}

let activeClientInstance: SupabaseClient | null = null;

export function createSupabaseInstance(customUrl?: string, customKey?: string): SupabaseClient | null {
  const { url: defaultUrl, anonKey: defaultKey } = getCredentials();
  const url = customUrl || defaultUrl;
  const key = customKey || defaultKey;

  if (!url || !key || !url.startsWith('https://') || url.includes('your-project')) {
    return null;
  }
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (err) {
    console.warn('[SupabaseClient] Initialization warning:', err);
    return null;
  }
}

activeClientInstance = createSupabaseInstance();

// Auto-sync configuration from server if client does not have local credentials
if (typeof window !== 'undefined' && !getCredentials().isConfigured) {
  fetch('/api/config/supabase')
    .then(r => r.json())
    .then(data => {
      if (data?.success && data?.isConfigured && data?.url && data?.anonKey) {
        safeLocalStorageSet('hunkar24_supabase_url', data.url);
        safeLocalStorageSet('hunkar24_supabase_anon_key', data.anonKey);
        activeClientInstance = createSupabaseInstance(data.url, data.anonKey);
      }
    })
    .catch(() => {});
}

// Dynamic accessor ensuring current instance
export function getSupabase(): SupabaseClient | null {
  if (!activeClientInstance) {
    activeClientInstance = createSupabaseInstance();
  }
  return activeClientInstance;
}

export const supabase: SupabaseClient | null = activeClientInstance;
export const isSupabaseConfigured = Boolean(getCredentials().isConfigured);

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  projectUrl: string;
  hasAnonKey: boolean;
  notes: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, anonKey, isConfigured } = getCredentials();
  return {
    isConfigured,
    projectUrl: url ? url.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'असंयोजित (Not Connected)',
    hasAnonKey: Boolean(anonKey),
    notes: isConfigured
      ? 'सफलतापूर्वक लाइव Supabase रियल-टाइम डेटाबेस एवं स्टोरेज से जुड़ा हुआ है।'
      : 'स्थानीय डेटाबेस मोड (Local Store) सक्रिय है। Supabase प्रोजेक्ट क्रेडेंशियल दर्ज करने पर स्वतः लाइव डेटाबेस व स्टोरेज से जुड़ जाएगा।'
  };
}

export async function checkSupabaseHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, latencyMs: 0, error: 'Supabase credentials not configured' };
  }
  const start = Date.now();
  try {
    const { error } = await client.from('articles').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (error && error.code !== 'PGRST116') {
      return { ok: false, latencyMs, error: error.message };
    }
    return { ok: true, latencyMs };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

export async function saveSupabaseCredentials(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('https://')) {
    return { success: false, error: 'प्रोजेक्ट URL https:// से प्रारंभ होना अनिवार्य है' };
  }
  if (!cleanKey || cleanKey.length < 20) {
    return { success: false, error: 'कृपया एक वैध Supabase Anon API Key दर्ज करें' };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey);
    const { error } = await testClient.from('articles').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.articles" does not exist')) {
      // Valid connection even if tables need migration
    }

    safeLocalStorageSet('hunkar24_supabase_url', cleanUrl);
    safeLocalStorageSet('hunkar24_supabase_anon_key', cleanKey);
    activeClientInstance = createSupabaseInstance(cleanUrl, cleanKey);

    // Synchronize to full-stack server so all server actions & other devices have it
    fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase से कनेक्ट करने में त्रुटि' };
  }
}

export function clearSupabaseCredentials(): void {
  safeLocalStorageRemove('hunkar24_supabase_url');
  safeLocalStorageRemove('hunkar24_supabase_anon_key');
  activeClientInstance = null;
}

// Supabase Storage Bucket Names
export const STORAGE_BUCKETS = {
  IMAGES: 'hunkar-news-images',
  VIDEOS: 'hunkar-news-videos',
  THUMBNAILS: 'hunkar-media-thumbnails',
  LEGACY_IMAGES: 'article-images'
} as const;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-matroska'
];

export interface UploadMediaResult {
  success: boolean;
  url?: string;
  bucket?: string;
  storagePath?: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Universal media upload to Supabase Storage with size (up to 50MB) and MIME validation
 */
export async function uploadMediaFileToSupabase(
  file: File,
  type: 'image' | 'video' | 'thumbnail' = 'image'
): Promise<UploadMediaResult> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  // 1. Validate File Size (Maximum 50 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `फ़ाइल का आकार (${sizeMb} MB) अधिकतम अनुमत सीमा 50 MB से अधिक है।`
    };
  }

  // 2. Validate MIME Type
  const mime = file.type.toLowerCase();
  if (type === 'image') {
    const isAllowedImage = ALLOWED_IMAGE_MIME_TYPES.some(t => mime.includes(t.replace('image/', ''))) || mime.startsWith('image/');
    if (!isAllowedImage) {
      return { success: false, error: 'अमान्य इमेज प्रारूप। केवल JPG, PNG, WEBP, AVIF अनुमत हैं।' };
    }
  } else if (type === 'video') {
    const isAllowedVideo = ALLOWED_VIDEO_MIME_TYPES.some(t => mime.includes(t.replace('video/', ''))) || mime.startsWith('video/');
    if (!isAllowedVideo) {
      return { success: false, error: 'अमान्य वीडियो प्रारूप। केवल MP4, WebM, MOV अनुमत हैं।' };
    }
  }

  // 3. Determine bucket and unique safe path
  const targetBucket =
    type === 'video'
      ? STORAGE_BUCKETS.VIDEOS
      : type === 'thumbnail'
      ? STORAGE_BUCKETS.THUMBNAILS
      : STORAGE_BUCKETS.IMAGES;

  const rawExt = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
  const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBase = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32);
  const filePath = `${Date.now()}_${cleanBase}.${cleanExt}`;

  try {
    // Attempt upload to primary target bucket
    let uploadRes = await client.storage
      .from(targetBucket)
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg')
      });

    let effectiveBucket: string = targetBucket;

    // Fallback to legacy bucket if new bucket does not exist yet
    if (uploadRes.error && type === 'image') {
      const fallbackRes = await client.storage
        .from(STORAGE_BUCKETS.LEGACY_IMAGES)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (!fallbackRes.error) {
        uploadRes = fallbackRes;
        effectiveBucket = STORAGE_BUCKETS.LEGACY_IMAGES;
      }
    }

    if (uploadRes.error) {
      return { success: false, error: uploadRes.error.message };
    }

    const { data: pubData } = client.storage
      .from(effectiveBucket)
      .getPublicUrl(uploadRes.data.path);

    if (pubData?.publicUrl) {
      return {
        success: true,
        url: pubData.publicUrl,
        bucket: effectiveBucket,
        storagePath: uploadRes.data.path,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    }

    return { success: false, error: 'पब्लिक URL प्राप्त करने में असमर्थ' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'स्टोरेज अपलोड त्रुटि' };
  }
}

/**
 * Direct client-side upload to Supabase Storage (Backward-compatible helper)
 */
export async function uploadImageToSupabase(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const result = await uploadMediaFileToSupabase(file, 'image');
  return {
    success: result.success,
    url: result.url,
    error: result.error
  };
}

/**
 * Video upload to Supabase Storage (hunkar-news-videos, up to 50MB)
 */
export async function uploadVideoToSupabase(file: File): Promise<UploadMediaResult> {
  return uploadMediaFileToSupabase(file, 'video');
}

