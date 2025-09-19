import { useState, useCallback } from 'react';
import type { Track } from './useMediaScanner';

export const usePlaybackQueue = () => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const setPlaybackQueue = useCallback((trackList: Track[], startIndex: number = 0) => {
    setQueue(trackList);
    setQueueIndex(startIndex);
  }, []);

  const playNext = useCallback((repeatMode?: 'none' | 'one' | 'all', isShuffling?: boolean) => {
    if (queue.length === 0) return null;

    if (isShuffling && queue.length > 1) {
      // Shuffle to random track (not current)
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      
      const randomTrack = queue[randomIndex];
      setQueueIndex(randomIndex);
      return randomTrack;
    } else if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      setQueueIndex(queueIndex + 1);
      return nextTrack;
    } else if (queue.length > 0 && repeatMode === 'all') {
      // Loop back to first track
      const firstTrack = queue[0];
      setQueueIndex(0);
      return firstTrack;
    }
    
    return null;
  }, [queue, queueIndex]);

  const playPrevious = useCallback((isShuffling?: boolean) => {
    if (queue.length === 0) return null;

    if (isShuffling && queue.length > 1) {
      // Shuffle to random track (not current)
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      
      const randomTrack = queue[randomIndex];
      setQueueIndex(randomIndex);
      return randomTrack;
    } else if (queueIndex > 0) {
      const prevTrack = queue[queueIndex - 1];
      setQueueIndex(queueIndex - 1);
      return prevTrack;
    } else if (queue.length > 0) {
      // Loop to last track
      const lastTrack = queue[queue.length - 1];
      setQueueIndex(queue.length - 1);
      return lastTrack;
    }
    
    return null;
  }, [queue, queueIndex]);

  const getCurrentTrack = useCallback(() => {
    return queue[queueIndex] || null;
  }, [queue, queueIndex]);

  const getQueuePosition = useCallback(() => {
    return { current: queueIndex + 1, total: queue.length };
  }, [queueIndex, queue.length]);

  return {
    queue,
    queueIndex,
    setPlaybackQueue,
    playNext,
    playPrevious,
    getCurrentTrack,
    getQueuePosition
  };
};