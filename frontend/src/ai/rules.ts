/**
 * AI 行为规则配置
 * 
 * 包含三大规则集：
 * A. 战斗逻辑：名为"勇猛"的送死
 * B. 探索逻辑：名为"好奇"的作死
 * C. 社交逻辑：名为"团魂"的内讧
 */

import type { RuleConfig, CombatRule, ExploreRule, SocialRule } from './types';

/**
 * 战斗规则配置
 */
export const COMBAT_RULES: Record<string, CombatRule> = {
  // 盲目自信
  blindConfidence: {
    id: 'blind_confidence',
    name: '盲目自信',
    description: '如果目标看起来像怪物（如史莱姆），基础分 +50，无视等级差距',
    condition: (context) => {
      return context.target?.threat_level <= 2 && context.target?.type === 'enemy';
    },
    modifier: 50,
    stackable: true
  },

  // 友军误伤
  friendlyFire: {
    id: 'friendly_fire',
    name: '友军误伤',
    description: '如果队友挡在弹道上，有 30% 概率忽略队友继续攻击（并道歉）',
    condition: (context) => {
      return context.allyBlocking && Math.random() < 0.3;
    },
    modifier: 20,
    special: 'ignore_ally'
  },

  // 捡漏王
  opportunist: {
    id: 'opportunist',
    name: '捡漏王',
    description: '如果敌人快死了，追击分数 +80%',
    condition: (context) => {
      return context.target?.hp && context.target.hp < 20;
    },
    modifier: 80,
    type: 'multiplier'
  },

  // 路痴逃跑
  lostWhenFleeing: {
    id: 'lost_when_fleeing',
    name: '路痴',
    description: '逃跑方向判定失败率 +40%（可能跑向怪物群）',
    condition: (context) => {
      return context.action === 'flee';
    },
    modifier: -40,
    special: 'wrong_direction'
  },

  // 战斗狂热
  battleRage: {
    id: 'battle_rage',
    name: '战斗狂热',
    description: '血量高于 50% 时，攻击倾向 +30%',
    condition: (context) => {
      return context.self?.hp && context.self.hp > 50;
    },
    modifier: 30
  },

  // 破罐破摔
  nothingToLose: {
    id: 'nothing_to_lose',
    name: '破罐破摔',
    description: '血量低于 20% 时，攻击倾向 +50%，防御倾向 -30%',
    condition: (context) => {
      return context.self?.hp && context.self.hp < 20;
    },
    modifier: 50,
    type: 'attack_boost'
  },

  // 盾牌强迫症
  shieldObsession: {
    id: 'shield_obsession',
    name: '盾牌强迫症',
    description: '有盾牌时，防御倾向 +40%',
    condition: (context) => {
      return context.self?.inventory?.includes('shield');
    },
    modifier: 40,
    type: 'defend_boost'
  },

  // 武器嫉妒
  weaponEnvy: {
    id: 'weapon_envy',
    name: '武器嫉妒',
    description: '如果敌人武器比自己的好，攻击欲望 +60%',
    condition: (context) => {
      return context.target?.hasBetterWeapon;
    },
    modifier: 60
  }
};

/**
 * 探索规则配置
 */
export const EXPLORE_RULES: Record<string, ExploreRule> = {
  // 拾荒者
  scavenger: {
    id: 'scavenger',
    name: '拾荒者',
    description: '即使是"破损的石头"或"垃圾"，也会赋予极高的分数',
    condition: () => true,
    modifier: 40,
    type: 'pickup_boost'
  },

  // 非我莫属
  mineMineMine: {
    id: 'mine_mine_mine',
    name: '非我莫属',
    description: '如果队友正在拾取某物，抢夺该物品的分数 +100',
    condition: (context) => {
      return context.allyAction === 'pickup' && context.allyDistance < 3;
    },
    modifier: 100
  },

  // 手贱
  triggerHappy: {
    id: 'trigger_happy',
    name: '手贱',
    description: '看到按钮/拉杆，必须互动的冲动 +90%，即使旁边写着"不要按"',
    condition: (context) => {
      return context.environment?.hasWarningSign;
    },
    modifier: 90,
    special: 'ignore_warning'
  },

  // 好奇心害死猫
  curiosityKilledCat: {
    id: 'curiosity_killed_cat',
    name: '好奇心害死猫',
    description: '未知区域探索欲望 +70%',
    condition: (context) => {
      return context.environment?.terrain === 'unknown';
    },
    modifier: 70
  },

  // 恐高症
  acrophobia: {
    id: 'acrophobia',
    name: '恐高症',
    description: '高处探索欲望 -60%',
    condition: (context) => {
      return context.environment?.terrain === 'high_place';
    },
    modifier: -60
  },

  // 水恐惧症
  aquaphobia: {
    id: 'aquaphobia',
    name: '水恐惧症',
    description: '水域探索欲望 -50%，游泳时恐慌 +30%',
    condition: (context) => {
      return context.environment?.terrain === 'water';
    },
    modifier: -50,
    type: 'panic_boost'
  },

  // 夜盲症
  nightBlindness: {
    id: 'night_blindness',
    name: '夜盲症',
    description: '夜间探索效率 -40%',
    condition: (context) => {
      return context.environment?.time === 'night';
    },
    modifier: -40
  },

  // 宝箱强迫症
  chestObsession: {
    id: 'chest_obsession',
    name: '宝箱强迫症',
    description: '看到宝箱，走不开，优先级 +200%',
    condition: (context) => {
      return context.perception?.some(p => p.type === 'item' && p.name.includes('chest'));
    },
    modifier: 200,
    type: 'priority_override'
  },

  // 抄近路
  shortcutSeeker: {
    id: 'shortcut_seeker',
    name: '抄近路',
    description: '总是想找捷径，-30% 走正常路径的欲望',
    condition: () => true,
    modifier: -30,
    type: 'normal_path_penalty'
  }
};

