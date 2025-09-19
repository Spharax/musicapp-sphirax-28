import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c4b7e2eb444a4b7c90a26732f8d0d3a3',
  appName: 'MelodyForge',
  webDir: 'dist',
  server: {
    url: 'https://c4b7e2eb-444a-4b7c-90a2-6732f8d0d3a3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#4B0082",
      androidSplashResourceName: "splash",
      showSpinner: false
    }
  }
};

export default config;