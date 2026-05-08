/**
 * 游戏状态管理
 */
import { defineStore } from 'pinia'
import { StupidCharacter, type NPC } from './stupid-character'

interface Message {
  speaker: 'player' | 'npc'
  content: string
}

export const useGameStore = defineStore('game', {
  state: () => ({
    // 游戏状态
    gameStarted: false,
    
    // 玩家状态
    playerPosition: { x: 5, y: 5 },
    
    // 地图
    currentMap: '起始小镇',
    
    // NPC 列表
    npcs: [
      {
        id: 'npc1',
        name: '复读姬',
        emoji: '🔄',
        type: 'repeater' as const,
        position: { x: 3, y: 5 }
      },
      {
        id: 'npc2',
        name: '杠精博士',
        emoji: '🧐',
        type: 'carper' as const,
        position: { x: 7, y: 3 }
      },
      {
        id: 'npc3',
        name: '幻觉大师',
        emoji: '👻',
        type: 'hallucinator' as const,
        position: { x: 8, y: 7 }
      },
      {
        id: 'npc4',
        name: '圣母心',
        emoji: '😇',
        type: 'saint' as const,
        position: { x: 2, y: 8 }
      }
    ] as NPC[],
    
    // 对话状态
    dialogueActive: false,
    currentNPC: null as NPC | null,
    currentCharacter: null as StupidCharacter | null,
    messages: [] as Message[],
    playerInput: '',
    isTyping: false,
  }),
  
  actions: {
    startGame() {
      this.gameStarted = true
    },
    
    movePlayer(dx: number, dy: number) {
      if (this.dialogueActive) return
      
      const newX = this.playerPosition.x + dx
      const newY = this.playerPosition.y + dy
      
      // 边界检查
      if (newX < 0 || newX > 10 || newY < 0 || newY > 10) return
      
      // 碰撞检测（简单版）
      // 墙壁：x + y 是 7 的倍数
      // if ((newX + newY) % 7 === 0) return
      
      this.playerPosition.x = newX
      this.playerPosition.y = newY
    },
    
    startDialogue(npc: NPC) {
      this.dialogueActive = true
      this.currentNPC = npc
      this.currentCharacter = new StupidCharacter(npc)
      this.messages = []
      
      // NPC 开场白
      const greeting = this.currentCharacter.getGreeting()
      this.messages.push({
        speaker: 'npc',
        content: greeting
      })
    },
    
    async sendMessage() {
      if (!this.playerInput.trim() || !this.currentCharacter) return
      
      const input = this.playerInput.trim()
      this.playerInput = ''
      
      // 添加玩家消息
      this.messages.push({
        speaker: 'player',
        content: input
      })
      
      // 显示打字中
      this.isTyping = true
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
      
      // 获取回复
      this.isTyping = false
      const response = await this.currentCharacter.chat(input)
      
      this.messages.push({
        speaker: 'npc',
        content: response
      })
    },
    
    closeDialogue() {
      this.dialogueActive = false
      this.currentNPC = null
      this.currentCharacter = null
      this.messages = []
      this.playerInput = ''
      this.isTyping = false
    }
  }
})
