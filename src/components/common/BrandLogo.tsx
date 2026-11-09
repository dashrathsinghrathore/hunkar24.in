import React, { useState } from 'react';
import { SITE_CONFIG } from '../../config/siteConfig';

interface BrandLogoProps {
  variant?: 'header' | 'mobile' | 'footer' | 'admin' | 'splash';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  showTagline = false,
  className = '',
  onClick
}) => {
  const [imgSrc, setImgSrc] = useState<string>(SITE_CONFIG.logoUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (imgSrc === SITE_CONFIG.logoUrl) {
      // Fallback to remote direct verified image
      setImgSrc(SITE_CONFIG.remoteLogoUrl);
    } else {
      setHasError(true);
    }
  };

  const getHeightClass = () => {
    switch (variant) {
      case 'header':
        return 'h-11 sm:h-13 md:h-15';
      case 'mobile':
        return 'h-9 sm:h-10';
      case 'footer':
        return 'h-12 md:h-14';
      case 'admin':
        return 'h-9 md:h-10';
      case 'splash':
        return 'h-16 md:h-20';
      default:
        return 'h-12';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {!hasError ? (
        <img
          src={imgSrc}
          alt="HUNKAR 24 Logo – हुंकार 24"
          onError={handleImageError}
          className={`${getHeightClass()} w-auto object-contain transition-transform duration-200 hover:scale-[1.01]`}
          loading="eager"
        />
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-red-700">
            <span className="text-2xl font-black font-newspaper-headline tracking-tighter">हुंकार</span>
            <span className="bg-red-700 text-white text-xs px-1.5 py-0.5 rounded font-mono font-bold">24</span>
          </div>
          <span className="text-[10px] text-stone-500 font-semibold tracking-wide">राजस्थान की बुलंद आवाज़!</span>
        </div>
      )}

      {showTagline && (
        <div className="hidden lg:flex flex-col border-l border-stone-300 dark:border-stone-700 pl-3">
          <span className="text-xs font-bold text-red-700 dark:text-red-500 tracking-wider">
            {SITE_CONFIG.brandTagline}
          </span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
            डिजिटल समाचार नेटवर्क
          </span>
        </div>
      )}
    </div>
  );
};
