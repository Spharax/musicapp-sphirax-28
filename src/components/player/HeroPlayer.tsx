import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Music } from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { NeonCard } from '@/components/ui/neon-card';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';
import melodyForgeLogo from '@/assets/melodyforge-logo.png';

export const HeroPlayer: React.FC = () => {
  const { currentTrack, playNext, playPrevious, getRecentTracks } = useMediaLibrary();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // If no current track, try to load the last played song
  useEffect(() => {
    if (!currentTrack) {
      loadLastPlayedTrack();
    }
  }, [currentTrack]);

  const loadLastPlayedTrack = async () => {
    const recentTracks = await getRecentTracks();
    if (recentTracks.length > 0) {
      // This would ideally set the current track, but we don't have that method exposed
      // For now, we'll just show placeholder
    }
  };

  // Use current track or show empty state
  const displayTrack = currentTrack;

  const progressPercentage = displayTrack?.duration && displayTrack.duration > 0 ? (currentTime / displayTrack.duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!displayTrack) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/90" />
        
        <NeonCard variant="hero" className="relative mx-4 mt-6 mb-4">
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="text-center py-16">
                <div className="w-32 h-32 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Music className="w-16 h-16 text-primary/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-muted-foreground">No Track Selected</h2>
                <p className="text-muted-foreground">Select a song from your library to start playing</p>
              </div>
            </div>
          </div>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background with hero image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url('/src/assets/hero-background.jpg')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/90" />
      
      <NeonCard variant="hero" className="relative mx-4 mt-6 mb-4">
        <div className="p-6">
          {/* Album Art Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 animate-float">
                <img
                  src={melodyForgeLogo}
                  alt="Album Art"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
              </div>
              {/* Pulsing glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-neon-pulse -z-10" />
            </div>

            {/* Track Info */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold gradient-text mb-2">
                {displayTrack.title}
              </h2>
              <p className="text-muted-foreground text-lg">
                {displayTrack.artist}
              </p>
              <p className="text-muted-foreground/80 text-sm">
                {displayTrack.album}
              </p>
            </div>

            {/* Waveform Visualizer */}
            <div className="w-full mb-6">
              <WaveformVisualizer 
                isPlaying={isPlaying}
                className="mb-4"
                bars={40}
                height={80}
              />
              
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 shadow-lg shadow-primary/50"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(displayTrack.duration)}</span>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <NeonButton variant="floating" size="floating" className="hover-lift">
                <Shuffle size={18} />
              </NeonButton>
              
              <NeonButton 
                variant="floating" 
                size="floating"
                className="hover-lift"
                onClick={() => playPrevious()}
                disabled={!currentTrack}
              >
                <SkipBack size={20} />
              </NeonButton>
              
              <NeonButton 
                variant="hero" 
                size="xl"
                className="rounded-full w-16 h-16 hover-lift ripple-effect relative overflow-hidden"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!currentTrack}
              >
                <div className="relative z-10">
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </div>
                {isPlaying && (
                  <div className="absolute inset-0 bg-primary/20 animate-neon-pulse" />
                )}
              </NeonButton>
              
              <NeonButton 
                variant="floating" 
                size="floating"
                className="hover-lift"
                onClick={() => playNext()}
                disabled={!currentTrack}
              >
                <SkipForward size={20} />
              </NeonButton>
              
              <NeonButton variant="floating" size="floating" className="hover-lift">
                <Repeat size={18} />
              </NeonButton>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center gap-6">
              <NeonButton
                variant="glow"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "hover-lift ripple-effect transition-all duration-300",
                  isLiked && "text-accent border-accent hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Heart size={18} className={cn(
                  isLiked ? "fill-current" : "",
                  "transition-all duration-300"
                )} />
              </NeonButton>
            </div>
          </div>
        </div>
      </NeonCard>
    </div>
  );
};