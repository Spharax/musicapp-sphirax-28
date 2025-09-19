import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Monitor, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const EnhancedInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installRejected, setInstallRejected] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user previously rejected installation
    const rejected = localStorage.getItem('pwa-install-rejected');
    setInstallRejected(!!rejected);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not rejected before
      if (!rejected && !standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      toast.success('MelodyForge installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('Installing MelodyForge...');
      } else {
        localStorage.setItem('pwa-install-rejected', 'true');
        setInstallRejected(true);
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-rejected', 'true');
    setInstallRejected(true);
  };

  const getDeviceIcon = () => {
    if (isIOS) return Smartphone;
    if (/Android/.test(navigator.userAgent)) return Smartphone;
    return Monitor;
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: 'Install MelodyForge',
        description: 'Add to Home Screen for the best experience',
        steps: [
          'Tap the Share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install'
        ]
      };
    }

    return {
      title: 'Install MelodyForge',
      description: 'Get the app for faster access and offline support',
      steps: [
        'Works offline',
        'Faster loading',
        'Native app experience'
      ]
    };
  };

  if (isStandalone || installRejected || !showPrompt) {
    return null;
  }

  const DeviceIcon = getDeviceIcon();
  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <Card className="glass-card border-primary/20 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DeviceIcon className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{instructions.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {instructions.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="w-6 h-6 -mr-2 -mt-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Benefits/Steps */}
              <div className="flex flex-wrap gap-1 mb-3">
                {instructions.steps.map((step, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {step}
                  </Badge>
                ))}
              </div>

              {/* Install Buttons */}
              <div className="flex gap-2">
                {isIOS ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowDown className="w-3 h-3" />
                    Share → Add to Home Screen
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      disabled={!deferredPrompt}
                      className="proton-button text-xs px-3 py-1 h-8"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Install App
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDismiss}
                      className="text-xs px-3 py-1 h-8"
                    >
                      Not Now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};