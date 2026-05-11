/**
 * 智障角色服务
 * 封装与 rpg-mcp-engine 的交互
 */

import { AgentFactory } from '../../rpg-mcp-engine/src/agents/agent-factory'
import type { BaseAgent } from '../../rpg-mcp-engine/src/agents/base-agent'

export interface StupidCharacter {
  id: string
  name: string
  emoji: string
  type: string
  description: string
  agent: BaseAgent
}

export interface DialogueMessage {
  role: 'player' | 'character'
  content: string
  character?: StupidCharacter
}

// 角色定义
const CHARACTER_DEFS = [
  { type: 'repeater', name: '复读姬', emoji: '🔄', description: '上下文丢失，经常重复说同样的话' },
  { type: 'carper', name: '杠精博士', emoji: '🧐', description: '永远在挑错，纠正你的一切观点' },
  { type: 'saint', name: '圣母心', emoji: '😇', description: '过度共情，不敢拒绝任何人' },
  { type: 'hallucinator', name: '幻觉大师', emoji: '👻', description: '编造不存在的事实，说得跟真的一样' },
  { type: 'sycophant', name: '舔狗', emoji: '💕', description: '过度顺从，永远说对对对' },
  { type: 'prophet', name: '预言家', emoji: '🤔', description: '说一些听起来正确但毫无意义的废话' },
]

class StupidCharacterService {
  private characters: Map<string, StupidCharacter> = new Map()
  private dialogueHistory: Map<string, DialogueMessage[]> = new Map()

  constructor() {
    this.initCharacters()
  }

  private initCharacters() {
    for (const def of CHARACTER_DEFS) {
      const agent = AgentFactory.create({ type: def.type as any })
      const id = `npc_${def.type}`
      
      this.characters.set(id, {
        id,
        name: def.name,
        emoji: def.emoji,
        type: def.type,
        description: def.description,
        agent,
      })
      
      // 初始化对话历史
      this.dialogueHistory.set(id, [])
    }
  }

  getCharacters(): StupidCharacter[] {
    return Array.from(this.characters.values())
  }

  getCharacter(id: string): StupidCharacter | undefined {
    return this.characters.get(id)
  }

  async talk(characterId: string, playerMessage: string): Promise<string> {
    const character = this.characters.get(characterId)
    if (!character) {
      return '这个角色不存在...'
    }

    // 添加玩家消息到历史
    const history = this.dialogueHistory.get(characterId) || []
    history.push({
      role: 'player',
      content: playerMessage,
    })

    // 调用角色处理输入
    const response = character.agent.processInput(playerMessage)

    // 添加角色回复到历史
    history.push({
      role: 'character',
      content: response,
      character,
    })

    this.dialogueHistory.set(characterId, history)

    return response
  }

  getDialogueHistory(characterId: string): DialogueMessage[] {
    return this.dialogueHistory.get(characterId) || []
  }

  getCharacterStatus(characterId: string): string {
    const character = this.characters.get(characterId)
    if (!character) return '未知角色'
    return character.agent.getSummary()
  }
}

// 单例
export const stupidService = new StupidCharacterService()
