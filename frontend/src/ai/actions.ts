/**
 * 智障探险队：完整动作系统
 * 
 * 定义所有可执行的动作类型及其执行逻辑
 */

import type { Action, PerceptionData } from './types'
import { GameEventManager } from './events'

// 动作执行结果
export interface ActionResult {
  success: boolean
  message: string
  effects: ActionEffect[]
  newState?: Partial<GameState>
}

// 动作效果
export interface ActionEffect {
  type: 'move' | 'attack' | 'damage' | 'heal' | 'pickup' | 'drop' | 'buff' | 'debuff' | 'dialogue' | 'sound' | 'teleport' | 'spawn' | 'despawn'
  target?: string
  value?: number
  message?: string
}

// 游戏状态（简化版）
export interface GameState {
  playerPosition: { x: number; y: number }
  playerHp: number
  playerMaxHp: number
  inventory: string[]
  npcs: Map<string, NPCState>
  items: Map<string, ItemState>
  enemies: Map<string, EnemyState>
}

export interface NPCState {
  id: string
  position: { x: number; y: number }
  hp: number
  maxHp: number
  status: string[]
  emotion: number
}

export interface ItemState {
  id: string
  name: string
  position: { x: number; y: number }
  quantity: number
}

export interface EnemyState {
  id: string
  name: string
  position: { x: number; y: number }
  hp: number
  maxHp: number
  threat_level: number
}

/**
 * 动作执行器
 */
export class ActionExecutor {
  private eventManager: GameEventManager
  private state: GameState

  constructor(eventManager: GameEventManager, initialState: GameState) {
    this.eventManager = eventManager
    this.state = initialState
  }

  /**
   * 执行动作
   */
  execute(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    switch (action.type) {
      case 'move':
        return this.executeMove(action, actorType, actorId, actorName)
      case 'attack':
        return this.executeAttack(action, actorType, actorId, actorName)
      case 'pickup':
        return this.executePickup(action, actorType, actorId, actorName)
      case 'use_item':
        return this.executeUseItem(action, actorType, actorId, actorName)
      case 'talk':
        return this.executeTalk(action, actorType, actorId, actorName)
      case 'flee':
        return this.executeFlee(action, actorType, actorId, actorName)
      case 'defend':
        return this.executeDefend(action, actorType, actorId, actorName)
      case 'inspect':
        return this.executeInspect(action, actorType, actorId, actorName)
      case 'interact':
        return this.executeInteract(action, actorType, actorId, actorName)
      case 'follow':
        return this.executeFollow(action, actorType, actorId, actorName)
      case 'wait':
        return this.executeWait(action, actorType, actorId, actorName)
      case 'help':
        return this.executeHelp(action, actorType, actorId, actorName)
      default:
        return { success: false, message: `未知动作类型: ${action.type}`, effects: [] }
    }
  }

  /**
   * 移动动作
   */
  private executeMove(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const direction = action.target || this.randomDirection()
    const { dx, dy } = this.parseDirection(direction)
    
    // 检查边界
    const targetX = action.position!.x + dx
    const targetY = action.position!.y + dy
    
    if (targetX < 0 || targetX >= 11 || targetY < 0 || targetY >= 11) {
      // 路痴效果：可能往反方向走
      if (actorType === 'npc') {
        const wrongDirection = { dx: -dx, dy: -dy }
        const wrongX = action.position!.x + wrongDirection.dx
        const wrongY = action.position!.y + wrongDirection.dy
        if (wrongX >= 0 && wrongX < 11 && wrongY >= 0 && wrongY < 11) {
          return {
            success: true,
            message: `${actorName} 路痴发作，往反方向走了！`,
            effects: [{
              type: 'move',
              target: actorId,
              message: `走到 (${wrongX}, ${wrongY})`
            }]
          }
        }
      }
      return { success: false, message: '走不通！', effects: [] }
    }

    // 检查障碍物
    const blocked = this.checkObstacle(targetX, targetY)
    if (blocked) {
      return { success: false, message: blocked, effects: [] }
    }

    // 触发事件
    this.eventManager.emit({
      type: 'chaos_event',
      timestamp: Date.now(),
      source: { type: actorType, id: actorId, name: actorName },
      data: { action: 'move', direction, position: { x: targetX, y: targetY } }
    })

    return {
      success: true,
      message: `${actorName} 向 ${direction} 移动`,
      effects: [{
        type: 'move',
        target: actorId,
        message: `走到 (${targetX}, ${targetY})`
      }]
    }
  }

