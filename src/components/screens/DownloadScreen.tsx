import React, { useState } from 'react';
import { Download, Link, FileAudio, FileVideo, Youtube, Globe, Zap } from 'lucide-react';
import { NeonCard, CardContent, CardHeader, CardTitle } from '@/components/ui/neon-card';
import { NeonButton } from '@/components/ui/neon-button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface DownloadItem {
  id: string;
  title: string;
  url: string;
  format: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

export const DownloadScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: '1',
      title: 'Synthwave Night Drive Mix',
      url: 'https://youtube.com/watch?v=example1',
      format: 'MP3 320kbps',
      progress: 75,
      status: 'downloading',
    },
    {
      id: '2',
      title: 'Cyberpunk City Ambience',
      url: 'https://youtube.com/watch?v=example2',
      format: 'MP4 1080p HEVC',
      progress: 100,
      status: 'completed',
    },
  ]);

  const handleDownload = () => {
    if (!url.trim()) return;
    
    const newDownload: DownloadItem = {
      id: Date.now().toString(),
      title: 'Extracting title...',
      url: url.trim(),
      format: 'MP3 320kbps',
      progress: 0,
      status: 'pending',
    };
    
    setDownloads(prev => [newDownload, ...prev]);
    setUrl('');
  };

  const formatPresets = [
    { label: 'MP3 High Quality', value: 'mp3-320', icon: <FileAudio size={16} /> },
    { label: 'MP3 Standard', value: 'mp3-128', icon: <FileAudio size={16} /> },
    { label: 'MP4 1080p', value: 'mp4-1080', icon: <FileVideo size={16} /> },
    { label: 'MP4 HEVC', value: 'mp4-hevc', icon: <FileVideo size={16} /> },
  ];

  const supportedSites = [
    { name: 'YouTube', icon: <Youtube size={16} />, color: 'text-red-500' },
    { name: 'SoundCloud', icon: <Globe size={16} />, color: 'text-orange-500' },
    { name: 'Vimeo', icon: <Globe size={16} />, color: 'text-blue-500' },
    { name: '1000+ Sites', icon: <Zap size={16} />, color: 'text-primary' },
  ];

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Smart Downloader</h1>
        <p className="text-muted-foreground">Download from YouTube and 1000+ sites</p>
      </div>

      {/* URL Input Section */}
      <div className="px-4 mb-6">
        <NeonCard variant="hero">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="text-primary" size={20} />
              Paste URL Here
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <NeonButton 
                variant="neon" 
                onClick={handleDownload}
                disabled={!url.trim()}
              >
                <Download size={16} className="mr-1" />
                Download
              </NeonButton>
            </div>
            
            {/* Quick Format Selection */}
            <div className="grid grid-cols-2 gap-2">
              {formatPresets.map((preset) => (
                <NeonButton
                  key={preset.value}
                  variant="floating"
                  size="sm"
                  className="justify-start"
                >
                  {preset.icon}
                  <span className="ml-2 text-xs">{preset.label}</span>
                </NeonButton>
              ))}
            </div>
          </CardContent>
        </NeonCard>
      </div>

      {/* Supported Sites */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">SUPPORTED PLATFORMS</h3>
        <div className="flex flex-wrap gap-2">
          {supportedSites.map((site, index) => (
            <Badge key={index} variant="outline" className="bg-card/50">
              <span className={site.color}>{site.icon}</span>
              <span className="ml-1">{site.name}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Downloads Tabs */}
      <div className="px-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/50">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-3">
              {downloads.filter(d => d.status === 'downloading' || d.status === 'pending').map((download) => (
                <NeonCard key={download.id} variant="floating">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                        {download.format.includes('MP4') ? (
                          <FileVideo className="text-primary" size={20} />
                        ) : (
                          <FileAudio className="text-secondary" size={20} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate mb-1">{download.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{download.format}</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{download.progress}% complete</span>
                          <Badge variant={download.status === 'downloading' ? 'default' : 'secondary'}>
                            {download.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </NeonCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-3">
              {downloads.filter(d => d.status === 'completed').map((download) => (
                <NeonCard key={download.id} variant="glow" className="cursor-pointer hover-scale">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                        {download.format.includes('MP4') ? (
                          <FileVideo className="text-secondary" size={20} />
                        ) : (
                          <FileAudio className="text-primary" size={20} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{download.title}</h4>
                        <p className="text-xs text-muted-foreground">{download.format}</p>
                      </div>
                      
                      <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                        ✓ Done
                      </Badge>
                    </div>
                  </CardContent>
                </NeonCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <Download className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Queue is empty</h3>
              <p className="text-muted-foreground mb-4">Queued downloads will appear here</p>
              <NeonButton variant="glow">Add to Queue</NeonButton>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};