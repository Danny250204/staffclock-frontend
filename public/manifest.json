import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'StaffClock',
        short_name: 'StaffClock',
        description: 'Professional attendance tracker with geolocation',
        theme_color: '#1e293b',
        // no icons array – uses default favicon.ico instead
      },
    }),
  ],
});