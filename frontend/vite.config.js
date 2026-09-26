import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // This forces all packages to use the same React instance
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Explicitly tells Vite how to bundle Leaflet
    include: ['react-leaflet', 'leaflet']
  }
})