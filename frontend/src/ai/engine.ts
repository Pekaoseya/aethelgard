/**
 * 智障探险队 AI 决策引擎
 * 
 * 整合记忆模块、情绪模块、混沌注入和规则配置
 * 实现三阶段决策流程：过滤器 → 效用计算 → 混沌注入
 */

import type { 
  PerceptionData, 
  Action, 
  PersonalityConfig, 
  DecisionContext,
  ChaosAction
} from './types';
import { MemoryModule } from './memory';
import { EmotionModule } from './emotions';
import { ChaosModule, ChaosType } from './chaos';
import { ALL_RULES, COMBAT_RULES, EXPLORE_RULES, SOCIAL_RULES, evaluateRules, describeRules } from './rules';

/** 引擎配置 */
export interface EngineConfig {
  chaosLevel: number;
  enableDebug: boolean;
  memorySize: number;
  emotionDecayRate: number;
}

/** 默认引擎配置 */
const DEFAULT_CONFIG: EngineConfig = {
  chaosLevel: 30,
  enableDebug: false,
  memorySize: 50,
  emotionDecayRate: 0.1
};

/**
 * AI 决策引擎
 */
export class AIDecisionEngine {
  private config: EngineConfig;
  private personality: PersonalityConfig;
  
  private memory: MemoryModule;
  private emotions: EmotionModule;
  private chaos: ChaosModule;

  constructor(personality: PersonalityConfig, config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.personality = personality;

    // 初始化各模块
    this.memory = new MemoryModule(this.config.memorySize, personality.bias_strength);
    this.emotions = new EmotionModule({ 
      decayRate: this.config.emotionDecayRate 
    });
    this.chaos = new ChaosModule({
      baseChaosLevel: this.config.chaosLevel
    });
  }

  /**
   * 主决策方法
   * 三阶段：可行性过滤 → 效用计算 → 混沌注入
   */
  decide(
    perception: PerceptionData,
    availableActions: Action[]
  ): Action & { reasoning: string; emotionalState: string } {
    const debug: string[] = [];

    // === 阶段一：可行性过滤 ===
    debug.push('【阶段一】可行性过滤');
    const feasibleActions = this.filterFeasibleActions(perception, availableActions);
    debug.push(`  可行动作: ${feasibleActions.map(a => a.type).join(', ')}`);

    if (feasibleActions.length === 0) {
      debug.push('  → 无可行动作，等待');
      return this.createWaitAction('没有可行的动作');
    }

    // === 阶段二：效用计算 ===
    debug.push('【阶段二】效用计算');
    const scoredActions = this.calculateUtility(perception, feasibleActions);
    
    // 排序选择最高分
    scoredActions.sort((a, b) => b.finalScore - a.finalScore);
    const bestAction = scoredActions[0];
    
    debug.push(`  最高分: ${bestAction.type} = ${bestAction.finalScore.toFixed(1)}`);
    debug.push(`  详情: ${describeRules(bestAction.appliedRules)}`);

    // === 阶段三：混沌注入 ===
    debug.push('【阶段三】混沌注入');
    const chaosLevel = this.chaos.calculateChaosLevel(this.emotions.getState().emotions);
    const chaosModifiedAction = this.chaos.inject(
      bestAction,
      chaosLevel
    );

    let finalAction: Action;
    let reasoning: string;

    if (chaosModifiedAction) {
      debug.push(`  → 混沌介入! 类型: ${chaosModifiedAction.chaosType}`);
      debug.push(`  → 理由: ${chaosModifiedAction.reason}`);
      finalAction = chaosModifiedAction;
      reasoning = chaosModifiedAction.reason || bestAction.reason;
    } else {
      debug.push('  → 正常决策');
      finalAction = bestAction;
      reasoning = bestAction.reason;
    }

    // 记录动作
    this.chaos.recordAction(finalAction);

    // 更新记忆
    this.memory.addMemory(
      this.getActionType(finalAction),
      `${finalAction.type}: ${finalAction.target}`,
      this.getEmotionImpact(finalAction)
    );

    // 情绪影响
    const emotionalState = this.emotions.getMoodDescription();

    if (this.config.enableDebug) {
      console.log(debug.join('\n'));
    }

    return {
      ...finalAction,
      reasoning,
      emotionalState
    };
  }

