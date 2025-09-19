import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Track } from '@/hooks/useMediaLibrary';
import { Play, Clock, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VirtualizedListProps {
  tracks: Track[];
  onTrackSelect: (track: Track, tracks: Track[]) => void;
  containerHeight?: number;
  itemHeight?: number;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  tracks,
  onTrackSelect,
  containerHeight = 400,
  itemHeight = 72
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const track = tracks[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card
                className="mx-2 mb-2 proton-card hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => onTrackSelect(track, tracks)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Track Number & Play Icon */}
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <span className="group-hover:hidden">{virtualItem.index + 1}</span>
                      <Play className="w-4 h-4 hidden group-hover:block" />
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{track.artist}</span>
                        <span>•</span>
                        <span className="truncate">{track.album}</span>
                      </div>
                    </div>
                    
                    {/* Duration */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};