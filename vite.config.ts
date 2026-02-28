import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/app/main.tsx'],
    },
  },
  plugins: [
    react(),
    // Bundle size report written to dist/bundle-stats.html after every build.
    // Open it in a browser after `pnpm build` to inspect chunk sizes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }) as any,
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TradeDash',
        short_name: 'TradeDash',
        description: 'Personal Multi-Chart Crypto Perps Dashboard',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', 'ltn0nharv1-1.tailb8a9a6.ts.net'],
  },
});
