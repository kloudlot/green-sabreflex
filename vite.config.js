import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chunking is left to Vite's automatic splitting, driven by the dynamic
// imports in components/charts/lazy.js. A manualChunks config was tried here
// and made things worse: forcing react/react-dom into a named chunk pulled
// React in alongside recharts, so the entry ended up statically importing the
// "lazy" chunk and index.html preloaded the whole thing.
export default defineConfig({
  plugins: [react()],
})
