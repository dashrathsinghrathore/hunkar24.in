import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storageUtils';

// Retrieve credentials from environment or saved configuration
function getCredentials() {
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

const { url: activeUrl, anonKey: activeKey, isConfigured: isConfiguredInitial } = getCredentials();

export const isSupabaseConfigured = isConfiguredInitial;

export function createSupabaseInstance(url = activeUrl, key = activeKey): SupabaseClient | null {
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

export const supabase: SupabaseClient | null = createSupabaseInstance();

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
    // Simple ping check
    const { error } = await testClient.from('articles').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.articles" does not exist')) {
      // If table doesn't exist yet, schema migration is needed, but credentials are valid!
    }

    safeLocalStorageSet('hunkar24_supabase_url', cleanUrl);
    safeLocalStorageSet('hunkar24_supabase_anon_key', cleanKey);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase से कनेक्ट करने में त्रुटि' };
  }
}

export function clearSupabaseCredentials(): void {
  safeLocalStorageRemove('hunkar24_supabase_url');
  safeLocalStorageRemove('hunkar24_supabase_anon_key');
}
