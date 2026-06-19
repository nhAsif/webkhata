import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:6540',
      '/uploads': 'http://localhost:6540',
    },
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
})
