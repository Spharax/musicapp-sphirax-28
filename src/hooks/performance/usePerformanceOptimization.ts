import { useEffect, useCallback } from 'react';
import { mobileOptimizationService } from '@/services/mobileOptimizationService';

export const usePerformanceOptimization = () => {
  
  useEffect(() => {
    // Initialize mobile optimizations
    mobileOptimizationService.initialize();

    return () => {
      // Cleanup on unmount
      mobileOptimizationService.cleanup();
    };
  }, []);

  const measureRender = useCallback((componentName: string) => {
    const startTime = mobileOptimizationService.startMeasure(componentName);
    
    return () => {
      mobileOptimizationService.measureRenderTime(componentName, startTime);
    };
  }, []);

  const getDeviceInfo = useCallback(() => {
    return mobileOptimizationService.getDeviceInfo();
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return mobileOptimizationService.getPerformanceMetrics();
  }, []);

  const getOptimizations = useCallback(() => {
    return {
      audio: mobileOptimizationService.getAudioOptimization(),
      network: mobileOptimizationService.getNetworkOptimization(),
      image: mobileOptimizationService.getImageOptimization(),
    };
  }, []);

  const provideFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    return mobileOptimizationService.provideFeedback(type);
  }, []);

  const getCacheStats = useCallback(() => {
    return mobileOptimizationService.getCacheStats();
  }, []);

  const clearCaches = useCallback(() => {
    mobileOptimizationService.clearCaches();
  }, []);

  return {
    measureRender,
    getDeviceInfo,
    getPerformanceMetrics,
    getOptimizations,
    provideFeedback,
    getCacheStats,
    clearCaches
  };
};