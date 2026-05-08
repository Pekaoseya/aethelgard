/**
 * AI 游戏状态管理
 * 
 * 集成 AI 决策引擎的游戏状态
 */
import { defineStore } from 'pinia'
import { AICharacterController, type AIControlledNPC, type GameEnvironment, type PersonalityConfig } from '@/ai'
import { SCENARIO_IDLE_SQUARE, getScenarioById, type TestScenario } from '@/ai/scenarios'

// 角色性格配置
const PERSONALITY_CONFIGS: Record<string, PersonalityConfig> = {
 复读姬: {
    id: '复读姬',
    traits: ['复读', '健忘'],
    bias_strength: 80,
    emotion_volatility: 0.8,
    irrationality: 0.9,
    loyalty: 50
  },
  杠精博士: {
    id: '杠精博士',
    traits: ['反驳', '逻辑控'],
    bias_strength: 70,
    emotion_volatility: 0.9,
    irrationality: 0.6,
    loyalty: 30,
    obsession_target: '真理'
  },
  幻觉大师: {
    id: '幻觉大师',
    traits: ['想象', '幻觉'],
    bias_strength: 90,
    emotion_volatility: 1.0,
    irrationality: 0.95,
    loyalty: 20
  },
  圣母心: {
    id: '圣母心',
    traits: ['帮助', '牺牲'],
    bias_strength: 60,
    emotion_volatility: 0.5,
    irrationality: 0.4,
    loyalty: 95
  },
  舔狗: {
    id: '舔狗',
    traits: ['追随', '讨好'],
    bias_strength: 85,
    emotion_volatility: 0.7,
    irrationality: 0.8,
    loyalty: 100,
    obsession_target: '队长'
  },
  预言家: {
    id: '预言家',
    traits: ['预言', '恐慌'],
    bias_strength: 75,
    emotion_volatility: 1.0,
    irrationality: 0.7,
    loyalty: 60
  }
}

export interface AIGameNPC {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
}

