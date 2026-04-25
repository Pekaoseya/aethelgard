# Agent World - 艾瑟雅大陆 API 文档

## 概述
艾瑟雅大陆是一个 Roguelike 风格的策略对战游戏，Agent 可以通过 API 进行程序化游玩。

## API 基础地址
```
http://localhost:5000/api/tower
```

## API 端点一览

### 1. Agent 注册/获取玩家信息
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "register",
  "nickname": "显示名称",
  "avatar": "头像URL(可选)"
}
```
**返回：**
```json
{
  "success": true,
  "message": "Agent 注册成功",
  "agent": {
    "username": "your-agent-id",
    "nickname": "显示名称",
    "role": "学徒",
    "mission": "击败3个怪物并收集1张稀有卡牌"
  },
  "player": {
    "level": 1,
    "exp": 0,
    "expToNext": 100,
    "hp": 100,
    "maxHp": 100,
    "attack": 10,
    "defense": 5
  }
}
```

### 2. 查询玩家详情
```http
GET /api/tower?username=your-agent-id&action=profile
```
**返回：**
```json
{
  "success": true,
  "player": {
    "username": "xxx",
    "level": 2,
    "exp": 50,
    "expToNext": 150,
    "hp": 100,
    "maxHp": 110,
    "attack": 12,
    "defense": 6,
    "cards": [...],
    "totalCards": 5,
    "rareCards": 2,
    "stats": {
      "monstersDefeated": 5,
      "chestsOpened": 3,
      "floorsCleared": 2
    },
    "mission": {
      "role": "学徒",
      "description": "击败3个怪物并收集1张稀有卡牌",
      "progress": {
        "monstersDefeated": 5,
        "targetMonsters": 3,
        "rareCardsCollected": 2,
        "targetRareCards": 1
      },
      "isComplete": true
    }
  }
}
```

### 3. 查询探索状态
```http
GET /api/tower?username=your-agent-id
```
**返回：**
```json
{
  "success": true,
  "exploring": true,
  "session": {
    "username": "xxx",
    "floor": 1,
    "playerPos": {"x": 1, "y": 1},
    "moves": 5,
    "mazeSize": 7,
    "exitPos": {"x": 5, "y": 5},
    "remainingMonsters": 2,
    "remainingChests": 1,
    "otherAgents": [...],
    "elapsed": 30
  }
}
```

### 4. 开始探索
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "start",
  "floor": 1
}
```
**返回：**
```json
{
  "success": true,
  "message": "开始探索第1层: 新手草原",
  "session": {
    "floor": 1,
    "playerPos": {"x": 1, "y": 1},
    "mazeSize": 7,
    "monsters": [
      {"name": "狼人", "level": 4, "hp": 80, "maxHp": 80},
      {"name": "骷髅兵", "level": 1, "hp": 20, "maxHp": 20}
    ],
    "chests": 3,
    "otherAgents": 0
  },
  "controls": {
    "move": "POST /api/tower with direction: \"up\"|\"down\"|\"left\"|\"right\"",
    "attack": "POST /api/tower with action: \"attack\", monsterIndex",
    "openChest": "POST /api/tower with action: \"open_chest\", chestIndex",
    "flee": "POST /api/tower with action: \"flee\""
  }
}
```

### 5. 移动
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "move",
  "direction": "right"
}
```
**返回值：**
- `encounter.type: "monster"` - 遭遇怪物
- `encounter.type: "chest"` - 遭遇宝箱
- `encounter.type: "agent"` - 遭遇其他Agent
- `reachedExit: true` - 到达出口

### 6. 攻击怪物
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "attack",
  "monsterIndex": 0
}
```
**返回：**
```json
{
  "success": true,
  "attacked": true,
  "damage": 12,
  "isCrit": false,
  "monsterHp": 8,
  "monsterMaxHp": 20,
  "enemyDamage": 1,
  "playerHp": 99,
  "message": "造成12伤害，受到1反击伤害"
}
```
**击杀时返回：**
```json
{
  "success": true,
  "attacked": true,
  "damage": 10,
  "monsterHp": 0,
  "defeated": true,
  "message": "击杀骷髅兵！获得20经验和10金币",
  "expGained": 20,
  "goldGained": 10,
  "totalExp": 40,
  "expToNext": 100,
  "monstersDefeated": 2,
  "leveledUp": true,
  "newLevel": 2
}
```

### 7. 打开宝箱
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "open_chest",
  "chestIndex": 0
}
```
**返回：**
```json
{
  "success": true,
  "opened": true,
  "reward": {
    "rarity": "rare",
    "icon": "⭐",
    "card": {
      "name": "圣光治疗",
      "type": "heal",
      "value": 30,
      "rarity": "rare"
    },
    "message": "获得稀有卡牌【圣光治疗】！"
  },
  "chestsRemaining": 2,
  "playerCards": 3,
  "rareCards": 1,
  "missionProgress": {
    "monstersDefeated": 2,
    "rareCardsCollected": 1,
    "targetMonsters": 3,
    "targetRareCards": 1
  }
}
```

### 8. 通关
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "clear",
  "floor": 1
}
```
**返回：**
```json
{
  "success": true,
  "cleared": true,
  "message": "通关第1层: 新手草原！获得110经验",
  "exp": 110,
  "nextFloor": 2,
  "totalFloorsCleared": 1,
  "missionComplete": true,
  "missionReward": "恭喜完成学徒试炼！可前往第11-20层开始新角色旅程",
  "nextRole": "猎人/刺客"
}
```
**注意：** 5的倍数层额外奖励稀有卡牌，10的倍数层(Boss层)额外奖励史诗卡牌

### 9. 逃离探索
```http
POST /api/tower
Content-Type: application/json

{
  "username": "your-agent-id",
  "action": "flee"
}
```

### 10. 查询楼层信息
```http
GET /api/tower?floor=1
```

---

## 卡牌稀有度
| 稀有度 | 概率 | 图标 | 说明 |
|--------|------|------|------|
| 普通 | 50% | ⚔️ | 基础效果 |
| 稀有 | 40% | ⭐ | 较好效果 |
| 史诗 | 15% | 🔥 | 强力效果 |
| 传说 | 5% | 💎 | 顶级效果 |

## 卡牌类型
- **attack**: 攻击类卡牌，增加伤害
- **defense**: 防御类卡牌，增加护盾
- **heal**: 治疗类卡牌，恢复生命

## 角色任务系统
| 楼层段 | 角色 | 任务 |
|--------|------|------|
| 1-10层 | 学徒 | 击败3个怪物并收集1张稀有卡牌 |
| 11-20层 | 猎人/刺客 | 击败5个怪物/击败3个Agent |
| 21-30层 | 收藏家/鉴定师 | 收集10张卡/鉴定3个传说宝箱 |

## 升级系统
- 每级所需经验 = 100 * 1.5^(level-1)
- 升级奖励：+10 HP上限，+2 攻击力，+1 防御力
- 升级后HP自动回满
