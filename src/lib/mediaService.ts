import { MediaAsset, MediaType } from '../types';
import {
  uploadMediaFileToSupabase,
  UploadMediaResult,
  MAX_FILE_SIZE_BYTES,
  STORAGE_BUCKETS
} from './supabaseClient';
import {
  uploadToFirebaseStorageBackup,
  getSecondaryBackupEnabled,
  setSecondaryBackupEnabled
} from './firebaseClient';

export interface MediaUploadProgress {
  fileIndex: number;
  fileName: string;
  percent: number;
  status: 'idle' | 'uploading_supabase' | 'backing_up_firebase' | 'completed' | 'failed';
  error?: string;
}

export interface ValidatedMediaUrlInfo {
  isValid: boolean;
  type: 'image' | 'video' | 'youtube' | 'instagram' | 'facebook' | 'unknown';
  directUrl: string;
  sourceProvider: 'supabase' | 'firebase' | 'imgbb' | 'cloudinary' | 'imagekit' | 'youtube' | 'instagram' | 'facebook' | 'external';
  mimeType?: string;
  fileSizeBytes?: number;
  accessible: boolean;
  thumbnailUrl?: string;
  title?: string;
  error?: string;
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate client-side thumbnail from video File or URL using HTML5 Canvas
 */
export async function captureVideoThumbnail(source: File | string): Promise<{ blob: Blob; dataUrl: string } | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
      video.src = objectUrl;

      const cleanup = () => {
        if (typeof source !== 'string') {
          URL.revokeObjectURL(objectUrl);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 7000);

      video.onloadeddata = () => {
        // Seek to 1 second (or midpoint if short)
        video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 1280);
          canvas.height = Math.min(video.videoHeight || 360, 720);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                clearTimeout(timeout);
                cleanup();
                if (blob) {
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                  resolve({ blob, dataUrl });
                } else {
                  resolve(null);
                }
              },
              'image/jpeg',
              0.85
            );
            return;
          }
        } catch {
          // ignore canvas taint errors
        }
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Validates any media URL (ImgBB, Cloudinary, ImageKit, YouTube, Instagram, Facebook, Supabase, etc.)
 */
export async function inspectAndValidateMediaUrl(url: string): Promise<ValidatedMediaUrlInfo> {
  const clean = url.trim();
  if (!clean || !clean.startsWith('http')) {
    return {
      isValid: false,
      type: 'unknown',
      directUrl: clean,
      sourceProvider: 'external',
      accessible: false,
      error: 'वैध HTTP/HTTPS URL दर्ज करें।'
    };
  }

  // Detect platform provider
  let sourceProvider: ValidatedMediaUrlInfo['sourceProvider'] = 'external';
  let detectedType: ValidatedMediaUrlInfo['type'] = 'unknown';

  if (clean.includes('supabase.co/storage/')) {
    sourceProvider = 'supabase';
    detectedType = /\.(mp4|webm|mov|ogg)/i.test(clean) ? 'video' : 'image';
  } else if (clean.includes('firebasestorage.googleapis.com')) {
    sourceProvider = 'firebase';
    detectedType = /\.(mp4|webm|mov|ogg)/i.test(clean) ? 'video' : 'image';
  } else if (clean.includes('ibb.co/') || clean.includes('i.ibb.co/')) {
    sourceProvider = 'imgbb';
    detectedType = 'image';
  } else if (clean.includes('cloudinary.com')) {
    sourceProvider = 'cloudinary';
    detectedType = 'image';
  } else if (clean.includes('imagekit.io')) {
    sourceProvider = 'imagekit';
    detectedType = 'image';
  } else if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    sourceProvider = 'youtube';
    detectedType = 'youtube';
  } else if (clean.includes('instagram.com')) {
    sourceProvider = 'instagram';
    detectedType = 'instagram';
  } else if (clean.includes('facebook.com') || clean.includes('fb.watch')) {
    sourceProvider = 'facebook';
    detectedType = 'facebook';
  } else if (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(clean)) {
    detectedType = 'image';
  } else if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(clean)) {
    detectedType = 'video';
  }

  // Ask server validator for Content-Type and accessibility
  try {
    const res = await fetch('/api/media/validate-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: clean })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          isValid: true,
          type: data.type || detectedType,
          directUrl: data.directUrl || clean,
          sourceProvider: data.sourceProvider || sourceProvider,
          mimeType: data.mimeType,
          fileSizeBytes: data.fileSize,
          accessible: data.accessible ?? true,
          thumbnailUrl: data.thumbnailUrl
        };
      }
    }
  } catch {
    // server unreachable, use client detection
  }

  return {
    isValid: true,
    type: detectedType,
    directUrl: clean,
    sourceProvider,
    accessible: true
  };
}

