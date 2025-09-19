import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Shuffle, Repeat, Timer, MoreHorizontal, Sliders, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Track } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';
import { AudioVisualizer } from '@/components/audio/AudioVisualizer';
import { useBackgroundPlayback } from '@/hooks/useBackgroundPlayback';
import { MiniWaveform } from '@/components/enhanced/MiniWaveform';
import { GestureControls } from '@/components/enhanced/GestureControls';
import { SleepTimer } from '@/components/enhanced/SleepTimer';
import { Equalizer } from '@/components/audio/Equalizer';
import { QueueManager } from '@/components/queue/QueueManager';
import { cn } from '@/lib/utils';

interface MediaPlayerProps {
  currentTrack?: Track;
  queue?: Track[];
  queueIndex?: number;
  onTrackEnd?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onReorderQueue?: (newQueue: Track[]) => void;
  onClearQueue?: () => void;
  onShuffleQueue?: () => void;
  className?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  currentTrack,
  queue = [],
  queueIndex = 0,
  onTrackEnd,
  onNext,
  onPrevious,
  onReorderQueue,
  onClearQueue,
  onShuffleQueue,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [showMiniWaveform, setShowMiniWaveform] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showQueueManager, setShowQueueManager] = useState(false);

  // Update favorite status when track changes
  useEffect(() => {
    if (currentTrack) {
      // For now, we'll check if the track has been played recently as a proxy for favorite
      setIsFavorite(currentTrack.playCount > 5);
    }
  }, [currentTrack]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = async () => {
      if (currentTrack) {
        // Update play count and stats
        try {
          const song = await musicDB.getSongById(currentTrack.id);
          if (song) {
            song.playCount += 1;
            song.lastPlayed = new Date();
            await musicDB.updateSong(song);
          }
        } catch (error) {
          console.error('Failed to update song stats:', error);
        }
      }
      
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        handleNext();
      } else {
        setIsPlaying(false);
        onTrackEnd?.();
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack, repeatMode, onTrackEnd]);

  // Handle play/pause
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Handle next track with shuffle support
  const handleNext = () => {
    if (onNext) {
      // Pass shuffle and repeat state to the handler
      (onNext as any)(repeatMode, isShuffling);
    }
  };

  // Handle previous track
  const handlePrevious = () => {
    if (onPrevious) {
      // Pass shuffle state to the handler
      (onPrevious as any)(isShuffling);
    }
  };

  // Background playback support
  useBackgroundPlayback({
    currentTrack,
    isPlaying,
    onNext,
    onPrevious,
    onPlay: togglePlayPause,
    onPause: togglePlayPause
  });

  // Handle seek
  const handleSeek = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = values[0];
    setCurrentTime(values[0]);
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = values[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!currentTrack) return;
    
    try {
      const song = await musicDB.getSongById(currentTrack.id);
      if (song) {
        // For now, we'll use playCount as a proxy for favorite status
        song.playCount = isFavorite ? Math.max(0, song.playCount - 5) : song.playCount + 5;
        await musicDB.updateSong(song);
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load new track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // For demo purposes, we'll use the file path directly
    // In a real implementation, this would need proper file handling
    try {
      audio.src = currentTrack.filePath || '';
      audio.load();
      
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    } catch (error) {
      console.error('Failed to load track:', error);
    }
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className={`p-6 glass-card border-0 border-t border-border/50 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm">No track selected</p>
        </div>
      </div>
    );
  }

  const handleSleepTimerEnd = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <GestureControls
      onSwipeLeft={handlePrevious}
      onSwipeRight={handleNext}
      onDoubleTap={togglePlayPause}
      className={`glass-card border-0 border-t border-border/50 ${className}`}
    >
      <audio ref={audioRef} preload="metadata" />
      
      {/* Enhanced Visualizers */}
      <div className="px-6 pt-4">
        {showVisualizer && isPlaying && (
          <div className="h-16 mb-4">
            <AudioVisualizer
              audioRef={audioRef}
              isPlaying={isPlaying}
              style="bars"
              className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5"
            />
          </div>
        )}
        
        {showMiniWaveform && !showVisualizer && (
          <div className="h-8 mb-4 flex items-center justify-center">
            <MiniWaveform
              audioRef={audioRef}
              isPlaying={isPlaying}
              className="w-full max-w-xs"
              bars={30}
              height={24}
            />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowVisualizer(!showVisualizer)}
              className="text-xs hover:text-primary transition-colors"
            >
              {showVisualizer ? 'Full' : 'Bars'}
            </button>
            <span className="text-xs text-muted-foreground">•</span>
            <button 
              onClick={() => setShowMiniWaveform(!showMiniWaveform)}
              className="text-xs hover:text-primary transition-colors"
            >
              {showMiniWaveform ? 'Wave' : 'Mini'}
            </button>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-4 p-6">
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-base">{currentTrack.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="w-10 h-10 text-muted-foreground hover:text-primary"
          >
            <SkipBack size={20} />
          </Button>

          <Button
            className="w-12 h-12 proton-button rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="w-10 h-10 text-muted-foreground hover:text-primary"
          >
            <SkipForward size={20} />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className={cn(
              "w-8 h-8",
              isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShuffling(!isShuffling)}
            className={cn(
              "w-8 h-8 relative transition-all",
              isShuffling 
                ? 'text-primary bg-primary/10 shadow-sm border border-primary/20' 
                : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
            )}
          >
            <Shuffle size={16} />
            {isShuffling && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRepeatMode(repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none')}
            className={cn(
              "w-8 h-8 relative transition-all",
              repeatMode !== 'none' 
                ? 'text-primary bg-primary/10 shadow-sm border border-primary/20' 
                : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
            )}
          >
            <Repeat size={16} />
            {repeatMode === 'all' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-medium">1</span>
            )}
          </Button>

          <SleepTimer onTimerEnd={handleSleepTimerEnd} />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEqualizer(true)}
            className="w-8 h-8 text-muted-foreground hover:text-primary"
          >
            <Sliders size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQueueManager(true)}
            className="w-8 h-8 text-muted-foreground hover:text-primary"
          >
            <List size={16} />
          </Button>
        </div>
      </div>
      
      {/* Advanced Components */}
      <Equalizer
        audioRef={audioRef}
        isOpen={showEqualizer}
        onClose={() => setShowEqualizer(false)}
      />
      
      <QueueManager
        queue={queue}
        currentIndex={queueIndex}
        isOpen={showQueueManager}
        onClose={() => setShowQueueManager(false)}
        onPlayTrack={(track, index) => {
          // Implementation would depend on parent component
        }}
        onReorderQueue={onReorderQueue || (() => {})}
        onClearQueue={onClearQueue || (() => {})}
        onShuffleQueue={onShuffleQueue || (() => {})}
      />
    </GestureControls>
  );
};