import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Play, Settings, Music, Clock, Shuffle } from 'lucide-react';
import { smartMixService, SmartMixOptions } from '@/services/smartMixService';
import { Track } from '@/hooks/useMediaLibrary';
import { toast } from 'sonner';

interface SmartMixCreatorProps {
  onPlaylistCreated?: (tracks: Track[]) => void;
  className?: string;
}

export const SmartMixCreator: React.FC<SmartMixCreatorProps> = ({ 
  onPlaylistCreated, 
  className 
}) => {
  const [options, setOptions] = useState<SmartMixOptions>({
    mood: 'energetic',
    duration: 60,
    diversity: 'medium',
    includeRecentlyPlayed: true,
    excludeSkipped: false
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewTracks, setPreviewTracks] = useState<Track[]>([]);

  const moodOptions = [
    { value: 'energetic', label: 'Energetic', color: 'bg-red-500', icon: Zap },
    { value: 'chill', label: 'Chill', color: 'bg-blue-500', icon: Music },
    { value: 'focus', label: 'Focus', color: 'bg-green-500', icon: Settings },
    { value: 'workout', label: 'Workout', color: 'bg-orange-500', icon: Play },
    { value: 'sleep', label: 'Sleep', color: 'bg-purple-500', icon: Clock }
  ];

  const diversityOptions = [
    { value: 'low', label: 'Low', description: 'Similar artists & genres' },
    { value: 'medium', label: 'Medium', description: 'Balanced variety' },
    { value: 'high', label: 'High', description: 'Maximum variety' }
  ];

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    try {
      const tracks = await smartMixService.generateSmartMix({
        ...options,
        duration: 30 // Shorter preview
      });
      
      setPreviewTracks(tracks.slice(0, 10)); // Show first 10 tracks
      toast.success(`Generated preview with ${tracks.length} tracks`);
    } catch (error) {
      console.error('Failed to generate smart mix:', error);
      toast.error('Failed to generate smart mix');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePlaylist = async () => {
    setIsGenerating(true);
    try {
      const playlistName = `Smart Mix - ${options.mood} ${new Date().toLocaleDateString()}`;
      const playlist = await smartMixService.createSmartPlaylist(playlistName, options);
      
      const tracks = await smartMixService.generateSmartMix(options);
      
      toast.success(`Created "${playlistName}" with ${tracks.length} tracks`);
      onPlaylistCreated?.(tracks);
    } catch (error) {
      console.error('Failed to create smart playlist:', error);
      toast.error('Failed to create smart playlist');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="glass-card animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Zap className="animate-bounce-gentle" />
            Smart Mix Creator
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Mood Selection */}
      <Card className="glass-card animate-slide-up hover-lift">
        <CardHeader>
          <CardTitle className="text-lg">Mood & Vibe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {moodOptions.map((mood) => {
              const Icon = mood.icon;
              const isSelected = options.mood === mood.value;
              
              return (
                <Card
                  key={mood.value}
                  className={`
                    interactive-card border cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => setOptions(prev => ({ ...prev, mood: mood.value as any }))}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-10 h-10 ${mood.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <p className="font-medium text-sm">{mood.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card className="glass-card animate-slide-up hover-lift">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock size={20} />
            Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Target Duration</Label>
              <span className="text-sm text-muted-foreground">{options.duration} minutes</span>
            </div>
            <Slider
              value={[options.duration || 60]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, duration: value }))}
              min={15}
              max={180}
              step={15}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Diversity & Options */}
      <Card className="glass-card animate-slide-up hover-lift">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shuffle size={20} />
            Mix Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diversity */}
          <div className="space-y-3">
            <Label>Diversity Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {diversityOptions.map((diversity) => (
                <Card
                  key={diversity.value}
                  className={`
                    interactive-card cursor-pointer p-3 text-center transition-all
                    ${options.diversity === diversity.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => setOptions(prev => ({ ...prev, diversity: diversity.value as any }))}
                >
                  <p className="font-medium text-sm">{diversity.label}</p>
                  <p className="text-xs text-muted-foreground">{diversity.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Recently Played</Label>
                <p className="text-xs text-muted-foreground">Boost recently played tracks</p>
              </div>
              <Switch
                checked={options.includeRecentlyPlayed}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeRecentlyPlayed: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Exclude Skipped Songs</Label>
                <p className="text-xs text-muted-foreground">Avoid songs you tend to skip</p>
              </div>
              <Switch
                checked={options.excludeSkipped}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, excludeSkipped: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewTracks.length > 0 && (
        <Card className="glass-card animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previewTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-md flex items-center justify-center">
                    <Music size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {track.genre && (
                    <Badge variant="outline" className="text-xs">
                      {track.genre}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 animate-slide-up">
        <Button
          onClick={handleGeneratePreview}
          disabled={isGenerating}
          variant="outline"
          className="flex-1 hover-lift"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Play size={16} className="mr-2" />
          )}
          Preview Mix
        </Button>
        
        <Button
          onClick={handleCreatePlaylist}
          disabled={isGenerating}
          className="flex-1 hover-lift ripple-effect"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Zap size={16} className="mr-2" />
          )}
          Create Playlist
        </Button>
      </div>
    </div>
  );
};