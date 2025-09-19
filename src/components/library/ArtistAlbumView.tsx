import React, { useState, useEffect } from 'react';
import { User, Disc, Play, Shuffle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { SwipeableCard } from '@/components/enhanced/SwipeableCard';

interface Artist {
  name: string;
  tracks: Track[];
  albumCount: number;
  totalDuration: number;
}

interface Album {
  name: string;
  artist: string;
  tracks: Track[];
  year?: number;
  totalDuration: number;
}

interface ArtistAlbumViewProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
}

export const ArtistAlbumView: React.FC<ArtistAlbumViewProps> = ({
  isOpen,
  onClose,
  onPlayTrack
}) => {
  const { audioFiles } = useMediaLibrary();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    if (isOpen) {
      organizeLibrary();
    }
  }, [isOpen, audioFiles]);

  const organizeLibrary = async () => {
    setIsLoading(true);
    
    try {
      // Group by artists
      const artistMap = new Map<string, Track[]>();
      const albumMap = new Map<string, Track[]>();

      audioFiles.forEach(track => {
        const artistName = track.artist || 'Unknown Artist';
        const albumKey = `${artistName} - ${track.album || 'Unknown Album'}`;

        // Group by artist
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, []);
        }
        artistMap.get(artistName)!.push(track);

        // Group by album
        if (!albumMap.has(albumKey)) {
          albumMap.set(albumKey, []);
        }
        albumMap.get(albumKey)!.push(track);
      });

      // Convert to arrays and calculate stats
      const artistsArray: Artist[] = Array.from(artistMap.entries()).map(([name, tracks]) => {
        const albums = new Set(tracks.map(t => t.album || 'Unknown Album'));
        const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
        
        return {
          name,
          tracks,
          albumCount: albums.size,
          totalDuration
        };
      });

      const albumsArray: Album[] = Array.from(albumMap.entries()).map(([key, tracks]) => {
        const [artist, albumName] = key.split(' - ');
        const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
        const years = tracks.map(t => t.year).filter(Boolean);
        const year = years.length > 0 ? Math.min(...years) : undefined;
        
        return {
          name: albumName,
          artist,
          tracks: tracks.sort((a, b) => (a.year || 0) - (b.year || 0)),
          year,
          totalDuration
        };
      });

      // Sort by track count (most popular first)
      artistsArray.sort((a, b) => b.tracks.length - a.tracks.length);
      albumsArray.sort((a, b) => b.tracks.length - a.tracks.length);

      setArtists(artistsArray);
      setAlbums(albumsArray);
    } catch (error) {
      console.error('Failed to organize library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playArtist = (artist: Artist, shuffle = false) => {
    let tracks = [...artist.tracks];
    if (shuffle) {
      tracks = tracks.sort(() => Math.random() - 0.5);
    }
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks);
    }
  };

  const playAlbum = (album: Album, shuffle = false) => {
    let tracks = [...album.tracks];
    if (shuffle) {
      tracks = tracks.sort(() => Math.random() - 0.5);
    }
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Browse Library</h2>
              <p className="text-sm text-muted-foreground">Explore by artists and albums</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/50">
          <Input
            placeholder="Search artists or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {selectedArtist ? (
          /* Artist Detail View */
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedArtist(null)}
                className="mb-4"
              >
                ← Back to Artists
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedArtist.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedArtist.tracks.length} songs • {selectedArtist.albumCount} albums • {formatDuration(selectedArtist.totalDuration)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => playArtist(selectedArtist)} className="proton-button">
                      <Play size={16} className="mr-2" />
                      Play All
                    </Button>
                    <Button variant="outline" onClick={() => playArtist(selectedArtist, true)}>
                      <Shuffle size={16} className="mr-2" />
                      Shuffle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {selectedArtist.tracks.map((track, index) => (
                  <SwipeableCard
                    key={track.id}
                    onTap={() => onPlayTrack(track, selectedArtist.tracks)}
                    className="p-3 rounded-lg hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{track.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.album} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </SwipeableCard>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : selectedAlbum ? (
          /* Album Detail View */
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAlbum(null)}
                className="mb-4"
              >
                ← Back to Albums
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Disc className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedAlbum.name}</h3>
                  <p className="text-lg text-muted-foreground">{selectedAlbum.artist}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlbum.year && `${selectedAlbum.year} • `}
                    {selectedAlbum.tracks.length} songs • {formatDuration(selectedAlbum.totalDuration)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => playAlbum(selectedAlbum)} className="proton-button">
                      <Play size={16} className="mr-2" />
                      Play Album
                    </Button>
                    <Button variant="outline" onClick={() => playAlbum(selectedAlbum, true)}>
                      <Shuffle size={16} className="mr-2" />
                      Shuffle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {selectedAlbum.tracks.map((track, index) => (
                  <SwipeableCard
                    key={track.id}
                    onTap={() => onPlayTrack(track, selectedAlbum.tracks)}
                    className="p-3 rounded-lg hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{track.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </SwipeableCard>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* Main View */
          <Tabs defaultValue="artists" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
              <TabsTrigger value="artists">Artists ({artists.length})</TabsTrigger>
              <TabsTrigger value="albums">Albums ({albums.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="artists" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <LoadingSkeleton variant="track" count={8} />
                  ) : (
                    filteredArtists.map((artist) => (
                      <SwipeableCard
                        key={artist.name}
                        onTap={() => setSelectedArtist(artist)}
                        className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{artist.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {artist.tracks.length} songs • {artist.albumCount} albums
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(artist.totalDuration)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                playArtist(artist);
                              }}
                            >
                              <Play size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                playArtist(artist, true);
                              }}
                            >
                              <Shuffle size={16} />
                            </Button>
                          </div>
                        </div>
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="albums" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <LoadingSkeleton variant="track" count={8} />
                  ) : (
                    filteredAlbums.map((album) => (
                      <SwipeableCard
                        key={`${album.artist}-${album.name}`}
                        onTap={() => setSelectedAlbum(album)}
                        className="proton-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Disc className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{album.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
                            <p className="text-xs text-muted-foreground">
                              {album.year && `${album.year} • `}
                              {album.tracks.length} songs • {formatDuration(album.totalDuration)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                playAlbum(album);
                              }}
                            >
                              <Play size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                playAlbum(album, true);
                              }}
                            >
                              <Shuffle size={16} />
                            </Button>
                          </div>
                        </div>
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};