export const useAIGameStore = defineStore('aiGame', {
  state: () => ({
    // 游戏状态
    gameStarted: false,
    aiEnabled: false,
    
    // 玩家状态
    playerPosition: { x: 5, y: 5 },
    playerHp: 100,
    playerMaxHp: 100,
    
    // 地图
    currentMap: '智障广场',
    mapSize: { width: 11, height: 11 },
    
    // 环境
    environment: {
      terrain: 'grass' as const,
      time: 'day' as const,
      hasWarningSign: false,
      items: [
        { name: '金币', position: { x: 3, y: 2 } },
        { name: '苹果', position: { x: 7, y: 4 } },
        { name: '破石头', position: { x: 1, y: 8 } },
        { name: '宝箱', position: { x: 9, y: 9 } }
      ],
      enemies: [] as Array<{ name: string; position: { x: number; y: number }; threat_level: number }>
    },
    
    // AI 控制的 NPC
    npcs: [
      { id: '复读姬', name: '复读姬', emoji: '🔁', position: { x: 2, y: 3 } },
      { id: '杠精博士', name: '杠精博士', emoji: '🤓', position: { x: 8, y: 2 } },
      { id: '幻觉大师', name: '幻觉大师', emoji: '👻', position: { x: 4, y: 8 } },
      { id: '圣母心', name: '圣母心', emoji: '😇', position: { x: 9, y: 7 } }
    ] as AIGameNPC[],
    
    // AI 控制器
    controller: null as AICharacterController | null,
    
    // AI 角色状态
    aiCharacters: [] as AIControlledNPC[],
    
    // UI 状态
    showAIPanel: false,
    aiSpeed: 1,
    
    // 对话状态
    dialogueActive: false,
    currentNPC: null as AIGameNPC | null,
    dialogueMessages: [] as Array<{ speaker: 'player' | 'npc'; content: string }>,
    playerInput: '',
    isTyping: false,
    
    // 场景系统
    currentScenario: null as TestScenario | null,
    availableScenarios: [] as TestScenario[]
  }),
  
  actions: {
    // 启动游戏
    startGame() {
      this.gameStarted = true;
      this.initAI();
    },
    
    // 初始化 AI
    initAI() {
      // 创建环境
      const env: GameEnvironment = {
        terrain: this.environment.terrain,
        time: this.environment.time,
        hasWarningSign: this.environment.hasWarningSign,
        items: [...this.environment.items],
        enemies: [...this.environment.enemies]
      };
      
      // 创建控制器
      this.controller = new AICharacterController(env, this.mapSize);
      
      // 注册角色
      this.npcs.forEach(npc => {
        const personality = PERSONALITY_CONFIGS[npc.id] || PERSONALITY_CONFIGS['复读姬'];
        const aiChar = this.controller!.registerCharacter(
          npc.id,
          npc.name,
          npc.emoji,
          npc.position,
          personality
        );
        this.aiCharacters.push(aiChar);
      });
      
      // 设置动作回调
      this.controller.setActionCallback((npc, action) => {
        // 更新 NPC 位置
        const npcState = this.npcs.find(n => n.id === npc.id);
        if (npcState) {
          npcState.position = { ...npc.position };
        }
        
        // 更新 AI 角色状态
        const aiChar = this.aiCharacters.find(c => c.id === npc.id);
        if (aiChar) {
          aiChar.position = { ...npc.position };
          aiChar.currentAction = action;
        }
      });
      
      // 启动 AI
      this.controller.start();
      this.aiEnabled = true;
    },
    
    // 停止 AI
    stopAI() {
      if (this.controller) {
        this.controller.stop();
        this.aiEnabled = false;
      }
    },
    
    // 暂停 AI
    pauseAI() {
      if (this.controller) {
        this.controller.stop();
      }
    },
    
    // 恢复 AI
    resumeAI() {
      if (this.controller && !this.aiEnabled) {
        this.controller.start();
        this.aiEnabled = true;
      }
    },
    
    // 改变 AI 速度
    setAISpeed(speed: number) {
      this.aiSpeed = speed;
      if (this.controller) {
        this.controller.stop();
        // 重新启动，间隔根据速度调整
        const interval = 3000 / speed;
        setTimeout(() => {
          if (this.controller) {
            this.controller.start();
          }
        }, 100);
      }
    },
    
    // 玩家移动
    movePlayer(dx: number, dy: number) {
      if (this.dialogueActive) return;
      
      const newX = this.playerPosition.x + dx;
      const newY = this.playerPosition.y + dy;
      
      // 边界检查
      if (newX < 0 || newX >= this.mapSize.width || newY < 0 || newY >= this.mapSize.height) {
        return;
      }
      
      // 检查是否与 AI NPC 重叠
      const occupied = this.npcs.some(n => n.position.x === newX && n.position.y === newY);
      if (occupied) return;
      
      this.playerPosition.x = newX;
      this.playerPosition.y = newY;
    },
    
    // 回合结束
    endTurn() {
      if (this.controller) {
        this.controller.endTurn();
      }
    },
    
    // 开始对话
    startDialogue(npc: AIGameNPC) {
      this.dialogueActive = true;
      this.currentNPC = npc;
      this.dialogueMessages = [];
      
      // 生成开场白
      const greetings = this.getNPCDialogue(npc.id, 'greeting');
      this.dialogueMessages.push({
        speaker: 'npc',
        content: greetings
      });
    },
    
    // 获取 NPC 对话
    getNPCDialogue(npcId: string, type: 'greeting' | 'chat' | 'leave'): string {
      const dialogues: Record<string, Record<string, string[]>> = {
        '复读姬': {
          greeting: ['复读姬: 你好你好！', '复读姬: 复读复读复读！'],
          chat: ['复读姬: 你说什么？', '复读姬: 复读！', '复读姬: 刚才你说什么来着？'],
          leave: ['复读姬: 拜拜复读！', '复读姬: 再见再见再见！']
        },
        '杠精博士': {
          greeting: ['杠精博士: 你以为你很懂？', '杠精博士: 哼，我要反驳你！'],
          chat: ['杠精博士: 不对！完全不对！', '杠精博士: 你这个逻辑有问题！', '杠精博士: 我要指出你的错误！'],
          leave: ['杠精博士: 哼，懒得跟你争！', '杠精博士: 你的见识太浅薄了！']
        },
        '幻觉大师': {
          greeting: ['幻觉大师: 你看到了吗？', '幻觉大师: 那边有个... 啊，消失了！'],
          chat: ['幻觉大师: 刚才有个龙飞过去了！', '幻觉大师: 我看到了...未来！', '幻觉大师: 嘘！别说话，它会听到的！'],
          leave: ['幻觉大师: 它来了它来了！', '幻觉大师: 快跑！！']
        },
        '圣母心': {
          greeting: ['圣母心: 你需要帮助吗？', '圣母心: 哦，可怜的人！'],
          chat: ['圣母心: 要不要我帮你扛点东西？', '圣母心: 别客气，我帮你！', '圣母心: 你看起来很累...'],
          leave: ['圣母心: 保重啊！', '圣母心: 需要帮忙就叫我！']
        }
      };
      
      const npcDialogues = dialogues[npcId] || dialogues['复读姬'];
      const options = npcDialogues[type] || ['...'];
      return options[Math.floor(Math.random() * options.length)];
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.playerInput.trim() || !this.currentNPC) return;
      
      const input = this.playerInput.trim();
      this.playerInput = '';
      
      this.dialogueMessages.push({
        speaker: 'player',
        content: input
      });
      
      this.isTyping = true;
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      this.isTyping = false;
      
      const response = this.getNPCDialogue(this.currentNPC.id, 'chat');
      this.dialogueMessages.push({
        speaker: 'npc',
        content: response
      });
    },
    
    // 关闭对话
    closeDialogue() {
      if (this.currentNPC) {
        const leaveMsg = this.getNPCDialogue(this.currentNPC.id, 'leave');
        this.dialogueMessages.push({
          speaker: 'npc',
          content: leaveMsg
        });
      }
      
      setTimeout(() => {
        this.dialogueActive = false;
        this.currentNPC = null;
        this.dialogueMessages = [];
      }, 1500);
    },
    
    // 切换 AI 面板
    toggleAIPanel() {
      this.showAIPanel = !this.showAIPanel;
    },
    
    // 加载场景
    loadScenario(scenarioId: string) {
      const scenario = getScenarioById(scenarioId);
      if (!scenario) return;
      
      // 停止当前 AI
      this.stopAI();
      
      // 重置状态
      this.aiCharacters = [];
      this.currentScenario = scenario;
      this.currentMap = scenario.name;
      
      // 加载地图配置
      this.mapSize = { ...scenario.mapSize };
      this.playerPosition = { ...scenario.playerStart };
      
      // 加载环境
      this.environment = {
        terrain: scenario.environment.terrain,
        time: scenario.environment.time,
        hasWarningSign: scenario.environment.hasWarningSign,
        items: [...scenario.environment.items],
        enemies: [...scenario.environment.enemies]
      };
      
      // 加载 NPC
      this.npcs = scenario.characters.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        position: { ...c.position }
      }));
      
      // 重新初始化 AI
      this.initAI();
    },
    
    // 获取当前场景
    getCurrentScenario(): TestScenario | null {
      return this.currentScenario;
    },
    
    // 检查是否与 NPC 相邻
    isNearNPC(npc: AIGameNPC) {
      const dx = Math.abs(npc.position.x - this.playerPosition.x);
      const dy = Math.abs(npc.position.y - this.playerPosition.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },
    
    // 检查是否有相邻 NPC
    getNearbyNPC(): AIGameNPC | null {
      for (const npc of this.npcs) {
        if (this.isNearNPC(npc)) {
          return npc;
        }
      }
      return null;
    }
  }
})
