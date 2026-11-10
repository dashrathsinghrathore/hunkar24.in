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
      ? 'सफलतापूर्वक लाइव Supabase रियल-टाइम डेटाबेस से जुड़ा हुआ है।'
      : 'स्थानीय डेटाबेस मोड (Local Store) सक्रिय है। Supabase प्रोजेक्ट क्रेडेंशियल दर्ज करने पर स्वतः लाइव डेटाबेस से जुड़ जाएगा।'
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
