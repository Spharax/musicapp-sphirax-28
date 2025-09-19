import React, { useState, useEffect } from 'react';
import { Play, Download, FileAudio, Search, Headphones, Settings, ScanLine, Music, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { PlaylistCreatorWithSongs } from '@/components/playlist/PlaylistCreatorWithSongs';
import { FileUploader } from '@/components/common/FileUploader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchScreen } from '@/components/search/SearchScreen';
import { SmartMixModal } from '@/components/smart-mix/SmartMixModal';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentTracks } from '@/components/home/RecentTracks';
import { NotificationSystem } from '@/components/common/NotificationSystem';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { SwipeableCard } from '@/components/enhanced/SwipeableCard';
import { musicDB } from '@/utils/musicDatabase';

export const HomeScreen: React.FC = () => {
  const { 
    isScanning, 
    scanProgress, 
    scanForMedia, 
    getRecentTracks, 
    audioFiles,
    playTrack 
  } = useMediaLibrary();
  
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSmartMix, setShowSmartMix] = useState(false);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalPlaytime: 0,
    totalPlaylists: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [audioFiles]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load recent tracks
      const recent = await getRecentTracks();
      setRecentTracks(recent);

      // Load stats
      const userStats = await musicDB.getStats();
      const allPlaylists = await musicDB.getAllPlaylists();
      
      setStats({
        totalTracks: audioFiles.length,
        totalPlaytime: userStats.totalPlayTime,
        totalPlaylists: allPlaylists.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const primaryActions = [
    { 
      id: 'play', 
      icon: Play, 
      label: 'Play Recent',
      description: 'Continue listening',
      action: () => recentTracks.length > 0 && playTrack(recentTracks[0], recentTracks),
      primary: true
    },
    { 
      id: 'scan', 
      icon: ScanLine, 
      label: 'Scan Library',
      description: 'Find new music',
      action: scanForMedia,
      primary: true
    }
  ];

  const secondaryActions = [
    { 
      id: 'playlist', 
      icon: FileAudio, 
      label: 'New Playlist',
      action: () => setShowPlaylistCreator(true)
    },
    { 
      id: 'discover', 
      icon: Search, 
      label: 'Search',
      action: () => setShowSearch(true)
    },
    { 
      id: 'smart-mix', 
      icon: Headphones, 
      label: 'Smart Mix',
      action: () => setShowSmartMix(true)
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings',
      action: () => console.log('Settings')
    },
  ];

  return (
    <div className="pb-20 min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-8 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-1">MelodyForge</h1>
            <p className="text-muted-foreground text-sm">Offline Music Player</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationSystem />
            <ThemeToggle />
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 pt-6">
        {/* Scanning Progress */}
        {isScanning && (
          <div className="mb-8 p-6 proton-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-medium">Scanning Music Library</h3>
                <p className="text-sm text-muted-foreground">Searching for audio files...</p>
              </div>
            </div>
            <Progress value={scanProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(scanProgress)}% complete
            </p>
          </div>
        )}

        {/* Primary Actions */}
        <div className="mb-8">
          <div className="grid gap-4">
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.action}
                disabled={action.id === 'play' && recentTracks.length === 0}
                className="h-16 proton-button flex items-center justify-start gap-4 px-6 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm opacity-80">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.map((action) => (
              <div
                key={action.id}
                className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
                onClick={action.action}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Library Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Library</h2>
          {isLoading ? (
            <LoadingSkeleton variant="stats" count={3} className="grid grid-cols-3 gap-3" />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="proton-card p-4 text-center hover-lift">
                <div className="text-2xl font-bold text-primary mb-1 animate-slide-up">{stats.totalTracks}</div>
                <div className="text-xs text-muted-foreground">Songs</div>
              </div>
              
              <div className="proton-card p-4 text-center hover-lift">
                <div className="text-2xl font-bold text-primary mb-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {Math.round(stats.totalPlaytime / 3600)}h
                </div>
                <div className="text-xs text-muted-foreground">Played</div>
              </div>
              
              <div className="proton-card p-4 text-center hover-lift">
                <div className="text-2xl font-bold text-primary mb-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  {stats.totalPlaylists}
                </div>
                <div className="text-xs text-muted-foreground">Lists</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Tracks */}
        {isLoading ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Recently Played</h2>
            <LoadingSkeleton variant="track" count={5} />
          </div>
        ) : recentTracks.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recently Played</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </div>
            
            <div className="space-y-2">
              {recentTracks.slice(0, 5).map((track, index) => (
                <SwipeableCard
                  key={track.id}
                  onTap={() => playTrack(track, recentTracks)}
                  onSwipeRight={() => playTrack(track, recentTracks)}
                  className="animate-slide-up"
                >
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-4 h-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </SwipeableCard>
              ))}
            </div>
          </div>
        ) : null}

        {/* Empty State / File Upload */}
        {audioFiles.length === 0 && !isScanning && (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Music Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add your music files to get started with your personal library
              </p>
            </div>
            
            <FileUploader onFilesAdded={loadData} />
          </div>
        )}

        {/* Add Music Section for existing libraries */}
        {audioFiles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add More Music</h2>
            </div>
            <FileUploader onFilesAdded={loadData} />
          </div>
        )}
      </div>

      {/* Search Screen */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-background">
          <SearchScreen onClose={() => setShowSearch(false)} />
        </div>
      )}

      {/* Playlist Creator Modal */}
      <PlaylistCreatorWithSongs
        isOpen={showPlaylistCreator}
        onClose={() => setShowPlaylistCreator(false)}
        onPlaylistCreated={() => {
          loadData(); // Refresh data after creating playlist
        }}
      />

      {/* Smart Mix Modal */}
      <SmartMixModal
        isOpen={showSmartMix}
        onClose={() => setShowSmartMix(false)}
        onMixCreated={(tracks) => {
          loadData(); // Refresh data
          if (tracks.length > 0) {
            playTrack(tracks[0], tracks);
          }
        }}
      />
    </div>
  );
};