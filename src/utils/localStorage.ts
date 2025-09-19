// Local storage utilities for offline functionality
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  colorTag: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isSmartPlaylist?: boolean;
  smartCriteria?: SmartPlaylistCriteria;
}

export interface SmartPlaylistCriteria {
  genre?: string[];
  artist?: string[];
  minDuration?: number;
  maxDuration?: number;
  addedAfter?: Date;
  playCount?: number;
}

export interface PlaybackHistory {
  trackId: string;
  playedAt: Date;
  duration: number;
  completed: boolean;
}

export interface UserStats {
  totalTracks: number;
  totalPlaytime: number; // in seconds
  totalPlaylists: number;
  favoriteGenre: string;
  streakDays: number;
  songsToday: number;
}

export class LocalStorage {
  private static PLAYLISTS_KEY = 'melodyforge_playlists';
  private static HISTORY_KEY = 'melodyforge_history';
  private static STATS_KEY = 'melodyforge_stats';
  private static FAVORITES_KEY = 'melodyforge_favorites';
  private static SETTINGS_KEY = 'melodyforge_settings';

  // Playlist management
  static getPlaylists(): Playlist[] {
    const stored = localStorage.getItem(this.PLAYLISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static savePlaylist(playlist: Playlist): void {
    const playlists = this.getPlaylists();
    const existingIndex = playlists.findIndex(p => p.id === playlist.id);
    
    if (existingIndex >= 0) {
      playlists[existingIndex] = { ...playlist, updatedAt: new Date() };
    } else {
      playlists.push(playlist);
    }
    
    localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(playlists));
  }

  static deletePlaylist(playlistId: string): void {
    const playlists = this.getPlaylists().filter(p => p.id !== playlistId);
    localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(playlists));
  }

  static addTrackToPlaylist(playlistId: string, trackId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (playlist && !playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      playlist.updatedAt = new Date();
      this.savePlaylist(playlist);
    }
  }

  static removeTrackFromPlaylist(playlistId: string, trackId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (playlist) {
      playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
      playlist.updatedAt = new Date();
      this.savePlaylist(playlist);
    }
  }

  // Playback history
  static addToHistory(trackId: string, duration: number, completed: boolean): void {
    const history = this.getHistory();
    const newEntry: PlaybackHistory = {
      trackId,
      playedAt: new Date(),
      duration,
      completed
    };
    
    history.unshift(newEntry);
    
    // Keep only last 1000 entries
    const trimmedHistory = history.slice(0, 1000);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    // Update stats
    this.updateStats(trackId, duration);
  }

  static getHistory(): PlaybackHistory[] {
    const stored = localStorage.getItem(this.HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getRecentTracks(limit: number = 10): string[] {
    const history = this.getHistory();
    const recentTrackIds = new Set<string>();
    
    for (const entry of history) {
      if (recentTrackIds.size >= limit) break;
      recentTrackIds.add(entry.trackId);
    }
    
    return Array.from(recentTrackIds);
  }

  // Favorites
  static getFavorites(): string[] {
    const stored = localStorage.getItem(this.FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static addToFavorites(trackId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(trackId)) {
      favorites.push(trackId);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    }
  }

  static removeFromFavorites(trackId: string): void {
    const favorites = this.getFavorites().filter(id => id !== trackId);
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
  }

  static isFavorite(trackId: string): boolean {
    return this.getFavorites().includes(trackId);
  }

  // Stats
  static getStats(): UserStats {
    const stored = localStorage.getItem(this.STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      totalTracks: 0,
      totalPlaytime: 0,
      totalPlaylists: 0,
      favoriteGenre: 'Unknown',
      streakDays: 0,
      songsToday: 0
    };
  }

  private static updateStats(trackId: string, duration: number): void {
    const stats = this.getStats();
    stats.totalPlaytime += duration;
    
    // Check if this is today's first song
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('last_played_date') || '';
    
    if (lastPlayed !== today) {
      if (lastPlayed === new Date(Date.now() - 86400000).toDateString()) {
        stats.streakDays++;
      } else {
        stats.streakDays = 1;
      }
      stats.songsToday = 1;
      localStorage.setItem('last_played_date', today);
    } else {
      stats.songsToday++;
    }
    
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  static updateTotalTracks(count: number): void {
    const stats = this.getStats();
    stats.totalTracks = count;
    stats.totalPlaylists = this.getPlaylists().length;
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  // Settings
  static getSettings() {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      theme: 'system',
      audioQuality: 'high',
      downloadQuality: '320kbps',
      autoScan: true,
      notifications: true,
      crossfade: false,
      replayGain: true
    };
  }

  static saveSetting(key: string, value: any): void {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Color tags for playlists
  static getColorTags(): string[] {
    return [
      '#B565FF', // Primary purple
      '#FF6B9D', // Pink
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA726', // Orange
      '#66BB6A', // Green
      '#EF5350', // Red
      '#AB47BC', // Deep purple
      '#26A69A', // Cyan
      '#FFCA28'  // Amber
    ];
  }
}
