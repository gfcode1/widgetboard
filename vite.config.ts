import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'WidgetBoard',
        short_name: 'WidgetBoard',
        description: 'Your infinite canvas dashboard with 26 widgets',
        theme_color: '#7c3aed',
        background_color: '#1a1b1e',
        display: 'standalone',
        icons: [
          {
            src: '/widgetboard/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/widgetboard/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ice.*\.somafm\.com\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  base: '/widgetboard/',
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor-react'
          if (id.includes('node_modules/react/') && !id.includes('react-dom')) return 'vendor-react'
          if (
            id.includes('node_modules/@mantine/core') ||
            id.includes('node_modules/@mantine/hooks')
          )
            return 'vendor-mantine'
          if (id.includes('node_modules/@dnd-kit')) return 'vendor-dnd'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/vite-env.d.ts', 'src/types/**', 'src/**/__tests__/**'],
      thresholds: { statements: 30, branches: 20, functions: 25, lines: 30 },
    },
  },
})
