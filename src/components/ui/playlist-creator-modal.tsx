import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { musicDB, Playlist } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface PlaylistCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistCreated?: (playlist: Playlist) => void;
}

const colorOptions = [
  { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-700' },
  { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-blue-700' },
  { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-green-700' },
  { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-pink-700' },
  { name: 'Orange', value: '#f97316', gradient: 'from-orange-500 to-orange-700' },
  { name: 'Red', value: '#ef4444', gradient: 'from-red-500 to-red-700' },
  { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-cyan-700' },
  { name: 'Indigo', value: '#6366f1', gradient: 'from-indigo-500 to-indigo-700' },
];

export const PlaylistCreatorModal: React.FC<PlaylistCreatorModalProps> = ({
  open,
  onOpenChange,
  onPlaylistCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setCreating(true);
    
    try {
      const playlist: Playlist = {
        id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor.value,
        songs: [],
        trackIds: [], // Alias for songs for compatibility
        createdAt: new Date(),
        dateCreated: new Date(), // Alias for createdAt
        lastModified: new Date()
      };

      await musicDB.createPlaylist(playlist);
      toast.success(`Playlist "${name}" created successfully!`);
      
      onPlaylistCreated?.(playlist);
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
      setSelectedColor(colorOptions[0]);
    } catch (error) {
      toast.error('Failed to create playlist');
      console.error('Error creating playlist:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Create New Playlist</DialogTitle>
          <DialogDescription>
            Create a new playlist to organize your music collection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Playlist Name */}
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border-muted focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description (Optional)</Label>
            <Textarea
              id="playlist-description"
              placeholder="Describe your playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/30 border-muted focus:border-primary resize-none"
              rows={3}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Playlist Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    relative h-12 rounded-lg bg-gradient-to-br ${color.gradient} 
                    transition-all duration-200 hover:scale-105
                    ${selectedColor.value === color.value 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-background' 
                      : ''
                    }
                  `}
                  title={color.name}
                >
                  {selectedColor.value === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedColor.name}
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedColor.gradient} text-white`}>
              <h3 className="font-semibold text-lg">
                {name || 'Playlist Name'}
              </h3>
              {description && (
                <p className="text-sm opacity-90 mt-1">
                  {description}
                </p>
              )}
              <p className="text-xs opacity-75 mt-2">
                0 songs • 0 min
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {creating ? 'Creating...' : 'Create Playlist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};