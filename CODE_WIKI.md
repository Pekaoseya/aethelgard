# Aethelgard 项目 Code Wiki

## 1 项目概述

Aethelgard 是一个基于 RPG-JS 和 PartyKit 构建的 MMO RPG 游戏世界，其核心理念是通过 MCP（Model Context Protocol）协议让 AI Agent 自主加入游戏并与其他玩家或 Agent 互动。项目名称"Aethelgard"源自古英语，意为" noble guardian"（高贵的守护者），体现了游戏世界中角色扮演与智能体协作的核心主题。

这个项目的独特之处在于它不仅是一个传统意义上的网络游戏框架，更是一个 AI Agent 的沙盒实验场。开发者设计了一套"智障探险队"系统，让 AI 角色拥有类似人类的性格缺陷、情绪波动和记忆机制，使游戏体验充满了不可预测性和趣味性。每个 AI Agent 都可能因为"性格缺陷"而做出看似愚蠢但符合其人设的决策，这种设计思路来源于对真实人类行为不确定性的模拟。

从技术架构角度来看，Aethelgard 采用前后端分离的设计模式，前端使用 Vue 3 构建用户界面，游戏逻辑由 RPG-JS 引擎驱动；后端则包含两个主要服务——PartyKit 服务器负责处理实时 WebSocket 通信，rpg-mcp-engine 则是一个功能完备的 MCP 服务器，为 AI Agent 提供游戏状态查询、角色管理、战斗模拟等丰富的能力接口。这种架构使得项目既能满足即时多人游戏的需求，又能为 AI Agent 提供结构化的决策支持接口。

## 2 技术栈详解

### 2.1 前端技术栈

前端部分采用 Vue 3 作为核心框架，这是一个渐进式 JavaScript 框架，以其灵活的组件系统和响应式数据绑定机制著称。项目选择 Vue 3 而非 Vue 2，不仅是因为其更好的 TypeScript 支持和 Composition API，更是因为 Vue 3 的性能提升和更小的打包体积对游戏类应用尤为重要。Vue 3 的响应式系统基于 Proxy 实现，相比 Vue 2 的 Object.defineProperty 在处理深层嵌套对象时更加高效和可靠。

构建工具方面，项目使用 Vite 作为开发服务器和打包工具。Vite 由 Vue 的创始人尤雨溪主导开发，它利用浏览器原生 ES 模块支持实现了极快的冷启动速度，对于需要频繁修改代码的游戏开发场景来说，这种即时反馈机制极大地提升了开发体验。在热更新（HMR）方面，Vite 也做到了模块级别的精确更新，避免了传统 webpack 全量刷新的弊端。

状态管理采用 Pinia，这是 Vue 官方推荐的新一代状态管理库，也是 Vuex 的继任者。Pinia 提供了更简洁的 API 设计、完整的 TypeScript 支持，以及更好的模块化组织方式。在 Aethelgard 项目中，Pinia 被用于管理游戏状态、AI 角色状态、用户界面状态等多个独立的状态域，通过 stores 目录下的模块化组织，实现了状态逻辑与视图逻辑的清晰分离。

游戏引擎层面，项目核心使用 RPG-JS 框架（版本 5.0.0-beta.7），这是一个专为 Web 游戏设计的 JavaScript 游戏引擎。RPG-JS 提供了完整的角色扮演游戏开发能力，包括角色移动、碰撞检测、事件系统、战斗系统等。项目还额外引入了 @rpgjs/tiledmap 模块，使开发者能够直接使用 Tiled 地图编辑器创建的地图文件，大大简化了游戏世界的搭建流程。渲染层面则依赖 Pixi.js（版本 8），这是一个高性能的 2D 图形渲染库，能够在保证视觉效果的同时维持流畅的帧率。

前端资源管理方面，项目配置了 @vueuse/core 工具库，它提供了一系列实用的 Vue Composition API 工具函数，如 useLocalStorage、useDebounceFn、useEventListener 等，这些工具函数能够帮助开发者快速实现常见的前端交互逻辑，避免重复造轮子。

### 2.2 后端技术栈

后端服务分为两个主要部分。首先是 PartyKit 服务器，它是一个基于 Cloudflare Workers 技术构建的实时通信平台，专门用于处理 WebSocket 连接。在 Aethelgard 项目中，PartyKit 承担着游戏房间管理、玩家状态同步、实时事件广播等核心职责。相比传统的 WebSocket 服务器，PartyKit 的优势在于其serverless 架构——开发者无需管理服务器基础设施，只需编写房间逻辑代码，平台会自动处理连接扩容和负载均衡。

