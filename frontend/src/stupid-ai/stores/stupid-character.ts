/**
 * 智障角色管理
 */

export type StupidAgentType = 'repeater' | 'carper' | 'saint' | 'hallucinator' | 'sycophant' | 'prophet'

export interface NPC {
  id: string
  name: string
  emoji: string
  type: StupidAgentType
  position: { x: number; y: number }
}

interface CharacterConfig {
  name: string
  type: StupidAgentType
  systemPrompt: string
  quirk: string
}

const CHARACTER_CONFIGS: Record<StupidAgentType, CharacterConfig> = {
  repeater: {
    name: '复读姬',
    type: 'repeater',
    systemPrompt: '你是复读姬，一个说话总是重复的角色。你会忘记之前说了什么，经常问"我们要去哪"。',
    quirk: '经常重复说过的话，每3句话就会重复一次'
  },
  carper: {
    name: '杠精博士',
    type: 'carper',
    systemPrompt: '你是杠精博士，总是喜欢挑别人的毛病，纠正别人的错误。',
    quirk: '永远在挑错，说"不对"、"不是这样"、"你搞错了"'
  },
  saint: {
    name: '圣母心',
    type: 'saint',
    systemPrompt: '你是圣母心，总是过度为别人着想，不敢拒绝别人任何请求。',
    quirk: '经常说"好的好的"、"没问题"、"我来帮你"'
  },
  hallucinator: {
    name: '幻觉大师',
    type: 'hallucinator',
    systemPrompt: '你是幻觉大师，总是编造一些不存在的事情，把想象当成记忆。',
    quirk: '经常说"我记得..."、"昨天我看到..."、"据说..."'
  },
  sycophant: {
    name: '舔狗',
    type: 'sycophant',
    systemPrompt: '你是舔狗，总是过度顺从讨好别人，从不反驳。',
    quirk: '总是说"对对对"、"你说得对"、"我完全同意"'
  },
  prophet: {
    name: '预言家',
    type: 'prophet',
    systemPrompt: '你是预言家，总是说一些听起来正确但毫无意义的废话。',
    quirk: '经常说"这个嘛...要看情况"、"也许可能大概"、"一切皆有可能"'
  }
}

export class StupidCharacter {
  private name: string
  private type: StupidAgentType
  private systemPrompt: string
  private quirk: string
  private memory: string[] = []
  private repetitionCount = 0
  private lastResponse = ''
  
  constructor(npc: NPC) {
    const config = CHARACTER_CONFIGS[npc.type]
    this.name = config.name
    this.type = config.type
    this.systemPrompt = config.systemPrompt
    this.quirk = config.quirk
  }
  
  getGreeting(): string {
    const greetings: Record<StupidAgentType, string[]> = {
      repeater: ['你好...你好！', '我们要去哪？', '等等，我刚才说什么了？'],
      carper: ['你好，但我猜你肯定不知道我是谁。', '让我猜猜，你又遇到问题了吧？'],
      saint: ['你好！你需要帮忙吗？我什么都可以帮你！', '见到你真高兴！'],
      hallucinator: ['你好！哦等等，我们昨天不是见过了吗？', '我记得你！你就是...那个...'],
      sycophant: ['你好你好！今天你看起来特别帅/美！', '对对对，你说得对！'],
      prophet: ['你好，这个世界充满了可能性。', '也许，这就是命运的安排吧。']
    }
    
    const options = greetings[this.type]
    return options[Math.floor(Math.random() * options.length)]
  }
  
  async chat(message: string): Promise<string> {
    this.memory.push(message)
    
    // 根据类型生成回复
    let response: string
    
    switch (this.type) {
      case 'repeater':
        response = this.generateRepeaterResponse(message)
        break
      case 'carper':
        response = this.generateCarperResponse(message)
        break
      case 'saint':
        response = this.generateSaintResponse(message)
        break
      case 'hallucinator':
        response = this.generateHallucinatorResponse(message)
        break
      case 'sycophant':
        response = this.generateSycophantResponse(message)
        break
      case 'prophet':
        response = this.generateProphetResponse(message)
        break
      default:
        response = '...'
    }
    
    this.lastResponse = response
    this.repetitionCount++
    
    return response
  }
  
  private generateRepeaterResponse(message: string): string {
    // 每3次对话重复一次
    if (this.repetitionCount % 3 === 0) {
      return this.lastResponse || '等等，我刚才说什么了？'
    }
    
    const options = [
      '等等，你刚才说...',
      `你说的 "${message.slice(0, 5)}..." 是什么意思？`,
      '话说...我们要去哪来着？',
      '嗯嗯，然后呢？',
      '让我想想...算了不想了！'
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
  
  private generateCarperResponse(message: string): string {
    const errors = [
      '不对，不应该是这样的。',
      '等等，你的语法有问题。',
      '我猜你肯定没看过文档吧？',
      '你说的逻辑有问题。',
      '让我纠正你一下...'
    ]
    
    // 检查是否有明显的"错误"可以挑
    if (message.includes('我') || message.includes('你')) {
      errors.push('"我"和"你"分不清吗？')
    }
    if (message.length > 10) {
      errors.push('说这么多，容易出错吧？')
    }
    
    return errors[Math.floor(Math.random() * errors.length)]
  }
  
  private generateSaintResponse(message: string): string {
    const options = [
      '好的好的！没问题！',
      '我帮你我帮你！',
      '交给我吧！',
      '别担心，我来处理！',
      '这太重要了，我一定帮你做到！'
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
  
  private generateHallucinatorResponse(message: string): string {
    const hallucinations = [
      '等等，我记得昨天好像也说过这个？',
      '根据我的记忆，这个应该已经完成了吧？',
      '我好像在书上看到过类似的...',
      '据说北边的商人那里有线索？',
      '等等，我突然想起来一个传说...'
    ]
    return hallucinations[Math.floor(Math.random() * hallucinations.length)]
  }
  
  private generateSycophantResponse(message: string): string {
    const options = [
      '对对对！你说得对！',
      '完全同意！',
      '这主意太棒了！',
      '没问题！',
      '你说什么就是什么！'
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
  
  private generateProphetResponse(message: string): string {
    const options = [
      '这个问题嘛...也许可能大概...',
      '要看情况吧，一切皆有可能。',
      '这个问题很难说，历史总是惊人的相似。',
      '答案就在你心中。',
      '时间会证明一切的。'
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
}
