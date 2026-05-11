import { defineConfig } from "vite"
import { rpgjs, tiledMapFolderPlugin } from "@rpgjs/vite"

export default defineConfig({
    plugins: [
        tiledMapFolderPlugin({
            sourceFolder: "./src/tiled",
            publicPath: "/map",
            buildOutputPath: "assets/data"
        }),
        ...rpgjs({}),
    ],
    server: {
        port: 5000,
        host: true
    }
})