partykit.json 配置文件定义了房间的行为模式，包括持久化选项、机器人脚本、CORS 设置等。PartyKit 的开发模式使用 `partykit dev` 命令启动，它会在本地模拟 Cloudflare Workers 运行环境，使开发者能够在本地完成全部调试工作后再部署上线。

第二部分是 rpg-mcp-engine，这是项目最复杂的模块之一，充当 MCP 服务器的角色。MCP（Model Context Protocol）是一种新兴的 AI Agent 通信协议，它定义了 AI 与外部工具交互的标准接口。rpg-mcp-engine 的核心职责是将游戏世界的各种能力抽象为工具（Tools），供 AI Agent 调用。这些工具涵盖了角色管理、战斗系统、世界探索、物品管理、NPC 交互等游戏的方方面面。

rpg-mcp-engine 采用 TypeScript 开发，充分利用了其类型系统和模块化组织能力。服务器入口位于 src/index.ts，它初始化 MCP 服务器并注册所有工具。src/server/ 目录下包含了服务器的核心实现，其中 consolidated/ 子目录包含 28 个核心工具的实现，每个工具都对应游戏的一个功能域。这种设计使得代码组织清晰，同时也便于后续扩展新功能。

数据库层面，项目使用 SQLite 作为数据存储方案，这是一个轻量级但功能完备的关系数据库。SQLite 的优势在于其零配置特性和文件级存储能力，非常适合这种需要持久化但规模不算巨大的游戏项目。src/storage/ 目录下的代码负责数据库的初始化、迁移和数据访问层的实现。

### 2.3 AI 决策系统

项目最具特色的部分当属前端 src/ai/ 目录下的 AI 决策引擎。这是一个模仿人类决策过程的系统，由多个协同工作的模块组成。

AIDecisionEngine 是决策引擎的核心类，它实现了三阶段决策流程：可行性过滤、效用计算和混沌注入。在可行性过滤阶段，系统根据当前感知数据剔除无法执行的动作（如缺少必要物品、目标距离过远、角色处于瘫痪状态等）。效用计算阶段则综合考虑基础分数、情境权重、性格偏差、情绪影响、记忆影响等多个维度，为每个可行动作计算一个综合得分。最后的混沌注入阶段根据角色的"混沌度"随机替换动作为更荒谬的选择，模拟人类决策中的"犯傻"行为。

情绪系统（EmotionModule）追踪角色的四种核心情绪：兴奋度、挫折感、恐惧感和愤怒值。这些情绪值会随时间衰减，同时也会被成功或失败的事件所影响。情绪状态不仅影响决策得分，还会触发不同的行为模式——例如高度恐惧的角色会更倾向于逃跑或躲藏，高度愤怒的角色则更可能发起攻击。

记忆系统（MemoryModule）采用有限容量的记忆存储策略。当记忆条目超过容量上限时，系统会按一定概率"遗忘"旧记忆，但这个遗忘过程并非完全随机——情绪影响越强烈的事件越难被遗忘。同时，系统还维护着"执念"（Obsessions）和"创伤"（Traumas）两个特殊记忆类别，前者会导致角色反复提及某些话题，后者则会导致角色回避特定情境。

混沌系统（ChaosModule）是整个决策引擎中最能体现"智障"特质的模块。它定义了一个基础混沌等级，并在此基础上根据情绪状态进行动态调整。混沌效果包括随机动作替换（将原本打算执行的动作替换为随机选择的其他动作）、目标偏移（将动作指向错误的目标）、执行延迟（在做出决策后延迟执行，期间可能被其他事件打断）等。

## 3 项目结构分析

### 3.1 前端目录结构

frontend/src/ 目录下包含了前端应用的全部源代码。main.ts 作为应用入口点，负责创建 Vue 应用实例并挂载到 DOM 元素上。这个文件极其简洁，仅包含三行代码——创建 App 实例、注册 Pinia 插件、执行挂载操作。这种设计体现了 Vue 3 的渐进式理念，框架核心只提供最基本的功能，复杂特性通过插件系统按需引入。

App.vue 是应用的主组件，它定义了两个视图状态：菜单界面（menu-screen）和游戏界面（rpg-game）。当用户点击"开始游戏"按钮时，应用会切换到 RPG 游戏界面，通过 iframe 加载独立的 RPG-JS 游戏模块。这种设计使得主应用和游戏引擎保持了松耦合关系，主应用可以专注于 UI 交互和状态管理，而游戏引擎则在独立的上下文中运行。

