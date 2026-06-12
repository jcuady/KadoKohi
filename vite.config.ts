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
          'icons/favicon.ico',
          'icons/favicon-16x16.png',
          'icons/favicon-32x32.png',
          'icons/favicon-96x96.png',
          'icons/apple-touch-icon.png',
        ],
        manifest: {
          name: 'Kado Kohi — Kado Coffee Marikina',
          short_name: 'KadoKohi',
          description:
            'Best specialty coffee in Marikina — order online, events, booth booking, and Kado Circle loyalty.',
          theme_color: '#9A1F24',
          background_color: '#FAF7F2',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/icon-310x310.png', sizes: '310x310', type: 'image/png' },
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
