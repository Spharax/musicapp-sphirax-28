import { useState, useEffect, useCallback } from 'react';
import { musicDB, Song } from '@/utils/musicDatabase';
import { toast } from 'sonner';
import type { Track } from './useMediaScanner';

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

export const useTrackDatabase = () => {
  const [audioFiles, setAudioFiles] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

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

  // Update track stats
  const updateTrackStats = useCallback(async (trackId: string) => {
    try {
      const song = await musicDB.getSongById(trackId);
      if (song) {
        song.playCount += 1;
        song.lastPlayed = new Date();
        await musicDB.updateSong(song);
        
        // Update local state
        setAudioFiles(prev => 
          prev.map(track => 
            track.id === trackId 
              ? { ...track, playCount: song.playCount, lastPlayed: song.lastPlayed }
              : track
          )
        );
      }
    } catch (error) {
      console.error('Failed to update song stats:', error);
    }
  }, []);

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

  const refreshLibrary = useCallback(async (newTracks: Track[]) => {
    setAudioFiles(newTracks);
  }, []);

  return {
    audioFiles,
    isLoading,
    getRecentTracks,
    getTopTracks,
    updateTrackStats,
    searchTracks,
    refreshLibrary,
    loadInitialData
  };
};