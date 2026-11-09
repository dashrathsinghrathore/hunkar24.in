import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  category?: string;
  district?: string;
  className?: string;
  aspectRatio?: string;
}

// Category and district-specific high-resolution verified visual fallbacks
const CATEGORY_FALLBACKS: Record<string, string> = {
  rajasthan: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', // Hawa Mahal, Jaipur
  schemes: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80', // Infrastructure & rural development
  jobs: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', // Education & exams
  education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', // Students & library
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80', // Wheat & mustard fields
  politics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80', // Vidhan Sabha & governance
  crime: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80', // Law, justice & police
  sports: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80', // Sports & athletics
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', // Cultural stage & arts
  business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80', // Markets & business
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Technology & AI
  weather: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80', // Sky & weather
  churu: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80', // Thar desert dunes & heritage
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80', // Pink city Jaipur
  sikar: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80', // Shekhawati fields
  bikaner: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80' // Junagarh & desert
};

const DEFAULT_NEWS_FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  category = 'rajasthan',
  district,
  className = '',
  loading = 'lazy',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine fallback image source
  const getFallback = () => {
    if (district && CATEGORY_FALLBACKS[district.toLowerCase()]) {
      return CATEGORY_FALLBACKS[district.toLowerCase()];
    }
    if (category && CATEGORY_FALLBACKS[category.toLowerCase()]) {
      return CATEGORY_FALLBACKS[category.toLowerCase()];
    }
    return DEFAULT_NEWS_FALLBACK;
  };

  const imageSrc = (!src || hasError) ? getFallback() : src;

  return (
    <div className={`relative overflow-hidden bg-stone-100 dark:bg-stone-800 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200 dark:bg-stone-800 animate-pulse flex items-center justify-center">
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">हुंकार 24</span>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt || 'हुंकार 24 समाचार'}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  );
};
