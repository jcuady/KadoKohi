import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'site.webmanifest',
          'android-chrome-192x192.png',
          'android-chrome-512x512.png',
          'icons/favicon.ico',
          'icons/favicon-16x16.png',
          'icons/favicon-32x32.png',
          'icons/favicon-48x48.png',
          'icons/favicon-96x96.png',
          'icons/icon-192x192.png',
          'icons/android-chrome-512x512.png',
          'icons/apple-touch-icon.png',
        ],
        manifest: {
          name: 'Kado Kohi — Kado Coffee Marikina',
          short_name: 'KadoKohi',
          description:
            'Best specialty coffee in Marikina — order online, events, booth booking, and Kado Circle loyalty.',
          theme_color: '#9E181D',
          background_color: '#F1DFBA',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          importScripts: ['/push-sw.js'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'kado-images',
                expiration: {
                  maxEntries: 120,
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        // shadcn-style: `@/` → `src/` (components/ui, lib/utils, etc.)
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      // With --host=0.0.0.0 the browser must connect HMR websocket to localhost explicitly.
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : {
              host: 'localhost',
              port: 3000,
              clientPort: 3000,
            },
    },
  };
});
