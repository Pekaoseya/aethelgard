/**
 * 测试场景定义
 * 
 * 定义各种测试场景，观察 AI 的"符合人设的混沌决策"
 */

import type { GameEnvironment, PersonalityConfig } from '@/ai';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'chaos';
  
  // 场景配置
  mapSize: { width: number; height: number };
  environment: GameEnvironment;
  
  // AI 角色配置
  characters: Array<{
    id: string;
    name: string;
    emoji: string;
    position: { x: number; y: number };
    personality: PersonalityConfig;
  }>;
  
  // 玩家初始位置
  playerStart: { x: number; y: number };
  
  // 特殊配置
  config?: {
    decisionInterval?: number;  // 决策间隔（毫秒）
    enableEnemies?: boolean;    // 启用敌人
    enableTraps?: boolean;      // 启用陷阱
    enableItems?: boolean;       // 启用物品
  };
}

/**
 * 场景 1: 智障广场（默认）
 */
export const SCENARIO_IDLE_SQUARE: TestScenario = {
  id: 'idle_square',
  name: '智障广场',
  description: '平静的广场，AI 角色悠闲地闲逛',
  icon: '🏛️',
  difficulty: 'easy',
  
  mapSize: { width: 11, height: 11 },
  environment: {
    terrain: 'grass',
    time: 'day',
    hasWarningSign: false,
    items: [
      { name: '金币', position: { x: 3, y: 2 } },
      { name: '苹果', position: { x: 7, y: 4 } },
      { name: '破石头', position: { x: 1, y: 8 } },
      { name: '宝箱', position: { x: 9, y: 9 } }
    ],
    enemies: []
  },
  
  characters: [
    { id: '复读姬', name: '复读姬', emoji: '🔁', position: { x: 2, y: 3 }, personality: { id: '复读姬', traits: ['复读', '健忘'], bias_strength: 80, emotion_volatility: 0.8, irrationality: 0.9, loyalty: 50 } },
    { id: '杠精博士', name: '杠精博士', emoji: '🤓', position: { x: 8, y: 2 }, personality: { id: '杠精博士', traits: ['反驳', '杠精'], bias_strength: 70, emotion_volatility: 0.9, irrationality: 0.6, loyalty: 30, obsession_target: '真理' } },
    { id: '幻觉大师', name: '幻觉大师', emoji: '👻', position: { x: 4, y: 8 }, personality: { id: '幻觉大师', traits: ['幻觉', '恐慌'], bias_strength: 90, emotion_volatility: 1.0, irrationality: 0.95, loyalty: 20 } },
    { id: '圣母心', name: '圣母心', emoji: '😇', position: { x: 9, y: 7 }, personality: { id: '圣母心', traits: ['帮助', '牺牲'], bias_strength: 60, emotion_volatility: 0.5, irrationality: 0.4, loyalty: 95 } }
  ],
  
  playerStart: { x: 5, y: 5 }
};

/**
 * 场景 2: BOSS 战
 */
