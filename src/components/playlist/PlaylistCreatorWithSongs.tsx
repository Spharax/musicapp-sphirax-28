import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Search, Music, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { musicDB, Playlist } from '@/utils/musicDatabase';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlaylistCreatorWithSongsProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (playlist: Playlist) => void;
  existingPlaylist?: Playlist | null;
}

export const PlaylistCreatorWithSongs: React.FC<PlaylistCreatorWithSongsProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated,
  existingPlaylist
}) => {
  const { audioFiles, getRecentTracks, getTopTracks } = useMediaLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);

  const colorTags = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadSuggestedTracks();
      if (existingPlaylist) {
        setName(existingPlaylist.name);
        setDescription(existingPlaylist.description || '');
        setSelectedColor(existingPlaylist.color);
        setSelectedTracks(new Set(existingPlaylist.songs));
      }
    }
  }, [isOpen, existingPlaylist]);

  const loadSuggestedTracks = async () => {
    const recent = await getRecentTracks();
    const top = await getTopTracks();
    setRecentTracks(recent);
    setTopTracks(top);
  };

  // Filter tracks based on search
  const filteredTracks = audioFiles.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTrackToggle = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleSelectAll = (tracks: Track[]) => {
    const newSelected = new Set(selectedTracks);
    tracks.forEach(track => newSelected.add(track.id));
    setSelectedTracks(newSelected);
  };

  const handleDeselectAll = (tracks: Track[]) => {
    const newSelected = new Set(selectedTracks);
    tracks.forEach(track => newSelected.delete(track.id));
    setSelectedTracks(newSelected);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setIsCreating(true);
    
    try {
      const playlist: Playlist = existingPlaylist ? {
        ...existingPlaylist,
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        songs: Array.from(selectedTracks),
        trackIds: Array.from(selectedTracks),
        lastModified: new Date()
      } : {
        id: `playlist_${Date.now()}_${Math.random()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        songs: Array.from(selectedTracks),
        trackIds: Array.from(selectedTracks),
        createdAt: new Date(),
        dateCreated: new Date(),
        lastModified: new Date()
      };

      await musicDB.createPlaylist(playlist);
      
      toast.success(`Playlist "${name}" ${existingPlaylist ? 'updated' : 'created'} successfully!`);
      onPlaylistCreated(playlist);
      handleClose();
    } catch (error) {
      toast.error(`Failed to ${existingPlaylist ? 'update' : 'create'} playlist`);
      console.error('Error with playlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor('#3B82F6');
    setSelectedTracks(new Set());
    setSearchQuery('');
    onClose();
  };

  const renderTrackItem = (track: Track, showAlbum = false) => (
    <div
      key={track.id}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all cursor-pointer group"
      onClick={() => handleTrackToggle(track.id)}
    >
      <Checkbox
        checked={selectedTracks.has(track.id)}
        onCheckedChange={() => handleTrackToggle(track.id)}
        className="shrink-0"
      />
      
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Music className="w-4 h-4 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate text-sm">{track.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        {showAlbum && (
          <p className="text-xs text-muted-foreground truncate">{track.album}</p>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: selectedColor }}
            />
            {existingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          {/* Playlist Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Playlist Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter playlist name..."
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                maxLength={100}
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Choose Color</label>
            <div className="flex gap-2 flex-wrap">
              {colorTags.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-lg border-2 transition-all duration-200
                    ${selectedColor === color 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:border-foreground/50 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check size={16} className="text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Song Selection */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Add Songs ({selectedTracks.size} selected)
              </h3>
            </div>

            <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Songs</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="top">Top Played</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    {audioFiles.length} songs available
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(audioFiles)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll(audioFiles)}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {audioFiles.map(track => renderTrackItem(track, true))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="recent" className="flex-1 overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Recently played songs
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(recentTracks)}
                  >
                    Select All Recent
                  </Button>
                </div>
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {recentTracks.map(track => renderTrackItem(track))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="top" className="flex-1 overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Most played songs
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(topTracks)}
                  >
                    Select All Top
                  </Button>
                </div>
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {topTracks.map(track => renderTrackItem(track))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="search" className="flex-1 overflow-hidden mt-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="Search songs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <ScrollArea className="h-72">
                    <div className="space-y-1">
                      {filteredTracks.map(track => renderTrackItem(track, true))}
                      {filteredTracks.length === 0 && searchQuery && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Music className="w-8 h-8 mx-auto mb-2" />
                          <p>No songs found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1"
          >
            {isCreating 
              ? (existingPlaylist ? 'Updating...' : 'Creating...') 
              : (existingPlaylist ? 'Update Playlist' : 'Create Playlist')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};