rpg-game/ 目录是 RPG-JS 游戏引擎的宿主。它包含 config/client.ts 配置文件，定义了游戏的资源路径、精灵图配置等元数据。modules/main/ 目录则包含游戏的主模块定义，包括服务器端逻辑（server.ts）和事件处理（events/ 目录）。events/ 目录下为每个 NPC 定义了独立的事件处理器，如 VillageElderEvent（村长事件）、GuardCaptainEvent（卫队长事件）、MerchantEvent（商人事件），每个事件都包含对话内容、交互行为和触发条件。

stupid-ai/ 目录包含面向玩家的 AI 演示界面。这是一个独立的 Vue 子应用，包含组件（components/）、服务（services/）和状态管理（stores/）三个子目录。components/ 中的 AIDemo.vue、AIGame.vue、AIPanel.vue 等组件提供了可视化的 AI 行为演示界面，玩家可以在这个界面上观察 AI 角色的决策过程、情绪变化和记忆状态。

ai/ 目录是前端 AI 决策引擎的核心代码库，包含了前文所述的决策引擎、情绪系统、记忆系统、混沌系统等全部实现。这个目录的代码是纯 TypeScript 编写，不依赖 Vue 或任何 UI 框架，可以被其他项目独立引用。

### 3.2 后端目录结构

backend/ 目录下包含 PartyKit 服务器和 rpg-mcp-engine 两个主要服务。party/ 目录是 PartyKit 服务器的实现，main.ts 定义了房间的主类 RPGServer，index.ts 是房间的入口文件。这种分离设计使得 PartyKit 的核心逻辑（main.ts）和环境配置（index.ts）保持独立，便于在不同环境下复用相同的游戏逻辑。

rpg-mcp-engine/ 是项目的核心服务模块，其结构如下：

src/agents/ 目录定义了不同类型的 AI Agent 实现，包括复读姬（RepeaterAgent）、预言家（ProphetAgent）、圣人（SaintAgent）、杠精（HallucinatorAgent）等角色类型。每个 Agent 都继承自 BaseAgent 基类，通过覆写 processInput 方法实现独特的对话策略。agents/prompts/ 目录包含各角色的系统提示词模板，这些提示词定义了角色的性格特点、说话风格和典型行为模式。

src/engine/ 目录是游戏引擎的核心实现，包含多个功能子系统。combat/ 子目录实现了 D&D 5e 风格的战斗系统，包括先攻判定（initiative）、攻击检定（attack roll）、伤害计算（damage calculation）、状态效果（conditions）等完整功能。spatial/ 子目录实现了空间系统，包括战场网格（combat-grid）、寻路算法（pathfinding）、视野判定（line of sight）等。dsl/ 子目录包含领域特定语言引擎，用于解析和执行游戏脚本。

src/server/ 目录实现了 MCP 服务器端点。consolidated/ 子目录包含 28 个核心工具的完整实现，每个工具对应一个功能域：character-manage 处理角色创建、属性修改、技能管理等；combat-manage 处理战斗初始化、回合推进、战斗结算等；world-manage 处理世界状态、天气系统、昼夜循环等。这些工具通过 action-based routing 模式设计，支持模糊匹配和引导式错误提示，降低了 AI Agent 的使用门槛。

src/storage/ 目录实现了数据持久化层。repos/ 子目录为每个数据实体提供了仓储（Repository）模式实现，包括角色仓储、世界仓储、物品仓储、NPC 仓储等。migrations.ts 负责数据库迁移管理，确保数据结构升级时能够平滑过渡。

src/schema/ 目录定义了游戏数据的数据结构和验证规则。每个模式文件（如 character.ts、world.ts、encounter.ts）使用 TypeScript 类型和 Zod 模式定义数据结构，并通过导出函数提供模式验证能力。这种设计确保了数据在应用层和存储层之间传输时的完整性和一致性。

## 4 核心模块职责

### 4.1 前端核心模块

Vue 应用主模块负责应用的整体状态管理和视图路由。App.vue 作为根组件，维护着 currentView 这个响应式状态变量，它控制着当前显示的是菜单界面还是游戏界面。组件还处理了一些全局性的样式和布局定义，为子组件提供了一致的视觉基础。这种单一状态变量驱动的视图切换机制简单而有效，避免了引入完整的 Vue Router 库来管理只有两个页面的应用。

