import {
  BoxComponent,
  inject,
  KeyboardControls,
  LightHalo,
  Presets,
  provideClientGlobalConfig,
  provideClientModules,
  provideLoadMap,
  RpgClientEngine,
  RpgGui,
  Sound,
  TitleScreenComponent,
  
} from "@rpgjs/client";
import Map from "../components/map.ce";
import Shadow from "../components/shadow.ce";
import WoodComponent from "../components/wood.ce";
import WoodUiComponent from "../components/wood-ui.ce";
import VueComponent from "../vue-component-with-injections.vue";
import FadeComponent from "../components/fade.ce";
import PlayerStatsComponent from "../components/player-stats.ce";
import { signal, effect } from 'canvasengine'
import { provideVueGui } from "@rpgjs/vue";
import { provideTiledMap } from "@rpgjs/tiledmap/client";
import { provideMain } from "../modules/main";
import TooltipComponent from "../components/tooltip.ce";
import { RpgClientObject } from "@rpgjs/client";
import { withMobile } from "@rpgjs/client";
import { provideActionBattle } from "@rpgjs/action-battle/client";
import { HudComponent } from "@rpgjs/client";


export default {
  providers: [
    provideLoadMap((id: string) => {
      const colorMap = {
        "center-map": "#1a472a",
        "left-map": "#2d5a7b",
        "right-map": "#7b2d5a",
        "top-map": "#5a7b2d",
        "bottom-map": "#5a2d7b",
        "town": "#3d6b3d",
      }
       return {
          id,
          component: Map,
          width: 640,
          height: 480,
          data: {
            color: colorMap[id] || "#3d6b3d"
          },
          hitboxes: [],
          player: {
            sprite: "stupid-hero"
          },
       }
    }),
    // provideTiledMap({
    //   basePath: "map"
    // }),
    provideVueGui(),
    provideClientGlobalConfig(),
    provideMain(),
    provideActionBattle({
      ui: {
        actionBar: {
          enabled: false,
          autoOpen: false,
          mode: "both" // "items" | "skills" | "both"
        }
      }
    }),
    provideClientModules([
      withMobile(),
      {
        spritesheetResolver: async (id: string) => {
          if (id === "potion" || id == 'wood') {
            return Presets.IconPreset({
              image: `${id}.png`,
              framesWidth: 1,
              framesHeight: 1,
              id,
            })
          }
          // 用户的角色精灵 - characters_v2.png (768x1024, 128x128 per frame)
          if (id === "hero" || id === "stupid-hero") {
            return Presets.LPCSpritesheetPreset({
              id: "stupid-hero",
              imageSource: "characters_v2.png",
              width: 768,
              height: 1024,
              ratio: 1,
            })
          }
          // 用户的 Gulu 角色 - gulu_v2.png (1280x1280, 128x128 per frame)
          if (id === "gulu") {
            return Presets.LPCSpritesheetPreset({
              id: "gulu",
              imageSource: "gulu_v2.png",
              width: 1280,
              height: 1280,
              ratio: 1,
            })
          }
          // 物品精灵 - items_v2.png
          if (id === "items") {
            return Presets.IconPreset({
              image: "items_v2.png",
              framesWidth: 6,
              framesHeight: 1,
              id: "items",
            })
          }
          if (id === "hero") {
            return Presets.LPCSpritesheetPreset({
              id: "hero",
              imageSource: "hero.png",
              width: 1728,
              height: 5568,
              ratio: 1.5,
            })
          }
          else if (id === "monster") {
            return Presets.LPCSpritesheetPreset({
              id: "monster",
              imageSource: "monster.png",
              width: 1728,
              height: 5568,
              ratio: 1.5,
            })
          }
          else if (id === "facesetId") {
            return  Presets.FacesetPreset({
              id: "facesetId",
              image: "faceset.png",
              width: 1024,
              height: 1024,
            }, 3, 4, {
              happy: [0, 0],
              sad: [1, 0],
            })
          }
          return undefined;
        },
        sprite: {
          componentsBehind: [Shadow],
         // componentsInFront: [LightHalo],
          onInit: (sprite) => {
           
          }
        },
        sceneMap: { 
          onBeforeLoading: (scene) => {
            console.log(scene)
            const gui = inject(RpgGui)
            gui.display('fade', {
              fadeIn: false,
              duration: 5000
            })
          },
          onAfterLoading: async (scene) => {
            const gui = inject(RpgGui)
            await new Promise(resolve => setTimeout(resolve, 5000))
            gui.hide('fade')
          },
        },
        sounds: [
          {
            id: "typewriter",
            src: "typewriter.wav",
          },
          {
            id: "cursor",
            src: "cursor.wav",
          },
          {
            id: "bgm",
            src: "music.mp3"
          }
        ],
        spritesheets: [
        
          {
            id: "animation",
            width: 1024,
            height: 1024,
            image: "exp.png",
            ...Presets.AnimationSpritesheetPreset(4, 4),
          }
        ],
        gui: [
          {
            id: "rpg-title-screen",
            component: TitleScreenComponent,
            autoDisplay: true,
            data: {
              title: "智障探险队",
              subtitle: "踏上愚蠢的冒险之旅",
              version: "v1.0.0",
              localActions: true,
              saveLoad: {
                mode: "load",
                slots: [null, null, null]
              },
              entries: [
                { id: "start", label: "开始游戏" },
                { id: "load", label: "继续游戏" },
                { id: "ai-mode", label: "AI 观察模式" }
              ]
            }
          },
          {
            id: "wood-ui",
            component: WoodUiComponent,
            autoDisplay: true,
            dependencies: () => {
              const engine = inject(RpgClientEngine)
              return [engine.scene.currentPlayer]
            }
          },
          VueComponent,
          {
            id: "my-tooltip",
            component: TooltipComponent,
            attachToSprite: true
          },
          {
            id: "fade",
            component: FadeComponent,
          },
          {
            id: "hud",
            component: HudComponent,
            autoDisplay: true,
            dependencies: () => {
              const engine = inject(RpgClientEngine)
              return [engine.scene.currentPlayer]
            },
            data: {
              faceset: {
                id: 'facesetId',
                expression: 'happy'
              }
            }
          }
        ],
        componentAnimations: [
          {
            id: "wood",
            component: WoodComponent,
          },
        ],
      },
    ]),
  ],
};
