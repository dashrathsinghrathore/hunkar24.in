import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { AdPlacement } from '../../types';

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const { advertisements, recordAdClick } = useNews();

  // Find active, approved, admin-created ad for this placement
  const now = Date.now();
  const activeAd = advertisements.find(ad => {
    // 1. Must be admin-created & approved
    if (ad.isDemo || ad.createdByAdmin === false || ad.approved === false) return false;
    // 2. Must be actively enabled
    if (ad.status !== 'active') return false;
    // 3. Media URL must be valid
    if (!ad.imageUrl || ad.imageUrl.trim().length === 0) return false;
    // 4. Start date must have arrived
    if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
    // 5. Expiry date must not have passed
    if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;

    // 6. Placement matching with aliases
    if (ad.placement === placement) return true;
    if (
      (placement === 'homepage_top' || placement === 'top_header') &&
      (ad.placement === 'homepage_top' || ad.placement === 'top_header')
    ) {
      return true;
    }
    if (
      (placement === 'between_cards' || placement === 'middle_feed') &&
      (ad.placement === 'between_cards' || ad.placement === 'middle_feed')
    ) {
      return true;
    }
    if (
      (placement === 'article_banner' || placement === 'article_page') &&
      (ad.placement === 'article_banner' || ad.placement === 'article_page')
    ) {
      return true;
    }
    return false;
  });

  // Strict Rule (Requirement 5):
  // "If no active admin-created advertisement exists, show no advertisement block.
  // Do not display a fake placeholder ad."
  if (!activeAd) {
    return null;
  }

  const handleClick = () => {
    if (activeAd.targetUrl) {
      recordAdClick(activeAd.id);
      window.open(activeAd.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Dimensions helper
  const getDimensions = () => {
    switch (placement) {
      case 'homepage_top':
      case 'top_header':
        return 'max-w-5xl h-20 sm:h-24';
      case 'before_feed':
      case 'between_cards':
      case 'middle_feed':
        return 'w-full h-24 sm:h-32';
      case 'sidebar':
        return 'w-full h-64 sm:h-72';
      case 'article_banner':
      case 'article_page':
        return 'w-full h-24 sm:h-32';
      case 'category_banner':
        return 'w-full h-24 sm:h-28';
      case 'mobile_sticky':
        return 'w-full h-14';
      default:
        return 'w-full h-24';
    }
  };

  return (
    <div className={`ad-banner my-4 mx-auto ${className}`}>
      {/* Strict Requirement: Clearly label advertisements as "विज्ञापन" or "Sponsored" */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1 px-1">
        <span className="font-semibold uppercase tracking-wider text-[10px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">
          विज्ञापन · Sponsored
        </span>
        {activeAd.advertiserName && (
          <span className="text-[10px] truncate max-w-[200px] text-stone-400">
            {activeAd.advertiserName}
          </span>
        )}
      </div>

      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        className={`group relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 cursor-pointer shadow-xs hover:shadow-md transition-all ${getDimensions()}`}
      >
        <img
          src={activeAd.imageUrl}
          alt={activeAd.campaignTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3">
          <div className="flex items-center justify-between w-full text-white">
            <span className="text-xs font-bold truncate drop-shadow-md pr-2">
              {activeAd.campaignTitle}
            </span>
            <span className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 shadow-md">
              <span>देखें</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
