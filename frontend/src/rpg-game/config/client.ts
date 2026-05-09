import { provideClientGlobalConfig, provideClientModules, provideRpg, Presets } from "@rpgjs/client";
import { provideTiledMap } from "@rpgjs/tiledmap/client";
import { RpgServerEngine } from "@rpgjs/server";

export default {
    providers: [
        provideClientGlobalConfig(),
        provideTiledMap({
            basePath: '/rpg-game/maps',
        }),
        provideClientModules([
            {
                spritesheets: [
                    {
                        id: 'hero',
                        image: '/sprites/characters_v2.png',
                        ...Presets.RMSpritesheet(3, 4)
                    },
                    {
                        id: 'gulu',
                        image: '/sprites/gulu_v2.png',
                        ...Presets.RMSpritesheet(3, 4)
                    }
                ]
            }
        ]),
        provideRpg(RpgServerEngine),
    ]
};
