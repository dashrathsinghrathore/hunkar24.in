/**
 * Universal Safe API Client for HUNKAR 24
 * Prevents "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" errors
 * when deployed on static hosts like Netlify where backend endpoints return index.html.
 */

export interface SafeApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isHtml?: boolean;
  status: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with HTML (e.g., Netlify fallback to index.html)
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        isHtml: true,
        status: res.status,
        error: 'सर्वर रिस्पॉन्स HTML है (स्टैटिक होस्टिंग मोड)'
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        data,
        status: res.status,
        error: data.error || `HTTP त्रुटि ${res.status}`
      };
    }

    return {
      success: true,
      data,
      status: res.status
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      error: err?.message || 'नेटवर्क कनेक्शन विफल रहा'
    };
  }
}

/**
 * Checks if the current environment is running purely as a static SPA
 * (e.g. deployed on Netlify, GitHub Pages) without an active Node.js server.
 */
export async function checkHasBackendServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/news-engine/status', { method: 'GET' });
    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('application/json');
  } catch {
    return false;
  }
}
