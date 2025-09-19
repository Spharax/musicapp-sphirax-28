import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Plus, Play, Heart, Music, Library as LibraryIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaylistCreatorWithSongs } from '@/components/playlist/PlaylistCreatorWithSongs';
import { FileUploader } from '@/components/common/FileUploader';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { VirtualizedList } from '@/components/performance/VirtualizedList';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { SwipeableCard } from '@/components/enhanced/SwipeableCard';
import { musicDB, Playlist } from '@/utils/musicDatabase';
import { cn } from '@/lib/utils';

export const LibraryScreen: React.FC = () => {
  const { 
    audioFiles, 
    playTrack
  } = useMediaLibrary();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadPlaylists(), loadFavorites()]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const allPlaylists = await musicDB.getAllPlaylists();
      setPlaylists(allPlaylists);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const loadFavorites = async () => {
    // For now, we'll use recent tracks as favorites since we don't have a favorites system yet
    try {
      const recentSongs = await musicDB.getRecentSongs(10);
      setFavoriteItems(recentSongs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        filePath: song.filePath,
        albumArt: song.albumArt,
        playCount: song.playCount,
        lastPlayed: song.lastPlayed,
        size: song.size,
        dateAdded: song.dateAdded,
        genre: song.genre
      })));
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const filteredItems = audioFiles.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePlaylist = async () => {
    await loadPlaylists(); // Refresh playlists after creating
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getPlaylistTracks = async (playlist: Playlist): Promise<Track[]> => {
    const tracks: Track[] = [];
    for (const songId of playlist.songs) {
      const song = await musicDB.getSongById(songId);
      if (song) {
        tracks.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          filePath: song.filePath,
          albumArt: song.albumArt,
          playCount: song.playCount,
          lastPlayed: song.lastPlayed,
          size: song.size,
          dateAdded: song.dateAdded,
          genre: song.genre
        });
      }
    }
    return tracks;
  };

  const renderTrackCard = (track: Track) => (
    <SwipeableCard
      key={track.id}
      onTap={() => playTrack(track, filteredItems)}
      onSwipeRight={() => playTrack(track, filteredItems)}
      className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02] group"
    >
      {viewMode === 'grid' ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
            <Music className="text-primary" size={24} />
          </div>
          <h3 className="font-medium text-sm mb-1 truncate">{track.title}</h3>
          <p className="text-xs text-muted-foreground mb-1 truncate">{track.artist}</p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(track.duration)}
          </p>
          <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity mx-auto mt-2" />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
            <Music className="text-primary" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{track.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(track.duration)} • {track.genre || 'Unknown'}
            </p>
          </div>
          <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </SwipeableCard>
  );

  const renderPlaylistCard = (playlist: Playlist) => {
    return (
      <div
        key={playlist.id}
        className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
        onClick={async () => {
          const tracks = await getPlaylistTracks(playlist);
          if (tracks.length > 0) {
            playTrack(tracks[0], tracks);
          }
        }}
      >
        {viewMode === 'grid' ? (
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: playlist.color }}
            >
              <Play className="text-white" size={20} />
            </div>
            <h3 className="font-medium text-sm mb-1 truncate">{playlist.name}</h3>
            <p className="text-xs text-muted-foreground">
              {playlist.songs.length} songs
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: playlist.color }}
            >
              <Play className="text-white" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {playlist.description || 'No description'}
              </p>
              <p className="text-xs text-muted-foreground">
                {playlist.songs.length} songs
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-20 min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-8 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LibraryIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Your Library</h1>
              <p className="text-sm text-muted-foreground">{audioFiles.length} songs available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="w-9 h-9"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="w-9 h-9"
            >
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
      </header>

      <div className="px-6 pt-6">
        {/* Tabs Content */}
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-accent/30">
            <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Library</TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Playlists</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            {/* Quick Create Section */}
            <div className="mb-8">
              <div 
                className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
                onClick={() => setShowPlaylistCreator(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Plus className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium">Create New Playlist</h3>
                    <p className="text-sm text-muted-foreground">Start building your collection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Music Files */}
            {audioFiles.length === 0 && (
              <div className="mb-8">
                <FileUploader onFilesAdded={() => window.location.reload()} />
              </div>
            )}

            {/* Library Items */}
            {isLoading ? (
              <LoadingSkeleton 
                variant={viewMode === 'grid' ? 'grid' : 'track'} 
                count={8} 
                className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}
              />
            ) : filteredItems.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'
              )}>
                {filteredItems.map(renderTrackCard)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Search className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
                <p className="text-muted-foreground">Try adjusting your search or add some music files</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists">
            {playlists.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'
              )}>
                {playlists.map(renderPlaylistCard)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Plus className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                <p className="text-muted-foreground mb-6">Create your first playlist to get started</p>
                <Button onClick={() => setShowPlaylistCreator(true)} className="proton-button">
                  Create Playlist
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favoriteItems.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'
              )}>
                {favoriteItems.map(renderTrackCard)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <Heart className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground">Heart some tracks to see them here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Playlist Creator Modal */}
      <PlaylistCreatorWithSongs
        isOpen={showPlaylistCreator}
        onClose={() => setShowPlaylistCreator(false)}
        onPlaylistCreated={handleCreatePlaylist}
      />
    </div>
  );
};