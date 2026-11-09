// Web Push Notification Architecture for HUNKAR 24 (Part 18)
// Prepared for production deployment; inactive until administrator enables or user grants explicit browser consent.

export interface PushNotificationPreferences {
  enabled: boolean;
  breakingNews: boolean;
  rajasthanState: boolean;
  selectedDistricts: string[];
  educationAndJobs: boolean;
  dailyDigest: boolean;
}

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  enabled: false,
  breakingNews: true,
  rajasthanState: true,
  selectedDistricts: ['jaipur', 'churu', 'sikar', 'bikaner'],
  educationAndJobs: true,
  dailyDigest: false
};

// Check if push notifications are supported by the client browser
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request permission and register subscription with backend server
export async function registerPushSubscription(
  preferences: PushNotificationPreferences = DEFAULT_PUSH_PREFERENCES
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return { success: false, error: 'इस ब्राउज़र में वेब पुश नोटिफिकेशन समर्थित नहीं है।' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'उपयोगकर्ता द्वारा नोटिफिकेशन अनुमति अस्वीकृत कर दी गई।' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // In production, inject applicationServerKey (VAPID public key)
      const fakeVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckj0Ks2uhPtG4ybM_ZR04W8_IT8J0Y';
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(fakeVapidKey) as unknown as BufferSource
      });
    }

    // Save subscription to backend
    await fetch('/api/web-push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        preferences
      })
    });

    localStorage.setItem('hunkar24_push_prefs', JSON.stringify(preferences));
    return { success: true, subscription };
  } catch (err: any) {
    return { success: false, error: err.message || 'पुश पंजीकरण में त्रुटि' };
  }
}

// Helper to convert VAPID base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
