/**
 * 混沌注入模块
 * 
 * 核心特点：
 * 1. 让 AI 做出"脑子抽风"的决定
 * 2. 混沌程度可调（从"稍微有点傻"到"彻底发疯"）
 * 3. 与情绪系统联动（暴躁时更容易抽风）
 * 4. 特定场景触发特殊混沌
 */

import type { ChaosAction, ChaosProfile } from './types';

/** 混沌类型枚举 */
export enum ChaosType {
    RANDOM = 'random',           // 随机行动
    CONTRADICT = 'contradict',   // 做相反的事
    SPAM = 'spam',              // 重复同一个动作
    IGNORE = 'ignore',          // 忽略明显提示
    BLAME = 'blame',            // 甩锅
    DELAY = 'delay',            // 拖延症
    OVERTHINK = 'overthink',    // 想太多
    UNDERTHINK = 'underthink',  // 不过脑子
    SUPERSTITION = 'superstition' // 迷信行为
}

/** 混沌配置 */
export interface ChaosConfig {
  baseChaosLevel: number;      // 基础混沌度 0-100
  emotionAmplifier: number;    // 情绪放大器
  criticalFailureChance: number; // 关键失败概率
  blessingChance: number;      // 意外好运概率
}

/** 默认混沌配置 */
const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  baseChaosLevel: 30,
  emotionAmplifier: 0.5,
  criticalFailureChance: 0.05,
  blessingChance: 0.03
};

export class ChaosModule {
  private config: ChaosConfig;
  private recentActions: ChaosAction[] = [];
  private superstitionCount: number = 0;
  private contradictionStreak: number = 0;

  constructor(config: Partial<ChaosConfig> = {}) {
    this.config = { ...DEFAULT_CHAOS_CONFIG, ...config };
  }

  /**
   * 计算实际混沌值（基础 + 情绪放大）
   */
  calculateChaosLevel(emotionState?: { angry?: number; confused?: number; bored?: number }): number {
    let chaos = this.config.baseChaosLevel;

    if (emotionState) {
      // 愤怒增加混沌
      if (emotionState.angry) {
        chaos += emotionState.angry * this.config.emotionAmplifier;
      }
      // 混乱增加混沌
      if (emotionState.confused) {
        chaos += emotionState.confused * this.config.emotionAmplifier * 1.5;
      }
      // 无聊增加混沌
      if (emotionState.bored) {
        chaos += emotionState.bored * this.config.emotionAmplifier * 0.8;
      }
    }

    return Math.min(100, Math.max(0, chaos));
  }

  /**
   * 注入混沌
   * 返回混沌动作或 null（正常决策）
   */
  inject(action: ChaosAction, currentChaos: number): ChaosAction | null {
    const roll = Math.random() * 100;

    // 低于混沌阈值才可能触发混沌
    if (roll > currentChaos) {
      return null;
    }

    const chaosType = this.rollChaosType(currentChaos);
    return this.executeChaos(action, chaosType);
  }

  /**
   * 根据混沌程度掷骰决定混沌类型
   */
  private rollChaosType(chaosLevel: number): ChaosType {
    const roll = Math.random() * 100;

    // 低混沌（< 30）：主要是小失误
    if (chaosLevel < 30) {
      if (roll < 40) return ChaosType.DELAY;
      if (roll < 70) return ChaosType.IGNORE;
      if (roll < 90) return ChaosType.UNDERTHINK;
      return ChaosType.RANDOM;
    }

    // 中混沌（30-60）：开始有性格缺陷
    if (chaosLevel < 60) {
      if (roll < 20) return ChaosType.DELAY;
      if (roll < 35) return ChaosType.IGNORE;
      if (roll < 50) return ChaosType.UNDERTHINK;
      if (roll < 65) return ChaosType.OVERTHINK;
      if (roll < 80) return ChaosType.SUPERSTITION;
      if (roll < 95) return ChaosType.RANDOM;
      return ChaosType.CONTRADICT;
    }

    // 高混沌（60+）：彻底发疯
    if (roll < 15) return ChaosType.DELAY;
    if (roll < 25) return ChaosType.IGNORE;
    if (roll < 35) return ChaosType.CONTRADICT;
    if (roll < 50) return ChaosType.SUPERSTITION;
    if (roll < 70) return ChaosType.OVERTHINK;
    if (roll < 90) return ChaosType.SPAM;
    return ChaosType.RANDOM;
  }

