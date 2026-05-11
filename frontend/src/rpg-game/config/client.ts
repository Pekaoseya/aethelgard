import { provideClientGlobalConfig, provideClientModules } from "@rpgjs/client"
import { provideMain } from "../modules/main"
import { provideTiledMap } from "@rpgjs/tiledmap/client"

export default {
    providers: [
        provideTiledMap({
            basePath: "/map"
        }),
        provideClientGlobalConfig(),
        provideMain(),
        provideClientModules([
            {
                spritesheets: [
                    {
                        id: "hero",
                        image: "spritesheets/hero.png"
                    },
                    {
                        id: "female",
                        image: "spritesheets/female.png"
                    }
                ]
            }
        ])
    ],
}