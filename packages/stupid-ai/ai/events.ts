/**
 * 智障探险队：游戏事件系统
 * 
 * 定义游戏中的事件类型和触发器
 */

// 事件类型枚举
export type GameEventType = 
  | 'player_near_npc'           // 玩家靠近 NPC
  | 'player_near_item'           // 玩家靠近物品
  | 'player_near_enemy'          // 玩家靠近敌人
  | 'npc_near_item'              // NPC 靠近物品
  | 'npc_near_enemy'             // NPC 靠近敌人
  | 'npc_attacked'               // NPC 被攻击
  | 'player_attacked'            // 玩家被攻击
  | 'item_picked_up'             // 物品被拾取
  | 'enemy_defeated'             // 敌人被击败
  | 'warning_sign_spotted'       // 发现警告标志
  | 'danger_zone_entered'        // 进入危险区域
  | 'trap_triggered'             // 陷阱触发
  | 'time_changed'               // 时间变化
  | 'chaos_event'                // 混沌事件
  | 'npc_conflict'               // NPC 冲突
  | 'obsession_triggered'        // 执念触发
  | 'trauma_triggered'           // 创伤触发

// 事件数据接口
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  source: {
    type: 'player' | 'npc' | 'environment';
    id?: string;
    name?: string;
  };
  target?: {
    type: 'player' | 'npc' | 'item' | 'enemy';
    id?: string;
    name?: string;
  };
  data?: Record<string, any>;
}

// 事件监听器
export type EventListener = (event: GameEvent) => void

/**
 * 游戏事件管理器
 */
export class GameEventManager {
  private listeners: Map<GameEventType, Set<EventListener>> = new Map()
  private globalListeners: Set<EventListener> = new Set()
  private eventHistory: GameEvent[] = []
  private maxHistory = 100

  /**
   * 监听特定事件
   */
  on(type: GameEventType, listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
    
    // 返回取消订阅函数
    return () => {
      this.listeners.get(type)?.delete(listener)
    }
  }

  /**
   * 监听所有事件
   */
  onAll(listener: EventListener): () => void {
    this.globalListeners.add(listener)
    return () => {
      this.globalListeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  emit(event: GameEvent): void {
    // 添加到历史
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift()
    }

    // 触发特定类型监听器
    const typeListeners = this.listeners.get(event.type)
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Event listener error for ${event.type}:`, error)
        }
      })
    }

    // 触发全局监听器
    this.globalListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Global event listener error:', error)
      }
    })
  }

  /**
   * 获取事件历史
   */
  getHistory(type?: GameEventType): GameEvent[] {
    if (type) {
      return this.eventHistory.filter(e => e.type === type)
    }
    return [...this.eventHistory]
  }

  /**
   * 获取最近 N 条事件
   */
  getRecentEvents(count: number = 10): GameEvent[] {
    return this.eventHistory.slice(-count)
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * 创建距离检测事件
   */
  static createProximityEvent(
    type: 'player' | 'npc',
    sourceId: string,
    sourceName: string,
    targetType: 'npc' | 'item' | 'enemy',
    targetId: string,
    targetName: string
  ): GameEvent {
    const eventMap: Record<string, GameEventType> = {
      'player_npc': 'player_near_npc',
      'player_item': 'player_near_item',
      'player_enemy': 'player_near_enemy',
      'npc_item': 'npc_near_item',
      'npc_enemy': 'npc_near_enemy'
    }
    
    const eventType = eventMap[`${type}_${targetType}`] || 'chaos_event'
    
    return {
      type: eventType,
      timestamp: Date.now(),
      source: { type, id: sourceId, name: sourceName },
      target: { type: targetType, id: targetId, name: targetName }
    }
  }

  /**
   * 创建战斗事件
   */
  static createCombatEvent(
    attackerType: 'player' | 'npc',
    attackerId: string,
    attackerName: string,
    targetType: 'player' | 'npc' | 'enemy',
    targetId: string,
    targetName: string,
    damage?: number
  ): GameEvent {
    const eventType = attackerType === 'player' ? 'player_attacked' : 'npc_attacked'
    
    return {
      type: eventType,
      timestamp: Date.now(),
      source: { type: attackerType, id: attackerId, name: attackerName },
      target: { type: targetType, id: targetId, name: targetName },
      data: damage ? { damage } : undefined
    }
  }

  /**
   * 创建拾取事件
   */
  static createPickupEvent(
    pickerType: 'player' | 'npc',
    pickerId: string,
    pickerName: string,
    itemName: string
  ): GameEvent {
    return {
      type: 'item_picked_up',
      timestamp: Date.now(),
      source: { type: pickerType, id: pickerId, name: pickerName },
      target: { type: 'item', name: itemName }
    }
  }

  /**
   * 创建混沌事件
   */
  static createChaosEvent(
    sourceId: string,
    sourceName: string,
    chaosType: string,
    description: string
  ): GameEvent {
    return {
      type: 'chaos_event',
      timestamp: Date.now(),
      source: { type: 'npc', id: sourceId, name: sourceName },
      data: { chaosType, description }
    }
  }
}

// 预定义的事件效果
export interface EventEffect {
  type: 'teleport' | 'damage' | 'heal' | 'buff' | 'debuff' | 'spawn' | 'despawn' | 'dialogue' | 'sound' | 'screen_effect'
  data: Record<string, any>
  probability?: number  // 触发概率
}

/**
 * 事件效果触发器
 */
export class EventTriggerSystem {
  private triggers: Map<GameEventType, EventEffect[]> = new Map()

  /**
   * 注册事件效果
   */
  register(eventType: GameEventType, effect: EventEffect): void {
    if (!this.triggers.has(eventType)) {
      this.triggers.set(eventType, [])
    }
    this.triggers.get(eventType)!.push(effect)
  }

  /**
   * 批量注册
   */
  registerBatch(config: Array<{ eventType: GameEventType; effect: EventEffect }>): void {
    config.forEach(({ eventType, effect }) => {
      this.register(eventType, effect)
    })
  }

  /**
   * 检查并触发效果
   */
  checkAndTrigger(event: GameEvent): EventEffect[] {
    const effects = this.triggers.get(event.type)
    if (!effects) return []

    return effects.filter(effect => {
      // 检查概率
      if (effect.probability !== undefined) {
        return Math.random() * 100 < effect.probability
      }
      return true
    })
  }
}
