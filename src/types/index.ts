// HUNKAR 24 – Type Definitions

export type ArticleStatus = 'published' | 'draft' | 'scheduled';

export interface Article {
  id: string;
  headline: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  district?: string;
  tehsil?: string;
  village?: string;
  mainImage: string;
  featuredImage?: string;
  imageCaption?: string;
  imageSource?: string;
  imageAlt?: string;
  imageType?: 'photo' | 'ai_illustration' | 'document' | 'graphic';
  imageGenerationStatus?: 'completed' | 'generating' | 'pending' | 'failed' | 'manual';
  reporterId?: string;
  reporterName: string;
  reporterRole?: string;
  reporterPhoto?: string;
  status: ArticleStatus;
  publishedAt: string;
  updatedAt: string;
  views: number;
  isBreaking?: boolean;
  isHero?: boolean;
  isExclusive?: boolean;
  tags: string[];
  videoUrl?: string;
  galleryImages?: string[]; // Up to 5 images per article
  mediaAssets?: MediaAsset[];
  readingTimeMinutes: number;
  likesCount?: number;
  // Automated News Integration fields
  isAutoImported?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  originalHeadline?: string;
  originalSources?: Array<{ name: string; url: string; publishedAt?: string }>;
  verificationStatus?: 'verified' | 'multiple_sources' | 'single_source' | 'needs_verification' | 'sensitive';
  riskFlags?: string[];
  entities?: { names?: string[]; locations?: string[]; dates?: string[] };
}

export type MediaType = 'image' | 'video' | 'thumbnail';
export type MediaSourceType = 'upload' | 'external_url' | 'imported';
export type StorageProvider = 'supabase' | 'firebase' | 'external' | 'local';
export type BackupStatus = 'pending' | 'backed_up' | 'failed' | 'disabled';

export interface MediaAsset {
  id: string;
  newsId?: string;
  mediaType: MediaType;
  sourceType: MediaSourceType;
  storageProvider: StorageProvider;
  storageBucket?: string;
  storagePath?: string;
  mediaUrl: string;
  firebaseStoragePath?: string;
  firebaseBackupUrl?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  displayOrder?: number;
  backupStatus: BackupStatus;
  createdAt: string;
  updatedAt: string;
  altText?: string;
  caption?: string;
}

export interface SyncEvent {
  eventId: string;
  entityId: string;
  eventType: 'article_publish' | 'article_update' | 'article_delete' | 'media_backup' | 'media_import';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}


export interface AutoNewsArticleItem {
  id: string;
  sourceProvider: string;
  originalHeadline: string;
  originalUrl: string;
  hindiHeadline: string;
  hindiSummary: string;
  hindiContent: string;
  category: string;
  district?: string;
  imageUrl?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  verificationStatus: 'verified' | 'multiple_sources' | 'single_source' | 'needs_verification' | 'sensitive';
  sources: Array<{ name: string; url: string; publishedAt?: string }>;
  riskFlags: string[];
  entities: {
    names: string[];
    locations: string[];
    dates: string[];
  };
  seoTags: string[];
  createdAt: string;
  publishedAt: string;
}

export interface BreakingNewsItem {
  id: string;
  text: string;
  category?: string;
  linkArticleId?: string;
  linkUrl?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  expiresAt?: string;
}

export interface CategoryItem {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  order: number;
  isVisible: boolean;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface PublicNewsSubmission {
  id: string;
  headline: string;
  description: string;
  district: string;
  tehsil: string;
  village?: string;
  dateOfIncident?: string;
  imageUrls: string[];
  videoUrl?: string;
  submitterName: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  consentGiven: boolean;
  status: SubmissionStatus;
  adminNotes?: string;
  createdAt: string;
  approvedArticleId?: string;
}

export type PromotionStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface BusinessPromotionRequest {
  id: string;
  businessName: string;
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  category: string;
  title: string;
  description: string;
  posterUrl?: string;
  videoUrl?: string;
  websiteUrl?: string;
  preferredPlacement: string;
  campaignDurationDays: number;
  budgetInr: number;
  status: PromotionStatus;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  createdAt: string;
}

export type AdPlacement =
  | 'homepage_top'
  | 'before_feed'
  | 'between_cards'
  | 'article_banner'
  | 'category_banner'
  | 'mobile_sticky'
  | 'top_header'
  | 'middle_feed'
  | 'sidebar'
  | 'article_page';

export interface AdvertisementCampaign {
  id: string;
  campaignTitle: string;
  advertiserName: string;
  placement: AdPlacement;
  imageUrl: string;
  logoUrl?: string;
  targetUrl: string;
  desktopVisible: boolean;
  mobileVisible: boolean;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'expired';
  startDate: string;
  endDate: string;
  pricingInr: number;
  paymentStatus?: PaymentStatus;
  approved?: boolean;
  createdByAdmin?: boolean;
  isDemo?: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'reporter' | 'ad_manager' | 'analyst';

export interface ReporterProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  assignedDistrict: string;
  assignedTehsil?: string;
  assignedVillages?: string[];
  photoUrl: string;
  publishedArticleCount: number;
  isVerified: boolean;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface VideoNewsItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  duration: string;
  views: number;
  publishedAt: string;
  source: 'youtube' | 'instagram' | 'direct';
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  photographer?: string;
}

export interface PhotoGalleryAlbum {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  photos: GalleryPhoto[];
  publishedAt: string;
  category: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface BusinessListing {
  id: string;
  name: string;
  category: string;
  district: string;
  address: string;
  contactNumber: string;
  whatsappNumber: string;
  verified: boolean;
  rating: number;
  imageUrl?: string;
}
