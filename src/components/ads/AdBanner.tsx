import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { AdPlacement } from '../../types';

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
}

const ROTATION_INTERVAL_MS = 8000;

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const { advertisements, recordAdClick } = useNews();

  // Filter all active, approved, admin-created ads matching this placement
  const matchingAds = useMemo(() => {
    const now = Date.now();
    return advertisements.filter(ad => {
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
  }, [advertisements, placement]);

  const isRotatableSlot =
    placement === 'top_header' || placement === 'homepage_top' || placement === 'sidebar';

  const matchingIdsKey = matchingAds.map(ad => ad.id).join('|');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Pick a random starting ad whenever the active ad pool changes
  useEffect(() => {
    if (matchingAds.length === 0) {
      setCurrentIndex(0);
      return;
    }
    if (isRotatableSlot && matchingAds.length > 1) {
      setCurrentIndex(Math.floor(Math.random() * matchingAds.length));
    } else {
      setCurrentIndex(0);
    }
  }, [matchingIdsKey, matchingAds.length, isRotatableSlot]);

  // Randomized ad rotation for top_header & sidebar slots when multiple partner ads exist
  useEffect(() => {
    if (!isRotatableSlot || matchingAds.length <= 1 || isHovered) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex(prev => {
        if (matchingAds.length <= 1) return 0;
        let next = Math.floor(Math.random() * matchingAds.length);
        if (next === prev) {
          next = (prev + 1) % matchingAds.length;
        }
        return next;
      });
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isRotatableSlot, matchingAds.length, isHovered]);

  const activeAd = matchingAds[currentIndex % Math.max(matchingAds.length, 1)];

  // Strict Rule:
  // If no active admin-created advertisement exists, show no advertisement block.
  if (!activeAd) {
    return null;
  }

  const handleClick = () => {
    if (activeAd.targetUrl) {
      recordAdClick(activeAd.id);
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

  const displayHost = (() => {
    try {
      return new URL(activeAd.targetUrl).hostname;
    } catch {
      return activeAd.advertiserName || '';
    }
  })();

  const isSidebar = placement === 'sidebar';

  return (
    <div
      className={`ad-banner my-4 mx-auto ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clearly label advertisements as "विज्ञापन" or "Sponsored" */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1 px-1">
        <span className="font-semibold uppercase tracking-wider text-[10px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">
          विज्ञापन · Sponsored
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {activeAd.advertiserName && (
            <span className="text-[10px] truncate max-w-[200px] text-stone-400">
              {activeAd.advertiserName}
            </span>
          )}
          {isRotatableSlot && matchingAds.length > 1 && (
            <div className="flex items-center gap-1" aria-label="विज्ञापन स्लाइड">
              {matchingAds.map((ad, idx) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`विज्ञापन ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex % matchingAds.length
                      ? 'w-3.5 bg-red-600'
                      : 'w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <a
        key={activeAd.id}
        href={activeAd.targetUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`block group relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 cursor-pointer shadow-xs hover:shadow-md transition-all ${getDimensions()}`}
      >
        <img
          src={activeAd.imageUrl}
          alt={activeAd.campaignTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />
        <div
          className={`absolute inset-0 flex gap-3 ${
            isSidebar
              ? 'bg-gradient-to-t from-black/90 via-black/45 to-black/25 flex-col justify-end p-4'
              : 'bg-gradient-to-r from-black/80 via-black/45 to-black/65 items-center justify-between px-3 sm:px-5'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {activeAd.logoUrl && (
              <img
                src={activeAd.logoUrl}
                alt={activeAd.advertiserName || activeAd.campaignTitle}
                className={`${
                  isSidebar ? 'w-12 h-12' : 'w-12 h-12 sm:w-16 sm:h-16'
                } rounded-full object-contain bg-white p-1 border-2 border-amber-400 shadow-md shrink-0`}
              />
            )}
            <div className="min-w-0 text-white">
              <span
                className={`${
                  isSidebar ? 'text-sm line-clamp-2' : 'text-xs sm:text-sm truncate'
                } font-black block drop-shadow-md`}
              >
                {activeAd.campaignTitle}
              </span>
              {displayHost && (
                <span className="text-[10px] sm:text-xs font-mono text-amber-300 truncate block drop-shadow">
                  {displayHost}
                </span>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center justify-center gap-1.5 bg-red-700 group-hover:bg-red-600 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 shadow-md transition-colors ${
              isSidebar ? 'w-full' : ''
            }`}
          >
            <span>वेबसाइट खोलें</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </a>
    </div>
  );
};
