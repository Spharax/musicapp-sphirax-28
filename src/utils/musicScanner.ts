import { webAudioService } from '@/services/webAudioService';
import { musicDB, Song } from './musicDatabase';
import { toast } from 'sonner';

export class MusicScanner {
  private supportedFormats = ['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.aac'];
  private minFileSize = 200 * 1024; // 200KB
  private minDuration = 10; // 10 seconds

  async scanForMusic(): Promise<Song[]> {
    try {
      toast.info('Please select your music files...');
      
      // Use web audio service to request file access
      const files = await webAudioService.requestFileAccess();
      
      if (files.length === 0) {
        toast.info('No files selected');
        return [];
      }

      const songs: Song[] = [];
      
      // Process each file
      for (const file of files) {
        try {
          const song = await this.createSongFromFile(file);
          if (song) {
            songs.push(song);
          }
        } catch (error) {
          console.log(`Could not process file ${file.name}:`, error);
        }
      }

      // Store found songs in database
      for (const song of songs) {
        try {
          await musicDB.addSong(song);
        } catch (error) {
          // Song might already exist, try to update
          try {
            await musicDB.updateSong(song);
          } catch (updateError) {
            console.log('Could not add/update song:', song.title, updateError);
          }
        }
      }

      toast.success(`Added ${songs.length} music files to your library`);
      return songs;
    } catch (error) {
      toast.error('Failed to access music files');
      console.error('Music scan error:', error);
      return [];
    }
  }

  async scanForDirectoryMusic(): Promise<Song[]> {
    try {
      toast.info('Please select a folder containing music...');
      
      // Use web audio service to request directory access
      const files = await webAudioService.requestDirectoryAccess();
      
      if (files.length === 0) {
        toast.info('No files found in selected directory');
        return [];
      }

      const songs: Song[] = [];
      
      // Process each file
      for (const file of files) {
        try {
          const song = await this.createSongFromFile(file);
          if (song) {
            songs.push(song);
          }
        } catch (error) {
          console.log(`Could not process file ${file.name}:`, error);
        }
      }

      // Store found songs in database
      for (const song of songs) {
        try {
          await musicDB.addSong(song);
        } catch (error) {
          try {
            await musicDB.updateSong(song);
          } catch (updateError) {
            console.log('Could not add/update song:', song.title, updateError);
          }
        }
      }

      toast.success(`Added ${songs.length} music files from directory`);
      return songs;
    } catch (error) {
      toast.error('Failed to access directory');
      console.error('Directory scan error:', error);
      return [];
    }
  }

  private isSupportedFormat(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.supportedFormats.includes(extension);
  }

  private async createSongFromFile(file: File): Promise<Song | null> {
    try {
      // Use web audio service to extract metadata
      const metadata = await webAudioService.extractMetadata(file);
      
      // Create object URL for playback
      const objectUrl = webAudioService.createObjectURL(file);
      
      // Generate unique ID
      const id = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const song: Song = {
        id,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        filePath: objectUrl, // Use object URL for web playback
        size: file.size,
        dateAdded: new Date(),
        playCount: 0,
        genre: metadata.genre,
        year: metadata.year
      };

      return song;
    } catch (error) {
      console.error('Error creating song from file:', error);
      return null;
    }
  }

  // Method to get audio duration (requires audio element)
  async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(180); // Default to 3 minutes if can't load
      });
      
      // Convert file path to blob URL for web
      audio.src = filePath;
    });
  }
}

export const musicScanner = new MusicScanner();