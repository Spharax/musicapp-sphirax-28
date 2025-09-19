import React, { useState } from 'react';
import { Heart, Share, Settings, Volume2, Headphones, Zap, MoreHorizontal, Music, Type, AudioLines } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeonButton } from '@/components/ui/neon-button';
import { NeonCard } from '@/components/ui/neon-card';
import { HeroPlayer } from '@/components/player/HeroPlayer';
import { LyricsDisplay } from '@/components/lyrics/LyricsDisplay';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { LocalStorage } from '@/utils/localStorage';

export const PlayerScreen: React.FC = () => {
  const { currentTrack } = useMediaLibrary();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="pb-20 min-h-screen">
      {/* Hero Player */}
      <HeroPlayer />
      
      {/* Player Tabs */}
      <div className="px-4 mb-6">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 animate-slide-up">
            <TabsTrigger value="queue" className="flex items-center gap-2 hover-lift">
              <Music size={16} />
              Queue
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="flex items-center gap-2 hover-lift">
              <Type size={16} />
              Lyrics
            </TabsTrigger>
            <TabsTrigger value="visualizer" className="flex items-center gap-2 hover-lift">
              <AudioLines size={16} />
              Visual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="animate-slide-up">
            {/* Queue Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold gradient-text">Up Next</h3>
                <NeonButton variant="glow" size="sm" className="hover-lift">
                  View Queue
                </NeonButton>
              </div>
              
              <NeonCard variant="floating" className="animate-slide-up">
                <CardContent className="p-4">
                   <div className="text-center py-8 text-muted-foreground">
                     <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p>No tracks in queue</p>
                     <p className="text-sm">Add music to see your queue here</p>
                  </div>
                </CardContent>
              </NeonCard>
            </div>
          </TabsContent>

          <TabsContent value="lyrics" className="animate-slide-up">
            <NeonCard variant="floating" className="h-96">
            <LyricsDisplay 
              currentTrack={currentTrack}
              currentTime={currentTime}
              className="h-full"
            />
            </NeonCard>
          </TabsContent>

          <TabsContent value="visualizer" className="animate-slide-up">
            <NeonCard variant="plasma" className="h-96">
              <CardContent className="p-6 flex items-center justify-center">
                <div className="w-full">
                  <WaveformVisualizer
                    isPlaying={isPlaying}
                    bars={60}
                    height={200}
                    className="mb-4 animate-glow-rotate"
                  />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Audio Visualizer</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPlaying ? 'Playing' : 'Paused'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </NeonCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Player Actions */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold gradient-text mb-4 animate-slide-up">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <NeonCard variant="glow" className="interactive-card ripple-effect">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <Heart className="text-white" size={20} />
              </div>
              <h4 className="font-semibold text-sm mb-1">Add to Favorites</h4>
              <p className="text-xs text-muted-foreground">Save this track</p>
            </CardContent>
          </NeonCard>
          
          <NeonCard variant="plasma" className="interactive-card ripple-effect">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                <Share className="text-white" size={20} />
              </div>
              <h4 className="font-semibold text-sm mb-1">Share Track</h4>
              <p className="text-xs text-muted-foreground">Send to friends</p>
            </CardContent>
          </NeonCard>
        </div>
      </div>

      {/* Audio Enhancement */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold gradient-text mb-4 animate-slide-up">Audio Enhancement</h3>
        <NeonCard variant="neon" className="animate-slide-up hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                <Headphones className="text-white" size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Spatial Audio</h4>
                <p className="text-xs text-muted-foreground">Enhanced 3D sound experience</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NeonButton variant="floating" size="sm" className="text-xs hover-lift ripple-effect">
                Bass Boost
              </NeonButton>
              <NeonButton variant="floating" size="sm" className="text-xs hover-lift ripple-effect">
                Vocal Enhance
              </NeonButton>
              <NeonButton variant="floating" size="sm" className="text-xs hover-lift ripple-effect">
                Equalizer
              </NeonButton>
            </div>
          </CardContent>
        </NeonCard>
      </div>
    </div>
  );
};