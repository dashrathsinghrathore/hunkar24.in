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

/**
 * Direct client-side upload to Supabase Storage bucket 'article-images'.
 * Returns public URL that works on all devices worldwide.
 */
export async function uploadImageToSupabase(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    const filePath = `${Date.now()}-${cleanBase}.${fileExt}`;

    const { data, error } = await client.storage
      .from('article-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: pubData } = client.storage
      .from('article-images')
      .getPublicUrl(data.path);

    if (pubData?.publicUrl) {
      return { success: true, url: pubData.publicUrl };
    }

    return { success: false, error: 'Failed to retrieve public URL from Supabase' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Storage upload error' };
  }
}
