import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a55083331c2e4cf1bbbe1709e09a477d',
  appName: 'FreshTrack',
  webDir: 'dist',
  server: {
    url: 'https://a5508333-1c2e-4cf1-bbbe-1709e09a477d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#10b981",
      showSpinner: false,
    },
    Camera: {
      presentationStyle: "fullscreen"
    }
  }
};

export default config;
