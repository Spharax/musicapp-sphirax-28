import React, { useState, useEffect } from 'react';
import { Sparkles, Music, Clock, Shuffle, TrendingUp, Heart, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface SmartMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMixCreated?: (tracks: Track[]) => void;
}

interface MixOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  algorithm: (tracks: Track[]) => Track[];
}

export const SmartMixModal: React.FC<SmartMixModalProps> = ({
  isOpen,
  onClose,
  onMixCreated
}) => {
  const { audioFiles, playTrack } = useMediaLibrary();
  const [selectedMix, setSelectedMix] = useState<string>('mood-boost');
  const [duration, setDuration] = useState([30]); // minutes
  const [generatedMix, setGeneratedMix] = useState<Track[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const mixOptions: MixOption[] = [
    {
      id: 'mood-boost',
      name: 'Mood Booster',
      description: 'Uplifting tracks to energize your day',
      icon: Zap,
      algorithm: (tracks) => {
        // Prefer higher play count and recent tracks
        return tracks
          .filter(t => t.playCount > 0)
          .sort((a, b) => (b.playCount * 0.7) + (b.lastPlayed ? 0.3 : 0) - (a.playCount * 0.7) - (a.lastPlayed ? 0.3 : 0))
          .slice(0, Math.floor(duration[0] / 3)); // ~3min per song
      }
    },
    {
      id: 'discovery',
      name: 'Discovery Mix',
      description: 'Songs you haven\'t heard in a while',
      icon: Sparkles,
      algorithm: (tracks) => {
        // Prefer tracks with low play count or never played
        return tracks
          .sort((a, b) => {
            const aScore = a.playCount + (a.lastPlayed ? new Date().getTime() - a.lastPlayed.getTime() : 0) / 1000000;
            const bScore = b.playCount + (b.lastPlayed ? new Date().getTime() - b.lastPlayed.getTime() : 0) / 1000000;
            return aScore - bScore;
          })
          .slice(0, Math.floor(duration[0] / 3));
      }
    },
    {
      id: 'favorites',
      name: 'Your Favorites',
      description: 'Most played songs in your library',
      icon: Heart,
      algorithm: (tracks) => {
        return tracks
          .filter(t => t.playCount > 2)
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, Math.floor(duration[0] / 3));
      }
    },
    {
      id: 'recent',
      name: 'Recently Added',
      description: 'Your newest additions',
      icon: TrendingUp,
      algorithm: (tracks) => {
        return tracks
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
          .slice(0, Math.floor(duration[0] / 3));
      }
    },
    {
      id: 'shuffle',
      name: 'Random Mix',
      description: 'Completely random selection',
      icon: Shuffle,
      algorithm: (tracks) => {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.floor(duration[0] / 3));
      }
    }
  ];

  const generateMix = async () => {
    if (audioFiles.length === 0) {
      toast.error('No music files found. Please add some music first.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const selectedOption = mixOptions.find(opt => opt.id === selectedMix);
      if (!selectedOption) return;

      // Apply the selected algorithm
      const mixTracks = selectedOption.algorithm(audioFiles);
      
      if (mixTracks.length === 0) {
        toast.error('Unable to generate mix with current criteria. Try different settings.');
        return;
      }

      setGeneratedMix(mixTracks);
      
      // Create a playlist from the mix
      const playlistName = `${selectedOption.name} - ${new Date().toLocaleDateString()}`;
      const playlist = {
        id: `smart_mix_${Date.now()}`,
        name: playlistName,
        songs: mixTracks.map(t => t.id),
        trackIds: mixTracks.map(t => t.id),
        createdAt: new Date(),
        dateCreated: new Date(),
        lastModified: new Date(),
        color: '#8B5CF6', // Purple color
        description: `Auto-generated ${selectedOption.name.toLowerCase()} with ${mixTracks.length} songs`,
        isSmartPlaylist: true,
        smartMixOptions: {
          type: selectedMix,
          duration: duration[0],
          generatedAt: new Date()
        }
      };
      
      await musicDB.createPlaylist(playlist);
      toast.success(`Created smart mix: ${playlistName}`);
      
      onMixCreated?.(mixTracks);
    } catch (error) {
      console.error('Failed to generate smart mix:', error);
      toast.error('Failed to generate smart mix');
    } finally {
      setIsGenerating(false);
    }
  };

  const playMix = () => {
    if (generatedMix.length > 0) {
      playTrack(generatedMix[0], generatedMix);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Mix Creator
          </DialogTitle>
          <DialogDescription>
            Let AI create personalized mixes based on your music taste, mood, or activity. Choose a preset or customize your mix preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mix Types */}
          <div>
            <h3 className="font-medium mb-3">Choose Mix Type</h3>
            <div className="space-y-2">
              {mixOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all border ${
                    selectedMix === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMix(option.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedMix === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <option.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.name}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Mix Duration</h3>
              <Badge variant="secondary" className="text-xs">
                {duration[0]} minutes
              </Badge>
            </div>
            <div className="px-2">
              <Slider
                value={duration}
                onValueChange={setDuration}
                max={120}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>10m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
            </div>
          </div>

          {/* Generated Mix Preview */}
          {generatedMix.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Generated Mix ({generatedMix.length} songs)</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {generatedMix.slice(0, 5).map((track, index) => (
                  <div key={track.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                    <Music className="w-3 h-3 text-primary" />
                    <span className="truncate">{track.title}</span>
                    <span className="text-muted-foreground">by {track.artist}</span>
                  </div>
                ))}
                {generatedMix.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    +{generatedMix.length - 5} more songs
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={generateMix}
              disabled={isGenerating}
              className="flex-1 proton-button"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Mix
                </>
              )}
            </Button>
            
            {generatedMix.length > 0 && (
              <Button onClick={playMix} variant="outline" className="flex-1">
                <Music className="w-4 h-4 mr-2" />
                Play Mix
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};