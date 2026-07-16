import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Prefer the dedicated package when available
import tailwindPlugin from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindPlugin()],
})
