import React, { useState, useEffect, useRef } from 'react';
import { Music2, Search, Download, Edit, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Track } from '@/hooks/useMediaLibrary';
import { toast } from 'sonner';

interface LyricsViewerProps {
  currentTrack?: Track;
  currentTime: number;
  isPlaying: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  currentTrack,
  currentTime,
  isPlaying,
  isOpen,
  onClose
}) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack && isOpen) {
      loadLyrics();
    }
  }, [currentTrack, isOpen]);

  useEffect(() => {
    if (lyrics.length > 0 && isPlaying) {
      updateCurrentLine();
    }
  }, [currentTime, lyrics, isPlaying]);

  useEffect(() => {
    if (autoScroll && activeLineRef.current && currentLineIndex >= 0) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex, autoScroll]);

  const loadLyrics = async () => {
    if (!currentTrack) return;
    
    setIsLoading(true);
    try {
      // Try to load from localStorage first
      const storedLyrics = localStorage.getItem(`lyrics_${currentTrack.id}`);
      if (storedLyrics) {
        const parsed = JSON.parse(storedLyrics);
        if (parsed.synced) {
          setLyrics(parsed.lines);
        } else {
          setPlainLyrics(parsed.text);
        }
      } else {
        // Try to fetch from online sources (placeholder)
        await searchLyricsOnline();
      }
    } catch (error) {
      console.error('Failed to load lyrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLyricsOnline = async () => {
    if (!currentTrack) return;
    
    setIsLoading(true);
    try {
      // Placeholder for lyrics API integration
      // In a real app, you'd integrate with Genius, Musixmatch, etc.
      const searchTerm = `${currentTrack.artist} ${currentTrack.title} lyrics`;
      
      // Simulate API call
      setTimeout(() => {
        const sampleLyrics = generateSampleLyrics(currentTrack);
        setPlainLyrics(sampleLyrics);
        toast.info('Lyrics service not configured');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to search lyrics:', error);
      toast.error('Failed to fetch lyrics');
      setIsLoading(false);
    }
  };

  const generateSampleLyrics = (track: Track): string => {
    return `${track.title}
by ${track.artist}

Lyrics not available
Connect to a lyrics service to display lyrics for this track.

[Chorus]
The actual lyrics would sync with the music
Line by line highlighting
Making it easy to sing along
With your favorite songs

[Verse 2]
You can edit these lyrics manually
Or fetch them from online sources
The lyrics viewer supports both
Synced and plain text formats

[Bridge]
Time-synced lyrics scroll automatically
Following the beat of the music
Creating an immersive experience
For every listening session

[Outro]
This is just a sample
Real integration coming soon
Enjoy your music with lyrics
In MelodyForge`;
  };

  const updateCurrentLine = () => {
    if (lyrics.length === 0) return;
    
    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
    
    if (activeIndex !== currentLineIndex) {
      setCurrentLineIndex(activeIndex);
    }
  };

  const saveLyrics = () => {
    if (!currentTrack) return;
    
    try {
      const lyricsData = {
        synced: lyrics.length > 0,
        lines: lyrics,
        text: plainLyrics,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`lyrics_${currentTrack.id}`, JSON.stringify(lyricsData));
      toast.success('Lyrics saved successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save lyrics:', error);
      toast.error('Failed to save lyrics');
    }
  };

  const parseLRCFormat = (lrcText: string): LyricLine[] => {
    const lines: LyricLine[] = [];
    const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.+)/g;
    let match;
    
    while ((match = lrcRegex.exec(lrcText)) !== null) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + centiseconds / 100;
      const text = match[4].trim();
      
      lines.push({ time, text });
    }
    
    return lines.sort((a, b) => a.time - b.time);
  };

  const handleLRCImport = (text: string) => {
    try {
      const parsed = parseLRCFormat(text);
      if (parsed.length > 0) {
        setLyrics(parsed);
        setPlainLyrics('');
        toast.success(`Imported ${parsed.length} synced lyrics lines`);
      } else {
        setPlainLyrics(text);
        toast.info('Imported as plain text lyrics');
      }
    } catch (error) {
      console.error('Failed to parse LRC:', error);
      toast.error('Failed to parse LRC format');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Lyrics</h2>
              {currentTrack && (
                <p className="text-sm text-muted-foreground">
                  {currentTrack.title} • {currentTrack.artist}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit size={16} className="mr-2" />
              {isEditing ? 'View' : 'Edit'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {isEditing ? (
          /* Edit Mode */
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={searchLyricsOnline}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search size={16} />
                {isLoading ? 'Searching...' : 'Search Online'}
              </Button>
              <Button
                onClick={saveLyrics}
                className="proton-button flex items-center gap-2"
              >
                <Download size={16} />
                Save Lyrics
              </Button>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lyrics (supports LRC format for syncing)
              </label>
              <Textarea
                value={plainLyrics}
                onChange={(e) => {
                  setPlainLyrics(e.target.value);
                  // Try to parse as LRC on change
                  if (e.target.value.includes('[') && e.target.value.includes(']')) {
                    const parsed = parseLRCFormat(e.target.value);
                    if (parsed.length > 0) {
                      setLyrics(parsed);
                    }
                  }
                }}
                placeholder="Paste lyrics here... 
                
LRC format example:
[00:12.34]This is a synced lyric line
[00:15.67]This line shows at 15.67 seconds

Or just paste plain text lyrics"
                className="min-h-96 font-mono text-sm"
              />
            </div>
            
            {lyrics.length > 0 && (
              <div className="p-3 bg-accent/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ✓ Found {lyrics.length} time-synced lyrics lines
                </p>
              </div>
            )}
          </div>
        ) : (
          /* View Mode */
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="p-4 border-b border-border/50 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                  id="auto-scroll"
                />
                <label htmlFor="auto-scroll" className="text-sm">
                  Auto scroll
                </label>
              </div>
              
              {lyrics.length === 0 && plainLyrics && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search in lyrics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>
              )}
            </div>

            {/* Lyrics Content */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading lyrics...</p>
                </div>
              ) : lyrics.length > 0 ? (
                /* Synced Lyrics */
                <div className="space-y-3">
                  {lyrics.map((line, index) => (
                    <div
                      key={index}
                      ref={index === currentLineIndex ? activeLineRef : undefined}
                      className={`text-lg leading-relaxed transition-all duration-300 ${
                        index === currentLineIndex
                          ? 'text-primary font-semibold scale-105 transform'
                          : index < currentLineIndex
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>
              ) : plainLyrics ? (
                /* Plain Text Lyrics */
                <div className="space-y-4">
                  {plainLyrics.split('\n').map((line, index) => {
                    const isHighlighted = searchQuery && 
                      line.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    return (
                      <div
                        key={index}
                        className={`text-lg leading-relaxed ${
                          isHighlighted ? 'bg-primary/20 p-2 rounded' : ''
                        }`}
                      >
                        {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No Lyrics */
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Music2 className="text-primary" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No lyrics found</h3>
                  <p className="text-muted-foreground mb-6">
                    {currentTrack 
                      ? `No lyrics available for "${currentTrack.title}"`
                      : 'Select a track to view lyrics'
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={searchLyricsOnline}
                      disabled={isLoading || !currentTrack}
                    >
                      <Search size={16} className="mr-2" />
                      Search Online
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      disabled={!currentTrack}
                      className="proton-button"
                    >
                      <Edit size={16} className="mr-2" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};