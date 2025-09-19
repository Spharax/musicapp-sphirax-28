import React, { useState, useEffect } from 'react';
import { Shuffle, Volume2, Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface CrossfadeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: CrossfadeSettings) => void;
}

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number;
  curve: 'linear' | 'exponential' | 'smooth';
  gapless: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  normalizeVolume: boolean;
  skipSilence: boolean;
  preloadNext: boolean;
}

export const CrossfadeSettings: React.FC<CrossfadeSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<CrossfadeSettings>({
    enabled: true,
    duration: 5,
    curve: 'smooth',
    gapless: false,
    fadeInDuration: 2,
    fadeOutDuration: 3,
    normalizeVolume: true,
    skipSilence: true,
    preloadNext: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('crossfade_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        onSettingsChange(parsedSettings);
      }
    } catch (error) {
      console.error('Failed to load crossfade settings:', error);
    }
  };

  const saveSettings = (newSettings: CrossfadeSettings) => {
    try {
      localStorage.setItem('crossfade_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange(newSettings);
      toast.success('Crossfade settings saved');
    } catch (error) {
      console.error('Failed to save crossfade settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: CrossfadeSettings = {
      enabled: true,
      duration: 5,
      curve: 'smooth',
      gapless: false,
      fadeInDuration: 2,
      fadeOutDuration: 3,
      normalizeVolume: true,
      skipSilence: true,
      preloadNext: true
    };
    saveSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  const updateSetting = <K extends keyof CrossfadeSettings>(
    key: K,
    value: CrossfadeSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Crossfade & Audio Settings</h2>
              <p className="text-sm text-muted-foreground">Configure smooth track transitions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw size={16} className="mr-2" />
              Reset
            </Button>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Crossfade Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                Crossfade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Crossfade */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Enable Crossfade</label>
                  <p className="text-sm text-muted-foreground">
                    Smoothly transition between tracks
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => updateSetting('enabled', enabled)}
                />
              </div>

              {settings.enabled && (
                <>
                  <Separator />
                  
                  {/* Crossfade Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-medium">Duration</label>
                      <span className="text-sm text-muted-foreground">
                        {settings.duration}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.duration]}
                      min={1}
                      max={15}
                      step={0.5}
                      onValueChange={([duration]) => updateSetting('duration', duration)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long tracks overlap during crossfade
                    </p>
                  </div>

                  {/* Fade Curve */}
                  <div className="space-y-3">
                    <label className="font-medium">Fade Curve</label>
                    <Select
                      value={settings.curve}
                      onValueChange={(curve: 'linear' | 'exponential' | 'smooth') => 
                        updateSetting('curve', curve)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="smooth">Smooth (Recommended)</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How the volume changes during crossfade
                    </p>
                  </div>

                  {/* Custom Fade Durations */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-sm">Fade In</label>
                        <span className="text-sm text-muted-foreground">
                          {settings.fadeInDuration}s
                        </span>
                      </div>
                      <Slider
                        value={[settings.fadeInDuration]}
                        min={0.5}
                        max={settings.duration}
                        step={0.1}
                        onValueChange={([fadeInDuration]) => 
                          updateSetting('fadeInDuration', fadeInDuration)
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-sm">Fade Out</label>
                        <span className="text-sm text-muted-foreground">
                          {settings.fadeOutDuration}s
                        </span>
                      </div>
                      <Slider
                        value={[settings.fadeOutDuration]}
                        min={0.5}
                        max={settings.duration}
                        step={0.1}
                        onValueChange={([fadeOutDuration]) => 
                          updateSetting('fadeOutDuration', fadeOutDuration)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Gapless Playback */}
          <Card>
            <CardHeader>
              <CardTitle>Gapless Playback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Enable Gapless</label>
                  <p className="text-sm text-muted-foreground">
                    No silence between tracks (disables crossfade)
                  </p>
                </div>
                <Switch
                  checked={settings.gapless}
                  onCheckedChange={(gapless) => {
                    updateSetting('gapless', gapless);
                    if (gapless) {
                      updateSetting('enabled', false);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Audio Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Volume Normalization */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Volume Normalization</label>
                  <p className="text-sm text-muted-foreground">
                    Maintain consistent volume across tracks
                  </p>
                </div>
                <Switch
                  checked={settings.normalizeVolume}
                  onCheckedChange={(normalizeVolume) => 
                    updateSetting('normalizeVolume', normalizeVolume)
                  }
                />
              </div>

              <Separator />

              {/* Skip Silence */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Skip Silence</label>
                  <p className="text-sm text-muted-foreground">
                    Automatically skip silent parts at track ends
                  </p>
                </div>
                <Switch
                  checked={settings.skipSilence}
                  onCheckedChange={(skipSilence) => 
                    updateSetting('skipSilence', skipSilence)
                  }
                />
              </div>

              <Separator />

              {/* Preload Next Track */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Preload Next Track</label>
                  <p className="text-sm text-muted-foreground">
                    Load next track in advance for seamless playback
                  </p>
                </div>
                <Switch
                  checked={settings.preloadNext}
                  onCheckedChange={(preloadNext) => 
                    updateSetting('preloadNext', preloadNext)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-medium mb-2">Current Configuration:</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    {settings.gapless ? (
                      <div>• Gapless playback enabled - no gaps between tracks</div>
                    ) : settings.enabled ? (
                      <>
                        <div>• Crossfade enabled - {settings.duration}s overlap</div>
                        <div>• {settings.curve} fade curve</div>
                        <div>• Fade in: {settings.fadeInDuration}s, Fade out: {settings.fadeOutDuration}s</div>
                      </>
                    ) : (
                      <div>• Standard playback - small gap between tracks</div>
                    )}
                    {settings.normalizeVolume && <div>• Volume normalization enabled</div>}
                    {settings.skipSilence && <div>• Silence detection enabled</div>}
                    {settings.preloadNext && <div>• Next track preloading enabled</div>}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Preview mode - play some tracks to hear the effect')}
                >
                  Test Current Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};