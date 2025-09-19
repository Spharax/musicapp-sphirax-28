import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Clock, Music, TrendingUp, Users, Disc, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMediaLibrary, Track } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

interface ListeningStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatsData {
  totalListeningTime: number;
  tracksPlayed: number;
  averageSessionLength: number;
  topArtists: Array<{ name: string; playCount: number; percentage: number }>;
  topGenres: Array<{ name: string; playCount: number; percentage: number }>;
  topTracks: Array<{ track: Track; playCount: number }>;
  dailyStats: Array<{ date: string; minutes: number; tracks: number }>;
  weeklyStats: Array<{ week: string; minutes: number; tracks: number }>;
  monthlyStats: Array<{ month: string; minutes: number; tracks: number }>;
}

export const ListeningStats: React.FC<ListeningStatsProps> = ({
  isOpen,
  onClose
}) => {
  const { audioFiles, getTopTracks } = useMediaLibrary();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, selectedPeriod]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [topTracks, allSongs] = await Promise.all([
        getTopTracks(),
        musicDB.getAllSongs()
      ]);

      // Calculate total listening time
      const totalListeningTime = allSongs.reduce((sum, song) => 
        sum + (song.playCount * song.duration), 0);

      // Calculate tracks played
      const tracksPlayed = allSongs.reduce((sum, song) => sum + song.playCount, 0);

      // Calculate top artists
      const artistStats = new Map<string, number>();
      allSongs.forEach(song => {
        const artist = song.artist || 'Unknown Artist';
        artistStats.set(artist, (artistStats.get(artist) || 0) + song.playCount);
      });

      const topArtists = Array.from(artistStats.entries())
        .map(([name, playCount]) => ({
          name,
          playCount,
          percentage: (playCount / tracksPlayed) * 100
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10);

      // Calculate top genres
      const genreStats = new Map<string, number>();
      allSongs.forEach(song => {
        const genre = song.genre || 'Unknown';
        genreStats.set(genre, (genreStats.get(genre) || 0) + song.playCount);
      });

      const topGenres = Array.from(genreStats.entries())
        .map(([name, playCount]) => ({
          name,
          playCount,
          percentage: (playCount / tracksPlayed) * 100
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 8);

      // Generate daily stats (mock data for demo)
      const dailyStats = generateDailyStats();
      const weeklyStats = generateWeeklyStats();
      const monthlyStats = generateMonthlyStats();

      setStats({
        totalListeningTime,
        tracksPlayed,
        averageSessionLength: totalListeningTime / Math.max(1, tracksPlayed),
        topArtists,
        topGenres,
        topTracks: topTracks.slice(0, 10).map(track => ({
          track,
          playCount: track.playCount
        })),
        dailyStats,
        weeklyStats,
        monthlyStats
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyStats = () => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      stats.push({
        date: format(date, 'MMM dd'),
        minutes: Math.floor(Math.random() * 120) + 30,
        tracks: Math.floor(Math.random() * 50) + 10
      });
    }
    return stats;
  };

  const generateWeeklyStats = () => {
    const stats = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      stats.push({
        week: format(weekStart, 'MMM dd'),
        minutes: Math.floor(Math.random() * 500) + 200,
        tracks: Math.floor(Math.random() * 200) + 50
      });
    }
    return stats;
  };

  const generateMonthlyStats = () => {
    const stats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      stats.push({
        month: format(monthStart, 'MMM yyyy'),
        minutes: Math.floor(Math.random() * 2000) + 800,
        tracks: Math.floor(Math.random() * 800) + 200
      });
    }
    return stats;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getCurrentPeriodStats = () => {
    if (!stats) return [];
    
    switch (selectedPeriod) {
      case 'week':
        return stats.dailyStats;
      case 'month':
        return stats.weeklyStats;
      case 'year':
        return stats.monthlyStats;
      default:
        return stats.dailyStats;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Listening Statistics</h2>
              <p className="text-sm text-muted-foreground">Your music listening insights</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your listening habits...</p>
          </div>
        ) : stats ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">
                      {formatTime(stats.totalListeningTime)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Time</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Music className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">
                      {stats.tracksPlayed.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Tracks Played</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">
                      {formatTime(stats.averageSessionLength)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Session</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">
                      {audioFiles.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Library Size</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Tracks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Most Played Tracks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topTracks.slice(0, 5).map((item, index) => (
                      <div key={item.track.id} className="flex items-center gap-3">
                        <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.track.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {item.track.artist}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {item.playCount} plays
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="artists" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Artists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topArtists.map((artist, index) => (
                      <div key={artist.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{artist.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {artist.playCount} plays
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {artist.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <Progress value={artist.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="genres" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc className="w-5 h-5" />
                    Top Genres
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.topGenres.map((genre, index) => (
                      <div key={genre.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{genre.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {genre.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <Progress value={genre.percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {genre.playCount} plays
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {/* Period Selector */}
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('week')}
                >
                  7 Days
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                >
                  30 Days
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('year')}
                >
                  12 Months
                </Button>
              </div>

              {/* Listening Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Listening Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getCurrentPeriodStats().map((stat, index) => {
                      const maxMinutes = Math.max(...getCurrentPeriodStats().map(s => s.minutes));
                      const percentage = (stat.minutes / maxMinutes) * 100;
                      
                      return (
                        <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {'date' in stat ? stat.date : 'week' in stat ? stat.week : 'month' in stat ? stat.month : ''}
                          </span>
                          <span className="text-muted-foreground">
                            {stat.minutes}m • {stat.tracks} tracks
                          </span>
                        </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <div className="font-medium">Peak Listening Day</div>
                        <div className="text-muted-foreground">
                          You listened to the most music on{' '}
                          {(() => {
                            const peakStat = getCurrentPeriodStats().reduce((max, stat) => 
                              stat.minutes > max.minutes ? stat : max
                            );
                            return 'date' in peakStat ? peakStat.date : 'week' in peakStat ? peakStat.week : 'month' in peakStat ? peakStat.month : '';
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <div className="font-medium">Favorite Artist</div>
                        <div className="text-muted-foreground">
                          {stats.topArtists[0]?.name} makes up{' '}
                          {stats.topArtists[0]?.percentage.toFixed(1)}% of your listening
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div>
                        <div className="font-medium">Library Growth</div>
                        <div className="text-muted-foreground">
                          You have {audioFiles.length} tracks in your library
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No data available</h3>
            <p className="text-muted-foreground">
              Start listening to music to see your statistics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};