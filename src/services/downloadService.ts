import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

export interface DownloadProgress {
  id: string;
  title: string;
  url: string;
  format: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  filePath?: string;
  thumbnail?: string;
}

export class DownloadService {
  private downloads = new Map<string, DownloadProgress>();
  private callbacks = new Set<(downloads: DownloadProgress[]) => void>();

  async downloadMedia(url: string, format: string = 'mp3'): Promise<string> {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const download: DownloadProgress = {
      id: downloadId,
      title: 'Extracting info...',
      url,
      format,
      progress: 0,
      status: 'pending'
    };

    this.downloads.set(downloadId, download);
    this.notifyCallbacks();

    try {
      // Step 1: Extract video info
      download.status = 'downloading';
      download.progress = 10;
      this.downloads.set(downloadId, download);
      this.notifyCallbacks();

      const info = await this.extractVideoInfo(url);
      download.title = info.title;
      download.thumbnail = info.thumbnail;
      download.progress = 20;
      this.downloads.set(downloadId, download);
      this.notifyCallbacks();

      // Step 2: Download video/audio
      const downloadedFile = await this.downloadFile(url, format, (progress) => {
        download.progress = 20 + (progress * 0.6); // 20% to 80%
        this.downloads.set(downloadId, download);
        this.notifyCallbacks();
      });

      // Step 3: Convert if needed
      let finalFile = downloadedFile;
      if (format !== downloadedFile.format) {
        download.progress = 85;
        this.downloads.set(downloadId, download);
        this.notifyCallbacks();
        
        // finalFile = await this.convertAudio(downloadedFile, format);
      }

      // Step 4: Save to music library
      const savedPath = await this.saveToMusicLibrary(finalFile, info);
      
      download.status = 'completed';
      download.progress = 100;
      download.filePath = savedPath;
      this.downloads.set(downloadId, download);
      this.notifyCallbacks();

      return downloadId;
    } catch (error) {
      download.status = 'error';
      this.downloads.set(downloadId, download);
      this.notifyCallbacks();
      throw error;
    }
  }

  private async extractVideoInfo(url: string): Promise<{ title: string; thumbnail?: string; duration?: number }> {
    // Simulate yt-dlp info extraction
    // In a real implementation, this would call yt-dlp through Capacitor plugin
    
    // Mock implementation for demonstration
    await this.delay(1000);
    
    const title = this.extractTitleFromUrl(url);
    return {
      title,
      thumbnail: undefined,
      duration: 180
    };
  }

  private extractTitleFromUrl(url: string): string {
    // Extract title from common URL patterns
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'YouTube Video';
    }
    if (url.includes('soundcloud.com')) {
      return 'SoundCloud Track';
    }
    return 'Downloaded Track';
  }

  private async downloadFile(
    url: string, 
    format: string, 
    progressCallback: (progress: number) => void
  ): Promise<{ data: Uint8Array; format: string; filename: string }> {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await this.delay(200);
      progressCallback(i / 100);
    }

    // In a real implementation, this would use yt-dlp through Capacitor
    // For now, return mock data
    const mockAudioData = new Uint8Array(1024 * 1024); // 1MB mock file
    return {
      data: mockAudioData,
      format: 'mp4',
      filename: `download_${Date.now()}.mp4`
    };
  }

  private async saveToMusicLibrary(
    file: { data: Uint8Array; format: string; filename: string },
    info: { title: string; thumbnail?: string; duration?: number }
  ): Promise<string> {
    const filename = `${info.title.replace(/[^a-zA-Z0-9]/g, '_')}.${file.format}`;
    const musicDir = 'Music/Downloads';
    
    try {
      // Ensure directory exists
      await Filesystem.mkdir({
        path: musicDir,
        directory: Directory.ExternalStorage,
        recursive: true
      });

      // Write file
      const filePath = `${musicDir}/${filename}`;
      await Filesystem.writeFile({
        path: filePath,
        data: new Blob([file.data]).toString(),
        directory: Directory.ExternalStorage
      });

      // Add to music database
      const song = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: info.title,
        artist: 'Downloaded',
        album: 'Downloads',
        duration: info.duration || 180,
        filePath,
        size: file.data.length,
        dateAdded: new Date(),
        playCount: 0,
        genre: 'Downloaded'
      };

      await musicDB.addSong(song);
      return filePath;
    } catch (error) {
      console.error('Failed to save to music library:', error);
      throw error;
    }
  }

  getDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values());
  }

  getDownload(id: string): DownloadProgress | undefined {
    return this.downloads.get(id);
  }

  removeDownload(id: string): void {
    this.downloads.delete(id);
    this.notifyCallbacks();
  }

  onDownloadsChange(callback: (downloads: DownloadProgress[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    const downloads = this.getDownloads();
    this.callbacks.forEach(callback => callback(downloads));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const downloadService = new DownloadService();