RPG-JS 游戏引擎模块负责渲染游戏世界和处理核心游戏逻辑。client.ts 配置文件中定义了精灵图资源路径和精灵表预设（Presets.RMSpritesheet），这些预设描述了角色在不同方向行走时的动画帧布局。游戏地图使用 Tiled 编辑器创建，导出的 .tmx 和 .tsx 文件存放在 public/rpg-game/maps/ 目录下，RPG-JS 引擎会在运行时解析这些文件并生成可交互的游戏地图。

事件系统是 RPG-JS 的核心特性之一。项目在 modules/main/events/ 目录下为每个 NPC 定义了独立的事件脚本。每个事件包含触发条件（onInit、onAction、onCollide 等）、对话内容、交互动作和分支逻辑。当玩家与 NPC 交互时，对话系统会按照预设的顺序或随机选择展示对话内容，支持简单的条件分支（如检查玩家背包中是否持有某物品）来改变对话走向。

AI 控制器模块（AICharacterController）桥接了 AI 决策引擎和游戏世界。它维护着一组受控 AI 角色的状态，包括位置、当前动作、情绪状态等。控制器以固定间隔（默认 3 秒）调用 AI 决策引擎获取动作决策，然后将决策结果转换为游戏世界的实际行为。这个设计模式清晰地分离了"思考"（AI 决策引擎）和"行动"（游戏世界交互）两个职责，便于独立测试和优化各部分逻辑。

### 4.2 后端核心模块

MCP 服务器模块是后端服务的核心入口点。它使用 @modelcontextprotocol/sdk 库提供的框架来构建符合 MCP 协议的服务端点。服务器初始化时会注册所有工具处理器（通过 consolidated-registry.ts 动态加载），并根据命令行参数选择传输层实现（stdio、TCP、Unix Socket 或 WebSocket）。这种多传输层设计使得 rpg-mcp-engine 可以灵活部署在不同环境中——本地开发使用 stdio 模式连接 Claude Desktop，生产环境则使用 TCP 或 WebSocket 模式提供网络服务。

战斗引擎模块（CombatEngine）是处理实时战斗逻辑的核心类。它实现了完整的 D&D 5e 战斗流程：先攻判定阶段为每个参与者投掷 d20 并加上先攻加值，生成排序后的行动顺序；行动阶段按顺序执行各参与者的动作，包括攻击、治疗、特殊能力使用等；状态效果阶段处理持续性效果的触发和移除；回合结束阶段结算死亡豁免和保存检定。引擎还支持传奇动作（Legendary Actions）和传奇抗性（Legendary Resistances）等高级特性，这些是 D&D 5e 中用于提升 Boss 战斗挑战度的特殊机制。

空间引擎模块（SpatialEngine）处理战斗中的位置相关计算。它维护着一个网格化的战斗地图，支持以下核心功能：网格查询（给定坐标获取相邻格子信息）、视野判定（基于 A* 算法计算两点间是否有障碍物阻挡）、寻路导航（计算从起点到终点的最优路径）、覆盖判定（判断一个位置相对于掩体是否提供掩护等级）。这些功能为战术性战斗提供了基础设施，使战斗不仅仅是对数值的比较，更涉及位置选择和战术布局。

数据模式层为整个应用提供了数据结构和验证规则。所有模式定义都遵循 Zod 库的 Schema 规范，这使得数据验证可以在多个层面进行——客户端 TypeScript 类型检查、服务器端数据验证、数据库存储前验证。模式文件还包含了数据示例和文档注释，这些信息可以被 MCP 服务器的工具元数据系统利用，为 AI Agent 提供更精确的使用指导。

## 5 关键类与函数详解

### 5.1 前端关键类

AIDecisionEngine 类是前端 AI 决策系统的中枢。其构造函数接收性格配置（PersonalityConfig）和引擎配置（EngineConfig）两个参数，前者定义了角色的性格参数如自信度、好奇心、贪婪度、忠诚度，后者配置了混沌等级、调试开关、记忆容量等引擎参数。decide 方法是类的核心，它接收感知数据（PerceptionData）和可用动作列表，返回最终选定的动作及其推理过程。这个方法的三阶段设计（过滤、评分、混沌注入）体现了决策系统的分层架构。

EmotionModule 类管理角色的情绪状态。它维护着四种核心情绪值的数组（excitement、frustration、fear、anger），这些值都在 0-100 范围内。tick 方法在每次调用时按配置的衰减率降低所有情绪值，模拟情绪的自然消退。getMoodDescription 方法根据当前情绪组合返回一个描述性的心情标签，如"自信且兴奋"、"恐惧但平静"等。这个标签被 AI 决策引擎用于选择适当的动作策略。

