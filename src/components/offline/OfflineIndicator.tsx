import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide indicator after 3 seconds when back online
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show indicator initially if offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={cn(
          "flex items-center gap-2 px-3 py-2 shadow-lg",
          isOnline ? "bg-green-500 hover:bg-green-600" : ""
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Offline mode
          </>
        )}
      </Badge>
    </div>
  );
};