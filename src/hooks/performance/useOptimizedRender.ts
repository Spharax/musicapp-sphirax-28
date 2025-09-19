import React, { useCallback, useMemo, memo } from 'react';
import { usePerformanceOptimization } from './usePerformanceOptimization';

// Higher-order component for performance optimization
export function withOptimizedRender<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const OptimizedComponent = memo((props: P) => {
    const { measureRender } = usePerformanceOptimization();
    
    const finishMeasure = useMemo(() => {
      return measureRender(componentName);
    }, [measureRender]);

    React.useEffect(() => {
      return finishMeasure;
    }, [finishMeasure]);

    return React.createElement(Component, props);
  });

  OptimizedComponent.displayName = `Optimized${componentName}`;
  return OptimizedComponent;
}

// Hook for optimized callbacks
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Hook for optimized memoization
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T => {
  return useMemo(factory, deps);
};

// Hook for debounced values (useful for search inputs)
export const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttled function calls
export const useThrottled = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = React.useRef<number>(0);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
};