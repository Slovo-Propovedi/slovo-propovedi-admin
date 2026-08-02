import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // plugin-react v6 dropped the automatic dedupe — restore it to avoid
    // duplicate-React / "invalid hook call" errors.
    dedupe: ['react', 'react-dom'],
    alias: {
      app: path.resolve(import.meta.dirname, 'src/app'),
      pages: path.resolve(import.meta.dirname, 'src/pages'),
      widgets: path.resolve(import.meta.dirname, 'src/widgets'),
      features: path.resolve(import.meta.dirname, 'src/features'),
      entities: path.resolve(import.meta.dirname, 'src/entities'),
      shared: path.resolve(import.meta.dirname, 'src/shared'),
    },
  },
})