MemoryModule 类实现了一个容量受限的记忆存储系统。addMemory 方法向记忆列表追加新条目，并在超出容量时执行遗忘逻辑。遗忘不是简单的 FIFO（先进先出），而是按情绪影响权重随机选择遗忘条目——情绪影响越强烈的事件被遗忘的概率越低。getSummary 方法返回记忆库的统计摘要，包括总条目数、各类型记忆分布、最近重要记忆等。这个摘要信息可以被 AI 用于决策参考。

AICharacterController 类是游戏世界与 AI 决策引擎之间的桥梁。它维护着所有受控 AI 角色的状态映射，并提供注册、注销、查询等管理接口。tick 方法在固定间隔被调用，它遍历所有受控角色，为每个角色执行完整的感知-决策-行动循环。setActionCallback 方法允许外部注册动作回调，使得游戏世界能够响应 AI 的动作决策。

### 5.2 后端关键类

CombatEngine 类封装了完整的战斗模拟逻辑。startEncounter 方法初始化一场战斗，它接收参与者列表，为每个人投掷先攻值，按先攻排序构建行动顺序，处理传奇动作和巢穴动作的特殊插入。nextTurnWithConditions 方法推进战斗回合，它先处理当前参与者的回合结束效果（如触发伤害、结束持续效果），然后推进到下一个存活参与者，最后处理新参与者的回合开始效果。这个方法还包含自动跳过死亡参与者的逻辑，确保战斗流程顺畅。

CombatActionResult 接口定义了战斗动作的执行结果结构。每个结果包含动作类型（攻击、治疗、伤害等）、执行者信息、目标信息、详细的数学计算过程和可读的消息描述。这种透明化的设计使得战斗过程可以被完整记录和回放，对于调试和审计都非常有价值。

SpatialEngine 类提供了空间计算的基础工具。calculateLineOfSight 方法使用 Bresenham 算法计算两点间的视线是否被障碍物阻挡，这对于判断远程攻击是否可行、地形是否提供掩护等场景至关重要。findPath 方法使用 A* 算法计算最短路径，考虑了困难地形（加倍移动消耗）和不可通行区域的影响。这些算法都经过优化，能够在大型网格地图上高效运行。

BaseAgent 类是所有 AI Agent 类型的基类。它封装了 Agent 的通用功能：记忆管理（addMemory、getRecentMemory）、状态追踪（unhealthyStatuses）、系统提示构建（buildSystemPrompt）。子类通过覆写 processInput 方法实现各自的对话策略，同时可以继承基类提供的记忆和状态管理能力。这种继承结构既保证了代码复用，又为每个 Agent 类型提供了定制化的空间。

### 5.3 核心函数签名

AIDecisionEngine.decide(perception: PerceptionData, availableActions: Action[]): Action & { reasoning: string; emotionalState: string }

这个方法接收 AI 的当前感知数据和所有可用动作，返回最终选定的动作及决策过程。返回值包含三个部分：选定的动作本身、推理过程描述（reasoning）、当前情绪状态描述（emotionalState）。这种结构使得 AI 的决策过程完全透明，便于人类理解和调试。

AICharacterController.registerCharacter(id: string, name: string, emoji: string, position: Position, personality: PersonalityConfig): AIControlledNPC

这个方法将一个新的 AI 角色注册到控制器中。它创建 AIDecisionEngine 实例，初始化角色状态，并返回创建的 NPC 对象。注册后的角色会被纳入控制器的决策循环中，在每个 tick 周期都会收到动作决策请求。

CombatEngine.executeAttack(actorId: string, targetId: string, attackBonus: number, dc: number, damage: number | string, damageType?: string): CombatActionResult

这个方法执行一次完整的攻击动作。它依次进行：投掷攻击骰（d20 + attackBonus 与 DC 比较）、处理暴击和失手、计算伤害（考虑抗性、易伤、免疫）、应用伤害到目标生命值、返回详细的执行结果。结果中包含完整的数学计算过程，可用于前端渲染攻击动画和数值显示。

SpatialEngine.calculateLineOfSight(from: Position, to: Position, obstacles: Set<string>): boolean

