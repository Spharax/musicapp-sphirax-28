import { useEffect, useRef } from 'react';
import { Track } from '@/hooks/useMediaLibrary';

interface UseBackgroundPlaybackProps {
  currentTrack?: Track;
  isPlaying: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export const useBackgroundPlayback = ({
  currentTrack,
  isPlaying,
  onNext,
  onPrevious,
  onPlay,
  onPause
}: UseBackgroundPlaybackProps) => {
  const mediaSessionRef = useRef<MediaSession | null>(null);

  useEffect(() => {
    // Check if MediaSession API is supported
    if ('mediaSession' in navigator) {
      mediaSessionRef.current = navigator.mediaSession;
    }
  }, []);

  // Update media session metadata when track changes
  useEffect(() => {
    if (!mediaSessionRef.current || !currentTrack) return;

    try {
      mediaSessionRef.current.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: currentTrack.albumArt ? [
          { src: currentTrack.albumArt, sizes: '96x96', type: 'image/png' },
          { src: currentTrack.albumArt, sizes: '128x128', type: 'image/png' },
          { src: currentTrack.albumArt, sizes: '192x192', type: 'image/png' },
          { src: currentTrack.albumArt, sizes: '256x256', type: 'image/png' },
          { src: currentTrack.albumArt, sizes: '384x384', type: 'image/png' },
          { src: currentTrack.albumArt, sizes: '512x512', type: 'image/png' }
        ] : undefined
      });
    } catch (error) {
      console.error('Failed to set media session metadata:', error);
    }
  }, [currentTrack]);

  // Set up media session action handlers
  useEffect(() => {
    if (!mediaSessionRef.current) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => onPlay?.()],
      ['pause', () => onPause?.()],
      ['previoustrack', () => onPrevious?.()],
      ['nexttrack', () => onNext?.()],
      ['stop', () => onPause?.()]
    ];

    // Set action handlers
    actionHandlers.forEach(([action, handler]) => {
      try {
        mediaSessionRef.current!.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`MediaSession action "${action}" is not supported:`, error);
      }
    });

    // Cleanup on unmount
    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          mediaSessionRef.current!.setActionHandler(action, null);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    };
  }, [onPlay, onPause, onNext, onPrevious]);

  // Update playback state
  useEffect(() => {
    if (!mediaSessionRef.current) return;

    try {
      mediaSessionRef.current.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (error) {
      console.error('Failed to set playback state:', error);
    }
  }, [isPlaying]);

  // Return media session for direct access if needed
  return {
    mediaSession: mediaSessionRef.current,
    isSupported: 'mediaSession' in navigator
  };
};