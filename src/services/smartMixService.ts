import { Track } from '@/hooks/useMediaLibrary';
import { musicDB, Playlist } from '@/utils/musicDatabase';

export interface SmartMixOptions {
  seedTracks?: Track[];
  genre?: string;
  mood?: 'energetic' | 'chill' | 'focus' | 'workout' | 'sleep';
  duration?: number; // in minutes
  diversity?: 'low' | 'medium' | 'high';
  includeRecentlyPlayed?: boolean;
  excludeSkipped?: boolean;
}

export interface AudioFeatures {
  energy: number; // 0-1
  valence: number; // 0-1 (happiness)
  tempo: number; // BPM
  danceability: number; // 0-1
  acousticness: number; // 0-1
}

export class SmartMixService {
  private audioFeatures = new Map<string, AudioFeatures>();

  async generateSmartMix(options: SmartMixOptions): Promise<Track[]> {
    const allTracks = await musicDB.getAllSongs();
    const tracks = allTracks.map(this.songToTrack);
    
    if (tracks.length === 0) return [];

    // Get seed tracks or select default ones
    const seedTracks = options.seedTracks || await this.getDefaultSeeds(tracks, options);
    
    // Calculate audio features for all tracks
    await this.calculateAudioFeatures(tracks);
    
    // Generate mix based on options
    let candidateTracks = tracks;
    
    // Filter by genre if specified
    if (options.genre) {
      candidateTracks = candidateTracks.filter(track => 
        track.genre?.toLowerCase().includes(options.genre!.toLowerCase())
      );
    }
    
    // Filter based on mood
    if (options.mood) {
      candidateTracks = this.filterByMood(candidateTracks, options.mood);
    }
    
    // Exclude recently played if requested
    if (options.excludeSkipped) {
      candidateTracks = candidateTracks.filter(track => track.playCount > 0);
    }
    
    // Calculate similarity scores
    const scoredTracks = candidateTracks.map(track => ({
      track,
      score: this.calculateSimilarityScore(track, seedTracks, options)
    }));
    
    // Sort by score and apply diversity
    const sortedTracks = scoredTracks
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
    
    // Apply diversity filter
    const diverseTracks = this.applyDiversity(sortedTracks, options.diversity || 'medium');
    
    // Limit by duration if specified
    if (options.duration) {
      return this.limitByDuration(diverseTracks, options.duration);
    }
    
    return diverseTracks.slice(0, 50); // Max 50 tracks
  }

  private async getDefaultSeeds(tracks: Track[], options: SmartMixOptions): Promise<Track[]> {
    // Get recently played tracks as seeds
    const recentTracks = await musicDB.getRecentSongs(5);
    if (recentTracks.length > 0) {
      return recentTracks.map(this.songToTrack).slice(0, 3);
    }
    
    // Fall back to top played tracks
    const topTracks = await musicDB.getTopSongs(5);
    if (topTracks.length > 0) {
      return topTracks.map(this.songToTrack).slice(0, 3);
    }
    
    // Final fallback: random tracks
    return this.getRandomTracks(tracks, 3);
  }

