import { deviceInfoService } from '../device/deviceInfoService';

export class CacheManagementService {
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly LOW_STORAGE_CACHE_LIMIT = 50 * 1024 * 1024; // 50MB
  private readonly NORMAL_CACHE_LIMIT = 200 * 1024 * 1024; // 200MB

  manageCaches(): void {
    const cacheSize = this.getCacheSize();
    const maxCacheSize = deviceInfoService.isLowStorage() 
      ? this.LOW_STORAGE_CACHE_LIMIT 
      : this.NORMAL_CACHE_LIMIT;

    if (cacheSize > maxCacheSize) {
      this.clearOldCaches();
    }
  }

  private getCacheSize(): number {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length;
      }
    }
    return size * 2; // Rough estimate including overhead
  }

  private clearOldCaches(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && now - item.timestamp > this.MAX_CACHE_AGE) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }

  clearAllCaches(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    }
  }

  setCacheItem(key: string, data: any, expiryHours: number = 24): void {
    const item = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
    };
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item:', error);
      // If storage is full, try clearing old caches and retry
      this.clearOldCaches();
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (retryError) {
        console.error('Failed to cache item after cleanup:', retryError);
      }
    }
  }

  getCacheItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (parsed.expiry && now > parsed.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to get cache item:', error);
      return null;
    }
  }

  getCacheStats(): { totalSize: number; itemCount: number } {
    let totalSize = 0;
    let itemCount = 0;

    for (let key in localStorage) {
      if (key.startsWith('cache_') && localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
        itemCount++;
      }
    }

    return { totalSize: totalSize * 2, itemCount }; // Rough estimate
  }
}

export const cacheManagementService = new CacheManagementService();