这个方法判断从起点到终点是否存在不受阻挡的视线。它使用 Bresenham 算法遍历两点间的网格，检查每个格子是否在障碍物集合中。如果路径上的任何格子都被标记为障碍，视线即为受阻。这个方法是实现远程攻击、地形掩护、潜行判定等功能的基础。

## 6 依赖关系图谱

### 6.1 项目级依赖

根目录的 package.json 定义了 pnpm workspace 配置，将 backend 和 frontend 两个子项目纳入统一管理。根级的唯一 devDependency 是 rolldown（版本 1.0.0-rc.18），这是一个用 Rust 编写的 JavaScript 打包器，未来可能用于替代现有的打包方案提升构建性能。workspace 的 scripts 配置了两条命令：dev 用于启动前端开发服务器，build 用于构建前端生产版本。

### 6.2 前端依赖

@rpgjs/client 和 @rpgjs/server 提供了 RPG 游戏引擎的核心 API，包括场景管理、角色控制、事件系统等。@rpgjs/tiledmap 模块扩展了对 Tiled 地图格式的原生支持，使开发者能够直接加载 .tmx 文件而无需手动解析。@rpgjs/ui-css 提供了游戏内置的 UI 组件样式，如对话框、菜单、对话框等。

canvasengine、@canvasengine/presets、@canvasengine/tiled 是 RPG-JS 的底层渲染依赖，它们封装了 Pixi.js 的高级特性，提供了更友好的游戏开发 API。Pixi.js 直接作为依赖引入，为应用提供了高性能的 2D 渲染能力。

@signe/di（依赖注入框架）、@signe/room（房间状态同步）、@signe/sync（数据同步工具）是一套来自 Signe 团队的工具库，它们为游戏提供了状态同步和模块解耦的能力，使得前端代码能够以更模块化的方式组织。

### 6.3 后端依赖

rpg-mcp-engine 的 package.json 中，核心依赖包括 @modelcontextprotocol/sdk（提供 MCP 协议的实现框架）、better-sqlite3（SQLite 数据库驱动，提供同步 API 更适合 Node.js 环境）、zod（数据验证库）、uuid（唯一标识生成）。开发依赖包括 TypeScript、tsx（TypeScript 执行环境）、vitest（测试框架）等。

partykit 服务器的 package.json 相对简单，仅依赖 partykit（服务器运行时）和 partysocket（WebSocket 客户端库）。这种轻量级的依赖配置体现了 PartyKit 的设计理念——将复杂的基础设施托管给平台，开发者只需关注业务逻辑。

### 6.4 模块间依赖

frontend/src/ai/ 目录下的 AI 决策引擎是一个自包含的模块，它不依赖 Vue、RPG-JS 或其他前端库，可以被独立测试和使用。这种设计使得决策引擎的核心逻辑可以被复用——既可以在浏览器环境中运行，也可以在 Node.js 环境中运行（如服务端 AI 验证）。

frontend 与 backend 之间的通信通过 PartyKit 的 WebSocket 实现。当玩家在前端执行动作时，数据通过 WebSocket 发送到 PartyKit 服务器，服务器处理后广播更新给所有连接的客户端。这种架构确保了状态的实时同步，同时避免了轮询带来的性能开销。

rpg-mcp-engine 与前端 AI 引擎之间存在数据格式的对应关系。MCP 服务器的 schema 层定义了 AI 与游戏交互的数据结构，这些结构与前端 AI 引擎的感知数据结构（PerceptionData）高度对应，确保了两端在数据交换时的一致性。

## 7 项目运行指南

### 7.1 环境准备

在开始运行项目之前，需要确保开发环境满足以下要求：Node.js 版本需要 18.0 或更高版本，因为项目使用了部分 ES2022+ 语法特性；pnpm 作为包管理器，需要通过 npm install -g pnpm 全局安装；TypeScript 知识是理解代码的基础，建议阅读官方文档了解基本概念。

项目需要准备两个独立的终端会话：一个用于前端开发服务器，一个用于后端 PartyKit 服务器（如果需要在本地测试完整功能的话）。

### 7.2 安装依赖

在项目根目录执行 pnpm install 命令，pnpm 会自动安装根目录及所有 workspace 子项目的依赖。由于项目使用了 pnpm workspace 特性，所有依赖都会被提升到根目录的 node_modules 中，实现跨子项目的依赖共享。这种配置既节省了磁盘空间，又加快了安装速度。

安装过程可能需要几分钟时间，取决于网络连接速度。如果遇到安装失败的情况，可以尝试清除缓存后重试：pnpm store prune && pnpm install。

