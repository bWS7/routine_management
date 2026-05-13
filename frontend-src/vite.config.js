import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        assetFileNames: 'static/[ext]/[name]-[hash][extname]',
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/imagens': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    }
  }
})
