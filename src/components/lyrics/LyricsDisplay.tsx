import React, { useState, useEffect } from 'react';
import { Music, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Track } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';

interface LyricsDisplayProps {
  currentTrack?: Track;
  currentTime?: number;
  className?: string;
}

// Mock lyrics data - in a real app, this would come from an API
const mockLyrics = {
  "default": [
    { time: 0, text: "Welcome to MelodyForge" },
    { time: 5, text: "Your offline music companion" },
    { time: 10, text: "Discover, play, and enjoy" },
    { time: 15, text: "All your favorite songs" },
    { time: 20, text: "In one beautiful place" },
  ]
};

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  currentTrack,
  currentTime = 0,
  className
}) => {
  const [lyrics, setLyrics] = useState<Array<{ time: number; text: string }>>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLyrics(mockLyrics.default);
        setIsLoading(false);
      }, 500);
    }
  }, [currentTrack]);

  const getCurrentLyricIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i;
      }
    }
    return -1;
  };

  const currentLyricIndex = getCurrentLyricIndex();

  if (!currentTrack) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No track selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lyrics</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(!isVisible)}
              className="w-8 h-8"
            >
              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => console.log('Download lyrics')}
            >
              <Download size={16} />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="truncate">{currentTrack.title}</p>
          <p className="truncate">{currentTrack.artist}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : isVisible ? (
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {lyrics.map((lyric, index) => (
                <div
                  key={index}
                  className={cn(
                    "transition-all duration-300 p-2 rounded-lg",
                    index === currentLyricIndex
                      ? "text-primary font-medium bg-primary/10 scale-105"
                      : "text-muted-foreground"
                  )}
                >
                  {lyric.text}
                </div>
              ))}
              
              {lyrics.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No lyrics available</p>
                  <p className="text-xs mt-1">Lyrics will appear here when available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Lyrics hidden</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};