import { useState, useEffect, useCallback } from 'react';
import { musicDB, Song } from '@/utils/musicDatabase';
import { musicScanner } from '@/utils/musicScanner';
import { toast } from 'sonner';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  albumArt?: string;
  playCount: number;
  lastPlayed?: Date;
  size: number;
  dateAdded: Date;
  genre?: string;
  year?: number;
}

const songToTrack = (song: Song): Track => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  album: song.album,
  duration: song.duration,
  filePath: song.filePath,
  albumArt: song.albumArt,
  playCount: song.playCount,
  lastPlayed: song.lastPlayed,
  size: song.size,
  dateAdded: song.dateAdded,
  genre: song.genre,
  year: song.year
});

export const useMediaLibrary = () => {
  const [audioFiles, setAudioFiles] = useState<Track[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await musicDB.init();
      const songs = await musicDB.getAllSongs();
      const tracks = songs.map(songToTrack);
      setAudioFiles(tracks);
      
      if (tracks.length === 0) {
        toast.info('No music found. Tap "Scan for Music" to find your songs!');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load music library');
    }
  };

  const scanForMedia = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      toast.info('Scanning for music files...');
      const songs = await musicScanner.scanForMusic();
      const tracks = songs.map(songToTrack);
      setAudioFiles(tracks);
      setScanProgress(100);
      
      if (songs.length > 0) {
        toast.success(`Found ${songs.length} music files!`);
      } else {
        toast.info('No music files found. Make sure you have music in your Music, Download, or Downloads folders.');
      }
    } catch (error) {
      console.error('Error scanning media:', error);
      toast.error('Failed to scan for music files');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const refreshScan = useCallback(async () => {
    await scanForMedia();
  }, [scanForMedia]);

  // Get recent tracks
  const getRecentTracks = useCallback(async (): Promise<Track[]> => {
    try {
      const recentSongs = await musicDB.getRecentSongs(10);
      return recentSongs.map(songToTrack);
    } catch (error) {
      console.error('Failed to get recent tracks:', error);
      return [];
    }
  }, []);

  // Get top tracks
  const getTopTracks = useCallback(async (): Promise<Track[]> => {
    try {
      const topSongs = await musicDB.getTopSongs(10);
      return topSongs.map(songToTrack);
    } catch (error) {
      console.error('Failed to get top tracks:', error);
      return [];
    }
  }, []);

  // Queue management
  const playTrack = useCallback(async (track: Track, trackList?: Track[]) => {
    setCurrentTrack(track);
    
    // Update play count and last played
    try {
      const song = await musicDB.getSongById(track.id);
      if (song) {
        song.playCount += 1;
        song.lastPlayed = new Date();
        await musicDB.updateSong(song);
      }
    } catch (error) {
      console.error('Failed to update song stats:', error);
    }
    
    if (trackList) {
      setQueue(trackList);
      setQueueIndex(trackList.findIndex(t => t.id === track.id));
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }
  }, []);

  const playNext = useCallback((repeatMode?: 'none' | 'one' | 'all', isShuffling?: boolean) => {
    if (isShuffling && queue.length > 1) {
      // Shuffle to random track (not current)
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      
      const randomTrack = queue[randomIndex];
      setCurrentTrack(randomTrack);
      setQueueIndex(randomIndex);
    } else if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      setCurrentTrack(nextTrack);
      setQueueIndex(queueIndex + 1);
    } else if (queue.length > 0 && repeatMode === 'all') {
      // Loop back to first track
      const firstTrack = queue[0];
      setCurrentTrack(firstTrack);
      setQueueIndex(0);
    }
  }, [queue, queueIndex]);

  const playPrevious = useCallback((isShuffling?: boolean) => {
    if (isShuffling && queue.length > 1) {
      // Shuffle to random track (not current)
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      
      const randomTrack = queue[randomIndex];
      setCurrentTrack(randomTrack);
      setQueueIndex(randomIndex);
    } else if (queueIndex > 0) {
      const prevTrack = queue[queueIndex - 1];
      setCurrentTrack(prevTrack);
      setQueueIndex(queueIndex - 1);
    } else if (queue.length > 0) {
      // Loop to last track
      const lastTrack = queue[queue.length - 1];
      setCurrentTrack(lastTrack);
      setQueueIndex(queue.length - 1);
    }
  }, [queue, queueIndex]);

  // Search functionality
  const searchTracks = useCallback((query: string): Track[] => {
    if (!query.trim()) return audioFiles;
    
    const searchTerm = query.toLowerCase();
    return audioFiles.filter(track =>
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.album.toLowerCase().includes(searchTerm) ||
      track.genre?.toLowerCase().includes(searchTerm)
    );
  }, [audioFiles]);

  return {
    // Data
    audioFiles,
    currentTrack,
    queue,
    queueIndex,
    
    // Scanning
    isScanning,
    scanProgress,
    scanForMedia,
    refreshScan,
    
    // Tracks
    getRecentTracks,
    getTopTracks,
    searchTracks,
    
    // Playback
    playTrack,
    playNext,
    playPrevious
  };
};