import { 
  provideClientGlobalConfig, 
  provideClientModules, 
  Presets 
} from "@rpgjs/client";
import { provideTiledMap } from "@rpgjs/tiledmap/client";
import { provideMain } from "../modules/main";

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
            ...Presets.RMSpritesheet(4, 4)
          },
          {
            id: 'gulu',
            image: '/sprites/gulu_v2.png',
            ...Presets.RMSpritesheet(4, 4)
          }
        ]
      }
    ])
  ],
};
