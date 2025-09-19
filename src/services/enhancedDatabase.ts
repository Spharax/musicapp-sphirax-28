import Dexie, { Table } from 'dexie';
import CryptoJS from 'crypto-js';

/**
 * Enhanced song interface with advanced audio format support
 */
export interface EnhancedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  size: number;
  dateAdded: Date;
  playCount: number;
  lastPlayed?: Date;
  albumArt?: string;
  genre?: string;
  year?: number;
  // Enhanced metadata fields
  format: AudioFormat;
  bitRate?: number;
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
  codec?: string;
  fileHash: string;
  lyrics?: string;
  lrcFile?: string;
  bookmarks: AudioBookmark[];
  customTags: Record<string, string>;
  lastPosition?: number; // For auto-resume
}

/**
 * Advanced playlist interface with smart playlist support
 */
export interface EnhancedPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: Date;
  lastModified: Date;
  color: string;
  isSmartPlaylist: boolean;
  smartQuery?: SmartPlaylistQuery;
  coverArt?: string;
  sortOrder: PlaylistSortOrder;
  totalDuration?: number;
  playCount: number;
}

/**
 * Audio format enumeration
 */
export enum AudioFormat {
  MP3 = 'mp3',
  FLAC = 'flac',
  WAV = 'wav',
  AAC = 'aac',
  OGG = 'ogg',
  ALAC = 'alac',
  DSD = 'dsd',
  MQA = 'mqa',
  OPUS = 'opus',
  WMA = 'wma'
}

/**
 * Audio bookmark for timestamp navigation
 */
export interface AudioBookmark {
  id: string;
  timestamp: number;
  label: string;
  createdAt: Date;
}

/**
 * Smart playlist query interface
 */
export interface SmartPlaylistQuery {
  conditions: QueryCondition[];
  operator: 'AND' | 'OR';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryCondition {
  field: keyof EnhancedSong;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'range';
  value: any;
}

export enum PlaylistSortOrder {
  MANUAL = 'manual',
  TITLE = 'title',
  ARTIST = 'artist',
  ALBUM = 'album',
  DATE_ADDED = 'dateAdded',
  PLAY_COUNT = 'playCount',
  DURATION = 'duration'
}

/**
 * Equalizer preset interface
 */
export interface EqualizerPreset {
  id: string;
  name: string;
  bands: number[]; // 10-band EQ values (-12 to +12 dB)
  isCustom: boolean;
  createdAt: Date;
}

/**
 * Audio effect settings
 */
export interface AudioEffectSettings {
  id: string;
  name: string;
  reverb: {
    enabled: boolean;
    roomSize: number;
    damping: number;
    wetLevel: number;
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
  bassBoost: {
    enabled: boolean;
    gain: number;
    frequency: number;
  };
  spatialAudio: {
    enabled: boolean;
    roomSize: number;
    rolloffFactor: number;
  };
}

/**
 * User preferences for audio processing
 */
export interface UserPreferences {
  id: string;
  highResAudio: boolean;
  defaultEqualizer?: string;
  defaultEffects?: string;
  autoResume: boolean;
  crossfadeDuration: number;
  replayGain: boolean;
  volumeNormalization: boolean;
  sleepTimerDefault: number;
  lastUsedFolder?: string;
  playbackSpeed: number;
  pitchShift: number;
  pitchLocked: boolean;
}

/**
 * Enhanced MelodyForge database with Dexie
 */
class EnhancedMelodyForgeDB extends Dexie {
  songs!: Table<EnhancedSong>;
  playlists!: Table<EnhancedPlaylist>;
  equalizerPresets!: Table<EqualizerPreset>;
  audioEffects!: Table<AudioEffectSettings>;
  preferences!: Table<UserPreferences>;

  constructor() {
    super('EnhancedMelodyForgeDB');
    
    this.version(1).stores({
      songs: '++id, title, artist, album, genre, format, dateAdded, playCount, lastPlayed, fileHash',
      playlists: '++id, name, createdAt, lastModified, isSmartPlaylist',
      equalizerPresets: '++id, name, isCustom',
      audioEffects: '++id, name',
      preferences: '++id'
    });

    // Add hooks for computed fields
    this.songs.hook('creating', (primKey, obj, trans) => {
      obj.dateAdded = new Date();
      obj.playCount = 0;
      obj.bookmarks = [];
      obj.customTags = {};
    });

    this.playlists.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.lastModified = new Date();
      obj.playCount = 0;
    });

    this.playlists.hook('updating', (modifications: Partial<EnhancedPlaylist>, primKey, obj, trans) => {
      modifications.lastModified = new Date();
    });
  }

