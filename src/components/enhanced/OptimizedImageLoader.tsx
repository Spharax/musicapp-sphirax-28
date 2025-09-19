import React, { useState, useRef, useEffect, memo } from 'react';
import { usePerformanceOptimization } from '@/hooks/performance/usePerformanceOptimization';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  lazy?: boolean;
}

export const OptimizedImageLoader: React.FC<OptimizedImageLoaderProps> = memo(({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const { getOptimizations } = usePerformanceOptimization();

  const imageOptimization = getOptimizations().image;

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${imageOptimization.lazyLoadThreshold}px` }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [lazy, imageOptimization.lazyLoadThreshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const getOptimizedSrc = (originalSrc: string) => {
    // For external images or when we need to optimize size
    if (originalSrc.startsWith('http') && imageOptimization.maxImageSize < 1920) {
      // This is a simplified example - in production you'd use a service like Cloudinary
      return originalSrc;
    }
    return originalSrc;
  };

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {!isInView && lazy && (
        <Skeleton className="w-full h-full absolute inset-0" />
      )}
      
      {isInView && (
        <>
          {!isLoaded && !isError && (
            <Skeleton className="w-full h-full absolute inset-0" />
          )}
          
          <img
            src={isError ? fallbackSrc : getOptimizedSrc(src)}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
          />
        </>
      )}
    </div>
  );
});

OptimizedImageLoader.displayName = 'OptimizedImageLoader';