import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Save, Volume2, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const FREQUENCY_BANDS = [
  { label: '32Hz', frequency: 32 },
  { label: '64Hz', frequency: 64 },
  { label: '125Hz', frequency: 125 },
  { label: '250Hz', frequency: 250 },
  { label: '500Hz', frequency: 500 },
  { label: '1kHz', frequency: 1000 },
  { label: '2kHz', frequency: 2000 },
  { label: '4kHz', frequency: 4000 },
  { label: '8kHz', frequency: 8000 },
  { label: '16kHz', frequency: 16000 }
];

const PRESETS = {
  flat: { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock: { name: 'Rock', gains: [5, 3, -1, -2, -1, 2, 4, 6, 6, 6] },
  pop: { name: 'Pop', gains: [2, 4, 4, 2, -1, -2, -1, 2, 4, 4] },
  jazz: { name: 'Jazz', gains: [4, 3, 1, 2, -1, -1, 0, 1, 3, 4] },
  classical: { name: 'Classical', gains: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4] },
  electronic: { name: 'Electronic', gains: [4, 3, 1, 0, -1, 2, 1, 1, 4, 5] },
  hiphop: { name: 'Hip Hop', gains: [5, 4, 1, 3, -1, -1, 1, -1, 2, 4] },
  vocal: { name: 'Vocal', gains: [1, 0, -1, 1, 4, 4, 3, 2, 1, 0] }
};

export const EqualizerScreen: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [gains, setGains] = useState<number[]>(PRESETS.flat.gains);
  const [activePreset, setActivePreset] = useState<string>('flat');
  const [customPresetName, setCustomPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadEqualizerSettings();
  }, []);

  useEffect(() => {
    if (isEnabled) {
      applyEqualizerSettings();
    }
  }, [gains, isEnabled]);

  const loadEqualizerSettings = () => {
    const saved = localStorage.getItem('melodyforge-equalizer');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setIsEnabled(settings.enabled);
        setGains(settings.gains || PRESETS.flat.gains);
        setActivePreset(settings.preset || 'flat');
      } catch (error) {
        console.error('Failed to load equalizer settings:', error);
      }
    }
  };

  const saveEqualizerSettings = () => {
    const settings = {
      enabled: isEnabled,
      gains: gains,
      preset: activePreset
    };
    localStorage.setItem('melodyforge-equalizer', JSON.stringify(settings));
    
    // Dispatch event for audio components to pick up
    document.dispatchEvent(new CustomEvent('equalizer-updated', { 
      detail: settings 
    }));
    
    toast.success('Equalizer settings saved');
  };

  const applyEqualizerSettings = () => {
    // Dispatch event for real-time updates
    document.dispatchEvent(new CustomEvent('equalizer-changed', { 
      detail: { enabled: isEnabled, gains } 
    }));
  };

  const handleGainChange = (index: number, value: number[]) => {
    const newGains = [...gains];
    newGains[index] = value[0];
    setGains(newGains);
    setActivePreset('custom');
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      setGains([...preset.gains]);
      setActivePreset(presetKey);
      toast.success(`Applied ${preset.name} preset`);
    }
  };

  const resetEqualizer = () => {
    setGains([...PRESETS.flat.gains]);
    setActivePreset('flat');
    toast.success('Equalizer reset to flat');
  };

  const getGainColor = (gain: number): string => {
    if (gain > 3) return 'text-red-500';
    if (gain > 0) return 'text-yellow-500';
    if (gain < -3) return 'text-blue-500';
    if (gain < 0) return 'text-cyan-500';
    return 'text-gray-500';
  };

  const formatGain = (gain: number): string => {
    return `${gain > 0 ? '+' : ''}${gain}dB`;
  };

  return (
    <div className="pb-20 min-h-screen bg-background px-4">
      <header className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Equalizer</h1>
            <p className="text-muted-foreground">Fine-tune your audio experience</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetEqualizer}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Switch 
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Master Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Audio Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Equalizer</p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled ? 'Audio processing active' : 'Bypass all audio processing'}
                </p>
              </div>
              <Switch 
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  setIsEnabled(checked);
                  toast.success(checked ? 'Equalizer enabled' : 'Equalizer disabled');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Presets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={activePreset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(key)}
                  className="h-12 flex flex-col items-center gap-1"
                  disabled={!isEnabled}
                >
                  <span className="font-medium">{preset.name}</span>
                  {activePreset === key && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equalizer Bands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Frequency Bands
              {activePreset === 'custom' && (
                <Badge variant="outline" className="ml-2">Custom</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visual EQ Display */}
              <div className="relative h-32 bg-muted/20 rounded-lg p-4 overflow-hidden">
                <div className="flex items-end justify-between h-full">
                  {FREQUENCY_BANDS.map((band, index) => {
                    const gain = gains[index];
                    const normalizedGain = ((gain + 12) / 24) * 100; // Normalize -12dB to +12dB to 0-100%
                    
                    return (
                      <div key={band.frequency} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-3 bg-primary/80 rounded-t transition-all duration-200"
                          style={{ 
                            height: `${Math.max(normalizedGain, 8)}%`,
                            backgroundColor: isEnabled ? undefined : 'var(--muted)'
                          }}
                        />
                        <div className="text-xs text-muted-foreground mt-1 transform rotate-45 origin-bottom-left">
                          {band.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Center line */}
                <div className="absolute inset-x-4 top-1/2 border-t border-muted-foreground/30" />
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {FREQUENCY_BANDS.map((band, index) => (
                  <div key={band.frequency} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{band.label}</label>
                      <span className={`text-sm font-mono ${getGainColor(gains[index])}`}>
                        {formatGain(gains[index])}
                      </span>
                    </div>
                    <Slider
                      value={[gains[index]]}
                      onValueChange={(value) => handleGainChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      disabled={!isEnabled}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={saveEqualizerSettings}
              className="w-full proton-button"
              disabled={!isEnabled}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};