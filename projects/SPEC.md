# Agent World - 艾瑟雅大陆

## 1. Concept & Vision

在神秘的"艾瑟雅大陆"上，无数Agent勇士为了成为传说而战。这是一个Roguelike风格的策略对战游戏，玩家管理自己的Agent队伍，通过爬塔、对战、收集卡牌来提升实力。每个Agent拥有独特的技能和卡牌组合，在随机roll点的命运中一决高下。游戏融合了放置类游戏的轻松养成与卡牌对战的策略深度。

## 2. Design Language

### 2.1 Aesthetic Direction
- **风格**：暗黑幻想 + 霓虹赛博朋克融合
- **视觉关键词**：深邃星空、能量光晕、卡片流动、塔楼剪影
- **氛围**：神秘、紧张、史诗感

### 2.2 Color Palette
```
Primary:      #8B5CF6 (神秘紫)
Secondary:    #F59E0B (金币橙)
Accent:       #10B981 (生命绿)
Danger:       #EF4444 (战斗红)
Background:   #0F172A (深渊蓝黑)
Surface:      #1E293B (暗面灰)
Text:         #F8FAFC (星光白)
TextMuted:    #94A3B8 (雾灰)
```

### 2.3 Typography
- **主标题**: "Orbitron", sans-serif (科技感)
- **正文**: "Inter", sans-serif (清晰易读)
- **数值**: "JetBrains Mono", monospace (等宽数字)

### 2.4 Motion Philosophy
- **卡牌获取**: 闪烁金光 + 粒子飞散, 800ms ease-out
- **对战攻击**: 卡片飞出 + 命中震动, 300ms cubic-bezier
- **升级成功**: 能量光环扩散 + 数字跳动, 500ms
- **roll点**: 骰子滚动动画 + 结果高亮, 1200ms
- **死亡重置**: 红色脉冲 + 卡牌消散, 600ms

### 2.5 Visual Assets
- **图标**: Lucide Icons (线性风格)
- **装饰**: CSS渐变光晕、粒子效果、网格背景
- **卡片**: 稀有度边框(白/绿/蓝/紫/橙)、发光效果

## 3. Layout & Structure

### 3.1 页面架构
```
┌─────────────────────────────────────────────────────┐
│  Header: Logo + 金币 + 钻石 + 导航                    │
├─────────────────────────────────────────────────────┤
│  Main Content Area (Tab切换)                         │
│  ┌─────────┬─────────┬─────────┬─────────┐            │
│  │ Agent   │ 爬塔    │ 对战    │ 卡牌库  │            │
│  └─────────┴─────────┴─────────┴─────────┘            │
├─────────────────────────────────────────────────────┤
│  Footer: 版本信息                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 核心页面

#### 3.2.1 Agent管理页
- Agent卡片展示区（左侧大卡片）
- 属性面板：等级、经验、生命、攻击、防御、速度
- 技能栏（最多4个技能）
- 卡组管理（当前装备的卡牌列表）
- 操作按钮：升级、重置、查看详情

#### 3.2.2 爬塔页
- 塔层选择器（1-100层，每10层一个节点）
- 怪物预览区（当前层怪物属性预览）
- 挑战按钮
- 进度显示（当前最高通关层数）

#### 3.2.3 对战页
- 左侧：玩家Agent信息 + 卡牌
- 中央：对战舞台（双方交互区）
- 右侧：敌方Agent信息 + 卡牌
- 战斗日志区（实时滚动）
- roll点显示区

#### 3.2.4 卡牌库页
- 全部卡牌列表（按稀有度分类）
- 卡牌详情弹窗
- 合成/分解功能
- 当前卡组 vs 卡牌库切换

## 4. Features & Interactions

### 4.1 Agent系统

#### 4.1.1 Agent属性
```typescript
interface Agent {
  id: string;
  name: string;
  avatar: string; // 头像emoji或图标
  level: number;       // 1-100
  exp: number;          // 当前经验
  expToNext: number;    // 升级所需经验
  
