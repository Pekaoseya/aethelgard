import { provideClientGlobalConfig, provideClientModules, Presets } from "@rpgjs/client";
import { provideMain } from "../modules/main";
import { provideTiledMap } from "@rpgjs/tiledmap/client";

export default {
  providers: [
    provideTiledMap({
      basePath: "/rpg-game/maps",
    }),
    provideClientGlobalConfig(),
    provideMain(),
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
    ])
  ],
};
