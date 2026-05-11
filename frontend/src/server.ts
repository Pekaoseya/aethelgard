import { createServer, provideServerModules, LocalStorageSaveStorageStrategy, provideSaveStorage } from "@rpgjs/server"
import { provideMain } from "./rpg-game/modules/main"
import { provideTiledMap } from "@rpgjs/tiledmap/server"

export default createServer({
    providers: [
        provideMain(),
        provideSaveStorage(new LocalStorageSaveStorageStrategy({ key: "save" })),
        provideServerModules([]),
        provideTiledMap()
    ]
})