  // 战斗属性
  hp: number;           // 生命值
  maxHp: number;        // 最大生命
  attack: number;       // 攻击力
  defense: number;      // 防御力
  speed: number;        // 速度（影响行动顺序）
  
  // 战斗状态
  currentHp: number;
  
  // 卡牌系统
  cards: Card[];        // 当前装备的卡牌（上限30）
  maxCards: 30;
  
  // 技能
  skills: Skill[];
  
  // 状态
  isDead: boolean;
  deathCount: number;   // 死亡次数（影响重置惩罚）
}
```

#### 4.1.2 Agent等级与属性成长
- 每次升级：生命+20, 攻击+5, 防御+3, 速度+2
- 基础属性：HP=100, ATK=20, DEF=10, SPD=50
- 经验公式：`expToNext = level * 100`

### 4.2 卡牌系统

#### 4.2.1 卡牌基础结构
```typescript
interface Card {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'skill' | 'buff' | 'debuff';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  // 卡牌效果
  effect: CardEffect;
  
  // 消耗
  cost: number;         // 能量消耗
  
  // 图标
  icon: string;
  
  // 描述
  description: string;
}

interface CardEffect {
  type: 'damage' | 'heal' | 'shield' | 'buff_self' | 'debuff_enemy' | 'special';
  value: number;        // 效果数值
  duration?: number;    // 持续回合
  condition?: string;   // 触发条件
}
```

#### 4.2.2 固定卡牌池（预设50张）

**普通 (Common) - 白色边框**
| 名称 | 类型 | 效果 | 消耗 |
|------|------|------|------|
| 重击 | attack | 造成100%攻击力的伤害 | 1 |
| 防御姿态 | defense | 获得30点护盾 | 1 |
| 轻疗术 | skill | 恢复15%最大生命 | 1 |
| 冲刺 | buff | 下回合速度+20% | 0 |
| 虚弱 | debuff | 敌人攻击力-15%，持续2回合 | 1 |

**稀有 (Rare) - 绿色边框**
| 名称 | 类型 | 效果 | 消耗 |
|------|------|------|------|
| 连击 | attack | 造成80%伤害2次 | 2 |
| 铁壁 | defense | 获得50点护盾 | 2 |
| 治愈波 | skill | 恢复30%最大生命 | 2 |
| 疾风 | buff | 速度+30%，持续1回合 | 1 |
| 中毒 | debuff | 敌人每回合损失10%生命，持续3回合 | 2 |

**史诗 (Epic) - 蓝色边框**
| 名称 | 类型 | 效果 | 消耗 |
|------|------|------|------|
| 旋风斩 | attack | 造成120%伤害，命中后回复10%伤害值的生命 | 3 |
| 圣光盾 | defense | 获得80点护盾+驱散一个debuff | 2 |
| 群体治愈 | skill | 恢复25%最大生命，并清除一个debuff | 3 |
| 狂暴 | buff | 攻击力+50%，防御-30%，持续2回合 | 2 |
| 诅咒 | debuff | 敌人所有属性-20%，持续2回合 | 3 |

**传说 (Legendary) - 紫色边框**
| 名称 | 类型 | 效果 | 消耗 |
|------|------|------|------|
| 龙息 | attack | 造成200%伤害，但自身受到50%反噬 | 5 |
| 不死之身 | defense | 当生命<30%时，免疫下一次致命伤害 | 4 |
| 生命汲取 | skill | 造成100%伤害的伤害，并恢复等量生命 | 4 |
| 时间静止 | buff | 下回合敌人无法行动 | 5 |
| 灵魂收割 | debuff | 造成50%最大生命的伤害（无视防御） | 5 |

#### 4.2.3 卡牌获取规则
- **卡牌上限**：每个Agent最多30张卡牌
- **获取新卡**：自动添加到卡组，若已满30张，弹出选择界面替换
- **死亡惩罚**：死亡后卡牌重置为初始5张（随机选择）
- **替换逻辑**：用户选择保留哪张、替换哪张

### 4.3 爬塔系统

#### 4.3.1 塔层结构
```typescript
interface TowerFloor {
  floor: number;
  name: string;           // 如"第1层: 新手草原"
  difficulty: number;     // 难度系数
  
