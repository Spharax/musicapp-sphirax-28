import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'track' | 'playlist' | 'stats' | 'player' | 'grid';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'track',
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'track':
        return (
          <div className="flex items-center gap-3 p-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-4 h-4" />
          </div>
        );

      case 'playlist':
        return (
          <div className="proton-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </div>
        );

      case 'grid':
        return (
          <div className="proton-card p-4">
            <div className="text-center space-y-3">
              <Skeleton className="w-16 h-16 mx-auto rounded-xl" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="proton-card p-4 text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        );

      case 'player':
        return (
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        );

      default:
        return <Skeleton className="h-16 w-full" />;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};