// Web-based audio service with File System Access API support
import { toast } from 'sonner';

export interface AudioPermissions {
  hasFileAccess: boolean;
  hasFileSystemAccess: boolean;
  hasAudioContext: boolean;
}

export class WebAudioService {
  private audioContext?: AudioContext;
  private currentSource?: AudioBufferSourceNode;
  private gainNode?: GainNode;
  private isPlaying = false;

  async checkPermissions(): Promise<AudioPermissions> {
    const permissions: AudioPermissions = {
      hasFileAccess: 'File' in window && 'FileReader' in window,
      hasFileSystemAccess: 'showOpenFilePicker' in window,
      hasAudioContext: 'AudioContext' in window || 'webkitAudioContext' in window
    };

    return permissions;
  }

  async initializeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      // @ts-ignore - webkitAudioContext fallback for Safari
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }

    // Resume context if suspended (required for auto-play policies)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async requestFileAccess(): Promise<File[]> {
    try {
      // Check if we're in a cross-origin iframe (like Lovable preview)
      if (window.self !== window.top) {
        console.log('Cross-origin iframe detected, using file input fallback');
        return await this.requestFilesWithInputElement();
      }
      
      const permissions = await this.checkPermissions();
      
      if (permissions.hasFileSystemAccess) {
        return await this.requestFilesWithFileSystemAccess();
      } else if (permissions.hasFileAccess) {
        return await this.requestFilesWithInputElement();
      } else {
        throw new Error('File access not supported in this browser');
      }
    } catch (error) {
      console.error('File access error:', error);
      // Always fallback to input element
      return await this.requestFilesWithInputElement();
    }
  }

  private async requestFilesWithFileSystemAccess(): Promise<File[]> {
    try {
      // Skip if in iframe to avoid SecurityError
      if (window.self !== window.top) {
        throw new Error('File System Access API not available in iframe');
      }

      // @ts-ignore - File System Access API
      const fileHandles = await window.showOpenFilePicker({
        multiple: true,
        types: [{
          description: 'Audio files',
          accept: {
            'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma']
          }
        }]
      });

      const files: File[] = [];
      for (const handle of fileHandles) {
        const file = await handle.getFile();
        files.push(file);
      }

      toast.success(`Selected ${files.length} audio files`);
      return files;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('File selection cancelled');
      } else {
        toast.error('Failed to access files');
        console.error('File access error:', error);
      }
      throw error; // Re-throw to trigger fallback
    }
  }

  private async requestFilesWithInputElement(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma';
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        
        if (files.length > 0) {
          toast.success(`Selected ${files.length} audio files`);
        }
        
        resolve(files);
      };
      
      input.oncancel = () => {
        toast.info('File selection cancelled');
        resolve([]);
      };
      
      input.click();
    });
  }

  async requestDirectoryAccess(): Promise<File[]> {
    const permissions = await this.checkPermissions();
    
    if (!permissions.hasFileSystemAccess) {
      throw new Error('Directory access not supported. Please select individual files instead.');
    }

    try {
      // @ts-ignore - File System Access API
      const directoryHandle = await window.showDirectoryPicker();
      const files: File[] = [];
      
      await this.scanDirectory(directoryHandle, files);
      
      toast.success(`Found ${files.length} audio files in directory`);
      return files;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('Directory selection cancelled');
      } else {
        toast.error('Failed to access directory');
        console.error('Directory access error:', error);
      }
      return [];
    }
  }

  private async scanDirectory(directoryHandle: any, files: File[]): Promise<void> {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma'];
    
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file') {
        const extension = name.toLowerCase().substring(name.lastIndexOf('.'));
        if (audioExtensions.includes(extension)) {
          const file = await handle.getFile();
          files.push(file);
        }
      } else if (handle.kind === 'directory') {
        // Recursively scan subdirectories
        await this.scanDirectory(handle, files);
      }
    }
  }

  async loadAudioFile(file: File): Promise<AudioBuffer> {
    await this.initializeAudioContext();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (error) {
          reject(new Error(`Failed to decode audio file: ${file.name}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  async playBuffer(buffer: AudioBuffer, startTime = 0): Promise<void> {
    await this.initializeAudioContext();
    
    // Stop current playback if any
    this.stop();
    
    // Create new source
    this.currentSource = this.audioContext!.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.gainNode!);
    
    // Start playback
    this.currentSource.start(0, startTime);
    this.isPlaying = true;
    
    // Handle playback end
    this.currentSource.onended = () => {
      this.isPlaying = false;
    };
  }

  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = undefined;
    }
    this.isPlaying = false;
  }

  pause(): void {
    // Web Audio API doesn't have pause, so we stop instead
    this.stop();
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Extract metadata from audio file
  async extractMetadata(file: File): Promise<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre?: string;
    year?: number;
  }> {
    // Basic metadata extraction from filename
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
    const parts = nameWithoutExt.split(' - ');
    
    let title = nameWithoutExt;
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';

    // Try to parse "Artist - Title" format
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    // Get duration by loading the audio
    let duration = 180; // Default 3 minutes
    try {
      const buffer = await this.loadAudioFile(file);
      duration = Math.round(buffer.duration);
    } catch (error) {
      console.warn('Could not get duration for', file.name);
    }

    return {
      title,
      artist,
      album,
      duration,
      genre: 'Unknown',
      year: new Date().getFullYear()
    };
  }

  // Create blob URL for file
  createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up blob URL
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const webAudioService = new WebAudioService();