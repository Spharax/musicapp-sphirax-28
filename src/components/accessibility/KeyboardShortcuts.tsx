import { useEffect } from 'react';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';

interface KeyboardShortcutsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onTogglePlay();
          break;
        
        case 'ArrowRight':
          if (event.shiftKey) {
            event.preventDefault();
            onNext?.();
          }
          break;
        
        case 'ArrowLeft':
          if (event.shiftKey) {
            event.preventDefault();
            onPrevious?.();
          }
          break;
        
        case 'ArrowUp':
          if (event.shiftKey) {
            event.preventDefault();
            onVolumeUp?.();
          }
          break;
        
        case 'ArrowDown':
          if (event.shiftKey) {
            event.preventDefault();
            onVolumeDown?.();
          }
          break;
        
        case 'KeyN':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onNext?.();
          }
          break;
        
        case 'KeyP':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onPrevious?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, onTogglePlay, onNext, onPrevious, onVolumeUp, onVolumeDown]);

  return null; // This component doesn't render anything
};