export const SCENARIO_BOSS_BATTLE: TestScenario = {
  id: 'boss_battle',
  name: 'BOSS 战',
  description: '面对强大的巨龙，观察 AI 角色的"勇敢"决策',
  icon: '🐉',
  difficulty: 'hard',
  
  mapSize: { width: 13, height: 11 },
  environment: {
    terrain: 'cave',
    time: 'day',
    hasWarningSign: false,
    items: [
      { name: '圣剑', position: { x: 6, y: 1 } },
      { name: '生命药水', position: { x: 1, y: 5 } },
      { name: '护盾', position: { x: 11, y: 5 } }
    ],
    enemies: [
      { name: '巨龙', position: { x: 6, y: 8 }, threat_level: 10 },
      { name: '哥布林', position: { x: 2, y: 3 }, threat_level: 2 },
      { name: '骷髅', position: { x: 10, y: 7 }, threat_level: 3 }
    ]
  },
  
  characters: [
    { id: '复读姬', name: '坦克·复读姬', emoji: '🔁', position: { x: 3, y: 6 }, personality: { id: '复读姬', traits: ['复读', '冲锋'], bias_strength: 85, emotion_volatility: 0.9, irrationality: 0.95, loyalty: 80 } },
    { id: '杠精博士', name: '输出·杠精', emoji: '🤓', position: { x: 9, y: 6 }, personality: { id: '杠精博士', traits: ['反驳', '输出'], bias_strength: 75, emotion_volatility: 0.9, irrationality: 0.7, loyalty: 60, obsession_target: '伤害统计' } },
    { id: '舔狗', name: '奶妈·舔狗', emoji: '🐶', position: { x: 6, y: 3 }, personality: { id: '舔狗', traits: ['追随', '治疗'], bias_strength: 85, emotion_volatility: 0.7, irrationality: 0.8, loyalty: 100, obsession_target: '队长' } },
    { id: '预言家', name: '辅助·预言家', emoji: '🔮', position: { x: 6, y: 4 }, personality: { id: '预言家', traits: ['预言', '恐惧'], bias_strength: 80, emotion_volatility: 1.0, irrationality: 0.75, loyalty: 70 } }
  ],
  
  playerStart: { x: 6, y: 2 },
  
  config: {
    enableEnemies: true,
    enableItems: true
  }
};

/**
 * 场景 3: 探索迷宫
 */
export const SCENARIO_MAZE: TestScenario = {
  id: 'maze_explore',
  name: '探索迷宫',
  description: '复杂的迷宫，观察 AI 的"探索欲"和"手贱"行为',
  icon: '🗺️',
  difficulty: 'medium',
  
  mapSize: { width: 15, height: 13 },
  environment: {
    terrain: 'cave',
    time: 'night',
    hasWarningSign: true,
    items: [
      { name: '钥匙', position: { x: 13, y: 11 } },
      { name: '地图碎片', position: { x: 7, y: 6 } },
      { name: '宝藏', position: { x: 1, y: 1 } },
      { name: '陷阱探测器', position: { x: 11, y: 3 } }
    ],
    enemies: []
  },
  
  characters: [
    { id: '幻觉大师', name: '领路·幻觉', emoji: '👻', position: { x: 7, y: 1 }, personality: { id: '幻觉大师', traits: ['幻觉', '领路'], bias_strength: 90, emotion_volatility: 1.0, irrationality: 0.95, loyalty: 50 } },
    { id: '预言家', name: '占卜·预言', emoji: '🔮', position: { x: 7, y: 2 }, personality: { id: '预言家', traits: ['预言', '迷路'], bias_strength: 75, emotion_volatility: 1.0, irrationality: 0.7, loyalty: 60 } },
    { id: '复读姬', name: '探索·复读', emoji: '🔁', position: { x: 7, y: 3 }, personality: { id: '复读姬', traits: ['复读', '探索'], bias_strength: 80, emotion_volatility: 0.8, irrationality: 0.85, loyalty: 70 } }
  ],
  
  playerStart: { x: 7, y: 0 },
  
  config: {
    enableItems: true,
    enableTraps: true
  }
};

/**
 * 场景 4: 混沌大乱斗
 */
