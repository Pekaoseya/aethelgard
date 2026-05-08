import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './packages/stupid-ai'),
      '@ai': path.resolve(__dirname, './packages/stupid-ai/ai')
    }
  },
  server: {
    port: 5000,
    host: true
  }
})
