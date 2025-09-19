export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  audioLatency: number;
}

export class PerformanceMonitoringService {
  private performanceMetrics: PerformanceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    audioLatency: 0
  };

  private observers: PerformanceObserver[] = [];

  initialize(): void {
    this.setupMemoryMonitoring();
    this.setupRenderPerformanceMonitoring();
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const interval = setInterval(() => {
        const memory = (performance as any).memory;
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }, 5000);

      // Store interval for cleanup if needed
      (this as any)._memoryInterval = interval;
    }
  }

  private setupRenderPerformanceMonitoring(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            this.performanceMetrics.renderTime = entry.duration;
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  measureRenderTime(name: string, startTime: number): void {
    const duration = performance.now() - startTime;
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  startMeasure(name: string): number {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    return startTime;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  isPerformanceDegraded(): boolean {
    return (
      this.performanceMetrics.memoryUsage > 0.8 ||
      this.performanceMetrics.renderTime > 16.67 // 60fps threshold
    );
  }

  cleanup(): void {
    if ((this as any)._memoryInterval) {
      clearInterval((this as any)._memoryInterval);
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();