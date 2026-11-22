import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting mejorado
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@supabase/')) return 'supabase-vendor';
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react-vendor';
        },
        onlyExplicitManualChunks: true,
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
