import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // manifest.json existe déjà en statique (frontend/public/manifest.json)
      // avec les meta tags <link rel="manifest"> dans index.html — pas besoin
      // que le plugin en génère un second.
      manifest: false,
      // injectManifest : notre propre service worker (src/sw.ts) gère les
      // événements "push"/"notificationclick", en plus du précaching Workbox.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
