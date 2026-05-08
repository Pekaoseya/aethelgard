# 智障探险队 - RPG-JS 配置指南

## 快速开始

### 1. 创建游戏入口

```typescript
// src/main.ts
import { createApp } from 'vue'
import { RpgClient, RpgClientSocket } from '@rpgjs/client'
import { RpgModule } from '@rpgjs/framework'
import App from './App.vue'

const client = await RpgClient.create({
    baseUrl: import.meta.env.BASE_URL,
    manifest: import.meta.env.BASE_URL + 'manifest.json',
    workersUrl: '/',
    socket: RpgClientSocket
})

client.start(App)
```

### 2. 定义地图

```typescript
// src/maps/town.ts
import { RpgMap, RpgModule } from '@rpgjs/framework'

@RpgModule<RpgMap>({ 
    register: RpgMap 
})
export class TownMap extends RpgMap {
    onLoad() {
        // 设置地图尺寸
        this.width = 20
        this.height = 15
        
        // 设置背景音乐
        this.sound = '/assets/town-theme.mp3'
    }
}
```

### 3. 定义玩家角色

```typescript
// src/player.ts
import { RpgPlayer } from '@rpgjs/framework'
import { RpgSprite } from '@rpgjs/client'

@RpgSprite()
class PlayerSprite {
    idleAnimation = 'idle'
    walkAnimation = 'walk'
    attackAnimation = 'attack'
}

export const player = {
    name: '勇者',
    description: '拯救世界的勇者',
    hitbox: {
        width: 32,
        height: 32
    },
    sprites: {
        player: PlayerSprite
    },
    startingMap: 'town'
}
```

### 4. 定义 NPC

```typescript
// src/npcs/village-elder.ts
import { RpgNpc, RpgPlugin, RpgListener, RpgMethod } from '@rpgjs/framework'

@RpgNpc()
class VillageElder {
    name = '村长'
    hitbox = {
        width: 32,
        height: 32
    }
    
    @RpgListener('interact')
    onInteract(player) {
        player.gui('MenuGui').open()
    }
}
```

### 5. 定义物品

```typescript
// src/items/health-potion.ts
import { RpgItem, RpgItemType } from '@rpgjs/framework'

@RpgItem({
    name: '生命药水',
    description: '恢复 50 点生命值',
    price: 50,
    type: RpgItemType.CONSUMABLE,
    stackable: true,
    maxStack: 99
})
class HealthPotion {
    onUse(player) {
        player.hp = Math.min(player.hp + 50, player.maxHp)
    }
}
```

### 6. 定义敌人/怪物

```typescript
// src/enemies/slime.ts
import { RpgEnemy, RpgEnemyStrength } from '@rpgjs/framework'

@RpgEnemy({
    name: '史莱姆',
    description: '最弱的怪物',
    exp: 10,
    gold: 5,
    level: 1,
    strength: RpgEnemyStrength.WEAK
})
class Slime {
    hp = 20
    atk = 5
    def = 0
}
```

### 7. 定义技能

```typescript
// src/skills/fireball.ts
import { RpgSkill, RpgSkillAnimation } from '@rpgjs/framework'

@RpgSkill({
    name: '火球术',
    description: '造成 50 点火焰伤害',
    power: 50,
    element: 'fire',
    hitRate: 0.8
})
@RpgSkillAnimation({
    name: 'fire',
    duration: 1000
})
class Fireball {}
```

### 8. 定义 GUI 对话框

```typescript
// src/guis/dialog.ts
import { RpgGui } from '@rpgjs/client'

@RpgGui()
export class DialogGui {
    onOpen() {
        // 显示对话框
    }
    
    onClose() {
        // 关闭对话框
    }
}
```

### 9. 配置游戏设置

```typescript
// src/settings.ts
export default {
    hero: {
        name: '智障勇者',
        speed: 150,  // 移动速度
        levels: [
            { exp: 0 },
            { exp: 100 },
            { exp: 300 }
        ]
    },
    ui: {
        displayUi: true,
        displayMenu: true
    }
}
```

## 地图配置详解

### 瓦片地图 (Tiled)

1. 使用 Tiled Map Editor 创建地图
2. 导出为 JSON 格式
3. 放置瓦片图（tileset）

```typescript
// 使用 Tiled 导出的地图
import mapTiled from './assets/map.json'

@RpgModule<RpgMap>({ 
    register: RpgMap 
})
export class TownMap extends RpgMap {
    onLoad() {
        this.mapJson = mapTiled
    }
}
```

### 地图事件

```typescript
@RpgMap({ 
    register: RpgMap 
})
export class TownMap extends RpgMap {
    onLoad() {
        // 添加 NPC
        this.addEvent('village_elder', {
            x: 5,
            y: 3,
            name: '村长'
        })
        
        // 添加宝箱
        this.addEvent('treasure_box', {
            x: 10,
            y: 8,
            treasure: {
                gold: 100,
                items: ['health_potion']
            }
        })
    }
}
```

## 资源目录结构

```
src/
├── assets/
│   ├── tilesets/       # 瓦片图
│   │   └── town.png
│   ├── characters/     # 角色精灵图
│   │   └── hero.png
│   ├── musics/         # 背景音乐
│   │   └── town-theme.mp3
│   └── sounds/         # 音效
│       └── attack.wav
├── maps/              # 地图定义
│   ├── town.ts
│   ├── dungeon.ts
│   └── forest.ts
├── npcs/              # NPC 定义
├── enemies/          # 敌人定义
├── items/            # 物品定义
├── skills/           # 技能定义
├── gui/              # UI 界面
└── main.ts           # 入口文件
```

## 智障探险队专属配置

### 智障角色 NPC

```typescript
import { RpgNpc, RpgListener } from '@rpgjs/framework'
import { StupidAIReply } from '@/ai/stupid-ai'

@RpgNpc()
export class RepeaterNpc {
    name = '复读姬'
    
    @RpgListener('interact')
    async onInteract(player) {
        const ai = new StupidAIReply('repeater')
        const response = await ai.think({
            context: '玩家正在和我对话',
            personality: '复读姬：总是重复别人的话，或者不断重复同一个词'
        })
        player.speak(response)
    }
}
```

### AI 行为触发

```typescript
@RpgNpc()
export class ChaoticNpc {
    name = '混沌使者'
    
    @RpgListener('onPlayerNear')
    onPlayerNear(player) {
        // AI 决定要做什么
        const action = ai.decideAction({
            context: { playerDistance: 2 },
            emotions: this.emotions,
            memory: this.memory
        })
        
        if (action === 'flee') {
            this.moveRandom()
        } else if (action === 'attack') {
            player.startCombat()
        }
    }
}
```

## 下一步

1. 准备素材（瓦片图、角色精灵图）
2. 使用 Tiled 创建第一张地图
3. 放置玩家起点
4. 添加第一个 NPC
5. 测试对话功能
6. 集成 AI 引擎

## 素材获取

- **瓦片图**: https://itch.io/game-assets/free
- **角色精灵图**: https://opengameart.org
- **音乐音效**: https://freesound.org
