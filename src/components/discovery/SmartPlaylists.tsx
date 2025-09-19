import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Heart, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface SmartPlaylist {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  generator: () => Promise<Track[]>;
  count?: number;
}

interface SmartPlaylistsProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayPlaylist: (tracks: Track[]) => void;
}

export const SmartPlaylists: React.FC<SmartPlaylistsProps> = ({
  isOpen,
  onClose,
  onPlayPlaylist
}) => {
  const { audioFiles, getRecentTracks, getTopTracks } = useMediaLibrary();
  const [playlists, setPlaylists] = useState<SmartPlaylist[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateSmartPlaylists();
    }
  }, [isOpen, audioFiles]);

  const generateSmartPlaylists = async () => {
    const smartPlaylists: SmartPlaylist[] = [
      {
        id: 'recent',
        name: 'Recently Added',
        description: 'Your newest additions',
        icon: Calendar,
        color: '#10b981',
        generator: async () => {
          const sorted = [...audioFiles].sort((a, b) => 
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
          return sorted.slice(0, 25);
        }
      },
      {
        id: 'most-played',
        name: 'Most Played',
        description: 'Your current favorites',
        icon: TrendingUp,
        color: '#f59e0b',
        generator: async () => {
          const topTracks = await getTopTracks();
          return topTracks.slice(0, 25);
        }
      },
      {
        id: 'long-tracks',
        name: 'Epic Songs',
        description: 'Songs over 5 minutes',
        icon: Clock,
        color: '#8b5cf6',
        generator: async () => {
          return audioFiles.filter(track => track.duration > 300).slice(0, 25);
        }
      },
      {
        id: 'short-tracks',
        name: 'Quick Hits',
        description: 'Songs under 3 minutes',
        icon: Zap,
        color: '#ef4444',
        generator: async () => {
          return audioFiles.filter(track => track.duration < 180).slice(0, 25);
        }
      },
      {
        id: 'never-played',
        name: 'Undiscovered',
        description: 'Songs you haven\'t played yet',
        icon: Sparkles,
        color: '#06b6d4',
        generator: async () => {
          return audioFiles.filter(track => track.playCount === 0).slice(0, 25);
        }
      },
      {
        id: 'recent-listens',
        name: 'Recently Played',
        description: 'Your latest listening history',
        icon: Heart,
        color: '#ec4899',
        generator: async () => {
          const recentTracks = await getRecentTracks();
          return recentTracks.slice(0, 25);
        }
      }
    ];

    // Calculate counts for each playlist
    const playlistsWithCounts = await Promise.all(
      smartPlaylists.map(async (playlist) => {
        try {
          const tracks = await playlist.generator();
          return { ...playlist, count: tracks.length };
        } catch (error) {
          console.error(`Failed to generate ${playlist.name}:`, error);
          return { ...playlist, count: 0 };
        }
      })
    );

    setPlaylists(playlistsWithCounts.filter(p => p.count && p.count > 0));
  };

  const handlePlayPlaylist = async (playlist: SmartPlaylist) => {
    setIsGenerating(playlist.id);
    try {
      const tracks = await playlist.generator();
      if (tracks.length > 0) {
        onPlayPlaylist(tracks);
        toast.success(`Playing ${playlist.name} (${tracks.length} songs)`);
        onClose();
      } else {
        toast.info(`${playlist.name} is empty`);
      }
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      toast.error('Failed to generate playlist');
    } finally {
      setIsGenerating(null);
    }
  };

  const createStaticPlaylist = async (smartPlaylist: SmartPlaylist) => {
    try {
      const tracks = await smartPlaylist.generator();
      if (tracks.length === 0) {
        toast.info('No tracks found for this playlist');
        return;
      }

      const playlist = {
        id: `smart_${Date.now()}`,
        name: smartPlaylist.name,
        description: smartPlaylist.description,
        songs: tracks.map(t => t.id),
        trackIds: tracks.map(t => t.id),
        createdAt: new Date(),
        dateCreated: new Date(),
        lastModified: new Date(),
        color: smartPlaylist.color
      };

      await musicDB.createPlaylist(playlist);
      toast.success(`Created "${smartPlaylist.name}" playlist with ${tracks.length} songs`);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart Playlists</h2>
              <p className="text-sm text-muted-foreground">Auto-generated from your library</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="grid gap-4">
          {playlists.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">No smart playlists available</h3>
              <p className="text-muted-foreground">Add more music to generate smart playlists</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <Card key={playlist.id} className="proton-card hover:scale-[1.02] transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: playlist.color + '20' }}
                    >
                      <playlist.icon 
                        size={24} 
                        className="text-primary"
                        style={{ color: playlist.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{playlist.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {playlist.count} songs
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePlayPlaylist(playlist)}
                      disabled={isGenerating === playlist.id}
                      className="flex-1 proton-button"
                    >
                      {isGenerating === playlist.id ? 'Generating...' : 'Play Now'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => createStaticPlaylist(playlist)}
                      className="flex-shrink-0"
                    >
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {playlists.length > 0 && (
          <div className="mt-8 p-4 bg-accent/20 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Pro Tip
            </h4>
            <p className="text-sm text-muted-foreground">
              Smart playlists are generated in real-time based on your music library and listening habits. 
              Save them as regular playlists to keep specific versions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};