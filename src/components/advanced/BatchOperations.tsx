import React, { useState } from 'react';
import { CheckSquare, Trash2, Heart, FolderPlus, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface BatchOperationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  isOpen,
  onClose
}) => {
  const { audioFiles } = useMediaLibrary();
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(audioFiles.map(track => track.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
    setSelectAll(newSelected.size === audioFiles.length);
  };

  const handleDeleteSelected = async () => {
    if (selectedTracks.size === 0) return;

    const confirmed = confirm(`Delete ${selectedTracks.size} selected tracks?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      for (const trackId of selectedTracks) {
        await musicDB.deleteSong(trackId);
      }
      toast.success(`Deleted ${selectedTracks.size} tracks`);
      setSelectedTracks(new Set());
      setSelectAll(false);
      // Force refresh the library
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete tracks:', error);
      toast.error('Failed to delete some tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (selectedTracks.size === 0) return;

    const playlistName = prompt('Enter playlist name:');
    if (!playlistName) return;

    setIsLoading(true);
    try {
      const playlist = {
        id: `batch_${Date.now()}`,
        name: playlistName,
        description: `Created from ${selectedTracks.size} selected tracks`,
        songs: Array.from(selectedTracks),
        trackIds: Array.from(selectedTracks),
        createdAt: new Date(),
        dateCreated: new Date(),
        lastModified: new Date(),
        color: '#8b5cf6'
      };

      await musicDB.createPlaylist(playlist);
      toast.success(`Created playlist "${playlistName}" with ${selectedTracks.size} tracks`);
      setSelectedTracks(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkFavorites = async () => {
    if (selectedTracks.size === 0) return;

    setIsLoading(true);
    try {
      for (const trackId of selectedTracks) {
        const song = await musicDB.getSongById(trackId);
        if (song) {
          song.playCount += 10; // Boost play count to mark as favorite
          await musicDB.updateSong(song);
        }
      }
      toast.success(`Marked ${selectedTracks.size} tracks as favorites`);
      setSelectedTracks(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to mark favorites:', error);
      toast.error('Failed to mark favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedTracks.size === 0) return;

    const selectedTracksData = audioFiles.filter(track => selectedTracks.has(track.id));
    const exportData = {
      playlist: {
        name: `Export_${new Date().toISOString().split('T')[0]}`,
        tracks: selectedTracksData.map(track => ({
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          genre: track.genre
        }))
      },
      exportDate: new Date().toISOString(),
      trackCount: selectedTracks.size
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `melodyforge_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedTracks.size} tracks metadata`);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Batch Operations</h2>
              <p className="text-sm text-muted-foreground">
                {selectedTracks.size} of {audioFiles.length} tracks selected
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({audioFiles.length} tracks)
            </label>
          </div>

          {selectedTracks.size > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreatePlaylist}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FolderPlus size={16} />
                Create Playlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkFavorites}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Heart size={16} />
                Mark Favorites
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Export Metadata
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Track List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <LoadingSkeleton variant="track" count={5} />
            ) : (
              audioFiles.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedTracks.has(track.id)
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedTracks.has(track.id)}
                    onCheckedChange={() => handleSelectTrack(track.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{track.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist} • {track.album}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDuration(track.duration)}</span>
                      <span>•</span>
                      <span>{Math.round(track.size / (1024 * 1024))}MB</span>
                      <span>•</span>
                      <span>Played {track.playCount} times</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {track.playCount > 5 && (
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Summary */}
        {selectedTracks.size > 0 && (
          <div className="p-4 border-t border-border/50 bg-accent/20">
            <div className="text-sm text-muted-foreground">
              <strong>{selectedTracks.size}</strong> tracks selected • 
              Total size: <strong>
                {Math.round(
                  audioFiles
                    .filter(t => selectedTracks.has(t.id))
                    .reduce((sum, t) => sum + t.size, 0) / (1024 * 1024)
                )}MB
              </strong> • 
              Total duration: <strong>
                {Math.floor(
                  audioFiles
                    .filter(t => selectedTracks.has(t.id))
                    .reduce((sum, t) => sum + t.duration, 0) / 60
                )}m
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};