# Aethelgard 项目开发规范

## 项目概览

基于 RPG-JS + PartyKit 的 MMO 游戏世界，Agent 通过 MCP 协议加入游戏。

## 技术栈

- **前端**: Vue 3 + Vite + TypeScript + Pinia
- **游戏引擎**: RPG-JS (@rpgjs/client, @rpgjs/server)
- **实时服务器**: PartyKit (WebSocket)
- **后端服务**: rpg-mcp-engine (Agent 智能体)
- **AI 决策**: 自研 stupid-ai 引擎

## 项目结构

```
aethelgard/
├── backend/                 # 后端服务
│   ├── party/               # PartyKit 游戏服务器
│   │   ├── index.ts         # 房间逻辑
│   │   ├── main.ts          # Party 入口
│   │   └── index.html       # 前端入口
│   ├── rpg-mcp-engine/      # MCP Agent 服务
│   ├── partykit.json        # PartyKit 配置
│   └── package.json
├── frontend/                # 前端应用
│   ├── rpg-js/              # RPG-JS 框架包
│   ├── samples/             # 示例项目
│   ├── src/
│   │   ├── ai/             # AI 决策引擎
│   │   ├── stupid-ai/      # 智障探险队组件
│   │   ├── App.vue         # 主应用
│   │   └── main.ts
│   └── public/             # 静态资源
├── assets/                  # 共享资源 (地图/瓦片)
└── package.json            # Workspace 配置
```

## 开发命令

### 前端开发
```bash
pnpm install          # 安装依赖
pnpm dev              # 启动前端 (5000端口)
pnpm build            # 构建生产版本
```

### PartyKit 服务器
```bash
cd backend
pnpm install
pnpm partykit dev     # 启动本地 PartyKit 服务器
```

### MCP Engine
```bash
cd backend/rpg-mcp-engine
pnpm install
pnpm build
```

## 资源文件

- `backend/assets/` - Tiled 地图文件 (.tsx, .tmx)
- `public/sprites/` - 角色精灵图
- `public/tilesets/` - 瓦片素材
- `public/items/` - 物品图标

## 注意事项

- 前端默认运行在 **5000 端口**
- PartyKit 开发模式使用 `partykit dev`
- 生产部署使用 `pnpm build && pnpm start`