  /**
   * 执行混沌效果
   */
  private executeChaos(action: ChaosAction, type: ChaosType): ChaosAction {
    switch (type) {
      case ChaosType.RANDOM:
        return this.executeRandomChaos(action);
      
      case ChaosType.CONTRADICT:
        return this.executeContradict(action);
      
      case ChaosType.SPAM:
        return this.executeSpam(action);
      
      case ChaosType.IGNORE:
        return this.executeIgnore(action);
      
      case ChaosType.DELAY:
        return this.executeDelay(action);
      
      case ChaosType.OVERTHINK:
        return this.executeOverthink(action);
      
      case ChaosType.UNDERTHINK:
        return this.executeUnderthink(action);
      
      case ChaosType.SUPERSTITION:
        return this.executeSuperstition(action);
      
      default:
        return action;
    }
  }

  /**
   * 随机混沌：做完全无关的事
   */
  private executeRandomChaos(action: ChaosAction): ChaosAction {
    const randomActions = [
      { type: 'inspect', target: 'shoes', reason: '突然想看看鞋子' },
      { type: 'yell', target: 'sky', reason: '对着天空大喊' },
      { type: 'sit', target: 'ground', reason: '突然想坐下' },
      { type: 'count', target: 'clouds', reason: '开始数云' },
      { type: 'inspect', target: 'nose', reason: '检查鼻子' },
      { type: 'talk', target: 'self', reason: '自言自语' },
      { type: 'jump', target: '原地', reason: '不知道为什么想跳' }
    ];

    const random = randomActions[Math.floor(Math.random() * randomActions.length)];
    return {
      ...action,
      type: random.type,
      target: random.target,
      reason: `[混沌随机] ${random.reason}`,
      chaosType: ChaosType.RANDOM,
      effectiveness: 0
    };
  }

  /**
   * 矛盾混沌：做完全相反的事
   */
  private executeContradict(action: ChaosAction): ChaosAction {
    this.contradictionStreak++;
    
    const opposites: Record<string, string[]> = {
      'attack': ['defend', 'flee'],
      'pickup': ['drop', 'ignore'],
      'talk': ['ignore', 'attack'],
      'follow': ['flee', 'go_opposite'],
      'defend': ['attack', 'flee'],
      'flee': ['attack', 'follow'],
      'use': ['drop', 'inspect'],
      'inspect': ['ignore', 'destroy']
    };

    const oppositesForAction = opposites[action.type] || ['wait'];
    const opposite = oppositesForAction[Math.floor(Math.random() * oppositesForAction.length)];

    return {
      ...action,
      type: opposite,
      reason: `[混沌矛盾] 明明要${action.type}，突然就不想了！`,
      chaosType: ChaosType.CONTRADICT,
      effectiveness: -20
    };
  }

  /**
   * 重复混沌：一直做同样的事
   */
  private executeSpam(action: ChaosAction): ChaosAction {
    const lastSame = this.recentActions
      .filter(a => a.type === action.type)
      .length;

    if (lastSame >= 2) {
      return {
        ...action,
        reason: `[混沌重复] 已经在${action.type}了，继续！`,
        chaosType: ChaosType.SPAM,
        effectiveness: -30
      };
    }

    return {
      ...action,
      reason: `[混沌重复] ${action.reason}（再重复一次）`,
      chaosType: ChaosType.SPAM,
      effectiveness: -10
    };
  }

  /**
   * 忽略混沌：无视明显应该做的事
   */
  private executeIgnore(action: ChaosAction): ChaosAction {
    const ignoreReasons = [
      '假装没看到',
      '觉得不重要',
      '懒得管',
      '在发呆',
      '走神了'
    ];

    return {
      ...action,
      reason: `[混沌忽略] ${ignoreReasons[Math.floor(Math.random() * ignoreReasons.length)]}`,
      chaosType: ChaosType.IGNORE,
      effectiveness: -50
    };
  }

  /**
   * 拖延混沌：做别的事
   */
  private executeDelay(action: ChaosAction): ChaosAction {
    const delayActions = [
      { type: 'inspect', target: 'hands', reason: '先看看手' },
      { type: 'wait', target: '5秒', reason: '再等等看' },
      { type: 'talk', target: 'self', reason: '先念叨两句' },
      { type: 'inspect', target: 'around', reason: '环顾四周' },
      { type: 'wait', target: 'later', reason: '等一下' }
    ];

    const delay = delayActions[Math.floor(Math.random() * delayActions.length)];
    return {
      ...action,
      type: delay.type,
      target: delay.target,
      reason: `[混沌拖延] ${delay.reason}...再${action.type}`,
      chaosType: ChaosType.DELAY,
      effectiveness: -20
    };
  }