  /**
   * 阶段一：可行性过滤
   * 剔除当前无法执行的动作
   */
  private filterFeasibleActions(
    perception: PerceptionData,
    actions: Action[]
  ): Action[] {
    return actions.filter(action => {
      // 检查库存
      if (action.requiresItem && !perception.self.inventory?.includes(action.requiresItem)) {
        return false;
      }
      
      // 检查状态限制
      if (action.requiresStatus && !perception.self.status?.includes(action.requiresStatus)) {
        return false;
      }
      
      // 检查距离
      if (action.maxDistance && action.distance > action.maxDistance) {
        return false;
      }

      // 检查禁止状态
      if (perception.self.status?.includes('paralyzed') && action.type === 'move') {
        return false;
      }

      if (perception.self.status?.includes('silenced') && action.type === 'talk') {
        return false;
      }

      return true;
    });
  }

  /**
   * 阶段二：效用计算
   * 公式: Score = (Base × W_situation) + Bias + Noise
   */
  private calculateUtility(
    perception: PerceptionData,
    actions: Action[]
  ): Array<Action & { finalScore: number; appliedRules: any[] }> {
    const emotionState = this.emotions.getState();
    const context = this.buildContext(perception);
    
    // 获取相关规则集
    const relevantRules = this.selectRelevantRules(actions);

    return actions.map(action => {
      // 1. 计算基础分
      let baseScore = action.baseScore || 50;

      // 2. 情境权重
      const situationModifier = this.calculateSituationModifier(action, perception);
      baseScore *= situationModifier;

      // 3. 性格偏差
      const personalityBias = this.calculatePersonalityBias(action);
      baseScore += personalityBias;

      // 4. 应用规则
      const { appliedRules, totalModifier } = evaluateRules(relevantRules, {
        ...context,
        action: action.type,
        self: perception.self,
        environment: perception.environment,
        perception: perception.perception
      });
      baseScore += totalModifier;

      // 5. 情绪影响
      const emotionModifier = this.emotions.getModifier(action.type);
      baseScore *= emotionModifier;

      // 6. 记忆影响
      const memoryModifier = this.calculateMemoryModifier(action);
      baseScore *= memoryModifier;

      // 7. 混沌噪声
      const noise = (Math.random() - 0.5) * 20 * (this.personality.bias_strength / 50);
      baseScore += noise;

      // 8. 执念加成
      if (this.hasObsession(action)) {
        baseScore *= 1.5;
      }

      // 9. 创伤回避
      if (this.hasTrauma(action)) {
        baseScore *= 0.3;
      }

      return {
        ...action,
        finalScore: Math.max(0, baseScore),
        appliedRules
      };
    });
  }

  /**
   * 选择相关规则集
   */
  private selectRelevantRules(actions: Action[]): Record<string, any> {
    const actionTypes = actions.map(a => a.type);
    
    // 根据动作类型选择规则
    if (actionTypes.some(t => ['attack', 'defend', 'flee'].includes(t))) {
      return { ...COMBAT_RULES };
    }
    if (actionTypes.some(t => ['pickup', 'inspect', 'interact'].includes(t))) {
      return { ...EXPLORE_RULES };
    }
    if (actionTypes.some(t => ['follow', 'talk', 'wait'].includes(t))) {
      return { ...SOCIAL_RULES };
    }
    
    return ALL_RULES;
  }

  /**
   * 计算情境权重
   */
  private calculateSituationModifier(action: Action, perception: PerceptionData): number {
    let modifier = 1.0;

    // 血量相关
    const hpRatio = perception.self.hp / perception.self.max_hp;
    if (action.type === 'attack' && hpRatio > 0.8) {
      modifier *= 1.2;  // 满血更敢打
    }
    if (action.type === 'flee' && hpRatio < 0.3) {
      modifier *= 2.0;  // 低血量优先逃跑
    }

    // 敌人相关
    if (action.type === 'attack') {
      const threatLevel = perception.perception
        .filter(p => p.type === 'enemy')
        .reduce((max, e) => Math.max(max, e.threat_level || 0), 0);
      modifier *= (1 + threatLevel * 0.1);
    }

    // 时间相关
    if (perception.environment?.time === 'night') {
      if (action.type === 'explore') modifier *= 0.5;
      if (action.type === 'flee') modifier *= 1.3;
    }

    return modifier;
  }

