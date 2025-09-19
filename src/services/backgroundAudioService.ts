import { Capacitor } from '@capacitor/core';

export interface BackgroundAudioOptions {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  elapsed?: number;
}

export class BackgroundAudioService {
  private isEnabled: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrack: BackgroundAudioOptions | null = null;

  async initialize(): Promise<void> {
    try {
      // Set up media session API for web
      if ('mediaSession' in navigator) {
        this.setupMediaSession();
      }

      // Listen for app state changes
      document.addEventListener('app-pause', () => {
        this.handleAppPause();
      });

      document.addEventListener('app-resume', () => {
        this.handleAppResume();
      });

      // Enable background audio for PWAs
      if ('serviceWorker' in navigator) {
        this.setupServiceWorker();
      }

      this.isEnabled = true;
    } catch (error) {
      console.error('Failed to initialize background audio:', error);
    }
  }

  private setupServiceWorker(): void {
    // Register service worker for background processing
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.log('ServiceWorker registration failed:', error);
    });
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
      if (this.currentAudio) {
        this.currentAudio.play();
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      document.dispatchEvent(new CustomEvent('media-previous'));
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      document.dispatchEvent(new CustomEvent('media-next'));
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (this.currentAudio && details.seekTime) {
        this.currentAudio.currentTime = details.seekTime;
      }
    });
  }

  async setTrack(audioElement: HTMLAudioElement, options: BackgroundAudioOptions): Promise<void> {
    this.currentAudio = audioElement;
    this.currentTrack = options;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: options.title,
        artist: options.artist,
        album: options.album || '',
        artwork: options.artwork ? [
          {
            src: options.artwork,
            sizes: '512x512',
            type: 'image/png'
          }
        ] : []
      });
    }

    // Update position state
    if (options.duration && 'mediaSession' in navigator) {
      navigator.mediaSession.setPositionState({
        duration: options.duration,
        playbackRate: 1,
        position: options.elapsed || 0
      });
    }
  }

  updatePlaybackState(isPlaying: boolean): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }

  updatePosition(currentTime: number): void {
    if ('mediaSession' in navigator && this.currentTrack?.duration) {
      navigator.mediaSession.setPositionState({
        duration: this.currentTrack.duration,
        playbackRate: 1,
        position: currentTime
      });
    }
  }

  private handleAppPause(): void {
    // Keep audio playing in background
    if (this.currentAudio && !this.currentAudio.paused) {
      console.log('App paused, continuing background playback');
    }
  }

  private handleAppResume(): void {
    // Sync UI state with audio state
    if (this.currentAudio) {
      document.dispatchEvent(new CustomEvent('background-audio-sync', {
        detail: {
          isPlaying: !this.currentAudio.paused,
          currentTime: this.currentAudio.currentTime
        }
      }));
    }
  }

  async disable(): Promise<void> {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    }

    this.isEnabled = false;
    this.currentAudio = null;
    this.currentTrack = null;
  }

  isBackgroundModeEnabled(): boolean {
    return this.isEnabled;
  }
}

export const backgroundAudioService = new BackgroundAudioService();
