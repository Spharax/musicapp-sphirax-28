// Native Android media scanner for local files
export interface AudioFile {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  size: number;
  path: string;
  format: string;
  dateAdded: Date;
  albumArt?: string;
}

export class MediaScanner {
  private static instance: MediaScanner;
  private audioFiles: AudioFile[] = [];
  private isScanning = false;

  static getInstance(): MediaScanner {
    if (!MediaScanner.instance) {
      MediaScanner.instance = new MediaScanner();
    }
    return MediaScanner.instance;
  }

  async scanForAudioFiles(progressCallback?: (progress: number) => void): Promise<AudioFile[]> {
    if (this.isScanning) return this.audioFiles;
    
    this.isScanning = true;
    this.audioFiles = [];

    try {
      // Request permission for file access
      if ('mediaDevices' in navigator) {
        // For web, we'll simulate scanning with stored files
        await this.loadStoredFiles();
      }
      
      // In real Android app, this would use native file system APIs
      if ((window as any).capacitor) {
        await this.scanNativeFiles(progressCallback);
      } else {
        // Fallback for web/testing
        await this.simulateFileDiscovery(progressCallback);
      }

      // Filter files: >10 seconds and >200KB
      this.audioFiles = this.audioFiles.filter(file => 
        file.duration > 10 && file.size > 200 * 1024
      );

      // Save to local storage
      localStorage.setItem('scanned_audio_files', JSON.stringify(this.audioFiles));
      this.isScanning = false;
      return this.audioFiles;
    } catch (error) {
      console.error('Error scanning files:', error);
      this.isScanning = false;
      return [];
    }
  }

  private async loadStoredFiles(): Promise<void> {
    const stored = localStorage.getItem('scanned_audio_files');
    if (stored) {
      this.audioFiles = JSON.parse(stored);
    }
  }

  private async scanNativeFiles(progressCallback?: (progress: number) => void): Promise<void> {
    try {
      // Check if Capacitor is available
      if (!(window as any).Capacitor) {
        console.log('Not running in Capacitor environment, using fallback');
        return this.simulateFileDiscovery(progressCallback);
      }

      // Dynamic import for Capacitor plugins (only when available)
      const capacitorModules = await import('@capacitor/filesystem').catch(() => null);
      
      if (!capacitorModules) {
        console.log('Capacitor filesystem not available, using fallback');
        return this.simulateFileDiscovery(progressCallback);
      }

      const { Filesystem, Directory } = capacitorModules;
      
      // Scan common music directories
      const musicDirs = ['Music', 'Download', 'Documents', 'DCIM'];
      let totalProcessed = 0;
      const totalDirs = musicDirs.length;

      for (const dir of musicDirs) {
        try {
          const entries = await Filesystem.readdir({
            path: dir,
            directory: Directory.ExternalStorage
          });

          for (const entry of entries.files) {
            if (this.isAudioFile(entry.name)) {
              const audioFile = await this.createAudioFileFromPath(entry.uri);
              if (audioFile) {
                this.audioFiles.push(audioFile);
              }
            }
          }
        } catch (error) {
          console.warn(`Could not scan directory ${dir}:`, error);
        }

        totalProcessed++;
        progressCallback?.((totalProcessed / totalDirs) * 100);
      }
    } catch (error) {
      console.error('Native file scanning error:', error);
      // Fallback to simulation
      return this.simulateFileDiscovery(progressCallback);
    }
  }

  private async simulateFileDiscovery(progressCallback?: (progress: number) => void): Promise<void> {
    // Simulate scanning progress for demo
    const mockFiles: Partial<AudioFile>[] = [
      {
        title: 'Neon Dreams',
        artist: 'Synthwave Collective',
        album: 'Digital Horizons',
        duration: 240,
        size: 8.5 * 1024 * 1024,
        format: 'mp3'
      },
      {
        title: 'Electric Pulse',
        artist: 'Cyber Phoenix',
        album: 'Binary Beats',
        duration: 198,
        size: 6.2 * 1024 * 1024,
        format: 'mp3'
      },
      {
        title: 'Chrome Velocity',
        artist: 'Future Bass',
        album: 'Velocity EP',
        duration: 275,
        size: 9.1 * 1024 * 1024,
        format: 'flac'
      },
      {
        title: 'Digital Storm',
        artist: 'Neon Horizon',
        album: 'Storm Front',
        duration: 320,
        size: 11.2 * 1024 * 1024,
        format: 'mp3'
      }
    ];

    let processed = 0;
    for (const mock of mockFiles) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate scan time
      
      const audioFile: AudioFile = {
        id: `audio_${Date.now()}_${Math.random()}`,
        title: mock.title!,
        artist: mock.artist!,
        album: mock.album!,
        duration: mock.duration!,
        size: mock.size!,
        path: `/storage/emulated/0/Music/${mock.title}.${mock.format}`,
        format: mock.format!,
        dateAdded: new Date()
      };
      
      this.audioFiles.push(audioFile);
      processed++;
      progressCallback?.((processed / mockFiles.length) * 100);
    }
  }

  private isAudioFile(filename: string): boolean {
    const audioExtensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'];
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private async createAudioFileFromPath(path: string): Promise<AudioFile | null> {
    try {
      // In real implementation, would extract metadata from file
      const filename = path.split('/').pop() || 'Unknown';
      const [title, extension] = filename.split('.') || ['Unknown', 'mp3'];
      
      return {
        id: `audio_${Date.now()}_${Math.random()}`,
        title: title.replace(/_/g, ' '),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 180, // Would be extracted from metadata
        size: 5 * 1024 * 1024, // Would be actual file size
        path,
        format: extension,
        dateAdded: new Date()
      };
    } catch (error) {
      console.error('Error creating audio file from path:', error);
      return null;
    }
  }

  getAudioFiles(): AudioFile[] {
    return this.audioFiles;
  }

  async refreshScan(progressCallback?: (progress: number) => void): Promise<AudioFile[]> {
    this.audioFiles = [];
    return this.scanForAudioFiles(progressCallback);
  }
}