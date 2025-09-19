import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Music, Play, Clock, User, Album } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';

interface SearchScreenProps {
  onClose?: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'title' | 'artist' | 'album' | 'genre'>('all');
  const { audioFiles, playTrack, searchTracks } = useMediaLibrary();

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return audioFiles.slice(0, 20); // Show first 20 tracks when no search

    const results = searchTracks(searchQuery);
    
    if (activeFilter === 'all') return results;
    
    return results.filter(track => {
      const query = searchQuery.toLowerCase();
      switch (activeFilter) {
        case 'title':
          return track.title.toLowerCase().includes(query);
        case 'artist':
          return track.artist.toLowerCase().includes(query);
        case 'album':
          return track.album.toLowerCase().includes(query);
        case 'genre':
          return track.genre?.toLowerCase().includes(query) || false;
        default:
          return true;
      }
    });
  }, [searchQuery, activeFilter, audioFiles, searchTracks]);

  const filters = [
    { id: 'all' as const, label: 'All', icon: Music },
    { id: 'title' as const, label: 'Title', icon: Music },
    { id: 'artist' as const, label: 'Artist', icon: User },
    { id: 'album' as const, label: 'Album', icon: Album },
    { id: 'genre' as const, label: 'Genre', icon: Filter },
  ];

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              ←
            </Button>
            <h1 className="text-xl font-bold">Search Music</h1>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 bg-card border-border/50"
              autoFocus
            />
          </div>
          
          {/* Filter Badges */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {filters.map(({ id, label, icon: Icon }) => (
              <Badge
                key={id}
                variant={activeFilter === id ? "default" : "outline"}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer transition-all whitespace-nowrap",
                  activeFilter === id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "hover:bg-accent"
                )}
                onClick={() => setActiveFilter(id)}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="px-6">
        {/* Results Header */}
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {searchQuery ? `${filteredTracks.length} results for "${searchQuery}"` : `Showing ${filteredTracks.length} songs`}
          </div>
          {filteredTracks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => playTrack(filteredTracks[0], filteredTracks)}
              className="text-primary hover:text-primary"
            >
              Play All
            </Button>
          )}
        </div>

        {/* Track List */}
        {filteredTracks.length > 0 ? (
          <div className="space-y-2">
            {filteredTracks.map((track, index) => (
              <Card
                key={track.id}
                className="proton-card hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => playTrack(track, filteredTracks)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Track Number & Play Icon */}
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <span className="group-hover:hidden">{index + 1}</span>
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
                    
                    {/* Duration & Actions */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(track.duration)}
                      </div>
                      {track.playCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {track.playCount} plays
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-muted/50 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No results found' : 'Start searching'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchQuery 
                ? `No songs found matching "${searchQuery}". Try different keywords.`
                : 'Search through your music library by title, artist, album, or genre.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};