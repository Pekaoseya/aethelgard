/**
 * AI 角色控制器
 * 
 * 管理游戏中的 AI 角色自主行为
 * 使用 AI 决策引擎做出"符合人设的混沌决策"
 */

import { AIDecisionEngine, type PersonalityConfig, type PerceptionData, type Action } from '@/ai';

export interface AIControlledNPC {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  engine: AIDecisionEngine;
  currentAction: Action | null;
  lastActionTime: number;
  moveHistory: Array<{ x: number; y: number; time: number }>;
}

export interface GameEnvironment {
  terrain: 'grass' | 'forest' | 'cave' | 'water' | 'high_place';
  time: 'day' | 'night';
  hasWarningSign: boolean;
  items: Array<{ name: string; position: { x: number; y: number } }>;
  enemies: Array<{ name: string; position: { x: number; y: number }; threat_level: number }>;
}

export class AICharacterController {
  private characters: Map<string, AIControlledNPC> = new Map();
  private tickInterval: number | null = null;
  private environment: GameEnvironment;
  private mapSize: { width: number; height: number };
  private onAction: ((npc: AIControlledNPC, action: Action) => void) | null = null;
  
  // 决策间隔（毫秒）
  private decisionInterval = 3000;

  constructor(
    environment: GameEnvironment,
    mapSize: { width: number; height: number } = { width: 11, height: 11 }
  ) {
    this.environment = environment;
    this.mapSize = mapSize;
  }

  /**
   * 注册 AI 角色
   */
  registerCharacter(
    id: string,
    name: string,
    emoji: string,
    position: { x: number; y: number },
    personality: PersonalityConfig
  ): AIControlledNPC {
    const engine = new AIDecisionEngine(personality, {
      chaosLevel: personality.irrationality * 100,
      enableDebug: false
    });

    const npc: AIControlledNPC = {
      id,
      name,
      emoji,
      position,
      engine,
      currentAction: null,
      lastActionTime: Date.now(),
      moveHistory: [{ ...position, time: Date.now() }]
    };

    this.characters.set(id, npc);
    return npc;
  }

  /**
   * 批量注册角色
   */
  registerCharacters(
    characters: Array<{
      id: string;
      name: string;
      emoji: string;
      position: { x: number; y: number };
      personality: PersonalityConfig;
    }>
  ): void {
    characters.forEach(c => {
      this.registerCharacter(c.id, c.name, c.emoji, c.position, c.personality);
    });
  }

  /**
   * 设置动作回调
   */
  setActionCallback(callback: (npc: AIControlledNPC, action: Action) => void): void {
    this.onAction = callback;
  }

  /**
   * 启动 AI 控制循环
   */
  start(): void {
    if (this.tickInterval) return;

    this.tickInterval = window.setInterval(() => {
      this.tick();
    }, this.decisionInterval);

    // 立即执行一次
    this.tick();
  }

  /**
   * 停止 AI 控制
   */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * 单次决策 tick
   */
  tick(): void {
    for (const npc of this.characters.values()) {
      this.makeDecision(npc);
    }
  }

  /**
   * 为单个角色做决策
   */
  private makeDecision(npc: AIControlledNPC): Action | null {
    // 构建感知数据
    const perception = this.buildPerception(npc);
    
    // 获取可用动作
    const availableActions = this.getAvailableActions(npc);
    
    // 使用 AI 引擎决策
    const decision = npc.engine.decide(perception, availableActions);
    
    // 执行动作
    this.executeAction(npc, decision);

    npc.currentAction = decision;
    npc.lastActionTime = Date.now();

    // 触发回调
    if (this.onAction) {
      this.onAction(npc, decision);
    }

    return decision;
  }

  /**
   * 构建感知数据
   */
  private buildPerception(npc: AIControlledNPC): PerceptionData {
    const { x, y } = npc.position;

    // 感知周围的敌人
    const nearbyEnemies = this.environment.enemies
      .filter(e => {
        const dist = Math.abs(e.position.x - x) + Math.abs(e.position.y - y);
        return dist <= 5;
      })
      .map(e => ({
        type: 'enemy' as const,
        name: e.name,
        distance: Math.abs(e.position.x - x) + Math.abs(e.position.y - y),
        threat_level: e.threat_level
      }));

    // 感知周围的物品
    const nearbyItems = this.environment.items
      .filter(i => {
        const dist = Math.abs(i.position.x - x) + Math.abs(i.position.y - y);
        return dist <= 3;
      })
      .map(i => ({
        type: 'item' as const,
        name: i.name,
        distance: Math.abs(i.position.x - x) + Math.abs(i.position.y - y)
      }));

    // 感知其他 AI 角色
    const nearbyAllies = Array.from(this.characters.values())
      .filter(other => other.id !== npc.id)
      .map(other => ({
        type: 'ally' as const,
        name: other.name,
        distance: Math.abs(other.position.x - x) + Math.abs(other.position.y - y),
        action: other.currentAction?.type || 'idle'
      }));

    return {
      self: {
        hp: 100,
        max_hp: 100,
        position: { x, y },
        status: [],
        inventory: ['rusty_sword', 'apple']
      },
      environment: {
        terrain: this.environment.terrain,
        time: this.environment.time,
        hasWarningSign: this.environment.hasWarningSign
      },
      perception: [...nearbyEnemies, ...nearbyItems, ...nearbyAllies]
    };
  }

