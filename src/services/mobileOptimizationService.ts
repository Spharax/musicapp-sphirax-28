import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export interface DeviceInfo {
  platform: string;
  model: string;
  osVersion: string;
  isVirtual: boolean;
  memUsed: number;
  diskFree: number;
  diskTotal: number;
  batteryLevel: number;
  isCharging: boolean;
}

export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  audioLatency: number;
}

export class MobileOptimizationService {
  private deviceInfo: DeviceInfo | null = null;
  private performanceMetrics: PerformanceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    audioLatency: 0
  };

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.loadDeviceInfo();
      this.setupPerformanceMonitoring();
      this.setupKeyboardHandling();
      this.setupAppStateHandling();
    } catch (error) {
      console.error('Failed to initialize mobile optimizations:', error);
    }
  }

  private async loadDeviceInfo(): Promise<void> {
    try {
      const info = await Device.getInfo();
      const batteryInfo = await Device.getBatteryInfo();
      
      this.deviceInfo = {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        isVirtual: info.isVirtual,
        memUsed: info.memUsed || 0,
        diskFree: 0, // Not available in Capacitor Device API
        diskTotal: 0, // Not available in Capacitor Device API
        batteryLevel: batteryInfo.batteryLevel || 0,
        isCharging: batteryInfo.isCharging || false
      };
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }, 5000);
    }

    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          this.performanceMetrics.renderTime = entry.duration;
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  private setupKeyboardHandling(): void {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.addListener('keyboardWillShow', (info) => {
      // Adjust layout for keyboard
      document.body.style.transform = `translateY(-${info.keyboardHeight / 4}px)`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      // Reset layout
      document.body.style.transform = 'translateY(0px)';
    });
  }

  private setupAppStateHandling(): void {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.onAppResume();
      } else {
        this.onAppPause();
      }
    });
  }

  private onAppResume(): void {
    // Refresh data, resume playback if needed
    document.dispatchEvent(new CustomEvent('app-resume'));
  }

  private onAppPause(): void {
    // Save state, pause playback
    document.dispatchEvent(new CustomEvent('app-pause'));
  }

  // Performance optimization methods
  optimizeForDevice(): void {
    if (!this.deviceInfo) return;

    // Reduce animations on low-end devices
    if (this.isLowEndDevice()) {
      this.reducedAnimations();
    }

    // Optimize audio quality based on storage
    if (this.isLowStorage()) {
      this.optimizeAudioQuality();
    }

    // Battery optimizations
    if (this.isLowBattery()) {
      this.enableBatterySaving();
    }
  }

  private isLowEndDevice(): boolean {
    if (!this.deviceInfo) return false;
    
    return this.deviceInfo.memUsed > 0.8 || // Using 80%+ of memory
           this.performanceMetrics.memoryUsage > 0.8;
  }

  private isLowStorage(): boolean {
    if (!this.deviceInfo) return false;
    
    const freeStorageRatio = this.deviceInfo.diskFree / this.deviceInfo.diskTotal;
    return freeStorageRatio < 0.1; // Less than 10% free
  }

  private isLowBattery(): boolean {
    if (!this.deviceInfo) return false;
    
    return this.deviceInfo.batteryLevel < 0.2 && !this.deviceInfo.isCharging;
  }

  private reducedAnimations(): void {
    document.body.classList.add('reduced-animations');
    
    // Add CSS class for reduced animations
    const style = document.createElement('style');
    style.textContent = `
      .reduced-animations * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeAudioQuality(): void {
    document.dispatchEvent(new CustomEvent('optimize-audio-quality', {
      detail: { quality: 'medium' }
    }));
  }

  private enableBatterySaving(): void {
    document.dispatchEvent(new CustomEvent('enable-battery-saving', {
      detail: {
        reduceBrightness: true,
        limitBackgroundTasks: true,
        pauseVisualEffects: true
      }
    }));
  }

  // Audio-specific optimizations
  optimizeAudioPlayback(): {
    bufferSize: number;
    sampleRate: number;
    quality: 'low' | 'medium' | 'high';
  } {
    if (!this.deviceInfo) {
      return { bufferSize: 4096, sampleRate: 44100, quality: 'high' };
    }

    let bufferSize = 4096;
    let sampleRate = 44100;
    let quality: 'low' | 'medium' | 'high' = 'high';

    // Adjust based on device capabilities
    if (this.isLowEndDevice()) {
      bufferSize = 8192; // Larger buffer for stability
      sampleRate = 22050; // Lower sample rate
      quality = 'medium';
    }

    if (this.isLowBattery()) {
      quality = 'low';
    }

    return { bufferSize, sampleRate, quality };
  }

  // Network optimization
  optimizeNetworkRequests(): {
    maxConcurrent: number;
    timeout: number;
    retryAttempts: number;
  } {
    let maxConcurrent = 6;
    let timeout = 10000;
    let retryAttempts = 3;

    if (this.isLowEndDevice()) {
      maxConcurrent = 3;
      timeout = 15000;
      retryAttempts = 2;
    }

    return { maxConcurrent, timeout, retryAttempts };
  }

  // Image optimization
  optimizeImageLoading(): {
    maxImageSize: number;
    quality: number;
    lazyLoadThreshold: number;
  } {
    let maxImageSize = 1920;
    let quality = 0.8;
    let lazyLoadThreshold = 100;

    if (this.isLowEndDevice()) {
      maxImageSize = 1080;
      quality = 0.6;
      lazyLoadThreshold = 200;
    }

    return { maxImageSize, quality, lazyLoadThreshold };
  }

  // Cache management
  manageCaches(): void {
    const cacheSize = this.getCacheSize();
    const maxCacheSize = this.isLowStorage() ? 50 * 1024 * 1024 : 200 * 1024 * 1024; // 50MB or 200MB

    if (cacheSize > maxCacheSize) {
      this.clearOldCaches();
    }
  }

  private getCacheSize(): number {
    // Estimate cache size from localStorage and other storage
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length;
      }
    }
    return size * 2; // Rough estimate including overhead
  }

  private clearOldCaches(): void {
    // Clear old cached data
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const key of keys) {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && now - item.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Haptic feedback
  async provideFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      
      const style = type === 'light' ? ImpactStyle.Light :
                   type === 'medium' ? ImpactStyle.Medium :
                   ImpactStyle.Heavy;
      
      await Haptics.impact({ style });
    } catch (error) {
      // Haptics not available, ignore
    }
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}

export const mobileOptimizationService = new MobileOptimizationService();