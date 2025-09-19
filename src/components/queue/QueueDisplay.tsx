import React from 'react';
import { Music, Play, SkipForward, List } from 'lucide-react';
import { NeonCard } from '@/components/ui/neon-card';
import { NeonButton } from '@/components/ui/neon-button';
import { CardContent } from '@/components/ui/card';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';

export const QueueDisplay: React.FC = () => {
  const { queue, queueIndex, currentTrack, playTrack, getQueuePosition } = useMediaLibrary();
  
  const queuePosition = getQueuePosition();
  const upcomingTracks = queue.slice(queueIndex + 1);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack || queue.length === 0) {
    return (
      <NeonCard variant="floating" className="animate-slide-up">
        <CardContent className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tracks in queue</p>
            <p className="text-sm">Add music to see your queue here</p>
          </div>
        </CardContent>
      </NeonCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold gradient-text">Queue</h3>
        <div className="text-sm text-muted-foreground">
          {queuePosition.current} of {queuePosition.total}
        </div>
      </div>

      {/* Currently Playing */}
      <NeonCard variant="glow" className="animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate text-sm">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              <p className="text-xs text-muted-foreground">Now Playing</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatTime(currentTrack.duration)}
            </div>
          </div>
        </CardContent>
      </NeonCard>

      {/* Up Next */}
      {upcomingTracks.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Up Next ({upcomingTracks.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {upcomingTracks.slice(0, 10).map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all cursor-pointer group"
                onClick={() => playTrack(track, queue)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs text-muted-foreground">
                  {queueIndex + index + 2}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-sm">{track.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(track.duration)}
                  </span>
                  <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
          
          {upcomingTracks.length > 10 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                +{upcomingTracks.length - 10} more tracks in queue
              </p>
            </div>
          )}
        </div>
      ) : (
        <NeonCard variant="floating">
          <CardContent className="p-4">
            <div className="text-center py-4 text-muted-foreground">
              <SkipForward className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">End of queue</p>
              <p className="text-xs">This is the last track</p>
            </div>
          </CardContent>
        </NeonCard>
      )}
    </div>
  );
};