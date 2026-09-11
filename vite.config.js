import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting mejorado
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase', '@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', 'react-icons', 'clsx', 'tailwind-merge'],
          'markdown-vendor': ['react-markdown', 'rehype-raw', 'remark-gfm', 'remark-unwrap-images'],
        },
      },
    },
    // Tamaño máximo de chunk para mejor división
    chunkSizeWarningLimit: 1000,
  },
  // Optimizaciones de desarrollo
  server: {
    // Precompilación de dependencias
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  },
  // Compresión de assets
  assetsInlineLimit: 4096,
})
