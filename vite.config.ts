import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 3000,
    outDir: 'dist',
    emptyOutDir: true,
  },
  base: './', // Electron için kritik: Dosya yolları relative olmalı
})

