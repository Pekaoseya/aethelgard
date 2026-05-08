# 智障探险队 AI 决策引擎 - 开发指南

## 项目概述

`stupid-adventure` 是一个基于 Vue 3 + TypeScript 的 RPG 游戏前端，集成了自研的 AI 决策规则引擎，支持 AI 角色自主行动观察。

## 技术栈

- **前端框架**: Vue 3 + Vite + TypeScript
- **状态管理**: Pinia
- **AI 引擎**: 自研效用驱动决策系统
- **游戏引擎**: RPG-JS (可选)

## 目录结构

```
stupid-adventure/
├── src/
│   ├── ai/                    # AI 决策引擎核心
│   │   ├── types.ts           # 类型定义
│   │   ├── engine.ts          # 主引擎 (三阶段决策)
│   │   ├── memory.ts          # 记忆模块 (50%概率记错)
│   │   ├── emotions.ts        # 情绪模块 (失败累积暴躁值)
│   │   ├── chaos.ts           # 混沌注入机制
│   │   ├── rules.ts           # 规则配置 (战斗/探索/社交)
│   │   ├── controller.ts      # AI 角色控制器
│   │   └── index.ts           # 统一导出
│   ├── components/
│   │   ├── AIDemo.vue         # AI 引擎演示组件
│   │   ├── AIGame.vue         # AI 游戏模式主界面
│   │   ├── AIPanel.vue        # AI 状态面板
│   │   └── DialogueBox.vue    # 对话框组件
│   ├── stores/
│   │   ├── game.ts            # 基础游戏状态管理
│   │   ├── ai-game.ts         # AI 游戏状态管理
│   │   └── stupid-character.ts # 智障角色状态
│   └── App.vue                # 主应用
```

## AI 决策引擎架构

### 三阶段决策流程

1. **可行性过滤器** - 剔除当前无法执行的动作
2. **效用计算** - 加权评分: `Score = (Base × W_situation) + Bias + Noise`
3. **混沌注入** - 根据性格和情绪注入随机性

### 核心模块

#### 1. 记忆模块 (`memory.ts`)

- **记忆模糊化**: 50% 概率记错
- **创伤注册**: 低情绪值触发回避
- **执念系统**: AI 会反复念叨某些事

```typescript
const memory = new MemoryModule(50, chaosLevel);
memory.addMemory('trauma', '上次按了按钮被炸飞', -50);
memory.checkTrauma('按钮'); // 返回创伤信息
```

#### 2. 情绪模块 (`emotions.ts`)

- **连续失败累积**: `frustrated` 和 `angry` 上升
- **情绪级联**: 一个情绪影响其他情绪
- **溢出机制**: 情绪过高触发特殊行为

```typescript
const emotions = new EmotionModule({ decayRate: 0.1 });
emotions.recordFailure(20); // 记录失败，愤怒上升
emotions.getModifier('attack'); // 获取攻击修正
```

#### 3. 混沌注入 (`chaos.ts`)

| 混沌类型 | 效果 |
|---------|------|
| `RANDOM` | 做完全无关的事 |
| `CONTRADICT` | 做相反的事 |
| `IGNORE` | 无视明显提示 |
| `SUPERSTITION` | 迷信行为 |
| `DELAY` | 拖延 |
| `OVERTHINK` | 想太多 |
| `UNDERTHINK` | 不过脑子 |
| `SPAM` | 重复动作 |

#### 4. AI 角色控制器 (`controller.ts`)

管理游戏中的 AI 角色自主行为：
- 定时决策循环
- 动作执行（移动、攻击、拾取等）
- 与游戏环境交互

#### 5. 规则配置 (`rules.ts`)

**战斗规则**:
- `blindConfidence`: 盲目自信，无视等级差
- `friendlyFire`: 30% 友军误伤概率
- `lostWhenFleeing`: 逃跑跑错方向

**探索规则**:
- `scavenger`: 垃圾也拾取
- `triggerHappy`: 手贱必须按按钮
- `chestObsession`: 宝箱强迫症

**社交规则**:
- `sheepEffect`: 羊群效应，跟风做蠢事
- `contrarian`: 杠精，总是反驳
- `parrotMode`: 复读机

### 智障角色配置

```typescript
const characters = [
  {
    id: '复读姬',
    name: '复读姬',
    icon: '🔁',
    traits: ['复读', '健忘'],
    bias_strength: 80,      // 偏差强度
    emotion_volatility: 0.8, // 情绪波动
    irrationality: 0.9,      // 非理性程度
    loyalty: 50
  },
  // ...
];
```

## AI 游戏模式

### 功能特性

1. **实时 AI 观察**
   - 4 个 AI 角色在地图上自主移动
   - 每个角色根据性格做出"符合人设的混沌决策"
   - 可观察 AI 的移动轨迹和决策理由

2. **AI 状态面板**
   - 实时显示每个角色的心情状态
   - 决策日志记录
   - 执念和移动历史

3. **交互功能**
   - 与 AI 角色对话
   - 观察 AI 对话的反应
   - 暂停/加速/减速 AI 行为

4. **控制功能**
   - 暂停 AI 决策
   - 调整 AI 速度 (0.5x - 3x)
   - 查看详细决策日志

### 启动 AI 游戏

1. 打开首页
2. 点击 **AI 观察模式** 按钮
3. 观察 AI 角色的混沌行为
4. 按 WASD 移动，按 E 与相邻角色对话

## 运行和测试

### 启动开发服务器

```bash
cd stupid-adventure
pnpm install
pnpm dev
```

### 访问地址

http://localhost:5000

### 构建生产版本

```bash
pnpm build
```

## 设计文档

完整的设计规范见用户提供的 [AI 决策规则引擎设计文档](./docs/ai-engine-design.md)。

### 核心设计理念

> 我们不追求最优解，而是追求"符合人设的混沌决策"

通过加权效用函数实现，每个行为有基础分，但会受到性格参数和情绪的剧烈干扰。
