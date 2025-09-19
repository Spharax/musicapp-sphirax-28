import { deviceInfoService, DeviceInfo } from './device/deviceInfoService';
import { performanceMonitoringService, PerformanceMetrics } from './performance/performanceMonitoringService';
import { optimizationStrategiesService } from './optimization/optimizationStrategiesService';
import { platformInteractionService } from './platform/platformInteractionService';
import { cacheManagementService } from './cache/cacheManagementService';

export class MobileOptimizationService {
  
  async initialize(): Promise<void> {
    try {
      // Initialize all services
      await deviceInfoService.initialize();
      performanceMonitoringService.initialize();
      platformInteractionService.initialize();
      
      // Apply initial optimizations
      this.optimizeForDevice();
      
      // Setup periodic cache management
      this.setupPeriodicOptimizations();
    } catch (error) {
      console.error('Failed to initialize mobile optimizations:', error);
    }
  }

  private setupPeriodicOptimizations(): void {
    // Run cache management every 5 minutes
    setInterval(() => {
      cacheManagementService.manageCaches();
    }, 5 * 60 * 1000);

    // Apply performance optimizations every minute
    setInterval(() => {
      optimizationStrategiesService.enablePerformanceOptimizations();
    }, 60 * 1000);
  }

  optimizeForDevice(): void {
    optimizationStrategiesService.enablePerformanceOptimizations();
  }

  // Convenience methods that delegate to appropriate services
  getDeviceInfo(): DeviceInfo | null {
    return deviceInfoService.getDeviceInfo();
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return performanceMonitoringService.getPerformanceMetrics();
  }

  async provideFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    return platformInteractionService.provideFeedback(type);
  }

  // Optimization getters
  getAudioOptimization() {
    return optimizationStrategiesService.optimizeAudioPlayback();
  }

  getNetworkOptimization() {
    return optimizationStrategiesService.optimizeNetworkRequests();
  }

  getImageOptimization() {
    return optimizationStrategiesService.optimizeImageLoading();
  }

  // Cache management
  getCacheStats() {
    return cacheManagementService.getCacheStats();
  }

  clearCaches(): void {
    cacheManagementService.clearAllCaches();
  }

  // Performance monitoring
  startMeasure(name: string): number {
    return performanceMonitoringService.startMeasure(name);
  }

  measureRenderTime(name: string, startTime: number): void {
    performanceMonitoringService.measureRenderTime(name, startTime);
  }

  cleanup(): void {
    performanceMonitoringService.cleanup();
  }
}

export const mobileOptimizationService = new MobileOptimizationService();

// Re-export interfaces for backward compatibility
export type { DeviceInfo, PerformanceMetrics };