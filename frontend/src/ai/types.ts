/**
 * 智障探险队 AI 决策规则引擎
 * 
 * 核心设计理念：效用驱动的"性格缺陷"
 * 不追求最优解，追求"符合人设的混沌决策"
 */

// ============== 核心类型定义 ==============

/** 感知数据 - 来自 rpg-mcp-engine 的环境信息 */
export interface PerceptionData {
    self: SelfStatus;
    environment: EnvironmentStatus;
    perception: PerceptionItem[];
}

export interface SelfStatus {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    position: Position;
    status: string[];        // 状态效果，如 ["poisoned", "stunned"]
    inventory: string[];     // 背包物品
    role: 'tank' | 'healer' | 'damage' | 'support';
}

export interface Position {
    x: number;
    y: number;
}

export interface EnvironmentStatus {
    terrain: 'grass' | 'water' | 'mountain' | 'cave' | 'town';
    time: 'dawn' | 'day' | 'dusk' | 'night';
    weather: 'clear' | 'rain' | 'storm' | 'snow';
    inCombat: boolean;
}

export interface PerceptionItem {
    type: 'enemy' | 'item' | 'ally' | 'npc' | 'object' | 'danger';
    name: string;
    distance: number;        // 距离（格子数）
    threatLevel?: number;    // 威胁等级 1-10
    value?: number;          // 物品价值
    action?: string;         // 盟友当前动作
    interactable?: boolean;  // 是否可交互
    dangerous?: boolean;     // 是否有危险
    description?: string;    // 描述信息
}

/** 可能的动作 */
export type ActionType = 
    | 'move' | 'attack' | 'pickup' | 'use_item' | 'talk'
    | 'flee' | 'defend' | 'inspect' | 'interact' | 'follow'
    | 'wait' | 'help' | 'cast_skill';

/** 动作结构 */
export interface Action {
    type: ActionType;
    target?: string;         // 目标名称
    item?: string;           // 使用的物品
    direction?: 'up' | 'down' | 'left' | 'right';
    message?: string;        // 对话内容
    position?: Position;     // 当前位置
    confidence: number;      // 执行这个动作的置信度 0-100
}

/** AI 性格配置 */
export interface PersonalityConfig {
    id: string;
    name: string;
    emoji: string;
    
    // 基础属性
    confidence: number;      // 自信度 0-100，影响盲目决策
    curiosity: number;      // 好奇心 0-100，影响探索冲动
    greed: number;          // 贪心 0-100，影响拾取判断
    loyalty: number;        // 团队意识 0-100，影响跟随/帮助
    
    // 性格缺陷（核心特色）
    quirks: PersonalityQuirk[];
    
    // 混沌因子
    chaosLevel: number;     // 整体混沌程度 0-100
}

export interface PersonalityQuirk {
    id: string;
    name: string;
    description: string;
    triggerCondition: (perception: PerceptionData) => boolean;
    effect: (action: Action, perception: PerceptionData) => ActionModification;
}

export interface ActionModification {
    scoreBonus: number;      // 分数加成
    overrideAction?: Action; // 强制替换动作
    probability: number;     // 触发概率 0-1
    message?: string;        // 触发时的吐槽
}

// ============== 情绪系统 ==============

export interface EmotionalState {
    // 核心情绪值 (0-100)
    excitement: number;      // 兴奋度
    frustration: number;     // 挫折感
    fear: number;           // 恐惧感
    anger: number;          // 愤怒值
    
    // 连续计数
    successStreak: number;     // 连续成功次数
    failureStreak: number;      // 连续失败次数
    
    // 当前状态
    currentMood: Mood;
    panicLevel: number;         // 恐慌等级 0-100
}

export type Mood = 
    | 'confident'   // 自信
    | 'cautious'   // 谨慎
    | 'excited'     // 兴奋
    | 'frustrated' // 受挫
    | 'panicked'    // 恐慌
    | 'enraged';    // 暴怒

// ============== 记忆系统 ==============

export interface MemoryEntry {
    id: string;
    timestamp: number;
    type: 'success' | 'failure' | 'discovery' | 'social' | 'trauma';
    description: string;
    // 记忆可能有误
    isAccurate: boolean;    // 记忆是否准确
    actualOutcome?: string;  // 真实结果（如果记忆有误）
    emotionalImpact: number; // 情绪影响 -100 到 100
    timesRecalled: number;  // 被回忆次数
}

export interface MemoryState {
    entries: MemoryEntry[];
    maxEntries: number;
    
    // 当前执念（AI 会反复提到的事）
    obsessions: string[];
    
    // 创伤事件（会导致回避行为）
    traumas: string[];  // 但可能记错是什么导致了创伤
}

// ============== 决策上下文 ==============

export interface DecisionContext {
    personality: PersonalityConfig;
    emotions: EmotionalState;
    memories: MemoryState;
    
    // 回合信息
    turnNumber: number;
    lastAction?: Action;
    lastActionOutcome?: 'success' | 'failure' | 'neutral';
}

// ============== 混沌系统 ==============

/** 混沌动作类型 */
export interface ChaosAction extends Action {
    chaosType?: string;
    chaosReason?: string;
}

/** 混沌配置文件 */
export interface ChaosProfile {
    id: string;
    name: string;
    baseChaosLevel: number;
    emotionAmplifier: number;
}

export default {
    PerceptionData,
    Action,
    PersonalityConfig,
    EmotionalState,
    MemoryEntry
};
