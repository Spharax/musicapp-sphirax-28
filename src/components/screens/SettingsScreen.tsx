import React, { useState, useEffect } from 'react';
import { Settings, Palette, Volume2, Download, Shield, Info, Music, Database, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    highQualityAudio: true,
    wifiOnly: false,
    autoPlay: true,
    showLyrics: true,
    defaultVolume: 80,
    crossfade: false,
    gaplessPlayback: true
  });
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalSize: 0,
    dbSize: 0
  });

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  const loadStats = async () => {
    try {
      const allSongs = await musicDB.getAllSongs();
      const totalSize = allSongs.reduce((acc, song) => acc + (song.size || 0), 0);
      
      setStats({
        totalSongs: allSongs.length,
        totalSize,
        dbSize: totalSize // Approximate
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('melodyforge-settings');
    if (saved) {
      setSettings({ ...settings, ...JSON.parse(saved) });
    }
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('melodyforge-settings', JSON.stringify(newSettings));
    toast.success('Setting updated');
  };

  const clearCache = async () => {
    try {
      // Clear localStorage cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('melodyforge-cache-')) {
          localStorage.removeItem(key);
        }
      });
      
      toast.success('Cache cleared successfully');
      loadStats();
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const resetDatabase = async () => {
    if (confirm('Are you sure? This will remove all your music data and cannot be undone.')) {
      try {
        await musicDB.clearAll();
        toast.success('Database reset successfully');
        loadStats();
      } catch (error) {
        toast.error('Failed to reset database');
      }
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="pb-20 min-h-screen bg-background px-4">
      <header className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Customize your experience</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Lyrics</p>
                <p className="text-sm text-muted-foreground">Display lyrics when available</p>
              </div>
              <Switch 
                checked={settings.showLyrics}
                onCheckedChange={(checked) => updateSetting('showLyrics', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Quality Audio</p>
                <p className="text-sm text-muted-foreground">Use 320kbps bitrate</p>
              </div>
              <Switch 
                checked={settings.highQualityAudio}
                onCheckedChange={(checked) => updateSetting('highQualityAudio', checked)}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Default Volume</p>
                <span className="text-sm text-muted-foreground">{settings.defaultVolume}%</span>
              </div>
              <Slider
                value={[settings.defaultVolume]}
                onValueChange={(value) => updateSetting('defaultVolume', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Crossfade</p>
                <p className="text-sm text-muted-foreground">Smooth transitions between tracks</p>
              </div>
              <Switch 
                checked={settings.crossfade}
                onCheckedChange={(checked) => updateSetting('crossfade', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Gapless Playback</p>
                <p className="text-sm text-muted-foreground">No silence between tracks</p>
              </div>
              <Switch 
                checked={settings.gaplessPlayback}
                onCheckedChange={(checked) => updateSetting('gaplessPlayback', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Playback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Play</p>
                <p className="text-sm text-muted-foreground">Continue to next track automatically</p>
              </div>
              <Switch 
                checked={settings.autoPlay}
                onCheckedChange={(checked) => updateSetting('autoPlay', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalSongs}</div>
                <div className="text-xs text-muted-foreground">Songs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{formatSize(stats.totalSize)}</div>
                <div className="text-xs text-muted-foreground">Total Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{formatSize(stats.dbSize)}</div>
                <div className="text-xs text-muted-foreground">Database</div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetDatabase}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Database
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">2024.01.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">PWA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};