/**
 * 社交规则配置
 */
export const SOCIAL_RULES: Record<string, SocialRule> = {
  // 羊群效应
  sheepEffect: {
    id: 'sheep_effect',
    name: '羊群效应',
    description: '如果超过2个队友在做同一件蠢事，跟随分数 +200%',
    condition: (context) => {
      return context.allyActions && 
             Object.values(context.allyActions).filter(a => a.includes('stupid')).length >= 2;
    },
    modifier: 200,
    type: 'follow_boost'
  },

  // 掉队
  laggingBehind: {
    id: 'lagging_behind',
    name: '掉队',
    description: '每移动10步，有10%概率停下来"看风景"或"发呆"',
    condition: (context) => {
      return context.self?.stepsTaken && 
             context.self.stepsTaken % 10 === 0 && 
             Math.random() < 0.1;
    },
    modifier: -100,
    special: 'stop_to_admire'
  },

  // 废话连篇
  nonsenseTalker: {
    id: 'nonsense_talker',
    name: '废话连篇',
    description: '80%的对话内容是无关紧要的感叹，只有20%是有效战术信息',
    condition: () => true,
    modifier: 0,
    special: 'filter_talk',
    type: 'talk_efficiency'
  },

  // 甩锅侠
  blameShifter: {
    id: 'blame_shifter',
    name: '甩锅侠',
    description: '失败时甩锅给队友的概率 +60%',
    condition: () => true,
    modifier: 60,
    type: 'blame_boost',
    trigger: 'on_failure'
  },

  // 复读机
  parrotMode: {
    id: 'parrot_mode',
    name: '复读机',
    description: '有30%概率重复队友最后一句话',
    condition: () => Math.random() < 0.3,
    modifier: 0,
    special: 'repeat_ally'
  },

  // 杠精
  contrarian: {
    id: 'contrarian',
    name: '杠精',
    description: '队友说什么都要反驳，60%概率说相反的话',
    condition: () => Math.random() < 0.6,
    modifier: 0,
    special: 'contradict_ally',
    type: 'social_negativity'
  },

  // 舔狗
  sycophant: {
    id: 'sycophant',
    name: '舔狗',
    description: '对特定角色（可能是队长/强者）好感度 +80%',
    condition: (context) => {
      return context.ally?.role === 'leader' || context.ally?.strength > 80;
    },
    modifier: 80,
    type: 'affinity_boost'
  },

  // 孤狼
  loneWolf: {
    id: 'lone_wolf',
    name: '孤狼',
    description: '独立行动倾向 +50%，跟随倾向 -40%',
    condition: () => true,
    modifier: 50,
    type: 'independence'
  },

  // 复读姬
  repeater: {
    id: 'repeater',
    name: '复读姬',
    description: '重复自己说过的最后一句话',
    condition: () => Math.random() < 0.5,
    modifier: 0,
    special: 'repeat_self'
  }
};

/**
 * 组合所有规则
 */
export const ALL_RULES: Record<string, RuleConfig> = {
  ...COMBAT_RULES,
  ...EXPLORE_RULES,
  ...SOCIAL_RULES
};

/**
 * 根据上下文计算规则应用
 */
export function evaluateRules(
  rules: Record<string, RuleConfig>,
  context: any
): { appliedRules: RuleConfig[]; totalModifier: number } {
  const appliedRules: RuleConfig[] = [];
  let totalModifier = 0;

  for (const rule of Object.values(rules)) {
    if (rule.condition(context)) {
      appliedRules.push(rule);
      if (rule.type === 'multiplier') {
        totalModifier *= (1 + rule.modifier / 100);
      } else {
        totalModifier += rule.modifier;
      }
    }
  }

  return { appliedRules, totalModifier };
}

/**
 * 获取规则描述
 */
export function describeRules(rules: RuleConfig[]): string {
  return rules.map(r => `${r.name}(${r.modifier > 0 ? '+' : ''}${r.modifier})`).join(', ');
}
