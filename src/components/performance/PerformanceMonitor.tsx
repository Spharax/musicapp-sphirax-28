import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePerformanceOptimization } from '@/hooks/performance/usePerformanceOptimization';
import { Activity, Battery, HardDrive, Smartphone, Trash2 } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
  const {
    getDeviceInfo,
    getPerformanceMetrics,
    getCacheStats,
    clearCaches
  } = usePerformanceOptimization();

  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [cacheStats, setCacheStats] = useState(getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
      setCacheStats(getCacheStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [getPerformanceMetrics, getCacheStats]);

  const handleClearCaches = () => {
    clearCaches();
    setCacheStats(getCacheStats());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="proton-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>
            Real-time system performance and optimization status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceInfo && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device
                  </span>
                  <Badge variant="outline">{deviceInfo.platform}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {deviceInfo.model} • {deviceInfo.osVersion}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Battery className="h-4 w-4" />
                    Battery
                  </span>
                  <Badge 
                    variant={deviceInfo.batteryLevel < 0.2 ? "destructive" : "secondary"}
                  >
                    {Math.round(deviceInfo.batteryLevel * 100)}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {deviceInfo.isCharging ? 'Charging' : 'On Battery'}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(metrics.memoryUsage * 100)}%
                </span>
              </div>
              <Progress value={metrics.memoryUsage * 100} className="h-2" />
            </div>

            {metrics.renderTime > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Render Time</span>
                  <span className="text-xs text-muted-foreground">
                    {metrics.renderTime.toFixed(2)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((metrics.renderTime / 16.67) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="proton-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Application cache usage and management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium">Cache Size</span>
              <div className="text-2xl font-bold text-primary">
                {formatBytes(cacheStats.totalSize)}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">Cached Items</span>
              <div className="text-2xl font-bold text-primary">
                {cacheStats.itemCount}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleClearCaches}
            variant="outline"
            className="w-full"
            disabled={cacheStats.itemCount === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache ({formatBytes(cacheStats.totalSize)})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};