  /**
   * 攻击动作
   */
  private executeAttack(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const targetName = action.target || '目标'
    const damage = Math.floor(Math.random() * 20) + 10

    // 友军误伤判定
    const friendlyFire = actorType === 'npc' && Math.random() < 0.3
    let actualTarget = targetName
    let message = `${actorName} 攻击了 ${targetName}！造成 ${damage} 点伤害！`

    if (friendlyFire) {
      // 随机选择一个友军
      const allies = Array.from(this.state.npcs.values()).filter(n => n.id !== actorId)
      if (allies.length > 0) {
        const victim = allies[Math.floor(Math.random() * allies.length)]
        actualTarget = victim.name
        message = `${actorName} "手滑" 攻击了友军 ${victim.name}！造成 ${damage} 点伤害！（并道歉）`
      }
    }

    this.eventManager.emit(GameEventManager.createCombatEvent(
      actorType, actorId, actorName,
      'enemy', actualTarget, actualTarget,
      damage
    ))

    return {
      success: true,
      message,
      effects: [{
        type: 'attack',
        target: actualTarget,
        value: damage,
        message
      }]
    }
  }

  /**
   * 拾取动作
   */
  private executePickup(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const itemName = action.target || '物品'

    // 抢夺判定
    if (actorType === 'npc' && Math.random() < 0.4) {
      const otherNPC = this.findOtherNPCNearItem(actorId, itemName)
      if (otherNPC) {
        return {
          success: true,
          message: `${actorName} 抢走了 ${otherNPC.name} 正在拾取的 ${itemName}！`,
          effects: [{
            type: 'pickup',
            target: itemName,
            message: `抢夺成功！`
          }]
        }
      }
    }

    this.eventManager.emit(GameEventManager.createPickupEvent(
      actorType, actorId, actorName,
      itemName
    ))

    return {
      success: true,
      message: `${actorName} 拾取了 ${itemName}！`,
      effects: [{
        type: 'pickup',
        target: itemName,
        message: `获得 ${itemName}`
      }]
    }
  }

  /**
   * 使用物品
   */
  private executeUseItem(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const itemName = action.target || '苹果'
    let healAmount = 0

    switch (itemName) {
      case '苹果':
      case '生命药水':
        healAmount = 20
        break
      case '圣剑':
        return { success: true, message: `${actorName} 挥舞圣剑，光芒四射！`, effects: [{ type: 'buff', target: actorId, message: '攻击力 +100' }] }
      case '护盾':
        return { success: true, message: `${actorName} 举起护盾！`, effects: [{ type: 'buff', target: actorId, message: '防御力 +50' }] }
      default:
        healAmount = 5
    }

    return {
      success: true,
      message: `${actorName} 使用了 ${itemName}，恢复了 ${healAmount} HP！`,
      effects: [{
        type: 'heal',
        target: actorId,
        value: healAmount,
        message: `恢复 ${healAmount} HP`
      }]
    }
  }

