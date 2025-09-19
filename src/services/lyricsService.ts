export interface LyricsLine {
  time: number; // Time in seconds
  text: string;
}

export interface Lyrics {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  lines: LyricsLine[];
  synced: boolean; // Whether lyrics are time-synced
  source: string;
}

export class LyricsService {
  private cache = new Map<string, Lyrics>();
  private apiEndpoints = {
    genius: 'https://api.genius.com/search',
    musixmatch: 'https://api.musixmatch.com/ws/1.1/',
    lrclib: 'https://lrclib.net/api/search'
  };

  async fetchLyrics(title: string, artist: string): Promise<Lyrics | null> {
    const cacheKey = `${artist}_${title}`.toLowerCase();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Try multiple sources
      let lyrics = await this.fetchFromLrcLib(title, artist);
      
      if (!lyrics) {
        lyrics = await this.fetchFromGenius(title, artist);
      }

      if (!lyrics) {
        lyrics = await this.generateFallbackLyrics(title, artist);
      }

      if (lyrics) {
        this.cache.set(cacheKey, lyrics);
      }

      return lyrics;
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      return null;
    }
  }

  private async fetchFromLrcLib(title: string, artist: string): Promise<Lyrics | null> {
    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(`${this.apiEndpoints.lrclib}?q=${query}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.length === 0) return null;
      
      const track = data[0];
      const lyrics: Lyrics = {
        id: `lrc_${Date.now()}`,
        trackId: '', // Will be set by caller
        title: track.trackName || title,
        artist: track.artistName || artist,
        lines: this.parseLrc(track.syncedLyrics || track.plainLyrics || ''),
        synced: !!track.syncedLyrics,
        source: 'LrcLib'
      };

      return lyrics;
    } catch (error) {
      console.error('LrcLib fetch error:', error);
      return null;
    }
  }

  private async fetchFromGenius(title: string, artist: string): Promise<Lyrics | null> {
    try {
      // Note: This would require a CORS proxy or backend implementation
      // For demo purposes, return null
      console.log('Genius API would be called here');
      return null;
    } catch (error) {
      console.error('Genius fetch error:', error);
      return null;
    }
  }

  private generateFallbackLyrics(title: string, artist: string): Lyrics {
    // Generate instrumental or basic lyrics
    const lines: LyricsLine[] = [
      { time: 0, text: `♪ ${title} ♪` },
      { time: 5, text: `by ${artist}` },
      { time: 10, text: '' },
      { time: 15, text: '[Instrumental Track]' },
      { time: 30, text: '' },
      { time: 60, text: '♪ Music playing ♪' },
      { time: 90, text: '' }
    ];

    return {
      id: `fallback_${Date.now()}`,
      trackId: '',
      title,
      artist,
      lines,
      synced: true,
      source: 'Generated'
    };
  }

  private parseLrc(lrcContent: string): LyricsLine[] {
    const lines: LyricsLine[] = [];
    const lrcLines = lrcContent.split('\n');

    for (const line of lrcLines) {
      const timeMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const centiseconds = parseInt(timeMatch[3].padEnd(3, '0').substring(0, 3));
        
        const time = minutes * 60 + seconds + centiseconds / 1000;
        const text = line.replace(/^\[\d{2}:\d{2}\.\d{2,3}\]/, '').trim();
        
        lines.push({ time, text });
      } else if (line.trim() && !line.startsWith('[')) {
        // Plain text line without timestamp
        lines.push({ time: 0, text: line.trim() });
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  }

  async saveLyrics(lyrics: Lyrics): Promise<void> {
    const cacheKey = `${lyrics.artist}_${lyrics.title}`.toLowerCase();
    this.cache.set(cacheKey, lyrics);
    
    // In a real implementation, save to IndexedDB or localStorage
    try {
      localStorage.setItem(`lyrics_${cacheKey}`, JSON.stringify(lyrics));
    } catch (error) {
      console.error('Failed to save lyrics to storage:', error);
    }
  }

  async loadCachedLyrics(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('lyrics_')) {
          const lyricsData = localStorage.getItem(key);
          if (lyricsData) {
            const lyrics = JSON.parse(lyricsData) as Lyrics;
            const cacheKey = key.replace('lyrics_', '');
            this.cache.set(cacheKey, lyrics);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cached lyrics:', error);
    }
  }

  getCurrentLine(lyrics: Lyrics, currentTime: number): LyricsLine | null {
    if (!lyrics.synced || lyrics.lines.length === 0) return null;

    // Find the current line based on time
    for (let i = lyrics.lines.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.lines[i].time) {
        return lyrics.lines[i];
      }
    }

    return null;
  }

  getNextLine(lyrics: Lyrics, currentTime: number): LyricsLine | null {
    if (!lyrics.synced || lyrics.lines.length === 0) return null;

    // Find the next line
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (currentTime < lyrics.lines[i].time) {
        return lyrics.lines[i];
      }
    }

    return null;
  }

  clearCache(): void {
    this.cache.clear();
    
    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('lyrics_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear lyrics cache:', error);
    }
  }
}

export const lyricsService = new LyricsService();