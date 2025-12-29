import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './', // Ensures assets load correctly in the Word Taskpane
  build: {
    outDir: 'dist',
  }
}) // Added the missing closing brace and parenthesis here