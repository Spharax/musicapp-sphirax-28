import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export class PlatformInteractionService {
  
  initialize(): void {
    if (!Capacitor.isNativePlatform()) return;

    this.setupKeyboardHandling();
    this.setupAppStateHandling();
  }

  private setupKeyboardHandling(): void {
    Keyboard.addListener('keyboardWillShow', (info) => {
      // Adjust layout for keyboard
      document.body.style.transform = `translateY(-${info.keyboardHeight / 4}px)`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      // Reset layout
      document.body.style.transform = 'translateY(0px)';
    });
  }

  private setupAppStateHandling(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.onAppResume();
      } else {
        this.onAppPause();
      }
    });
  }

  private onAppResume(): void {
    // Refresh data, resume playback if needed
    document.dispatchEvent(new CustomEvent('app-resume'));
  }

  private onAppPause(): void {
    // Save state, pause playback
    document.dispatchEvent(new CustomEvent('app-pause'));
  }

  async provideFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      
      const style = type === 'light' ? ImpactStyle.Light :
                   type === 'medium' ? ImpactStyle.Medium :
                   ImpactStyle.Heavy;
      
      await Haptics.impact({ style });
    } catch (error) {
      // Haptics not available, ignore
    }
  }
}

export const platformInteractionService = new PlatformInteractionService();