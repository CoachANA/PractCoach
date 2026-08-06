import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.practcoach.app',
  appName: 'Pract Coach',
  webDir: 'out',
  server: {
      url: "https://practcoach.com",
      cleartext: false,
    },
};

export default config;