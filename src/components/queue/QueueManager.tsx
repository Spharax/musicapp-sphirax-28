import React, { useState } from 'react';
import { List, Shuffle, RotateCcw, Trash2, Music, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Track } from '@/hooks/useMediaLibrary';
import { SwipeableCard } from '@/components/enhanced/SwipeableCard';
import { toast } from 'sonner';

interface QueueManagerProps {
  queue: Track[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track, index: number) => void;
  onReorderQueue: (newQueue: Track[]) => void;
  onClearQueue: () => void;
  onShuffleQueue: () => void;
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  queue,
  currentIndex,
  isOpen,
  onClose,
  onPlayTrack,
  onReorderQueue,
  onClearQueue,
  onShuffleQueue
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newQueue = [...queue];
    const draggedItem = newQueue[draggedIndex];
    newQueue.splice(draggedIndex, 1);
    newQueue.splice(index, 0, draggedItem);
    
    onReorderQueue(newQueue);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = queue.reduce((total, track) => total + track.duration, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <List className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Play Queue</h2>
              <p className="text-sm text-muted-foreground">
                {queue.length} songs • {Math.floor(totalDuration / 60)} minutes
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Controls */}
        <div className="flex gap-2 p-4 border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onShuffleQueue}
            className="flex items-center gap-2"
          >
            <Shuffle size={16} />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearQueue}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
            Clear All
          </Button>
        </div>

        {/* Queue List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {queue.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Music className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Queue is empty</h3>
                <p className="text-muted-foreground">Add some tracks to start listening</p>
              </div>
            ) : (
              queue.map((track, index) => (
                <SwipeableCard
                  key={`${track.id}-${index}`}
                  onTap={() => onPlayTrack(track, index)}
                  onSwipeLeft={() => {
                    const newQueue = queue.filter((_, i) => i !== index);
                    onReorderQueue(newQueue);
                    toast.success('Track removed from queue');
                  }}
                  className={`p-3 rounded-lg transition-all ${
                    index === currentIndex
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 cursor-move"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <GripVertical size={16} className="text-muted-foreground" />
                      
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${
                          index === currentIndex ? 'text-primary' : ''
                        }`}>
                          {track.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist} • {track.album}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(track.duration)}
                        </span>
                        {index === currentIndex && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </SwipeableCard>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Up Next Section */}
        {queue.length > currentIndex + 1 && (
          <div className="p-4 border-t border-border/50">
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Up Next</h4>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm truncate">
                  {queue[currentIndex + 1]?.title}
                </h5>
                <p className="text-xs text-muted-foreground truncate">
                  {queue[currentIndex + 1]?.artist}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};