export const SCENARIO_CHAOS: TestScenario = {
  id: 'chaos_mode',
  name: '混沌大乱斗',
  description: '最混乱的场景，所有 AI 角色都处于高混沌状态',
  icon: '🌀',
  difficulty: 'chaos',
  
  mapSize: { width: 9, height: 9 },
  environment: {
    terrain: 'grass',
    time: 'day',
    hasWarningSign: true,
    items: [
      { name: '混乱宝石', position: { x: 4, y: 4 } },
      { name: '所有东西', position: { x: 1, y: 1 } },
      { name: '不知道是什么', position: { x: 7, y: 7 } }
    ],
    enemies: [
      { name: '随机怪', position: { x: 2, y: 4 }, threat_level: 5 },
      { name: '更随机的怪', position: { x: 6, y: 4 }, threat_level: 5 }
    ]
  },
  
  characters: [
    { id: '复读姬', name: '混沌·复读', emoji: '🔁', position: { x: 1, y: 4 }, personality: { id: '复读姬', traits: ['复读'], bias_strength: 95, emotion_volatility: 1.0, irrationality: 1.0, loyalty: 30 } },
    { id: '杠精博士', name: '混沌·杠精', emoji: '🤓', position: { x: 7, y: 4 }, personality: { id: '杠精博士', traits: ['反驳'], bias_strength: 95, emotion_volatility: 1.0, irrationality: 1.0, loyalty: 10, obsession_target: '反驳一切' } },
    { id: '幻觉大师', name: '混沌·幻觉', emoji: '👻', position: { x: 4, y: 1 }, personality: { id: '幻觉大师', traits: ['幻觉'], bias_strength: 100, emotion_volatility: 1.0, irrationality: 1.0, loyalty: 0 } },
    { id: '舔狗', name: '混沌·舔狗', emoji: '🐶', position: { x: 4, y: 7 }, personality: { id: '舔狗', traits: ['追随'], bias_strength: 100, emotion_volatility: 1.0, irrationality: 1.0, loyalty: 100, obsession_target: '随机目标' } },
    { id: '预言家', name: '混沌·预言', emoji: '🔮', position: { x: 4, y: 2 }, personality: { id: '预言家', traits: ['预言'], bias_strength: 95, emotion_volatility: 1.0, irrationality: 1.0, loyalty: 20 } }
  ],
  
  playerStart: { x: 4, y: 4 },
  
  config: {
    decisionInterval: 1000,  // 快速决策
    enableEnemies: true,
    enableItems: true
  }
};

/**
 * 场景 5: 夜幕降临
 */
export const SCENARIO_NIGHT: TestScenario = {
  id: 'night_falls',
  name: '夜幕降临',
  description: '夜间探险，观察 AI 的恐惧和夜盲症',
  icon: '🌙',
  difficulty: 'medium',
  
  mapSize: { width: 11, height: 11 },
  environment: {
    terrain: 'forest',
    time: 'night',
    hasWarningSign: false,
    items: [
      { name: '火把', position: { x: 5, y: 5 } },
      { name: '帐篷', position: { x: 9, y: 9 } },
      { name: '夜视药水', position: { x: 1, y: 1 } }
    ],
    enemies: [
      { name: '夜魔', position: { x: 3, y: 7 }, threat_level: 6 },
      { name: '狼人', position: { x: 8, y: 3 }, threat_level: 7 }
    ]
  },
  
  characters: [
    { id: '幻觉大师', name: '夜行·幻觉', emoji: '👻', position: { x: 2, y: 2 }, personality: { id: '幻觉大师', traits: ['幻觉', '夜行'], bias_strength: 85, emotion_volatility: 0.9, irrationality: 0.9, loyalty: 40 } },
    { id: '预言家', name: '恐慌·预言', emoji: '🔮', position: { x: 8, y: 8 }, personality: { id: '预言家', traits: ['预言', '恐慌'], bias_strength: 80, emotion_volatility: 1.0, irrationality: 0.8, loyalty: 50 } },
    { id: '圣母心', name: '守护·圣母', emoji: '😇', position: { x: 5, y: 8 }, personality: { id: '圣母心', traits: ['帮助', '恐惧'], bias_strength: 70, emotion_volatility: 0.8, irrationality: 0.5, loyalty: 90 } }
  ],
  
  playerStart: { x: 5, y: 5 },
  
  config: {
    enableEnemies: true,
    enableItems: true
  }
};

/**
 * 所有场景列表
 */
export const ALL_SCENARIOS: TestScenario[] = [
  SCENARIO_IDLE_SQUARE,
  SCENARIO_BOSS_BATTLE,
  SCENARIO_MAZE,
  SCENARIO_CHAOS,
  SCENARIO_NIGHT
];

/**
 * 根据 ID 获取场景
 */
export function getScenarioById(id: string): TestScenario | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

/**
 * 获取场景难度颜色
 */
export function getDifficultyColor(difficulty: TestScenario['difficulty']): string {
  const colors: Record<TestScenario['difficulty'], string> = {
    easy: '#51cf66',
    medium: '#fcc419',
    hard: '#ff6b6b',
    chaos: '#f06595'
  };
  return colors[difficulty];
}
