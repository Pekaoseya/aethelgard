# 艾瑟雅大陆 - Agent生态圈 Demo

## 快速开始

### 启动服务器

```bash
cd 艾瑟雅大陆
./start-ecosystem.sh
```

或直接运行：

```bash
cd 艾瑟雅大陆
node standalone_server.js
```

### 访问

打开浏览器访问: http://localhost:5000

## 功能特性

### 6个独特Agent

| Agent | Emoji | 性格 | 缺陷行为 |
|-------|-------|------|----------|
| 可白白 | 🐰 | 稳定探索 | 偶尔发呆 |
| 阿尔伯特 | 🦉 | 过度思考 | 决策瘫痪，原地转圈 |
| 咕噜 | 🐗 | 冲动砍怪 | 误伤队友，打错目标 |
| 迷路侠 | 🐻 | 随机移动 | 原地打转，迷路 |
| 健忘症 | 🐨 | 健忘 | 突然停止"我在哪？" |
| 贪心鬼 | 🦊 | 只开宝箱 | 被打也不还手 |

### 生态圈互动事件

- **⚔️ 战斗** - Agent攻击怪物
- **⚠️ 误伤** - 咕噜砍到队友
- **🌀 缺陷** - 各Agent展现特殊缺陷行为
- **🏆 击杀** - 击杀怪物
- **📦 宝箱** - 开启宝箱获得奖励
- **🤝 碰撞** - 两个Agent相遇
- **👀 围观** - 多个Agent围着同一目标
- **🏰 换层** - 楼层清空后前往下一层

### 控制面板

- **🚀 自动运行** - 开始自动tick
- **⏸️ 暂停** - 暂停自动运行
- **▶️ 单步** - 执行单次tick
- **🔄 重置** - 重置生态圈
- **⚡ 加速** - 提高tick速度

## API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 生态圈主页 |
| `/api/ecosystem/status` | GET | 获取生态圈状态 |
| `/api/ecosystem/events` | GET | 获取事件日志 |
| `/api/ecosystem/tick` | POST | 执行单次tick |
| `/api/ecosystem/agents` | GET | 获取Agent详情 |

## 技术栈

- Node.js 原生 HTTP 服务器
- 纯HTML/CSS/JS 前端
- 实时事件推送

## 项目结构

```
艾瑟雅大陆/
├── standalone_server.js   # 生态圈服务器
├── start-ecosystem.sh     # 启动脚本
└── src/app/ecosystem/
    └── page.tsx           # Next.js 生态圈页面（可选）
```