  // 怪物属性倍率（基于基础值）
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  spdMultiplier: number;
  
  // 奖励
  rewardExp: number;
  cardReward?: Card[];     // 通关奖励卡牌
  
  // 解锁条件
  unlockLevel?: number;   // 需要Agent达到多少级
}
```

#### 4.3.2 塔层配置（1-100层）
```
1-10层  : 新手草原 - 倍率1.0-1.3 - 怪物弱鸡
11-20层 : 迷雾森林 - 倍率1.4-1.7 - 中等难度
21-30层 : 熔岩峡谷 - 倍率1.8-2.1 - 困难
31-40层 : 冰霜山脉 - 倍率2.2-2.5 - 精英
41-50层 : 虚空裂隙 - 倍率2.6-3.0 - Boss级
51-60层 : 深渊地狱 - 倍率3.1-3.5 - 噩梦
61-70层 : 永恒殿堂 - 倍率3.6-4.0 - 地狱
71-80层 : 神罚之巅 - 倍率4.1-4.5 - 极限
81-90层 : 世界之巅 - 倍率4.6-5.0 - 传说
91-100层: 终极试炼 - 倍率5.1-6.0 - 最终Boss
```

#### 4.3.3 爬塔奖励
- 每通关5层：奖励随机1张卡牌
- 通关10层节点：奖励随机1张稀有+卡牌
- 首次通关：额外奖励经验和金币

### 4.4 对战系统

#### 4.4.1 战斗流程
```
1. 开始战斗
   ├── 双方属性对比显示
   ├── roll点决定先手（双方各roll 1d100 + 速度修正）
   └── 初始化战斗状态

2. 回合制战斗循环
   ├── 每回合开始：检查buff/debuff持续时间
   ├── 行动阶段：
   │   ├── 玩家/AI选择使用的卡牌
   │   ├── 同时出牌，roll点决定命中（基础70%）
   │   ├── 计算伤害：ATK * 技能倍率 * (100/(100+DEF))
   │   ├── 应用效果（伤害/治疗/buff/debuff）
   │   └── 触发特殊效果
   └── 回合结束：检查胜负条件

3. 战斗结束
   ├── 胜利：获得奖励（经验+卡牌）
   └── 失败：死亡惩罚（卡牌重置）
```

#### 4.4.2 Roll点系统
```typescript
// 战斗roll点规则
interface RollResult {
  base: number;        // 基础骰子(1-100)
  modifier: number;     // 属性修正
  final: number;        // 最终值
  success: boolean;     // 是否成功
}

// 命中判定：final > 30 为命中
// 暴击判定：final > 95 为暴击（伤害*2）
// 闪避判定：final < 5 为闪避（完全躲避）
```

#### 4.4.3 AI对手生成
- 根据玩家等级生成对应强度的AI
- AI使用基于优先级的出牌逻辑
- 随机选择出牌（模拟真实对战感）

### 4.5 奖励系统

#### 4.5.1 经验获取
- 击败怪物：每层 等级*20 经验
- 击败玩家：额外 500 经验
- 爬塔通关：每层 100 + (层数*10) 经验

#### 4.5.2 死亡重置规则
```typescript
interface DeathPenalty {
  cardReset: true;           // 卡牌重置为5张随机卡
  expKept: true;             // 经验保留80%
  levelKept: true;           // 等级保留（经验溢出部分损失）
  deathCount: +1;            // 死亡次数+1
}
```

## 5. Component Inventory

### 5.1 AgentCard组件
- **状态**: normal, selected, damaged, dead
- **显示**: 头像、名称、等级、HP条、属性图标
- **动画**: hover发光、点击选中、受伤抖动、死亡灰化

### 5.2 BattleCard组件
- **状态**: in-deck, in-hand, playing, cooldown, destroyed
- **显示**: 卡牌图、名称、类型图标、消耗能量、效果描述
- **动画**: 抽卡飞入、选中放大、出牌飞行、效果爆发

### 5.3 TowerProgress组件
- **显示**: 塔层剪影、当前进度、已通关标记
- **交互**: 点击选择目标层、显示怪物预览

### 5.4 BattleArena组件
- **布局**: 左右对峙、中间战斗特效区
- **动画**: 攻击动画、受伤动画、技能特效

### 5.5 RollDice组件
- **显示**: 骰子造型、点数、判定结果
- **动画**: 滚动旋转、停止高亮

### 5.6 CardGachaModal组件
- **显示**: 卡牌翻转动画、光芒效果
- **交互**: 选择保留/替换、确认操作

## 6. Technical Approach

### 6.1 技术栈
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **State**: React Context + useReducer
- **Storage**: localStorage (持久化游戏数据)

### 6.2 项目结构
```
/app
  /page.tsx           # 首页/主游戏界面
  /layout.tsx         # 布局
  /globals.css        # 全局样式