/**
 * Import external image/video to Supabase Storage and Firebase secondary backup
 */
export async function importExternalMedia(
  url: string,
  mediaType: 'image' | 'video' = 'image'
): Promise<{ success: boolean; url?: string; mediaAsset?: MediaAsset; error?: string }> {
  try {
    const res = await fetch('/api/media/import-external', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, mediaType })
    });
    const data = await res.json();
    if (data.success && data.url) {
      return {
        success: true,
        url: data.url,
        mediaAsset: data.mediaAsset
      };
    }
    return { success: false, error: data.error || 'मीडिया इम्पोर्ट विफल रहा।' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'सर्वर से कनेक्ट करने में त्रुटि।' };
  }
}

/**
 * Upload single media item with dual-cloud Supabase + Firebase backup synchronization
 */
export async function uploadSingleMedia(
  file: File,
  mediaType: 'image' | 'video' = 'image',
  onProgress?: (percent: number) => void
): Promise<{
  success: boolean;
  url?: string;
  storageProvider: 'supabase' | 'local';
  firebaseBackedUp: boolean;
  firebaseBackupUrl?: string;
  error?: string;
  asset?: MediaAsset;
}> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      storageProvider: 'local',
      firebaseBackedUp: false,
      error: `फ़ाइल का आकार (${sizeMb} MB) 50 MB से अधिक है।`
    };
  }

  onProgress?.(20);

  // 1. Primary Upload: Supabase Storage
  let primaryUrl = '';
  let storageProvider: 'supabase' | 'local' = 'supabase';
  let storageBucket = mediaType === 'video' ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES;
  let storagePath = '';

  const sbResult = await uploadMediaFileToSupabase(file, mediaType);
  if (sbResult.success && sbResult.url) {
    primaryUrl = sbResult.url;
    storageBucket = (sbResult.bucket as any) || storageBucket;
    storagePath = sbResult.storagePath || '';
    onProgress?.(60);
  } else {
    // Server fallback
    try {
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const dataUrl = await readPromise;

      const serverRes = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          filename: file.name,
          mediaType
        })
      });

      const serverData = await serverRes.json();
      if (serverData.success && serverData.url) {
        primaryUrl = serverData.url;
        storageProvider = serverData.storage === 'supabase' ? 'supabase' : 'local';
        storagePath = serverData.storagePath || '';
        onProgress?.(65);
      } else {
        return {
          success: false,
          storageProvider: 'local',
          firebaseBackedUp: false,
          error: serverData.error || 'अपलोड प्रक्रिया विफल रही।'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        storageProvider: 'local',
        firebaseBackedUp: false,
        error: err?.message || 'अपलोड विफल रहा।'
      };
    }
  }

  // 2. Secondary Cloud Backup: Firebase Storage (Non-blocking)
  let firebaseBackedUp = false;
  let firebaseBackupUrl: string | undefined;
  let firebaseStoragePath: string | undefined;

  if (getSecondaryBackupEnabled()) {
    try {
      const category = mediaType === 'video' ? 'videos' : 'images';
      const fbRes = await uploadToFirebaseStorageBackup(file, category, file.name, file.type);
      if (fbRes.success && fbRes.url) {
        firebaseBackedUp = true;
        firebaseBackupUrl = fbRes.url;
        firebaseStoragePath = fbRes.path;
      }
    } catch (fbErr) {
      console.warn('[DualCloud] Firebase backup notice:', fbErr);
    }
  }

  onProgress?.(90);

  // 3. Register media asset in database / server
  const assetId = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const asset: MediaAsset = {
    id: assetId,
    mediaType,
    sourceType: 'upload',
    storageProvider,
    storageBucket,
    storagePath,
    mediaUrl: primaryUrl,
    firebaseStoragePath,
    firebaseBackupUrl,
    mimeType: file.type,
    fileSize: file.size,
    displayOrder: 0,
    backupStatus: firebaseBackedUp
      ? 'backed_up'
      : getSecondaryBackupEnabled()
      ? 'pending'
      : 'disabled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Sync asset metadata to server
  fetch('/api/media/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  }).catch(() => {});

  onProgress?.(100);

  return {
    success: true,
    url: primaryUrl,
    storageProvider,
    firebaseBackedUp,
    firebaseBackupUrl,
    asset
  };
}