### 7.3 启动前端开发服务器

执行 pnpm dev 命令启动前端开发服务器。Vite 会在 5000 端口启动开发服务器，并在终端显示访问地址。通常访问地址为 http://localhost:5000，打开浏览器访问即可看到游戏的主菜单界面。

开发模式下，Vite 会对源代码进行即时编译，任何文件修改都会触发热更新，无需手动刷新页面。如果修改了 TypeScript 类型定义，可能需要手动重启开发服务器以清除缓存。

### 7.4 启动 PartyKit 服务器

PartyKit 服务器用于处理游戏的实时多人交互功能。在本地开发时，需要确保已经安装了 PartyKit CLI（如果尚未安装，执行 npm install -g partykit）。然后进入 backend 目录，执行 pnpm partykit dev 命令启动 PartyKit 开发服务器。

开发服务器启动后会监听本地端口，默认情况下会模拟 Cloudflare Workers 的运行环境。连接到同一个"房间"的客户端会通过 WebSocket 进行实时状态同步，这种同步是事件驱动的——只有当房间状态发生变化时，才会向客户端推送更新。

需要注意的是，PartyKit 的本地开发模式与生产环境存在一些差异。例如，某些 Cloudflare Workers 特有的 API（如 Durable Objects）在本地环境下可能无法完全模拟。如果遇到这类问题，建议参考 PartyKit 官方文档了解如何在本地环境中配置替代方案。

### 7.5 运行 MCP Engine

rpg-mcp-engine 是独立于 PartyKit 的 MCP 服务器，用于为 AI Agent 提供游戏能力接口。开发 MCP Engine 需要先构建 TypeScript 代码，然后启动服务器进程。进入 backend/rpg-mcp-engine 目录后，依次执行 pnpm build 编译代码和 pnpm start 启动服务器。

MCP 服务器默认监听 stdio 模式，这是 Claude Desktop 和类似工具的标准连接方式。如果需要 TCP 或 WebSocket 连接，可以通过命令行参数指定传输层和端口号。

### 7.6 测试框架

项目使用 vitest 作为测试框架，所有测试文件位于各模块的 tests/ 子目录中。执行 pnpm test（在根目录或 backend/rpg-mcp-engine 目录下）可以运行全部测试用例。测试覆盖了战斗引擎、空间计算、数据验证等核心功能，确保代码修改不会破坏已有功能。

## 8 数据流与状态管理

### 8.1 前端状态流

前端应用维护着多层次的状态结构。最顶层是 Pinia stores 中定义的全局状态，包括 game store（游戏基础状态）、ai-game store（AI 游戏状态）、stupid-character store（AI 角色状态）。这些状态通过响应式机制与 Vue 组件绑定，当状态变化时自动触发视图更新。

RPG-JS 游戏引擎维护着独立的状态空间，包括角色位置、背包物品、任务进度等。游戏引擎的状态通过事件系统与 Vue 组件通信，当游戏事件触发时（如角色拾取物品、NPC 对话），事件处理器会更新 Pinia 状态，触发相应的 UI 更新。

AI 决策引擎的状态完全独立于上述两层。它维护着自己的情绪值、记忆列表、混沌状态等，这些状态通过 AICharacterController 与游戏世界交互。当控制器决定执行某个动作时，它会通过 RPG-JS 引擎的 API 触发相应的游戏行为，同时更新自己的决策历史。

### 8.2 后端状态流

rpg-mcp-engine 的状态管理采用数据库持久化与内存缓存结合的方案。SQLite 数据库存储所有持久化数据，包括角色属性、世界状态、历史记录等。服务器启动时从数据库加载初始状态到内存，后续操作在内存中执行并定期同步回数据库。

战斗场景采用实时状态管理模式。当战斗开始时，CombatEngine 实例加载参战角色的最新数据到内存，后续的战斗动作直接在内存中修改状态。战斗结束后，最终状态被写回数据库。这种设计确保了战斗的实时性和数据的一致性。

### 8.3 跨端同步

前端与后端之间通过 PartyKit 实现的 WebSocket 连接进行状态同步。连接建立后，客户端会收到服务器推送的初始状态快照，后续的增量更新通过事件消息同步。当客户端执行操作（如移动、交互）时，消息发送到 PartyKit 服务器，服务器处理后广播更新给所有同房间的客户端。

这种基于事件广播的同步机制确保了所有客户端最终看到一致的游戏世界状态。即使在网络延迟或消息丢失的情况下，客户端也只需要等待下一个同步事件就能恢复到正确状态。PartyKit 平台内置了消息持久化和重连机制，进一步提升了连接的可靠性。