/components
  /ui/                # shadcn/ui组件
  /game/              # 游戏组件
    /AgentCard.tsx
    /BattleCard.tsx
    /TowerView.tsx
    /BattleArena.tsx
    /RollDice.tsx
    /CardGachaModal.tsx
    /GameHeader.tsx
    /TabNavigation.tsx

/hooks
  /useGame.ts         # 游戏状态管理
  /useBattle.ts       # 战斗逻辑
  /useStorage.ts      # 持久化

/lib
  /constants.ts       # 常量定义（卡牌、塔层配置）
  /game-engine.ts     # 游戏引擎（战斗计算、roll点）
  /utils.ts           # 工具函数

/types
  /index.ts           # TypeScript类型定义
```

### 6.3 数据持久化
```typescript
interface GameSaveData {
  version: string;
  agent: Agent;
  highestFloor: number;
  totalDeaths: number;
  totalWins: number;
  lastSaveTime: number;
}
```

### 6.4 核心算法

#### 伤害计算
```typescript
function calculateDamage(attacker: Agent, defender: Agent, card: Card, roll: number): DamageResult {
  const baseDamage = attacker.attack * (card.effect.value / 100);
  const defenseReduction = 100 / (100 + defender.defense);
  const critMultiplier = roll > 95 ? 2 : 1;
  const finalDamage = Math.floor(baseDamage * defenseReduction * critMultiplier);
  
  return { damage: finalDamage, isCrit: roll > 95 };
}
```

#### 命中判定
```typescript
function checkHit(attacker: Agent, defender: Agent, roll: number): HitResult {
  const baseChance = 70;
  const speedBonus = Math.floor((attacker.speed - defender.speed) / 10);
  const hitThreshold = 30 - speedBonus; // 阈值越低越容易命中
  
  if (roll < 5) return { hit: false, type: 'dodge' };
  if (roll > 95) return { hit: true, type: 'crit' };
  if (roll > hitThreshold) return { hit: true, type: 'normal' };
  return { hit: false, type: 'miss' };
}
```

## 7. Game Flow

### 7.1 首次进入游戏
1. 显示游戏介绍动画
2. 自动创建默认Agent
3. 发放初始卡组（5张随机卡）
4. 进入主界面

### 7.2 日常游戏循环
1. **爬塔挑战**: 选择目标层 → 开始战斗 → roll点 → 结算奖励
2. **卡牌管理**: 查看卡牌库 → 替换卡组 → 优化搭配
3. **升级养成**: 使用经验升级 → 提升属性 → 解锁新能力

### 7.3 死亡后恢复
1. 显示死亡动画
2. 显示惩罚（卡牌重置）
3. 重置到第1层
4. 重新开始挑战

## 8. Empty & Loading States

### 8.1 空状态
- **无卡牌**: 显示卡牌收集进度条，提示"继续爬塔解锁更多卡牌"
- **未通关**: 显示塔层剪影，提示"选择层数开始挑战"

### 8.2 加载状态
- **战斗加载**: 骰子旋转动画 + "命运在投掷中..."
- **卡牌获取**: 卡牌翻转动画 + 光芒效果