  /**
   * 过度思考混沌：想太多
   */
  private executeOverthink(action: ChaosAction): ChaosAction {
    const overthinking = [
      '这样做对吗？',
      '如果那样会怎样？',
      '队友会怎么想？',
      '万一失败了呢？',
      '历史会怎么评价？',
      '宇宙的终极意义是什么？'
    ];

    return {
      ...action,
      reason: `[混沌想太多] ${action.reason}...${overthinking[Math.floor(Math.random() * overthinking.length)]}`,
      chaosType: ChaosType.OVERTHINK,
      effectiveness: -30
    };
  }

  /**
   * 欠思考混沌：不过脑子
   */
  private executeUnderthink(action: ChaosAction): ChaosAction {
    return {
      ...action,
      reason: `[混沌欠思考] 管他呢！${action.reason}`,
      chaosType: ChaosType.UNDERTHINK,
      effectiveness: Math.random() > 0.5 ? 20 : -40  // 50% 好运，50% 白给
    };
  }

  /**
   * 迷信混沌：基于奇怪的迷信
   */
  private executeSuperstition(action: ChaosAction): ChaosAction {
    this.superstitionCount++;

    const superstitions = [
      { trigger: 'jump_before', action: 'jump', target: '先跳一下' },
      { trigger: 'lucky_number', action: 'count', target: '必须数到7' },
      { trigger: 'avoid_black', action: 'go_around', target: '绕开黑猫' },
      { trigger: 'knock_wood', action: 'knock', target: '敲敲木头' },
      { trigger: 'cross_fingers', action: 'wait', target: '先比个手势' }
    ];

    const superstition = superstitions[Math.floor(Math.random() * superstitions.length)];

    // 检查是否可以执行迷信动作
    if (this.superstitionCount % 3 === 0) {
      return {
        ...action,
        type: superstition.action,
        target: superstition.target,
        reason: `[混沌迷信] ${superstition.trigger}！`,
        chaosType: ChaosType.SUPERSTITION,
        effectiveness: -10
      };
    }

    return {
      ...action,
      reason: `[混沌迷信] ${superstition.trigger}...${action.reason}`,
      chaosType: ChaosType.SUPERSTITION,
      effectiveness: 0
    };
  }

  /**
   * 检查关键失败（随机灾难）
   */
  checkCriticalFailure(): ChaosAction | null {
    if (Math.random() < this.config.criticalFailureChance) {
      const failures = [
        { type: 'stumble', target: '摔倒', reason: '脚滑了', damage: 10 },
        { type: 'trip', target: '绊倒', reason: '被自己绊倒', damage: 5 },
        { type: 'confuse', target: '迷失', reason: '突然不认识路了', damage: 0 },
        { type: 'sneeze', target: '打喷嚏', reason: '打了个大喷嚏', damage: 0 }
      ];

      const failure = failures[Math.floor(Math.random() * failures.length)];
      return {
        type: failure.type,
        target: failure.target,
        reason: `[关键失败] ${failure.reason}`,
        chaosType: ChaosType.RANDOM,
        effectiveness: -100,
        damage: failure.damage
      };
    }

    return null;
  }

  /**
   * 检查意外好运
   */
  checkBlessing(): ChaosAction | null {
    if (Math.random() < this.config.blessingChance) {
      const blessings = [
        { type: 'found', target: '金币', reason: '地上捡到', bonus: 50 },
        { type: 'critical', target: '暴击', reason: '莫名其妙暴击了', bonus: 100 },
        { type: 'dodge', target: '闪避', reason: '刚好躲开了', bonus: 0 },
        { type: 'found', target: '道具', reason: '摸到了好东西', bonus: 75 }
      ];

      const blessing = blessings[Math.floor(Math.random() * blessings.length)];
      return {
        type: blessing.type,
        target: blessing.target,
        reason: `[意外好运] ${blessing.reason}`,
        chaosType: ChaosType.RANDOM,
        effectiveness: blessing.bonus
      };
    }

    return null;
  }

  /**
   * 记录动作
   */
  recordAction(action: ChaosAction): void {
    this.recentActions.push(action);
    if (this.recentActions.length > 10) {
      this.recentActions.shift();
    }
  }

  /**
   * 获取混沌统计
   */
  getStats(): { chaosLevel: number; recentChaos: ChaosAction[] } {
    return {
      chaosLevel: this.config.baseChaosLevel,
      recentChaos: this.recentActions.filter(a => a.chaosType)
    };
  }
}

export default ChaosModule;
