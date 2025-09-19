import React, { useState, useEffect } from 'react';
import { Play, Music, Clock, MoreVertical, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';

interface RecentTracksProps {
  limit?: number;
  onTrackSelect?: (track: Track) => void;
}

export const RecentTracks: React.FC<RecentTracksProps> = ({ 
  limit = 10, 
  onTrackSelect 
}) => {
  const { getRecentTracks, playTrack, audioFiles } = useMediaLibrary();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentTracks();
  }, [audioFiles]);

  const loadRecentTracks = async () => {
    setLoading(true);
    try {
      const tracks = await getRecentTracks();
      setRecentTracks(tracks.slice(0, limit));
    } catch (error) {
      console.error('Failed to load recent tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPlay = (track: Track) => {
    playTrack(track, recentTracks);
    onTrackSelect?.(track);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastPlayed = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentTracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent tracks</p>
            <p className="text-sm">Your recently played music will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Tracks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentTracks.map((track, index) => (
            <div
              key={track.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all group hover:bg-accent/50 cursor-pointer",
                index === 0 && "ring-1 ring-primary/20 bg-primary/5"
              )}
              onClick={() => handleTrackPlay(track)}
            >
              {/* Album Art / Icon */}
              <div className="relative">
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={`${track.album} cover`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{track.title}</h4>
                  {index === 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Last Played
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{formatDuration(track.duration)}</span>
                  <span>•</span>
                  <span>{formatLastPlayed(track.lastPlayed)}</span>
                  {track.playCount > 1 && (
                    <>
                      <span>•</span>
                      <span>{track.playCount} plays</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {track.playCount > 5 && (
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTrackPlay(track)}>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="w-4 h-4 mr-2" />
                      Add to Favorites
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};