import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@components': path.resolve(__dirname, './src/stupid-ai/components'),
      '@stores': path.resolve(__dirname, './src/stupid-ai/stores')
    }
  },
  server: {
    port: 5000,
    host: true
  }
})
