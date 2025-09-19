import { useState, useCallback } from 'react';
import { useMediaScanner } from './useMediaScanner';
import { usePlaybackQueue } from './usePlaybackQueue';
import { useTrackDatabase } from './useTrackDatabase';
import type { Track } from './useMediaScanner';

export const useMediaLibrary = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  const {
    isScanning,
    scanProgress,
    scanForMedia
  } = useMediaScanner();

  const {
    queue,
    queueIndex,
    setPlaybackQueue,
    playNext: queuePlayNext,
    playPrevious: queuePlayPrevious,
    getCurrentTrack,
    getQueuePosition
  } = usePlaybackQueue();

  const {
    audioFiles,
    isLoading,
    getRecentTracks,
    getTopTracks,
    updateTrackStats,
    searchTracks,
    refreshLibrary,
    loadInitialData
  } = useTrackDatabase();

  // Enhanced scan that updates the database
  const scanForMediaEnhanced = useCallback(async () => {
    const tracks = await scanForMedia();
    await refreshLibrary(tracks);
  }, [scanForMedia, refreshLibrary]);

  // Play track with queue management
  const playTrack = useCallback(async (track: Track, trackList?: Track[]) => {
    setCurrentTrack(track);
    
    // Update play count and last played
    await updateTrackStats(track.id);
    
    if (trackList) {
      const trackIndex = trackList.findIndex(t => t.id === track.id);
      setPlaybackQueue(trackList, trackIndex);
    } else {
      setPlaybackQueue([track], 0);
    }
  }, [updateTrackStats, setPlaybackQueue]);

  const playNext = useCallback((repeatMode?: 'none' | 'one' | 'all', isShuffling?: boolean) => {
    const nextTrack = queuePlayNext(repeatMode, isShuffling);
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      updateTrackStats(nextTrack.id);
    }
  }, [queuePlayNext, updateTrackStats]);

  const playPrevious = useCallback((isShuffling?: boolean) => {
    const prevTrack = queuePlayPrevious(isShuffling);
    if (prevTrack) {
      setCurrentTrack(prevTrack);
      updateTrackStats(prevTrack.id);
    }
  }, [queuePlayPrevious, updateTrackStats]);

  const refreshScan = useCallback(async () => {
    await scanForMediaEnhanced();
  }, [scanForMediaEnhanced]);

  return {
    // Data
    audioFiles,
    currentTrack,
    queue,
    queueIndex,
    isLoading,
    
    // Scanning
    isScanning,
    scanProgress,
    scanForMedia: scanForMediaEnhanced,
    refreshScan,
    
    // Tracks
    getRecentTracks,
    getTopTracks,
    searchTracks,
    
    // Playback
    playTrack,
    playNext,
    playPrevious,
    getCurrentTrack,
    getQueuePosition
  };
};

// Re-export Track type for convenience
export type { Track };