## 9 MCP 工具接口

### 9.1 角色管理工具

character_manage 工具提供了角色相关的全部 CRUD 操作。它的 action 参数支持多种操作类型：create 用于创建新角色，update 用于修改角色属性，delete 用于移除角色，get 用于查询角色信息。每个操作都有对应的参数验证和数据前置检查，确保操作的安全性。

### 9.2 战斗管理工具

combat_manage 工具管理战斗会话的生命周期。start_combat 操作初始化一场战斗，需要提供参战者列表和可选的战场配置。advance_turn 操作推进战斗回合，处理各种回合结束效果。end_combat 操作结算战斗结果，将状态同步回主数据库。

combat_action 工具执行具体的战斗动作。attack 操作模拟一次攻击检定和伤害计算；heal 操作执行治疗并更新生命值；cast_spell 操作处理法术释放，包含法术消耗、目标选择、效果应用等完整逻辑。每个动作都返回详细的结果描述，可用于前端渲染战斗动画。

### 9.3 世界管理工具

world_manage 工具提供游戏世界的宏观管理能力。它可以查询世界状态（当前区域、天气、时间）、修改世界设置（改变天气、触发事件）、导航玩家（传送到特定位置）。这些操作通常需要较高的权限，因为不当的世界状态修改可能影响游戏平衡。

spatial_manage 工具处理空间相关的计算请求。calculate_los 检查两点间是否有视线连接；find_path 计算从起点到终点的最优路径；get_terrain 返回指定位置的地形信息。这些工具是实现 AI Agent 空间感知能力的基础。

### 9.4 物品与交易工具

item_manage 工具管理游戏中的物品定义，包括创建物品实例、查询物品属性、修改物品属性等操作。inventory_manage 工具则管理角色的背包，执行拾取、丢弃、使用物品等操作。这两个工具共同构成了游戏经济系统的基础设施。

## 10 开发最佳实践

### 10.1 代码组织原则

项目遵循清晰的分层架构原则。前端代码按功能域组织（ai/、rpg-game/、stupid-ai/），每个功能域内进一步按角色（components/）、逻辑（services/）、状态（stores/）分层。这种组织方式使得代码结构一目了然，新开发者能够快速定位需要修改的文件。

后端代码采用模块化设计。src/ 目录下的每个子目录都代表一个功能模块，模块之间通过导出接口进行交互。src/server/consolidated/ 目录下的工具实现采用了统一的模式——每个工具都有对应的 Tool 定义（描述参数和返回值）和 Handler 函数（实现业务逻辑），这种模式使得工具的实现和注册过程标准化。

### 10.2 类型安全实践

项目全面使用 TypeScript，并在关键位置添加了 Zod 模式验证。前端的 AI 决策引擎使用 TypeScript 类型定义感知数据、动作、性格配置等数据结构，这些类型确保了代码编辑器的智能提示和编译时检查。后端的 MCP 工具参数通过 Zod 模式验证，运行时检查确保了外部输入的安全性。

类型定义文件（.d.ts）用于声明没有类型定义的第三方库模块，如 partykit 的全局类型。这种做法弥补了类型定义的缺失，使得 TypeScript 编译器能够完整地检查代码。

### 10.3 测试策略

项目采用单元测试与集成测试相结合的策略。单元测试覆盖核心算法和工具函数，如战斗引擎的伤害计算、空间引擎的路径查找、决策引擎的评分逻辑等。集成测试则验证模块间的协作，如 MCP 工具的完整调用链、数据库操作的正确性等。

测试文件使用 vitest 框架编写，支持快速运行和 watch 模式。测试用例采用描述性命名，清晰说明被测试的功能点。每个测试用例都遵循 Arrange-Act-Assert 模式，先准备测试数据，执行被测操作，然后验证预期结果。

### 10.4 性能考量

前端开发中，AI 决策引擎的 tick 间隔被设置为可配置参数，默认 3 秒的间隔在游戏性和计算开销之间取得了平衡。对于复杂的决策场景，可以临时提高间隔以获得更详细的调试输出；对于简单的 NPC 行为，可以降低间隔以提升响应速度。

后端开发中，数据库操作使用参数化查询防止 SQL 注入，同时通过索引优化查询性能。战斗状态保存在内存中，只在战斗结束时写入数据库，这种设计减少了对数据库的写入频率，提升了响应速度。
