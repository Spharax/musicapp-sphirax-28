import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { audioProcessor, AudioProcessor } from '@/services/audioProcessor';
import { MetadataService } from '@/services/metadataService';
import { EnhancedSong } from '@/services/enhancedDatabase';
import { toast } from 'sonner';

interface EnhancedMediaPlayerProps {
  currentTrack?: EnhancedSong;
  onTrackEnd?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

export const EnhancedMediaPlayer: React.FC<EnhancedMediaPlayerProps> = ({
  currentTrack,
  onTrackEnd,
  onNext,
  onPrevious,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [pitchShift, setPitchShift] = useState(0);
  const [pitchLocked, setPitchLocked] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(false);
  
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const fileRef = useRef<File | null>(null);

  // Load and play current track
  useEffect(() => {
    if (currentTrack?.filePath) {
      loadTrack();
    }
  }, [currentTrack]);

  const loadTrack = async () => {
    if (!currentTrack?.filePath) return;

    try {
      const response = await fetch(currentTrack.filePath);
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], currentTrack.title, { type: 'audio/mpeg' });
      
      const { buffer, format, metadata } = await audioProcessor.loadAudioFile(file);
      audioBufferRef.current = buffer;
      fileRef.current = file;
      setDuration(buffer.duration);
      
      // Show format badge
      const formatInfo = MetadataService.getFormatDisplayInfo(format);
      toast.success(`Loaded ${formatInfo.name} file`, {
        description: `${formatInfo.description} - ${formatInfo.maxQuality}`
      });
    } catch (error) {
      console.error('Failed to load track:', error);
      toast.error('Failed to load audio track');
    }
  };

  const togglePlayPause = async () => {
    if (!audioBufferRef.current) return;

    try {
      if (isPlaying) {
        audioProcessor.stop();
        setIsPlaying(false);
      } else {
        await audioProcessor.playBuffer(audioBufferRef.current, currentTime);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Playback failed');
    }
  };

  const handleSpeedChange = (values: number[]) => {
    const speed = values[0];
    setPlaybackSpeed(speed);
    audioProcessor.setPlaybackSpeed(speed);
  };

  const handlePitchChange = (values: number[]) => {
    const pitch = values[0];
    setPitchShift(pitch);
    audioProcessor.setPitchShift(pitch);
  };

  const handleVolumeChange = (values: number[]) => {
    const vol = values[0];
    setVolume(vol);
    audioProcessor.setVolume(vol);
  };

  if (!currentTrack) {
    return (
      <div className={`p-6 glass-card ${className}`}>
        <div className="text-center text-muted-foreground">
          <Play className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p>No track loaded</p>
        </div>
      </div>
    );
  }

  const formatInfo = MetadataService.getFormatDisplayInfo(currentTrack.format);

  return (
    <div className={`glass-card ${className}`}>
      {/* Track info with format badge */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-semibold truncate">{currentTrack.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: formatInfo.color + '20', color: formatInfo.color }}
          >
            {formatInfo.icon} {formatInfo.name}
          </Badge>
        </div>
      </div>

      {/* Advanced controls */}
      <div className="p-4 space-y-4">
        {/* Speed and pitch controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Speed: {playbackSpeed.toFixed(1)}x</label>
            <Slider
              value={[playbackSpeed]}
              min={0.5}
              max={2.0}
              step={0.1}
              onValueChange={handleSpeedChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pitch: {pitchShift > 0 ? '+' : ''}{pitchShift}</label>
            <Slider
              value={[pitchShift]}
              min={-12}
              max={12}
              step={1}
              onValueChange={handlePitchChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={onPrevious}>
            <SkipBack size={20} />
          </Button>
          
          <Button 
            size="lg" 
            className="w-12 h-12 rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onNext}>
            <SkipForward size={20} />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Volume2 size={16} />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEqualizer(!showEqualizer)}
          >
            <Sliders size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};