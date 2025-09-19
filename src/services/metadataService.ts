import jsmediatags from 'jsmediatags';
import { EnhancedSong, AudioFormat } from './enhancedDatabase';

/**
 * Enhanced metadata service using jsmediatags for comprehensive tag support
 */
export class MetadataService {
  /**
   * Extract comprehensive metadata from audio file
   */
  static async extractMetadata(file: File): Promise<ExtractedMetadata> {
    return new Promise((resolve, reject) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const metadata = this.parseJSMediaTags(tag, file);
          resolve(metadata);
        },
        onError: (error) => {
          console.warn('Failed to extract metadata:', error);
          // Return basic metadata from file properties
          resolve(this.getBasicMetadata(file));
        }
      });
    });
  }

  /**
   * Parse jsmediatags result into our metadata format
   */
  private static parseJSMediaTags(tag: any, file: File): ExtractedMetadata {
    const tags = tag.tags;
    const format = this.detectFormatFromTags(tags, file);
    
    // Extract album art
    let albumArt: string | undefined;
    if (tags.picture) {
      const { data, format: imageFormat } = tags.picture;
      const imageData = new Uint8Array(data);
      const blob = new Blob([imageData], { type: imageFormat });
      albumArt = URL.createObjectURL(blob);
    }

    // Extract lyrics
    const lyrics = tags.USLT?.text || tags.lyrics || undefined;

    return {
      title: tags.title || this.getFileNameWithoutExtension(file.name),
      artist: tags.artist || 'Unknown Artist',
      album: tags.album || 'Unknown Album',
      genre: tags.genre || undefined,
      year: tags.year ? parseInt(tags.year) : undefined,
      track: tags.track ? parseInt(tags.track.split('/')[0]) : undefined,
      disc: tags.disk ? parseInt(tags.disk.split('/')[0]) : undefined,
      albumArtist: tags.albumartist || tags.artist,
      composer: tags.composer || undefined,
      duration: 0, // Will be set by audio buffer
      bitRate: tags.bitrate || undefined,
      sampleRate: undefined, // Will be set by audio buffer
      bitDepth: undefined, // Will be set by audio buffer
      channels: undefined, // Will be set by audio buffer
      format: format,
      albumArt: albumArt,
      lyrics: lyrics,
      comment: tags.comment?.text || tags.comment || undefined,
      bpm: tags.bpm ? parseInt(tags.bpm) : undefined,
      key: tags.initialkey || undefined,
      replayGain: {
        track: tags.replaygain_track_gain ? parseFloat(tags.replaygain_track_gain) : undefined,
        album: tags.replaygain_album_gain ? parseFloat(tags.replaygain_album_gain) : undefined
      },
      customTags: this.extractCustomTags(tags)
    };
  }

  /**
   * Get basic metadata when tag parsing fails
   */
  private static getBasicMetadata(file: File): ExtractedMetadata {
    return {
      title: this.getFileNameWithoutExtension(file.name),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      genre: undefined,
      year: undefined,
      track: undefined,
      disc: undefined,
      albumArtist: 'Unknown Artist',
      composer: undefined,
      duration: 0,
      bitRate: undefined,
      sampleRate: undefined,
      bitDepth: undefined,
      channels: undefined,
      format: this.detectAudioFormat(file.name, file.type),
      albumArt: undefined,
      lyrics: undefined,
      comment: undefined,
      bpm: undefined,
      key: undefined,
      replayGain: { track: undefined, album: undefined },
      customTags: {}
    };
  }

  /**
   * Detect audio format from tags and file properties
   */
  private static detectFormatFromTags(tags: any, file: File): AudioFormat {
    // Check if we have specific format information in tags
    const codec = tags.codec?.toLowerCase();
    if (codec) {
      if (codec.includes('flac')) return AudioFormat.FLAC;
      if (codec.includes('alac')) return AudioFormat.ALAC;
      if (codec.includes('aac')) return AudioFormat.AAC;
      if (codec.includes('mp3')) return AudioFormat.MP3;
      if (codec.includes('ogg')) return AudioFormat.OGG;
      if (codec.includes('opus')) return AudioFormat.OPUS;
    }

    // Fallback to file-based detection
    return this.detectAudioFormat(file.name, file.type);
  }

  /**
   * Detect audio format from file properties
   */
  private static detectAudioFormat(fileName: string, mimeType: string): AudioFormat {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Check MIME type first for better accuracy
    if (mimeType) {
      if (mimeType.includes('flac')) return AudioFormat.FLAC;
      if (mimeType.includes('wav')) return AudioFormat.WAV;
      if (mimeType.includes('aac') || mimeType.includes('mp4')) return AudioFormat.AAC;
      if (mimeType.includes('ogg')) return AudioFormat.OGG;
      if (mimeType.includes('opus')) return AudioFormat.OPUS;
    }

    // Fallback to extension
    switch (extension) {
      case 'mp3': return AudioFormat.MP3;
      case 'flac': return AudioFormat.FLAC;
      case 'wav': return AudioFormat.WAV;
      case 'aac': case 'm4a': return AudioFormat.AAC;
      case 'ogg': return AudioFormat.OGG;
      case 'alac': return AudioFormat.ALAC;
      case 'dsd': case 'dsf': return AudioFormat.DSD;
      case 'mqa': return AudioFormat.MQA;
      case 'opus': return AudioFormat.OPUS;
      case 'wma': return AudioFormat.WMA;
      default: return AudioFormat.MP3;
    }
  }

  /**
   * Extract custom/uncommon tags
   */
  private static extractCustomTags(tags: any): Record<string, string> {
    const customTags: Record<string, string> = {};
    const standardTags = new Set([
      'title', 'artist', 'album', 'genre', 'year', 'track', 'disk',
      'albumartist', 'composer', 'comment', 'picture', 'lyrics', 'USLT',
      'bitrate', 'bpm', 'initialkey', 'replaygain_track_gain', 'replaygain_album_gain'
    ]);

    Object.keys(tags).forEach(key => {
      if (!standardTags.has(key) && typeof tags[key] === 'string') {
        customTags[key] = tags[key];
      }
    });

    return customTags;
  }

  /**
   * Get filename without extension
   */
  private static getFileNameWithoutExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '');
  }

  /**
   * Update song metadata in file (in-memory only for web)
   */
  static async updateSongMetadata(
    originalFile: File, 
    updates: Partial<ExtractedMetadata>
  ): Promise<File> {
    // For web applications, we can't actually modify files
    // This would return a new File object with updated metadata
    // in a real implementation, but for now we return the original
    console.log('Metadata update requested:', updates);
    return originalFile;
  }

  /**
   * Parse LRC (lyrics) file content
   */
  static parseLRCFile(lrcContent: string): LRCLine[] {
    const lines = lrcContent.split('\n');
    const lrcLines: LRCLine[] = [];
    
    for (const line of lines) {
      const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const centiseconds = parseInt(timeMatch[3]);
        const timestamp = minutes * 60 + seconds + centiseconds / 100;
        
        const text = line.replace(/\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
        if (text) {
          lrcLines.push({ timestamp, text });
        }
      }
    }
    
    return lrcLines.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate LRC file content from lyrics with timestamps
   */
  static generateLRCContent(lrcLines: LRCLine[], metadata?: Partial<ExtractedMetadata>): string {
    let content = '';
    
    // Add metadata headers
    if (metadata?.title) content += `[ti:${metadata.title}]\n`;
    if (metadata?.artist) content += `[ar:${metadata.artist}]\n`;
    if (metadata?.album) content += `[al:${metadata.album}]\n`;
    
    // Add timestamp lines
    for (const line of lrcLines) {
      const minutes = Math.floor(line.timestamp / 60);
      const seconds = Math.floor(line.timestamp % 60);
      const centiseconds = Math.floor((line.timestamp % 1) * 100);
      
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
      content += `[${timeStr}]${line.text}\n`;
    }
    
    return content;
  }

  /**
   * Check if file is a supported audio format
   */
  static isSupportedAudioFormat(file: File): boolean {
    const supportedTypes = [
      'audio/mpeg', 'audio/mp3',
      'audio/flac', 'audio/x-flac',
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/aac', 'audio/x-aac', 'audio/mp4',
      'audio/ogg', 'audio/vorbis',
      'audio/opus',
      'audio/x-ms-wma'
    ];

    const supportedExtensions = [
      'mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'alac', 'dsd', 'dsf', 'mqa'
    ];

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    return supportedTypes.includes(file.type) || 
           (extension ? supportedExtensions.includes(extension) : false);
  }

  /**
   * Get format display information
   */
  static getFormatDisplayInfo(format: AudioFormat): FormatDisplayInfo {
    const formatInfo: Record<AudioFormat, FormatDisplayInfo> = {
      [AudioFormat.MP3]: {
        name: 'MP3',
        description: 'MPEG-1 Audio Layer 3',
        color: '#ff6b6b',
        icon: '♪',
        isLossless: false,
        maxQuality: 'Lossy up to 320 kbps'
      },
      [AudioFormat.FLAC]: {
        name: 'FLAC',
        description: 'Free Lossless Audio Codec',
        color: '#4ecdc4',
        icon: '♫',
        isLossless: true,
        maxQuality: 'Lossless up to 32-bit/192kHz'
      },
      [AudioFormat.WAV]: {
        name: 'WAV',
        description: 'Waveform Audio File Format',
        color: '#45b7d1',
        icon: '∿',
        isLossless: true,
        maxQuality: 'Uncompressed PCM'
      },
      [AudioFormat.AAC]: {
        name: 'AAC',
        description: 'Advanced Audio Coding',
        color: '#96ceb4',
        icon: '♬',
        isLossless: false,
        maxQuality: 'Lossy up to 512 kbps'
      },
      [AudioFormat.OGG]: {
        name: 'OGG',
        description: 'Ogg Vorbis',
        color: '#feca57',
        icon: '♩',
        isLossless: false,
        maxQuality: 'Lossy variable bitrate'
      },
      [AudioFormat.ALAC]: {
        name: 'ALAC',
        description: 'Apple Lossless Audio Codec',
        color: '#a8e6cf',
        icon: '🍎',
        isLossless: true,
        maxQuality: 'Lossless up to 32-bit/384kHz'
      },
      [AudioFormat.DSD]: {
        name: 'DSD',
        description: 'Direct Stream Digital',
        color: '#ff8b94',
        icon: '△',
        isLossless: true,
        maxQuality: 'DSD64/128/256/512'
      },
      [AudioFormat.MQA]: {
        name: 'MQA',
        description: 'Master Quality Authenticated',
        color: '#c44569',
        icon: '◆',
        isLossless: true,
        maxQuality: 'Studio Master quality'
      },
      [AudioFormat.OPUS]: {
        name: 'OPUS',
        description: 'Opus Audio Codec',
        color: '#778beb',
        icon: '◎',
        isLossless: false,
        maxQuality: 'Lossy up to 510 kbps'
      },
      [AudioFormat.WMA]: {
        name: 'WMA',
        description: 'Windows Media Audio',
        color: '#f8b500',
        icon: '⊞',
        isLossless: false,
        maxQuality: 'Lossy up to 440 kbps'
      }
    };

    return formatInfo[format];
  }
}

/**
 * Extracted metadata interface
 */
export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  track?: number;
  disc?: number;
  albumArtist?: string;
  composer?: string;
  duration: number;
  bitRate?: number;
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
  format: AudioFormat;
  albumArt?: string;
  lyrics?: string;
  comment?: string;
  bpm?: number;
  key?: string;
  replayGain: {
    track?: number;
    album?: number;
  };
  customTags: Record<string, string>;
}

/**
 * LRC lyrics line interface
 */
export interface LRCLine {
  timestamp: number;
  text: string;
}

/**
 * Format display information
 */
export interface FormatDisplayInfo {
  name: string;
  description: string;
  color: string;
  icon: string;
  isLossless: boolean;
  maxQuality: string;
}