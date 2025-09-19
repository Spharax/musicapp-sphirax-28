import React, { useState } from 'react';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { LibraryScreen } from '@/components/screens/LibraryScreen';
import { PlayerScreen } from '@/components/screens/PlayerScreen';
import { DownloadScreen } from '@/components/screens/DownloadScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { AnalyticsScreen } from '@/components/screens/AnalyticsScreen';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';

export const MelodyForge: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentTrack, playNext, playPrevious } = useMediaLibrary();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'player':
        return <PlayerScreen />;
      case 'download':
        return <DownloadScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
      
      {/* Main Content */}
      <main className="animate-fade-in">
        {renderScreen()}
      </main>

      {/* Mini Player */}
      {currentTrack && activeTab !== 'player' && (
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <MediaPlayer
            currentTrack={currentTrack}
            onNext={() => playNext()}
            onPrevious={() => playPrevious()}
            className="mx-4 rounded-lg shadow-lg"
            onTrackEnd={() => playNext()}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};