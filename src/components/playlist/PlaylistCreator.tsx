import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LocalStorage, Playlist } from '@/utils/localStorage';

interface PlaylistCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (playlist: Playlist) => void;
}

export const PlaylistCreator: React.FC<PlaylistCreatorProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(LocalStorage.getColorTags()[0]);
  const [isCreating, setIsCreating] = useState(false);

  const colorTags = LocalStorage.getColorTags();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      colorTag: selectedColor,
      trackIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to local storage
    LocalStorage.savePlaylist(newPlaylist);
    
    // Callback to parent
    onPlaylistCreated(newPlaylist);
    
    // Reset form
    setName('');
    setDescription('');
    setSelectedColor(colorTags[0]);
    setIsCreating(false);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(colorTags[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: selectedColor }}
            />
            Create New Playlist
          </DialogTitle>
          <DialogDescription>
            Create a custom playlist and add your favorite tracks to organize your music collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Playlist Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Playlist Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name..."
              className="w-full"
              maxLength={50}
            />
            <div className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Choose Color Tag</label>
            <div className="grid grid-cols-5 gap-3">
              {colorTags.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all duration-200
                    flex items-center justify-center
                    ${selectedColor === color 
                      ? 'border-foreground shadow-lg scale-110' 
                      : 'border-border hover:border-foreground/50 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check size={20} className="text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Selected: {selectedColor}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-card border rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <Plus className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {name || 'Untitled Playlist'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground">
                  0 songs • Created just now
                </p>
              </div>
            </div>
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
            {isCreating ? 'Creating...' : 'Create Playlist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};