  /**
   * 获取可用动作
   */
  private getAvailableActions(npc: AIControlledNPC): Action[] {
    const actions: Action[] = [
      // 等待
      { type: 'wait', target: '原地', baseScore: 20 },
      // 移动（四个方向）
      { type: 'move', target: '北', baseScore: 30, distance: 1 },
      { type: 'move', target: '南', baseScore: 30, distance: 1 },
      { type: 'move', target: '东', baseScore: 30, distance: 1 },
      { type: 'move', target: '西', baseScore: 30, distance: 1 },
      // 拾取
      { type: 'pickup', target: '物品', baseScore: 40 },
      // 攻击
      { type: 'attack', target: '敌人', baseScore: 50 },
      // 跟随玩家
      { type: 'follow', target: '玩家', baseScore: 35 },
      // 对话
      { type: 'talk', target: '队友', baseScore: 25 },
      // 自言自语
      { type: 'talk', target: '自己', baseScore: 15 },
      // 探索
      { type: 'inspect', target: '周围', baseScore: 35 },
      // 帮助
      { type: 'help', target: '队友', baseScore: 40 },
      // 逃跑
      { type: 'flee', target: '逃跑', baseScore: 40 }
    ];

    return actions;
  }

  /**
   * 执行动作
   */
  private executeAction(npc: AIControlledNPC, action: Action): void {
    const { x, y } = npc.position;

    switch (action.type) {
      case 'move':
        this.executeMove(npc, action.target);
        break;
      case 'attack':
        // 攻击不改变位置
        break;
      case 'pickup':
        // 拾取物品
        this.removeNearbyItem(npc);
        break;
      case 'follow':
        // 跟随逻辑在外部处理
        break;
      case 'wait':
      case 'talk':
      case 'inspect':
      case 'help':
      case 'flee':
      default:
        // 其他动作不改变位置
        break;
    }
  }

  /**
   * 执行移动
   */
  private executeMove(npc: AIControlledNPC, direction: string): void {
    const { x, y } = npc.position;
    let newX = x;
    let newY = y;

    switch (direction) {
      case '北': newY = y - 1; break;
      case '南': newY = y + 1; break;
      case '东': newX = x + 1; break;
      case '西': newX = x - 1; break;
    }

    // 边界检查
    if (newX < 0 || newX >= this.mapSize.width || newY < 0 || newY >= this.mapSize.height) {
      return;
    }

    // 检查是否有其他 AI 在该位置
    const occupied = Array.from(this.characters.values()).some(
      other => other.id !== npc.id && other.position.x === newX && other.position.y === newY
    );

    if (occupied) {
      return;
    }

    // 移动
    npc.position.x = newX;
    npc.position.y = newY;
    npc.moveHistory.push({ x: newX, y: newY, time: Date.now() });

    // 限制历史长度
    if (npc.moveHistory.length > 20) {
      npc.moveHistory.shift();
    }
  }

  /**
   * 移除附近的物品
   */
  private removeNearbyItem(npc: AIControlledNPC): void {
    const { x, y } = npc.position;
    const idx = this.environment.items.findIndex(
      item => Math.abs(item.position.x - x) <= 1 && Math.abs(item.position.y - y) <= 1
    );

    if (idx !== -1) {
      this.environment.items.splice(idx, 1);
    }
  }

  /**
   * 获取所有 AI 角色
   */
  getCharacters(): AIControlledNPC[] {
    return Array.from(this.characters.values());
  }

  /**
   * 获取单个角色
   */
  getCharacter(id: string): AIControlledNPC | undefined {
    return this.characters.get(id);
  }

  /**
   * 更新环境
   */
  updateEnvironment(env: Partial<GameEnvironment>): void {
    this.environment = { ...this.environment, ...env };
  }

  /**
   * 添加物品到世界
   */
  addItem(name: string, position: { x: number; y: number }): void {
    this.environment.items.push({ name, position });
  }

  /**
   * 添加敌人到世界
   */
  addEnemy(name: string, position: { x: number; y: number }, threatLevel: number): void {
    this.environment.enemies.push({ name, position, threat_level: threatLevel });
  }

  /**
   * 回合结束
   */
  endTurn(): void {
    for (const npc of this.characters.values()) {
      npc.engine.tick();
    }
  }
}

export default AICharacterController;
