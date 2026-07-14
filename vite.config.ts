import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Prefer IPv4 for localhost — avoids browser hitting ::1 while Vite listens on 127.0.0.1.
dns.setDefaultResultOrder('ipv4first');

/** Local dev: http://127.0.0.1:5174 (Vite alt port; 3000/3333 often taken on Windows). */
const DEV_HOST = '127.0.0.1';
const DEV_PORT = 5174;
const PREVIEW_PORT = 4173;

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        devOptions: {
          enabled: false,
        },
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
          navigateFallbackDenylist: [/^\/assets\//],
          importScripts: ['/push-sw.js'],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'script' || url.pathname.startsWith('/assets/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'kado-assets',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
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
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('gsap') || id.includes('@gsap')) return 'vendor-gsap';
            if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
          },
        },
      },
    },
    server: {
      host: DEV_HOST,
      port: DEV_PORT,
      strictPort: true,
      open: `http://${DEV_HOST}:${DEV_PORT}/`,
    },
    preview: {
      host: DEV_HOST,
      port: PREVIEW_PORT,
      strictPort: true,
    },
  };
});
