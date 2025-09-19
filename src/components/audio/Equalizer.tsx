import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Save, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface EqualizerProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  isOpen: boolean;
  onClose: () => void;
}

const EQ_PRESETS = {
  flat: { name: 'Flat', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock: { name: 'Rock', values: [5, 4, 3, 1, -1, -1, 0, 2, 4, 5] },
  pop: { name: 'Pop', values: [-1, 2, 4, 4, 2, 0, -1, -1, 2, 3] },
  jazz: { name: 'Jazz', values: [3, 2, 1, 2, -1, -1, 0, 2, 3, 4] },
  classical: { name: 'Classical', values: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  electronic: { name: 'Electronic', values: [4, 3, 1, 0, -1, 2, 1, 1, 3, 4] },
  hiphop: { name: 'Hip Hop', values: [5, 4, 1, 3, -1, -1, 1, 2, 3, 4] },
  vocal: { name: 'Vocal', values: [-2, -1, -1, 1, 3, 3, 2, 1, 0, -1] },
  bass: { name: 'Bass Boost', values: [6, 5, 3, 1, -1, -2, -1, 0, 1, 2] },
  treble: { name: 'Treble Boost', values: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 6] }
};

const FREQUENCY_BANDS = [
  '32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'
];

export const Equalizer: React.FC<EqualizerProps> = ({ audioRef, isOpen, onClose }) => {
  const [eqValues, setEqValues] = useState<number[]>(EQ_PRESETS.flat.values);
  const [selectedPreset, setSelectedPreset] = useState('flat');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);

  useEffect(() => {
    if (audioRef?.current && isOpen && !audioContext) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = context.createMediaElementSource(audioRef.current);
        
        // Create biquad filters for each frequency band
        const filterNodes = FREQUENCY_BANDS.map((_, index) => {
          const filter = context.createBiquadFilter();
          filter.type = index === 0 ? 'lowshelf' : index === 9 ? 'highshelf' : 'peaking';
          filter.frequency.value = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][index];
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });

        // Connect filters in series
        let currentNode = source;
        filterNodes.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
        currentNode.connect(context.destination);

        setAudioContext(context);
        setFilters(filterNodes);
      } catch (error) {
        console.error('Failed to create audio context:', error);
        toast.error('Equalizer not supported in this browser');
      }
    }

    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioRef, isOpen]);

  const updateEqualizer = (values: number[]) => {
    setEqValues(values);
    filters.forEach((filter, index) => {
      filter.gain.value = values[index];
    });
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetValues = EQ_PRESETS[preset as keyof typeof EQ_PRESETS].values;
    updateEqualizer(presetValues);
    toast.success(`Applied ${EQ_PRESETS[preset as keyof typeof EQ_PRESETS].name} preset`);
  };

  const handleBandChange = (bandIndex: number, value: number[]) => {
    const newValues = [...eqValues];
    newValues[bandIndex] = value[0];
    updateEqualizer(newValues);
    setSelectedPreset('custom');
  };

  const resetEqualizer = () => {
    updateEqualizer(EQ_PRESETS.flat.values);
    setSelectedPreset('flat');
    toast.success('Equalizer reset to flat');
  };

  const saveCustomPreset = () => {
    // In a real app, this would save to localStorage or database
    localStorage.setItem('customEQPreset', JSON.stringify(eqValues));
    toast.success('Custom preset saved');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Equalizer</h2>
              <p className="text-sm text-muted-foreground">Fine-tune your audio</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          {/* Preset Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Presets</label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQ_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EQ Bands */}
          <div>
            <label className="text-sm font-medium mb-4 block">Frequency Bands</label>
            <div className="grid grid-cols-5 gap-4">
              {FREQUENCY_BANDS.map((freq, index) => (
                <div key={freq} className="text-center">
                  <div className="h-32 mb-2 flex items-end justify-center">
                    <Slider
                      orientation="vertical"
                      value={[eqValues[index]]}
                      min={-12}
                      max={12}
                      step={0.5}
                      onValueChange={(value) => handleBandChange(index, value)}
                      className="h-full"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{freq}</div>
                  <div className="text-xs font-mono text-primary">
                    {eqValues[index] > 0 ? '+' : ''}{eqValues[index].toFixed(1)}dB
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={resetEqualizer}
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </Button>
            <Button
              onClick={saveCustomPreset}
              className="flex items-center gap-2 proton-button"
            >
              <Save size={16} />
              Save Custom
            </Button>
          </div>

          {/* Audio Enhancement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 size={18} />
                Audio Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Bass Boost</label>
                <Slider
                  value={[0]}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Virtualizer</label>
                <Slider
                  value={[0]}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};