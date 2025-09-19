export interface Song {
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
}

export interface Playlist {
  id: string;
  name: string;
  songs: string[]; // Song IDs
  trackIds: string[]; // Alias for songs for compatibility
  createdAt: Date;
  dateCreated: Date; // Alias for createdAt
  lastModified: Date;
  color: string;
  description?: string;
  isSmartPlaylist?: boolean;
  smartMixOptions?: any;
}

export interface UserStats {
  totalPlayTime: number;
  totalSongs: number;
  totalPlaylists: number;
  favoriteGenre?: string;
  topArtist?: string;
  lastUpdated: Date;
}

class MusicDatabase {
  private dbName = 'MelodyForgeDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Songs store
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('artist', 'artist', { unique: false });
          songStore.createIndex('album', 'album', { unique: false });
          songStore.createIndex('genre', 'genre', { unique: false });
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }

        // Stats store
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'id' });
        }
      };
    });
  }

  async addSong(song: Song): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    await store.add(song);
  }

  async getAllSongs(): Promise<Song[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSongById(id: string): Promise<Song | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSong(song: Song): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    await store.put(song);
  }

  async createPlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    await store.add(playlist);
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['playlists'], 'readonly');
      const store = transaction.objectStore('playlists');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    await store.put(playlist);
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    await store.delete(id);
  }

  async updateStats(stats: UserStats): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['stats'], 'readwrite');
    const store = transaction.objectStore('stats');
    await store.put({ ...stats, id: 'user_stats' });
  }

  async getStats(): Promise<UserStats> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stats'], 'readonly');
      const store = transaction.objectStore('stats');
      const request = store.get('user_stats');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          // Default stats
          const defaultStats: UserStats = {
            totalPlayTime: 0,
            totalSongs: 0,
            totalPlaylists: 0,
            lastUpdated: new Date()
          };
          resolve(defaultStats);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentSongs(limit: number = 10): Promise<Song[]> {
    const songs = await this.getAllSongs();
    return songs
      .filter(song => song.lastPlayed)
      .sort((a, b) => (b.lastPlayed?.getTime() || 0) - (a.lastPlayed?.getTime() || 0))
      .slice(0, limit);
  }

  async getTopSongs(limit: number = 10): Promise<Song[]> {
    const songs = await this.getAllSongs();
    return songs
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  async deleteSong(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    await store.delete(id);
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    // Clear all object stores
    const transaction = this.db!.transaction(['songs', 'playlists', 'stats'], 'readwrite');
    
    const songsStore = transaction.objectStore('songs');
    const playlistsStore = transaction.objectStore('playlists');
    const statsStore = transaction.objectStore('stats');
    
    await Promise.all([
      songsStore.clear(),
      playlistsStore.clear(),
      statsStore.clear()
    ]);
  }
}

export const musicDB = new MusicDatabase();