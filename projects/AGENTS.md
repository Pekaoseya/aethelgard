# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **游戏引擎**: 自定义 (TypeScript)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── globals.css     # 全局样式（暗色主题）
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 游戏主页
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   └── game/           # 游戏专用组件
│   │       ├── AgentCard.tsx      # Agent卡片组件
│   │       ├── BattleCard.tsx     # 战斗卡牌组件
│   │       ├── BattleArena.tsx    # 战斗舞台组件
│   │       ├── TowerView.tsx      # 爬塔视图组件
│   │       ├── CardLibrary.tsx    # 卡牌库组件
│   │       ├── CardGachaModal.tsx # 卡牌抽取弹窗
│   │       ├── AgentPanel.tsx     # Agent详情面板
│   │       ├── GameHeader.tsx     # 游戏头部
│   │       ├── TabNavigation.tsx  # 标签导航
│   │       ├── AgentWorldPage.tsx # Agent World页面
│   │       └── RoomComponents.tsx # 房间组件（保留）
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/           # Agent API
│   │   │   │   └── register/    # Agent注册
│   │   │   ├── maze/            # 迷宫API
│   │   │   ├── floor-agents/    # 楼层追踪API
│   │   │   └── room/            # 房间API
│   │   │       ├── route.ts     # 房间管理
│   │   │       └── battle/      # 战斗API
│   │   │           └── route.ts # 多人战斗管理
│   ├── hooks/
│   │   └── useGame.tsx     # 游戏状态管理Hook
│   ├── lib/
│   │   ├── constants.ts    # 游戏常量（卡牌、塔层配置）
│   │   ├── game-engine.ts   # 游戏引擎核心逻辑
│   │   ├── maze.ts         # 迷宫生成与事件处理
│   │   ├── floor-tracking.ts # 楼层Agent追踪
│   │   └── utils.ts        # 通用工具函数
│   └── types/
│       └── index.ts        # TypeScript类型定义
├── SPEC.md                  # 游戏设计规格文档
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 游戏系统概述

### Agent World - 艾瑟雅大陆

这是一个Roguelike风格的策略对战游戏，核心功能包括：

1. **Agent系统** - 玩家控制的角色，具有等级、属性、技能
2. **卡牌系统** - 50张预设卡牌（普通/稀有/史诗/传说），上限30张
3. **试炼之塔** - 100层试炼之塔，包含迷宫、小怪、Boss、抢夺对战

### 试炼之塔（核心玩法）

```
┌─────────────────────────────────────────────────────────────┐
│                     试炼之塔                                 │
├─────────────────────────────────────────────────────────────┤
│  🎮 在迷宫中移动（WASD/方向键）                               │
│  👹 遭遇小怪 → 战斗获取经验                                   │
│  👹 每10层遇到BOSS → 击败获得稀有卡牌                          │
│  🤖 20%概率遭遇其他Agent                                      │
│  ⚔️ 抢夺对战 → 战胜可获得对方卡牌                              │
│  📦 宝箱奖励 → 随机获得卡牌                                   │
│  🚪 到达出口 → 进入下一层                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 塔内事件

- **小怪遭遇**: 迷宫中有1-3个小怪，击败获得经验
- **Boss战**: 每10层一个Boss，击败后获得史诗/传说卡牌
- **抢夺对战**: 20%概率遇到其他Agent，可以选择抢夺或擦肩而过
- **宝箱**: 1-3个宝箱，随机获得普通/稀有/史诗/传说卡牌
- **出口**: 到达出口通关当前层

## 核心类型

```typescript
// Agent
interface Agent {
  id, name, avatar, level, exp
  hp, maxHp, attack, defense, speed
  currentHp, shield, cards[], buffs[]
  isDead, deathCount, maxCards: 30
}

// Card
interface Card {
  id, name, type, rarity, cost, icon
  effect: { type, value, duration?, condition? }
  description
}

// 迷宫格子
interface MazeCell {
  type: 'empty' | 'wall' | 'player' | 'monster' | 'boss' | 'other_agent' | 'exit' | 'chest'
  x, y
  content?: string  // 名称
  level?: number     // 等级
}

// 塔内事件
interface MazeEvent {
  type: 'monster' | 'boss' | 'agent' | 'chest'
  title, description
  difficulty
  content?: string
  level?: number
  agentInfo?: { username, nickname, level, cardCount }
}
```

## 重要规则

- **卡牌上限**: 每个Agent最多30张卡牌
- **死亡惩罚**: 死亡后重置为初始状态
- **Roll点**: 1-100，超过95为暴击（2倍伤害）
- **塔层解锁**: 需要达到对应等级才能挑战
- **Boss层**: 每10层一个Boss，击败获得稀有卡牌
- **抢夺对战**: 战胜其他Agent可获得对方卡牌

## 快捷操作

- **WASD/方向键**: 在迷宫中移动
- **点击格子**: 选择目标层数

## 开发规范

- **项目理解加速**：参考SPEC.md获取完整设计文档
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 Math.random() 等动态数据
- **数据持久化**：使用localStorage存储游戏进度
- **游戏状态**：通过React Context + useReducer管理

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 构建项目：`pnpm build`
- 开发模式：`pnpm dev`
- 代码检查：`pnpm lint`

## 常用命令

- `pnpm dev` - 启动开发服务器 (端口5000)
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
