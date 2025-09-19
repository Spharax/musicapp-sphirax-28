import { deviceInfoService } from '../device/deviceInfoService';
import { performanceMonitoringService } from '../performance/performanceMonitoringService';

export interface AudioOptimization {
  bufferSize: number;
  sampleRate: number;
  quality: 'low' | 'medium' | 'high';
}

export interface NetworkOptimization {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
}

export interface ImageOptimization {
  maxImageSize: number;
  quality: number;
  lazyLoadThreshold: number;
}

export class OptimizationStrategiesService {
  
  optimizeAudioPlayback(): AudioOptimization {
    const deviceInfo = deviceInfoService.getDeviceInfo();
    const isLowEnd = deviceInfoService.isLowEndDevice();
    const isLowBattery = deviceInfoService.isLowBattery();
    
    let bufferSize = 4096;
    let sampleRate = 44100;
    let quality: 'low' | 'medium' | 'high' = 'high';

    if (isLowEnd) {
      bufferSize = 8192; // Larger buffer for stability
      sampleRate = 22050; // Lower sample rate
      quality = 'medium';
    }

    if (isLowBattery) {
      quality = 'low';
    }

    return { bufferSize, sampleRate, quality };
  }

  optimizeNetworkRequests(): NetworkOptimization {
    const isLowEnd = deviceInfoService.isLowEndDevice();
    
    let maxConcurrent = 6;
    let timeout = 10000;
    let retryAttempts = 3;

    if (isLowEnd) {
      maxConcurrent = 3;
      timeout = 15000;
      retryAttempts = 2;
    }

    return { maxConcurrent, timeout, retryAttempts };
  }

  optimizeImageLoading(): ImageOptimization {
    const isLowEnd = deviceInfoService.isLowEndDevice();
    
    let maxImageSize = 1920;
    let quality = 0.8;
    let lazyLoadThreshold = 100;

    if (isLowEnd) {
      maxImageSize = 1080;
      quality = 0.6;
      lazyLoadThreshold = 200;
    }

    return { maxImageSize, quality, lazyLoadThreshold };
  }

  enablePerformanceOptimizations(): void {
    const isLowEnd = deviceInfoService.isLowEndDevice();
    const isLowBattery = deviceInfoService.isLowBattery();
    const isDegraded = performanceMonitoringService.isPerformanceDegraded();

    if (isLowEnd || isDegraded) {
      this.enableReducedAnimations();
    }

    if (deviceInfoService.isLowStorage()) {
      this.triggerAudioQualityOptimization();
    }

    if (isLowBattery) {
      this.enableBatterySaving();
    }
  }

  private enableReducedAnimations(): void {
    document.body.classList.add('reduced-animations');
    
    const style = document.createElement('style');
    style.textContent = `
      .reduced-animations * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private triggerAudioQualityOptimization(): void {
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
}

export const optimizationStrategiesService = new OptimizationStrategiesService();