  /**
   * 计算性格偏差
   */
  private calculatePersonalityBias(action: Action): number {
    let bias = 0;

    // 根据性格配置调整
    if (this.personality.id === '复读姬') {
      if (action.type === 'repeat') bias += 100;
    }
    if (this.personality.id === '杠精博士') {
      if (action.type === 'contradict') bias += 80;
    }
    if (this.personality.id === '圣母心') {
      if (action.type === 'help') bias += 80;
      if (action.type === 'attack') bias -= 40;
    }
    if (this.personality.id === '舔狗') {
      if (action.type === 'follow') bias += 100;
      if (action.target === this.personality.obsession_target) bias += 200;
    }

    return bias * (this.personality.bias_strength / 50);
  }

  /**
   * 计算记忆影响
   */
  private calculateMemoryModifier(action: Action): number {
    // 检查是否有相关创伤
    const traumaCheck = this.memory.checkTrauma(action.target || '');
    if (traumaCheck.hasTrauma) {
      return 0.3;  // 减少创伤相关动作
    }

    // 执念加成
    if (this.hasObsession(action)) {
      return 1.5;
    }

    return 1.0;
  }

  /**
   * 检查是否有执念
   */
  private hasObsession(action: Action): boolean {
    const obsessions = this.memory.getObsessions();
    const actionStr = `${action.type} ${action.target}`.toLowerCase();
    return obsessions.some(o => actionStr.includes(o.toLowerCase()));
  }

  /**
   * 检查是否有创伤
   */
  private hasTrauma(action: Action): boolean {
    const traumaCheck = this.memory.checkTrauma(action.target || '');
    return traumaCheck.hasTrauma;
  }

  /**
   * 构建决策上下文
   */
  private buildContext(perception: PerceptionData): DecisionContext {
    const context: DecisionContext = {
      self: perception.self,
      environment: perception.environment,
      perception: perception.perception
    };
    return context;
  }

  /**
   * 创建等待动作
   */
  private createWaitAction(reason: string): Action & { reasoning: string; emotionalState: string } {
    return {
      type: 'wait',
      target: '原地',
      baseScore: 0,
      reason,
      reasoning: reason,
      emotionalState: this.emotions.getMoodDescription()
    };
  }

  /**
   * 获取动作类型用于记忆
   */
  private getActionType(action: Action): 'success' | 'failure' | 'discovery' | 'trauma' | 'social' {
    if (action.type === 'attack' && action.effectiveness && action.effectiveness < 0) {
      return 'failure';
    }
    if (action.type === 'pickup') return 'discovery';
    if (action.type === 'talk') return 'social';
    return 'success';
  }

  /**
   * 获取情绪影响
   */
  private getEmotionImpact(action: Action): number {
    if (action.type === 'attack' && action.effectiveness && action.effectiveness > 0) {
      return 10;
    }
    if (action.effectiveness && action.effectiveness < -50) {
      return -20;
    }
    return 0;
  }

  /**
   * 回合结束：更新状态
   */
  tick(): void {
    this.emotions.tick();
  }

  /**
   * 记录失败
   */
  recordFailure(intensity: number = 10): void {
    this.emotions.recordFailure(intensity);
    this.memory.addMemory('failure', '任务失败了', -intensity);
  }

  /**
   * 记录成功
   */
  recordSuccess(intensity: number = 10): void {
    this.emotions.recordSuccess(intensity);
    this.memory.addMemory('success', '任务成功了！', intensity);
  }

  /**
   * 获取状态摘要
   */
  getStatus(): string {
    return `
【${this.personality.id}】状态报告
━━━━━━━━━━━━━━━━━━━━
心情: ${this.emotions.getMoodDescription()}
记忆: ${this.memory.getSummary()}
━━━━━━━━━━━━━━━━━━━━
${this.config.enableDebug ? this.emotions.debug() : ''}
    `.trim();
  }

  /**
   * 获取调试信息
   */
  getDebug(): {
    memory: any;
    emotions: any;
    chaos: any;
    personality: PersonalityConfig;
  } {
    return {
      memory: this.memory.getSummary(),
      emotions: this.emotions.getState(),
      chaos: this.chaos.getStats(),
      personality: this.personality
    };
  }
}

export default AIDecisionEngine;
