import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'firebase-messaging-sw.js',
      registerType: 'autoUpdate', // <-- CHANGE TO autoUpdate
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      },
      manifest: {
        name: 'AUS | Digital Services',
        short_name: 'AUS Services',
        description: 'Service Request and Ticket Management System',
        theme_color: '#0b5299',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }, // manifest is closing here

      // <-- Add devOptions here
      devOptions: {
        enabled: true,
        type: 'classic'
      }
    })
  ],

  // This is your server preview block
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'digitalservices.adityauniversity.in'
    ]
  }
})
