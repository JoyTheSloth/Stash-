import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

  // Copy space_bg image from brain artifacts to project root as bg.png
  try {
    const src = "C:\\Users\\joyde\\.gemini\\antigravity\\brain\\512f38f7-3eab-4899-8a41-dedc05f100c7\\space_bg_1784282097022.png";
    const dest = path.resolve('./bg.png');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log("Background image copied successfully to bg.png!");
    }
    const searchFile = path.resolve('./spotlight_search.txt');
    if (fs.existsSync(searchFile)) fs.unlinkSync(searchFile);
  } catch (e) {
    console.error("Failed to copy background image or clean up:", e);
  }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: false,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  }
})
