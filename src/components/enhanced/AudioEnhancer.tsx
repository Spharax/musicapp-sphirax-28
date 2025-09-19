import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, Headphones, Radio } from 'lucide-react';

interface AudioEnhancerProps {
  audioElement?: HTMLAudioElement | null;
}

export const AudioEnhancer: React.FC<AudioEnhancerProps> = ({ audioElement }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [equalizer, setEqualizer] = useState<BiquadFilterNode[]>([]);
  const [compressor, setCompressor] = useState<DynamicsCompressorNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [bassBoost, setBassBoost] = useState(0);
  const [trebleBoost, setTrebleBoost] = useState(0);
  const [volume, setVolume] = useState(100);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (audioElement && !audioContext) {
      initializeAudioProcessing();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    // Listen for equalizer settings
    const handleEqualizerUpdate = (event: CustomEvent) => {
      const { enabled, gains } = event.detail;
      if (enabled && equalizer.length > 0) {
        gains.forEach((gain: number, index: number) => {
          if (equalizer[index]) {
            equalizer[index].gain.value = gain;
          }
        });
      }
    };

    document.addEventListener('equalizer-changed', handleEqualizerUpdate as EventListener);
    return () => {
      document.removeEventListener('equalizer-changed', handleEqualizerUpdate as EventListener);
    };
  }, [equalizer]);

  const initializeAudioProcessing = async () => {
    if (!audioElement) return;

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaElementSource(audioElement);
      
      // Create equalizer bands
      const frequencies = [60, 170, 350, 1000, 3500, 10000];
      const filters = frequencies.map((frequency, index) => {
        const filter = context.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      // Create compressor
      const comp = context.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.knee.value = 30;
      comp.ratio.value = 12;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;

      // Create analyser
      const anal = context.createAnalyser();
      anal.fftSize = 256;
      anal.smoothingTimeConstant = 0.8;

      // Connect nodes
      let currentNode = source;
      filters.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      
      currentNode.connect(comp);
      comp.connect(anal);
      anal.connect(context.destination);

      setAudioContext(context);
      setEqualizer(filters);
      setCompressor(comp);
      setAnalyser(anal);

      // Start visualization
      startVisualization();
    } catch (error) {
      console.error('Failed to initialize audio processing:', error);
    }
  };

  const startVisualization = () => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, `hsl(${(i / bufferLength) * 360}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(i / bufferLength) * 360}, 70%, 30%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const updateBassBoost = (value: number) => {
    setBassBoost(value);
    if (equalizer[0]) {
      equalizer[0].gain.value = value;
    }
  };

  const updateTrebleBoost = (value: number) => {
    setTrebleBoost(value);
    if (equalizer[equalizer.length - 1]) {
      equalizer[equalizer.length - 1].gain.value = value;
    }
  };

  const updateVolume = (value: number) => {
    setVolume(value);
    if (audioElement) {
      audioElement.volume = value / 100;
    }
  };

  const toggleSpatialAudio = (enabled: boolean) => {
    setSpatialAudio(enabled);
    // Implementation would depend on Web Audio API spatial audio features
  };

  const toggleNoiseReduction = (enabled: boolean) => {
    setNoiseReduction(enabled);
    // Implementation would involve noise gate or other processing
  };

  return (
    <div className="space-y-4">
      {/* Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            Audio Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-32 bg-black/10 rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Audio Enhancement Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            Audio Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Master Volume</label>
              <Badge variant="outline">{volume}%</Badge>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value) => updateVolume(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Bass Boost</label>
              <Badge variant="outline">{bassBoost > 0 ? '+' : ''}{bassBoost}dB</Badge>
            </div>
            <Slider
              value={[bassBoost]}
              onValueChange={(value) => updateBassBoost(value[0])}
              min={-12}
              max={12}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Treble Boost</label>
              <Badge variant="outline">{trebleBoost > 0 ? '+' : ''}{trebleBoost}dB</Badge>
            </div>
            <Slider
              value={[trebleBoost]}
              onValueChange={(value) => updateTrebleBoost(value[0])}
              min={-12}
              max={12}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Spatial Audio</p>
              <p className="text-sm text-muted-foreground">3D audio experience</p>
            </div>
            <Switch 
              checked={spatialAudio}
              onCheckedChange={toggleSpatialAudio}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Noise Reduction</p>
              <p className="text-sm text-muted-foreground">Reduce background noise</p>
            </div>
            <Switch 
              checked={noiseReduction}
              onCheckedChange={toggleNoiseReduction}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};