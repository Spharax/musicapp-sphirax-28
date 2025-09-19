import { useState, useCallback } from 'react';
import { musicScanner } from '@/utils/musicScanner';
import { musicDB, Song } from '@/utils/musicDatabase';
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

export const useMediaScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const scanForMedia = useCallback(async (): Promise<Track[]> => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      toast.info('Scanning for music files...');
      const songs = await musicScanner.scanForMusic();
      const tracks = songs.map(songToTrack);
      setScanProgress(100);
      
      if (songs.length > 0) {
        toast.success(`Found ${songs.length} music files!`);
      } else {
        toast.info('No music files found. Make sure you have music in your Music, Download, or Downloads folders.');
      }
      
      return tracks;
    } catch (error) {
      console.error('Error scanning media:', error);
      toast.error('Failed to scan for music files');
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    isScanning,
    scanProgress,
    scanForMedia
  };
};