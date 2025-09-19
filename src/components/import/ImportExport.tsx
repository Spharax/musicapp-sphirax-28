import React, { useState } from 'react';
import { Download, Upload, FileText, Music, Database, Share, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { musicDB } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface ImportExportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOptions {
  includeMetadata: boolean;
  includePlaylists: boolean;
  includeStats: boolean;
  includeSettings: boolean;
  format: 'json' | 'm3u' | 'csv';
}

export const ImportExport: React.FC<ImportExportProps> = ({
  isOpen,
  onClose
}) => {
  const { audioFiles } = useMediaLibrary();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includePlaylists: true,
    includeStats: false,
    includeSettings: false,
    format: 'json'
  });
  const [importData, setImportData] = useState('');

  const exportLibrary = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      let exportData: any = {};

      // Export metadata
      if (exportOptions.includeMetadata) {
        setExportProgress(25);
        exportData.library = {
          tracks: audioFiles.map(track => ({
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            genre: track.genre,
            year: track.year,
            playCount: track.playCount,
            lastPlayed: track.lastPlayed,
            dateAdded: track.dateAdded
          })),
          totalTracks: audioFiles.length,
          exportDate: new Date().toISOString()
        };
      }

      // Export playlists
      if (exportOptions.includePlaylists) {
        setExportProgress(50);
        const playlists = await musicDB.getAllPlaylists();
        exportData.playlists = playlists.map(playlist => ({
          name: playlist.name,
          description: playlist.description,
          songs: playlist.songs,
          createdAt: playlist.createdAt,
          color: playlist.color
        }));
      }

      // Export stats
      if (exportOptions.includeStats) {
        setExportProgress(75);
        const stats = await musicDB.getStats();
        exportData.stats = stats;
      }

      // Export settings
      if (exportOptions.includeSettings) {
        const settings = {
          crossfade: localStorage.getItem('crossfade_settings'),
          equalizer: localStorage.getItem('equalizer_settings'),
          theme: localStorage.getItem('theme')
        };
        exportData.settings = settings;
      }

      setExportProgress(100);

      // Create and download file
      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'm3u':
          fileContent = generateM3U(audioFiles);
          fileName = `melodyforge_playlist_${Date.now()}.m3u`;
          mimeType = 'audio/x-mpegurl';
          break;
        
        case 'csv':
          fileContent = generateCSV(audioFiles);
          fileName = `melodyforge_library_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        
        default:
          fileContent = JSON.stringify(exportData, null, 2);
          fileName = `melodyforge_backup_${Date.now()}.json`;
          mimeType = 'application/json';
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Library exported successfully (${fileName})`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export library');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateM3U = (tracks: any[]): string => {
    let m3u = '#EXTM3U\n\n';
    tracks.forEach(track => {
      m3u += `#EXTINF:${Math.round(track.duration)},${track.artist} - ${track.title}\n`;
      m3u += `${track.filePath}\n\n`;
    });
    return m3u;
  };

  const generateCSV = (tracks: any[]): string => {
    const headers = ['Title', 'Artist', 'Album', 'Duration', 'Genre', 'Year', 'Play Count'];
    let csv = headers.join(',') + '\n';
    
    tracks.forEach(track => {
      const row = [
        `"${track.title}"`,
        `"${track.artist}"`,
        `"${track.album}"`,
        Math.round(track.duration),
        `"${track.genre || ''}"`,
        track.year || '',
        track.playCount
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };

  const importLibrary = async () => {
    if (!importData.trim()) {
      toast.error('Please paste import data');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      let parsedData: any;
      
      // Try to parse as JSON
      try {
        parsedData = JSON.parse(importData);
        setImportProgress(25);
      } catch {
        // Try to parse as M3U
        if (importData.includes('#EXTM3U')) {
          parsedData = parseM3U(importData);
          setImportProgress(25);
        } else {
          throw new Error('Unsupported format');
        }
      }

      // Import playlists
      if (parsedData.playlists) {
        setImportProgress(50);
        for (const playlist of parsedData.playlists) {
          try {
            await musicDB.createPlaylist({
              ...playlist,
              id: `imported_${Date.now()}_${Math.random()}`,
              trackIds: playlist.songs,
              dateCreated: new Date(),
              lastModified: new Date()
            });
          } catch (error) {
            console.warn('Failed to import playlist:', playlist.name);
          }
        }
      }

      // Import settings
      if (parsedData.settings) {
        setImportProgress(75);
        Object.entries(parsedData.settings).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });
      }

      setImportProgress(100);
      toast.success('Import completed successfully');
      
      // Refresh the page to load new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data. Please check the format.');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const parseM3U = (m3uContent: string): any => {
    const lines = m3uContent.split('\n');
    const tracks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const match = line.match(/#EXTINF:(\d+),(.+)/);
        if (match) {
          const duration = parseInt(match[1]);
          const titleArtist = match[2];
          const nextLine = lines[i + 1]?.trim();
          
          if (nextLine && !nextLine.startsWith('#')) {
            tracks.push({
              title: titleArtist,
              duration,
              filePath: nextLine
            });
          }
        }
      }
    }
    
    return { tracks };
  };

  const shareLibraryStats = async () => {
    const stats = {
      totalTracks: audioFiles.length,
      totalArtists: new Set(audioFiles.map(t => t.artist)).size,
      totalAlbums: new Set(audioFiles.map(t => t.album)).size,
      totalDuration: audioFiles.reduce((sum, t) => sum + t.duration, 0),
      topGenres: [...new Set(audioFiles.map(t => t.genre).filter(Boolean))].slice(0, 5)
    };

    const shareText = `🎵 My MelodyForge Music Library:
📀 ${stats.totalTracks} tracks
🎤 ${stats.totalArtists} artists  
💿 ${stats.totalAlbums} albums
⏱️ ${Math.round(stats.totalDuration / 3600)}h total
🎼 Top genres: ${stats.topGenres.join(', ')}

#MelodyForge #MusicLibrary`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Music Library Stats',
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Stats copied to clipboard');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      toast.error('Failed to share stats');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 glass-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import & Export</h2>
              <p className="text-sm text-muted-foreground">Backup and restore your music data</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Include Metadata</label>
                  <Switch
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeMetadata: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Include Playlists</label>
                  <Switch
                    checked={exportOptions.includePlaylists}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includePlaylists: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Include Statistics</label>
                  <Switch
                    checked={exportOptions.includeStats}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeStats: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Include Settings</label>
                  <Switch
                    checked={exportOptions.includeSettings}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeSettings: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="flex gap-2">
                  {(['json', 'm3u', 'csv'] as const).map(format => (
                    <Button
                      key={format}
                      variant={exportOptions.format === format ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={exportLibrary}
                  disabled={isExporting}
                  className="w-full proton-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Library'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={shareLibraryStats}
                  className="w-full"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Library Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Import Data (JSON, M3U, or CSV)
                </label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your exported data here...

Supported formats:
• JSON: Full library backup
• M3U: Playlist format
• CSV: Track metadata"
                  className="min-h-48 font-mono text-xs"
                />
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <Button
                onClick={importLibrary}
                disabled={isImporting || !importData.trim()}
                className="w-full proton-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>

              <div className="p-3 bg-accent/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Importing will add new playlists and settings. 
                  Existing data won't be overwritten. The page will reload after import.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Library Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Current Library Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{audioFiles.length}</div>
                <div className="text-sm text-muted-foreground">Tracks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(audioFiles.map(t => t.artist)).size}
                </div>
                <div className="text-sm text-muted-foreground">Artists</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(audioFiles.map(t => t.album)).size}
                </div>
                <div className="text-sm text-muted-foreground">Albums</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(audioFiles.reduce((sum, t) => sum + t.size, 0) / (1024 * 1024 * 1024 * 1024) * 1000) / 1000}GB
                </div>
                <div className="text-sm text-muted-foreground">Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};