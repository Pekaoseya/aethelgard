/**
 * 智障探险队：MCP 通信接口
 * 
 * 定义 AI 引擎与 rpg-mcp-engine 的通信协议
 */

import type { Action, PerceptionData, PersonalityConfig } from './types'
import { AIDecisionEngine } from './engine'

// MCP 消息类型
export type MCPMessageType = 
  | 'perception_update'      // 感知数据更新
  | 'action_request'          // 请求执行动作
  | 'action_result'           // 动作执行结果
  | 'state_sync'              // 状态同步
  | 'character_update'        // 角色状态更新
  | 'environment_change'      // 环境变化
  | 'dialogue_request'        // 对话请求
  | 'error'                   // 错误信息

// MCP 消息结构
export interface MCPMessage {
  id: string
  type: MCPMessageType
  timestamp: number
  sender: 'client' | 'server'
  payload: Record<string, any>
}

// MCP 通信配置
export interface MCPConfig {
  serverUrl?: string
  apiKey?: string
  enableLocalMode?: boolean  // 本地模式，不连接外部服务器
}

// MCP 客户端
export class MCPClient {
  private config: MCPConfig
  private messageQueue: MCPMessage[] = []
  private listeners: Map<MCPMessageType, Set<(msg: MCPMessage) => void>> = new Map()
  private engine: AIDecisionEngine | null = null
  private characterId: string = ''

  constructor(config: MCPConfig = {}) {
    this.config = {
      enableLocalMode: true,
      ...config
    }
  }

  /**
   * 连接 MCP 服务器
   */
  async connect(): Promise<boolean> {
    if (this.config.enableLocalMode) {
      console.log('[MCP] 运行在本地模式')
      return true
    }

    // 外部服务器连接逻辑
    try {
      // 这里可以实现与 rpg-mcp-engine 的 WebSocket/HTTP 连接
      console.log('[MCP] 连接到 MCP 服务器...')
      return true
    } catch (error) {
      console.error('[MCP] 连接失败:', error)
      return false
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.messageQueue = []
    this.listeners.clear()
  }

  /**
   * 注册 AI 引擎
   */
  registerEngine(engine: AIDecisionEngine, characterId: string): void {
    this.engine = engine
    this.characterId = characterId
  }

  /**
   * 发送消息
   */
  send(message: Omit<MCPMessage, 'id' | 'timestamp' | 'sender'>): void {
    const fullMessage: MCPMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
      sender: 'client'
    }

    if (this.config.enableLocalMode) {
      this.processLocalMessage(fullMessage)
    } else {
      this.messageQueue.push(fullMessage)
      this.flushQueue()
    }
  }

  /**
   * 订阅消息
   */
  subscribe(type: MCPMessageType, callback: (msg: MCPMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    
    return () => {
      this.listeners.get(type)?.delete(callback)
    }
  }

  /**
   * 处理感知数据更新
   */
  sendPerceptionUpdate(perception: PerceptionData): void {
    this.send({
      type: 'perception_update',
      payload: { characterId: this.characterId, perception }
    })
  }

  /**
   * 请求动作执行
   */
  requestAction(perception: PerceptionData, availableActions: Action[]): Promise<MCPMessage | null> {
    return new Promise((resolve) => {
      if (!this.engine) {
        resolve(null)
        return
      }

      const decision = this.engine.decide(perception, availableActions)
      
      this.send({
        type: 'action_request',
        payload: {
          characterId: this.characterId,
          decision,
          reasoning: decision.reasoning
        }
      })

      resolve({
        id: this.generateId(),
        type: 'action_result',
        timestamp: Date.now(),
        sender: 'server',
        payload: { characterId: this.characterId, action: decision }
      })
    })
  }

  /**
   * 发送动作结果
   */
  sendActionResult(action: Action, success: boolean, message: string): void {
    this.send({
      type: 'action_result',
      payload: {
        characterId: this.characterId,
        action,
        success,
        message
      }
    })
  }

  /**
   * 同步角色状态
   */
  syncCharacterState(state: {
    hp?: number
    maxHp?: number
    position?: { x: number; y: number }
    status?: string[]
    inventory?: string[]
  }): void {
    this.send({
      type: 'character_update',
      payload: { characterId: this.characterId, state }
    })
  }

  /**
   * 报告环境变化
   */
  reportEnvironmentChange(change: {
    type: 'terrain' | 'time' | 'weather' | 'spawn' | 'despawn'
    data: any
  }): void {
    this.send({
      type: 'environment_change',
      payload: { characterId: this.characterId, change }
    })
  }

  /**
   * 请求对话
   */
  requestDialogue(context: {
    speaker: string
    message: string
    emotion?: string
  }): void {
    this.send({
      type: 'dialogue_request',
      payload: { characterId: this.characterId, ...context }
    })
  }

  // ========== 私有方法 ==========

  private generateId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async flushQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        // 发送到服务器
        console.log('[MCP] 发送消息:', message.type)
      }
    }
  }

  private processLocalMessage(message: MCPMessage): void {
    // 本地模式下直接处理消息
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(cb => cb(message))
    }
  }
}

/**
 * MCP 服务器模拟（用于本地测试）
 */
export class MCPServer {
  private clients: Set<MCPClient> = new Set()

  /**
   * 添加客户端
   */
  addClient(client: MCPClient): void {
    this.clients.add(client)
  }

  /**
   * 移除客户端
   */
  removeClient(client: MCPClient): void {
    this.clients.delete(client)
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(message: Omit<MCPMessage, 'id' | 'timestamp' | 'sender'>): void {
    const fullMessage: MCPMessage = {
      ...message,
      id: `server_${Date.now()}`,
      timestamp: Date.now(),
      sender: 'server'
    }

    this.clients.forEach(client => {
      client.subscribe(fullMessage.type, () => {})
    })
  }

  /**
   * 广播感知数据
   */
  broadcastPerception(characterId: string, perception: PerceptionData): void {
    this.broadcast({
      type: 'perception_update',
      payload: { characterId, perception }
    })
  }

  /**
   * 广播环境变化
   */
  broadcastEnvironmentChange(change: { type: string; data: any }): void {
    this.broadcast({
      type: 'environment_change',
      payload: change
    })
  }
}

// ========== 工具函数 ==========

/**
 * 创建 MCP 配置
 */
export function createMCPConfig(apiKey?: string, serverUrl?: string): MCPConfig {
  return {
    apiKey,
    serverUrl,
    enableLocalMode: !serverUrl
  }
}

/**
 * 创建本地 MCP 客户端
 */
export function createLocalMCPClient(): MCPClient {
  return new MCPClient({ enableLocalMode: true })
}

/**
 * 格式化 MCP 消息为可读字符串
 */
export function formatMCPMessage(msg: MCPMessage): string {
  return `[${msg.sender}] ${msg.type}: ${JSON.stringify(msg.payload, null, 2)}`
}