  /**
   * 对话动作
   */
  private executeTalk(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const dialogues = [
      `${actorName}: 你们看到了吗？那边好像有... 啊，消失了！`,
      `${actorName}: 我告诉你们一个秘密... 其实我是穿越者！`,
      `${actorName}: 等等，我刚才说什么来着？`,
      `${actorName}: 对对对，你说得对！（其实根本没在听）`,
      `${actorName}: 不对！你的逻辑有问题！`,
      `${actorName}: 哇！你看那个云，像不像一个... 龙？`
    ]

    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)]

    return {
      success: true,
      message: dialogue,
      effects: [{
        type: 'dialogue',
        target: actorId,
        message: dialogue
      }]
    }
  }

  /**
   * 逃跑动作
   */
  private executeFlee(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    // 路痴效果
    const lost = Math.random() < 0.4
    let message = `${actorName} 决定逃跑！`
    
    if (lost) {
      message = `${actorName} 试图逃跑... 但因为路痴属性，跑向了敌人！`
      this.eventManager.emit(GameEventManager.createChaosEvent(
        actorId, actorName, 'lost', '逃跑失败，跑向敌人'
      ))
    } else {
      message = `${actorName} 成功逃跑了！（可能只是原地打转）`
    }

    return {
      success: true,
      message,
      effects: [{
        type: 'move',
        target: actorId,
        message
      }]
    }
  }

  /**
   * 防御动作
   */
  private executeDefend(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    return {
      success: true,
      message: `${actorName} 进入防御姿态！`,
      effects: [{
        type: 'buff',
        target: actorId,
        value: 50,
        message: '防御力 +50%'
      }]
    }
  }

  /**
   * 调查动作
   */
  private executeInspect(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const findings = [
      `${actorName} 仔细观察了周围... 发现了一坨可疑的草。`,
      `${actorName} 用"专业"眼光审视了一下... 什么都没看懂。`,
      `${actorName} 蹲下来研究... ${action.target || '目标'} 似乎被盯得有点发毛。`
    ]

    return {
      success: true,
      message: findings[Math.floor(Math.random() * findings.length)],
      effects: []
    }
  }

  /**
   * 交互动作（按按钮、拉杆等）
   */
  private executeInteract(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    // 手贱效果
    const triggered = Math.random() < 0.5

    if (triggered) {
      return {
        success: true,
        message: `${actorName} "不小心" 按了 ${action.target || '按钮'}！发生了爆炸！`,
        effects: [{
          type: 'damage',
          target: actorId,
          value: -20,
          message: '受到 20 点伤害！（手欠的下场）'
        }]
      }
    }

    return {
      success: true,
      message: `${actorName} 小心翼翼地触碰了 ${action.target || '机关'}... 什么都没发生。（这次）`,
      effects: []
    }
  }

  /**
   * 跟随动作
   */
  private executeFollow(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    // 羊群效应
    const sheepEffect = Math.random() < 0.3
    let message = `${actorName} 跟着 ${action.target || '目标'} 走。`

    if (sheepEffect) {
      message = `${actorName} 看到其他人在做蠢事，也跟着做了！`
      this.eventManager.emit(GameEventManager.createChaosEvent(
        actorId, actorName, 'sheep', '羊群效应发作'
      ))
    }

    return {
      success: true,
      message,
      effects: [{
        type: 'move',
        target: actorId,
        message
      }]
    }
  }

  /**
   * 等待动作
   */
  private executeWait(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    // 发呆效果
    const zones = ['看风景', '发呆', '数蚂蚁', '思考人生', '突然唱起歌']
    const activity = zones[Math.floor(Math.random() * zones.length)]

    return {
      success: true,
      message: `${actorName} 停下来 ${activity}...`,
      effects: []
    }
  }

  /**
   * 帮助动作
   */
  private executeHelp(
    action: Action,
    actorType: 'player' | 'npc',
    actorId: string,
    actorName: string
  ): ActionResult {
    const helps = [
      `${actorName} 冲上去帮忙！结果帮了倒忙。`,
      `${actorName} 试图帮助 ${action.target || '某人'}...`,
      `${actorName} 大喊："我来帮你！" 然后冲向了错误的方向。`
    ]

    return {
      success: true,
      message: helps[Math.floor(Math.random() * helps.length)],
      effects: []
    }
  }

  // ========== 辅助方法 ==========

  private randomDirection(): string {
    const dirs = ['上', '下', '左', '右']
    return dirs[Math.floor(Math.random() * dirs.length)]
  }

  private parseDirection(dir: string): { dx: number; dy: number } {
    switch (dir) {
      case '上': return { dx: 0, dy: -1 }
      case '下': return { dx: 0, dy: 1 }
      case '左': return { dx: -1, dy: 0 }
      case '右': return { dx: 1, dy: 0 }
      default: return { dx: 0, dy: 0 }
    }
  }

  private checkObstacle(x: number, y: number): string | null {
    // 检查是否有 NPC
    for (const npc of this.state.npcs.values()) {
      if (npc.position.x === x && npc.position.y === y) {
        return '有 NPC 在那里'
      }
    }
    // 检查是否有敌人
    for (const enemy of this.state.enemies.values()) {
      if (enemy.position.x === x && enemy.position.y === y) {
        return '敌人挡住了去路'
      }
    }
    return null
  }

  private findOtherNPCNearItem(excludeId: string, itemName: string): NPCState | null {
    for (const npc of this.state.npcs.values()) {
      if (npc.id === excludeId) continue
      for (const item of this.state.items.values()) {
        if (item.name === itemName) {
          const dist = Math.abs(npc.position.x - item.position.x) + 
                       Math.abs(npc.position.y - item.position.y)
          if (dist <= 2) return npc
        }
      }
    }
    return null
  }

  /**
   * 更新游戏状态
   */
  updateState(newState: Partial<GameState>): void {
    this.state = { ...this.state, ...newState }
  }
}

/**
 * 创建默认游戏状态
 */
export function createDefaultGameState(): GameState {
  return {
    playerPosition: { x: 5, y: 5 },
    playerHp: 100,
    playerMaxHp: 100,
    inventory: [],
    npcs: new Map(),
    items: new Map(),
    enemies: new Map()
  }
}