  private getRandomTracks(tracks: Track[], count: number): Track[] {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private async calculateAudioFeatures(tracks: Track[]): Promise<void> {
    for (const track of tracks) {
      if (!this.audioFeatures.has(track.id)) {
        // In a real implementation, this would analyze the audio file
        // For now, we'll generate features based on metadata
        const features = this.generateMockFeatures(track);
        this.audioFeatures.set(track.id, features);
      }
    }
  }

  private generateMockFeatures(track: Track): AudioFeatures {
    // Generate realistic features based on genre and other metadata
    const genre = track.genre?.toLowerCase() || 'unknown';
    
    let baseFeatures: Partial<AudioFeatures> = {};
    
    if (genre.includes('electronic') || genre.includes('edm')) {
      baseFeatures = { energy: 0.8, valence: 0.7, tempo: 128, danceability: 0.9, acousticness: 0.1 };
    } else if (genre.includes('rock') || genre.includes('metal')) {
      baseFeatures = { energy: 0.9, valence: 0.6, tempo: 120, danceability: 0.6, acousticness: 0.2 };
    } else if (genre.includes('classical') || genre.includes('ambient')) {
      baseFeatures = { energy: 0.3, valence: 0.5, tempo: 80, danceability: 0.2, acousticness: 0.8 };
    } else if (genre.includes('jazz') || genre.includes('blues')) {
      baseFeatures = { energy: 0.5, valence: 0.6, tempo: 100, danceability: 0.5, acousticness: 0.6 };
    } else if (genre.includes('pop')) {
      baseFeatures = { energy: 0.7, valence: 0.8, tempo: 120, danceability: 0.8, acousticness: 0.3 };
    } else {
      baseFeatures = { energy: 0.6, valence: 0.6, tempo: 110, danceability: 0.6, acousticness: 0.4 };
    }
    
    // Add some randomness
    const addVariance = (value: number, variance = 0.1) => 
      Math.max(0, Math.min(1, value + (Math.random() - 0.5) * variance * 2));
    
    return {
      energy: addVariance(baseFeatures.energy || 0.6),
      valence: addVariance(baseFeatures.valence || 0.6),
      tempo: (baseFeatures.tempo || 110) + (Math.random() - 0.5) * 20,
      danceability: addVariance(baseFeatures.danceability || 0.6),
      acousticness: addVariance(baseFeatures.acousticness || 0.4)
    };
  }

  private filterByMood(tracks: Track[], mood: string): Track[] {
    return tracks.filter(track => {
      const features = this.audioFeatures.get(track.id);
      if (!features) return true;
      
      switch (mood) {
        case 'energetic':
          return features.energy > 0.6 && features.valence > 0.5;
        case 'chill':
          return features.energy < 0.5 && features.valence > 0.4;
        case 'focus':
          return features.acousticness > 0.5 && features.energy < 0.6;
        case 'workout':
          return features.energy > 0.7 && features.danceability > 0.6;
        case 'sleep':
          return features.energy < 0.3 && features.acousticness > 0.6;
        default:
          return true;
      }
    });
  }

  private calculateSimilarityScore(track: Track, seedTracks: Track[], options: SmartMixOptions): number {
    const features = this.audioFeatures.get(track.id);
    if (!features) return 0;
    
    let totalSimilarity = 0;
    
    for (const seedTrack of seedTracks) {
      const seedFeatures = this.audioFeatures.get(seedTrack.id);
      if (!seedFeatures) continue;
      
      // Calculate feature similarity
      const energySim = 1 - Math.abs(features.energy - seedFeatures.energy);
      const valenceSim = 1 - Math.abs(features.valence - seedFeatures.valence);
      const tempoSim = 1 - Math.abs(features.tempo - seedFeatures.tempo) / 60;
      const danceSim = 1 - Math.abs(features.danceability - seedFeatures.danceability);
      const acousticSim = 1 - Math.abs(features.acousticness - seedFeatures.acousticness);
      
      const similarity = (energySim + valenceSim + tempoSim + danceSim + acousticSim) / 5;
      totalSimilarity += similarity;
    }
    
    let score = totalSimilarity / seedTracks.length;
    
    // Boost score for frequently played tracks
    if (options.includeRecentlyPlayed) {
      score += (track.playCount / 100) * 0.1;
    }
    
    // Add genre matching bonus
    const seedGenres = seedTracks.map(t => t.genre?.toLowerCase()).filter(Boolean);
    if (seedGenres.includes(track.genre?.toLowerCase())) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private applyDiversity(tracks: Track[], diversity: string): Track[] {
    if (diversity === 'low') return tracks;
    
    const diverseTracks: Track[] = [];
    const usedArtists = new Set<string>();
    const usedGenres = new Set<string>();
    
    const diversityThreshold = diversity === 'high' ? 0.3 : 0.5;
    
    for (const track of tracks) {
      const artistCount = [...diverseTracks].filter(t => t.artist === track.artist).length;
      const genreCount = [...diverseTracks].filter(t => t.genre === track.genre).length;
      
      const artistRatio = artistCount / Math.max(1, diverseTracks.length);
      const genreRatio = genreCount / Math.max(1, diverseTracks.length);
      
      if (artistRatio < diversityThreshold && genreRatio < diversityThreshold) {
        diverseTracks.push(track);
      } else if (diverseTracks.length < 20) {
        // Still add tracks if playlist is short
        diverseTracks.push(track);
      }
    }
    
    return diverseTracks;
  }

  private limitByDuration(tracks: Track[], targetMinutes: number): Track[] {
    const targetSeconds = targetMinutes * 60;
    const result: Track[] = [];
    let totalDuration = 0;
    
    for (const track of tracks) {
      if (totalDuration + track.duration <= targetSeconds) {
        result.push(track);
        totalDuration += track.duration;
      } else {
        break;
      }
    }
    
    return result;
  }

  async createSmartPlaylist(name: string, options: SmartMixOptions): Promise<Playlist> {
    const tracks = await this.generateSmartMix(options);
    const trackIds = tracks.map(t => t.id);
    
    const playlist: any = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: this.generatePlaylistDescription(options),
      songs: trackIds,
      createdAt: new Date(),
      color: this.getPlaylistColor(options.mood),
      isSmartPlaylist: true,
      smartMixOptions: options
    };
    
    await musicDB.createPlaylist(playlist);
    return playlist;
  }

  private generatePlaylistDescription(options: SmartMixOptions): string {
    const parts: string[] = [];
    
    if (options.mood) {
      parts.push(`${options.mood} vibes`);
    }
    
    if (options.genre) {
      parts.push(`${options.genre} music`);
    }
    
    if (options.duration) {
      parts.push(`${options.duration} minutes`);
    }
    
    parts.push('smart mix');
    
    return parts.join(' • ');
  }

  private getPlaylistColor(mood?: string): string {
    switch (mood) {
      case 'energetic': return '#FF6B6B';
      case 'chill': return '#4ECDC4';
      case 'focus': return '#45B7D1';
      case 'workout': return '#FFA726';
      case 'sleep': return '#9C27B0';
      default: return '#6C5CE7';
    }
  }

  private songToTrack = (song: any): Track => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    filePath: song.filePath,
    albumArt: song.albumArt,
    playCount: song.playCount,
    lastPlayed: song.lastPlayed,
    size: song.size,
    dateAdded: song.dateAdded,
    genre: song.genre
  });
}

export const smartMixService = new SmartMixService();