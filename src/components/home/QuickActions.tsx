import React from 'react';
import { Play, Shuffle, Heart, Clock, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';

interface QuickActionsProps {
  onActionSelect?: (action: string, tracks?: Track[]) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect }) => {
  const { audioFiles, playTrack } = useMediaLibrary();

  const actions = [
    {
      id: 'shuffle-all',
      icon: Shuffle,
      label: 'Shuffle All',
      gradient: 'from-purple-500 to-pink-500',
      action: () => {
        if (audioFiles.length > 0) {
          const shuffled = [...audioFiles].sort(() => Math.random() - 0.5);
          playTrack(shuffled[0], shuffled);
          onActionSelect?.('shuffle-all', shuffled);
        }
      }
    },
    {
      id: 'favorites',
      icon: Heart,
      label: 'Favorites',
      gradient: 'from-red-500 to-rose-500',
      action: () => {
        const favorites = audioFiles.filter(track => track.playCount > 5);
        if (favorites.length > 0) {
          playTrack(favorites[0], favorites);
          onActionSelect?.('favorites', favorites);
        }
      }
    },
    {
      id: 'recently-added',
      icon: Clock,
      label: 'Recently Added',
      gradient: 'from-blue-500 to-cyan-500',
      action: () => {
        const recent = [...audioFiles]
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
          .slice(0, 20);
        if (recent.length > 0) {
          playTrack(recent[0], recent);
          onActionSelect?.('recently-added', recent);
        }
      }
    },
    {
      id: 'top-tracks',
      icon: TrendingUp,
      label: 'Top Tracks',
      gradient: 'from-green-500 to-emerald-500',
      action: () => {
        const topTracks = [...audioFiles]
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, 20);
        if (topTracks.length > 0) {
          playTrack(topTracks[0], topTracks);
          onActionSelect?.('top-tracks', topTracks);
        }
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Quick Mix</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            onClick={action.action}
            disabled={audioFiles.length === 0}
            className={`h-20 flex flex-col items-center gap-2 bg-gradient-to-br ${action.gradient} border-0 text-white hover:scale-[1.02] transition-all shadow-lg`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
      
      {audioFiles.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          <p className="text-sm">Add music to use quick actions</p>
        </div>
      )}
    </div>
  );
};