  /**
   * Calculate file hash for duplicate detection
   */
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    return CryptoJS.SHA256(wordArray).toString();
  }

  /**
   * Detect audio format from file
   */
  detectAudioFormat(fileName: string, mimeType?: string): AudioFormat {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'mp3':
        return AudioFormat.MP3;
      case 'flac':
        return AudioFormat.FLAC;
      case 'wav':
        return AudioFormat.WAV;
      case 'aac':
      case 'm4a':
        return AudioFormat.AAC;
      case 'ogg':
        return AudioFormat.OGG;
      case 'alac':
        return AudioFormat.ALAC;
      case 'dsd':
      case 'dsf':
        return AudioFormat.DSD;
      case 'mqa':
        return AudioFormat.MQA;
      case 'opus':
        return AudioFormat.OPUS;
      case 'wma':
        return AudioFormat.WMA;
      default:
        return AudioFormat.MP3;
    }
  }

  /**
   * Get songs by smart playlist query
   */
  async getSmartPlaylistSongs(query: SmartPlaylistQuery): Promise<EnhancedSong[]> {
    let collection = this.songs.toCollection();
    
    // Apply conditions
    for (const condition of query.conditions) {
      switch (condition.operator) {
        case 'equals':
          collection = collection.filter(song => song[condition.field] === condition.value);
          break;
        case 'contains':
          collection = collection.filter(song => 
            String(song[condition.field]).toLowerCase().includes(String(condition.value).toLowerCase())
          );
          break;
        case 'greater':
          collection = collection.filter(song => song[condition.field] > condition.value);
          break;
        case 'less':
          collection = collection.filter(song => song[condition.field] < condition.value);
          break;
      }
    }

    // Apply sorting and get results
    let songs: EnhancedSong[];
    if (query.sortBy) {
      songs = await collection.sortBy(query.sortBy);
      if (query.sortOrder === 'desc') {
        songs.reverse();
      }
    } else {
      songs = await collection.toArray();
    }
    
    // Apply limit
    if (query.limit) {
      return songs.slice(0, query.limit);
    }
    
    return songs;
  }

  /**
   * Get recent songs with enhanced filtering
   */
  async getRecentSongs(limit: number = 10, format?: AudioFormat): Promise<EnhancedSong[]> {
    let collection = this.songs.where('lastPlayed').above(new Date(0));
    
    if (format) {
      collection = collection.filter(song => song.format === format);
    }
    
    const songs = await collection.reverse().sortBy('lastPlayed');
    return songs.slice(0, limit);
  }

  /**
   * Get top songs by play count
   */
  async getTopSongs(limit: number = 10, format?: AudioFormat): Promise<EnhancedSong[]> {
    let collection = this.songs.where('playCount').above(0);
    
    if (format) {
      collection = collection.filter(song => song.format === format);
    }
    
    const songs = await collection.reverse().sortBy('playCount');
    return songs.slice(0, limit);
  }

  /**
   * Search songs with advanced filters
   */
  async searchSongs(
    query: string, 
    filters?: {
      format?: AudioFormat;
      genre?: string;
      year?: number;
      minDuration?: number;
      maxDuration?: number;
    }
  ): Promise<EnhancedSong[]> {
    const searchTerm = query.toLowerCase();
    let collection = this.songs.toCollection();

    // Apply text search
    if (query) {
      collection = collection.filter(song =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm) ||
        song.album.toLowerCase().includes(searchTerm) ||
        song.genre?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters) {
      if (filters.format) {
        collection = collection.filter(song => song.format === filters.format);
      }
      if (filters.genre) {
        collection = collection.filter(song => song.genre === filters.genre);
      }
      if (filters.year) {
        collection = collection.filter(song => song.year === filters.year);
      }
      if (filters.minDuration) {
        collection = collection.filter(song => song.duration >= filters.minDuration!);
      }
      if (filters.maxDuration) {
        collection = collection.filter(song => song.duration <= filters.maxDuration!);
      }
    }

    return collection.toArray();
  }

  /**
   * Find duplicate songs by hash
   */
  async findDuplicates(): Promise<EnhancedSong[][]> {
    const songs = await this.songs.toArray();
    const hashGroups = new Map<string, EnhancedSong[]>();
    
    songs.forEach(song => {
      if (!hashGroups.has(song.fileHash)) {
        hashGroups.set(song.fileHash, []);
      }
      hashGroups.get(song.fileHash)!.push(song);
    });
    
    return Array.from(hashGroups.values()).filter(group => group.length > 1);
  }

  /**
   * Initialize default data
   */
  async initializeDefaults(): Promise<void> {
    // Default equalizer presets
    const defaultPresets: Omit<EqualizerPreset, 'id'>[] = [
      {
        name: 'Flat',
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        isCustom: false,
        createdAt: new Date()
      },
      {
        name: 'Rock',
        bands: [3, 2, -1, -2, 1, 2, 3, 4, 4, 3],
        isCustom: false,
        createdAt: new Date()
      },
      {
        name: 'Classical',
        bands: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
        isCustom: false,
        createdAt: new Date()
      },
      {
        name: 'Bass Boost',
        bands: [6, 4, 2, 0, 0, 0, 0, 0, 0, 0],
        isCustom: false,
        createdAt: new Date()
      },
      {
        name: 'Vocal Enhance',
        bands: [-2, -1, 0, 1, 3, 4, 3, 1, 0, -1],
        isCustom: false,
        createdAt: new Date()
      }
    ];

    const existingPresets = await this.equalizerPresets.count();
    if (existingPresets === 0) {
      await this.equalizerPresets.bulkPut(defaultPresets as EqualizerPreset[]);
    }

    // Default preferences
    const existingPrefs = await this.preferences.count();
    if (existingPrefs === 0) {
      await this.preferences.add({
        id: 'user-prefs',
        highResAudio: false,
        autoResume: true,
        crossfadeDuration: 3,
        replayGain: false,
        volumeNormalization: false,
        sleepTimerDefault: 30,
        playbackSpeed: 1.0,
        pitchShift: 0,
        pitchLocked: true
      });
    }
  }
}

export const enhancedDB = new EnhancedMelodyForgeDB();