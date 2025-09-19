import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Music, Clock, Users, Star, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';

export const AnalyticsScreen: React.FC = () => {
  const { audioFiles, getTopTracks, getRecentTracks } = useMediaLibrary();
  const [analytics, setAnalytics] = useState({
    totalPlayTime: 0,
    totalTracks: 0,
    totalPlaylists: 0,
    averageSessionTime: 0,
    mostPlayedGenre: 'Unknown',
    topArtist: 'Unknown',
    streakDays: 0
  });
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [recentActivity, setRecentActivity] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [audioFiles]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get basic stats
      const stats = await musicDB.getStats();
      const allPlaylists = await musicDB.getAllPlaylists();
      const topTracksData = await getTopTracks();
      const recentTracksData = await getRecentTracks();

      // Calculate advanced analytics
      const genres = audioFiles.reduce((acc, track) => {
        const genre = track.genre || 'Unknown';
        acc[genre] = (acc[genre] || 0) + track.playCount;
        return acc;
      }, {} as Record<string, number>);

      const artists = audioFiles.reduce((acc, track) => {
        acc[track.artist] = (acc[track.artist] || 0) + track.playCount;
        return acc;
      }, {} as Record<string, number>);

      const mostPlayedGenre = Object.entries(genres).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
      const topArtist = Object.entries(artists).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      setAnalytics({
        totalPlayTime: stats.totalPlayTime,
        totalTracks: audioFiles.length,
        totalPlaylists: allPlaylists.length,
        averageSessionTime: stats.totalPlayTime / Math.max(audioFiles.reduce((acc, track) => acc + track.playCount, 0), 1),
        mostPlayedGenre,
        topArtist,
        streakDays: calculateStreakDays()
      });

      setTopTracks(topTracksData);
      setRecentActivity(recentTracksData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreakDays = () => {
    // Simple streak calculation based on recent tracks
    // In a real app, this would be more sophisticated
    const recentDays = new Set();
    audioFiles.forEach(track => {
      if (track.lastPlayed) {
        const day = track.lastPlayed.toDateString();
        recentDays.add(day);
      }
    });
    return recentDays.size;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen bg-background px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-background px-4">
      <header className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">Your music listening insights</p>
          </div>
          <Button variant="outline" onClick={loadAnalytics}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Music className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{analytics.totalTracks}</div>
              <div className="text-xs text-muted-foreground">Total Tracks</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatTime(analytics.totalPlayTime)}</div>
              <div className="text-xs text-muted-foreground">Play Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{analytics.totalPlaylists}</div>
              <div className="text-xs text-muted-foreground">Playlists</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{analytics.streakDays}</div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Listening Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Listening Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Favorite Genre</span>
                  <Badge variant="secondary">{analytics.mostPlayedGenre}</Badge>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Top Artist</span>
                  <span className="text-sm text-muted-foreground">{analytics.topArtist}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg. Session</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(analytics.averageSessionTime)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Tracks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Played Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No play data yet</p>
                <p className="text-sm">Start listening to see your top tracks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topTracks.slice(0, 10).map((track, index) => (
                  <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{track.playCount} plays</div>
                      <div className="text-xs text-muted-foreground">{formatDuration(track.duration)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Your recently played tracks will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((track) => (
                  <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {track.lastPlayed && new Date(track.lastPlayed).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Music Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Music Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Weekly Listening Goal</span>
                <span className="text-sm text-muted-foreground">
                  {formatTime(analytics.totalPlayTime % (7 * 24 * 3600))} / 2h
                </span>
              </div>
              <Progress 
                value={Math.min((analytics.totalPlayTime % (7 * 24 * 3600)) / (2 * 3600) * 100, 100)} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Discovery Goal</span>
                <span className="text-sm text-muted-foreground">
                  {Math.min(analytics.totalTracks, 50)} / 50 tracks
                </span>
              </div>
              <Progress 
                value={Math.min(analytics.totalTracks / 50 * 100, 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};