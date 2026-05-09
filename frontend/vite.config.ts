import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rpgjs, tiledMapFolderPlugin } from '@rpgjs/vite'
import path from 'path'
import startServer from './src/server'

export default defineConfig({
  plugins: [
    vue(),
    tiledMapFolderPlugin({
      sourceFolder: './src/rpg-game/tiled',
      publicPath: '/rpg-game/maps',
      buildOutputPath: 'assets/data'
    }),
    ...rpgjs({
      server: startServer
    })
  ],
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
