import { Card, TowerFloor, Agent } from '@/types';

// ============= 卡牌常量 =============
export const CARD_ICONS: Record<string, string> = {
  attack: '⚔️',
  defense: '🛡️',
  skill: '✨',
  buff: '💪',
  debuff: '💀',
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#FFFFFF',
  rare: '#22C55E',
  epic: '#3B82F6',
  legendary: '#A855F7',
};

export const RARITY_BORDER_COLORS: Record<string, string> = {
  common: 'border-white/50',
  rare: 'border-green-500/50',
  epic: 'border-blue-500/50',
  legendary: 'border-purple-500/50',
};

// 预设卡牌池 (50张)
export const CARD_POOL: Card[] = [
  // 普通卡 (Common) - 15张
  { id: 'c1', name: '重击', type: 'attack', rarity: 'common', cost: 1, icon: '⚔️', description: '造成100%攻击力的伤害', effect: { type: 'damage', value: 100 } },
  { id: 'c2', name: '防御姿态', type: 'defense', rarity: 'common', cost: 1, icon: '🛡️', description: '获得30点护盾', effect: { type: 'shield', value: 30 } },
  { id: 'c3', name: '轻疗术', type: 'skill', rarity: 'common', cost: 1, icon: '💊', description: '恢复15%最大生命', effect: { type: 'heal', value: 15 } },
  { id: 'c4', name: '冲刺', type: 'buff', rarity: 'common', cost: 0, icon: '💨', description: '下回合速度+20%', effect: { type: 'buff_self', value: 20, duration: 1, condition: 'speed' } },
  { id: 'c5', name: '虚弱', type: 'debuff', rarity: 'common', cost: 1, icon: '😵', description: '敌人攻击力-15%，持续2回合', effect: { type: 'debuff_enemy', value: 15, duration: 2, condition: 'attack' } },
  { id: 'c6', name: '猛击', type: 'attack', rarity: 'common', cost: 1, icon: '👊', description: '造成90%攻击力的伤害', effect: { type: 'damage', value: 90 } },
  { id: 'c7', name: '护盾', type: 'defense', rarity: 'common', cost: 1, icon: '🛡️', description: '获得25点护盾', effect: { type: 'shield', value: 25 } },
  { id: 'c8', name: '急救', type: 'skill', rarity: 'common', cost: 1, icon: '🩹', description: '恢复10%最大生命', effect: { type: 'heal', value: 10 } },
  { id: 'c9', name: '蓄力', type: 'buff', rarity: 'common', cost: 0, icon: '🔥', description: '下回合攻击力+15%', effect: { type: 'buff_self', value: 15, duration: 1, condition: 'attack' } },
  { id: 'c10', name: '减速', type: 'debuff', rarity: 'common', cost: 1, icon: '🐌', description: '敌人速度-10%，持续2回合', effect: { type: 'debuff_enemy', value: 10, duration: 2, condition: 'speed' } },
  { id: 'c11', name: '突刺', type: 'attack', rarity: 'common', cost: 1, icon: '🗡️', description: '造成85%攻击力的伤害', effect: { type: 'damage', value: 85 } },
  { id: 'c12', name: '格挡', type: 'defense', rarity: 'common', cost: 1, icon: '🛡️', description: '获得35点护盾', effect: { type: 'shield', value: 35 } },
  { id: 'c13', name: '微疗', type: 'skill', rarity: 'common', cost: 0, icon: '💚', description: '恢复8%最大生命', effect: { type: 'heal', value: 8 } },
  { id: 'c14', name: '坚固', type: 'buff', rarity: 'common', cost: 0, icon: '🛡️', description: '下回合防御+20%', effect: { type: 'buff_self', value: 20, duration: 1, condition: 'defense' } },
  { id: 'c15', name: '破防', type: 'debuff', rarity: 'common', cost: 1, icon: '💔', description: '敌人防御-10%，持续2回合', effect: { type: 'debuff_enemy', value: 10, duration: 2, condition: 'defense' } },

  // 稀有卡 (Rare) - 15张
  { id: 'r1', name: '连击', type: 'attack', rarity: 'rare', cost: 2, icon: '⚡', description: '造成80%伤害2次', effect: { type: 'damage', value: 80, condition: 'double_hit' } },
  { id: 'r2', name: '铁壁', type: 'defense', rarity: 'rare', cost: 2, icon: '🏰', description: '获得50点护盾', effect: { type: 'shield', value: 50 } },
  { id: 'r3', name: '治愈波', type: 'skill', rarity: 'rare', cost: 2, icon: '🌊', description: '恢复30%最大生命', effect: { type: 'heal', value: 30 } },
  { id: 'r4', name: '疾风', type: 'buff', rarity: 'rare', cost: 1, icon: '🌪️', description: '速度+30%，持续1回合', effect: { type: 'buff_self', value: 30, duration: 1, condition: 'speed' } },
  { id: 'r5', name: '中毒', type: 'debuff', rarity: 'rare', cost: 2, icon: '☠️', description: '敌人每回合损失10%生命，持续3回合', effect: { type: 'debuff_enemy', value: 10, duration: 3, condition: 'poison' } },
  { id: 'r6', name: '双重打击', type: 'attack', rarity: 'rare', cost: 2, icon: '🎯', description: '造成75%伤害2次', effect: { type: 'damage', value: 75, condition: 'double_hit' } },
  { id: 'r7', name: '魔法盾', type: 'defense', rarity: 'rare', cost: 2, icon: '🔮', description: '获得60点护盾', effect: { type: 'shield', value: 60 } },
  { id: 'r8', name: '治疗术', type: 'skill', rarity: 'rare', cost: 2, icon: '💖', description: '恢复25%最大生命', effect: { type: 'heal', value: 25 } },
  { id: 'r9', name: '狂暴之力', type: 'buff', rarity: 'rare', cost: 1, icon: '😤', description: '攻击力+25%，持续1回合', effect: { type: 'buff_self', value: 25, duration: 1, condition: 'attack' } },
  { id: 'r10', name: '虚弱诅咒', type: 'debuff', rarity: 'rare', cost: 2, icon: '👻', description: '敌人攻击和防御-15%，持续2回合', effect: { type: 'debuff_enemy', value: 15, duration: 2, condition: 'all_stats' } },
  { id: 'r11', name: '穿刺', type: 'attack', rarity: 'rare', cost: 2, icon: '🗡️', description: '造成110%伤害，50%几率穿透护盾', effect: { type: 'damage', value: 110, condition: 'pierce' } },
  { id: 'r12', name: '反射盾', type: 'defense', rarity: 'rare', cost: 2, icon: '🔄', description: '获得40点护盾，反弹20%伤害', effect: { type: 'shield', value: 40, condition: 'reflect' } },
  { id: 'r13', name: '生命之泉', type: 'skill', rarity: 'rare', cost: 2, icon: '⛲', description: '恢复20%最大生命+清除一个debuff', effect: { type: 'heal', value: 20, condition: 'cleanse' } },
  { id: 'r14', name: '铁化', type: 'buff', rarity: 'rare', cost: 1, icon: '🛡️', description: '防御+35%，持续1回合', effect: { type: 'buff_self', value: 35, duration: 1, condition: 'defense' } },
  { id: 'r15', name: '腐蚀', type: 'debuff', rarity: 'rare', cost: 2, icon: '🧪', description: '敌人防御-25%，持续2回合', effect: { type: 'debuff_enemy', value: 25, duration: 2, condition: 'defense' } },

  // 史诗卡 (Epic) - 12张
  { id: 'e1', name: '旋风斩', type: 'attack', rarity: 'epic', cost: 3, icon: '🌀', description: '造成120%伤害，命中后回复10%伤害值的生命', effect: { type: 'damage', value: 120, condition: 'lifesteal' } },
  { id: 'e2', name: '圣光盾', type: 'defense', rarity: 'epic', cost: 2, icon: '✨', description: '获得80点护盾+驱散一个debuff', effect: { type: 'shield', value: 80, condition: 'cleanse' } },
  { id: 'e3', name: '群体治愈', type: 'skill', rarity: 'epic', cost: 3, icon: '🌟', description: '恢复25%最大生命，并清除一个debuff', effect: { type: 'heal', value: 25, condition: 'cleanse' } },
  { id: 'e4', name: '狂暴', type: 'buff', rarity: 'epic', cost: 2, icon: '👹', description: '攻击力+50%，防御-30%，持续2回合', effect: { type: 'buff_self', value: 50, duration: 2, condition: 'attack_down_defense' } },
  { id: 'e5', name: '诅咒', type: 'debuff', rarity: 'epic', cost: 3, icon: '💀', description: '敌人所有属性-20%，持续2回合', effect: { type: 'debuff_enemy', value: 20, duration: 2, condition: 'all_stats' } },
  { id: 'e6', name: '碎裂斩', type: 'attack', rarity: 'epic', cost: 3, icon: '💥', description: '造成150%伤害，无视30%防御', effect: { type: 'damage', value: 150, condition: 'ignore_defense' } },
  { id: 'e7', name: '不灭护盾', type: 'defense', rarity: 'epic', cost: 3, icon: '🛡️', description: '获得100点护盾+1回合免疫', effect: { type: 'shield', value: 100, condition: 'immunity' } },
  { id: 'e8', name: '神圣治疗', type: 'skill', rarity: 'epic', cost: 3, icon: '🙏', description: '恢复40%最大生命', effect: { type: 'heal', value: 40 } },
  { id: 'e9', name: '分身术', type: 'buff', rarity: 'epic', cost: 2, icon: '👥', description: '复制一张手牌', effect: { type: 'buff_self', value: 1, condition: 'duplicate' } },
  { id: 'e10', name: '沉默', type: 'debuff', rarity: 'epic', cost: 3, icon: '🤐', description: '敌人下一回合无法使用技能卡', effect: { type: 'debuff_enemy', value: 0, duration: 1, condition: 'silence' } },
  { id: 'e11', name: '雷霆一击', type: 'attack', rarity: 'epic', cost: 3, icon: '⚡', description: '造成180%伤害，30%几率眩晕敌人1回合', effect: { type: 'damage', value: 180, condition: 'stun' } },
  { id: 'e12', name: '坚不可摧', type: 'defense', rarity: 'epic', cost: 3, icon: '🏛️', description: '获得150点护盾', effect: { type: 'shield', value: 150 } },

  // 传说卡 (Legendary) - 8张
  { id: 'l1', name: '龙息', type: 'attack', rarity: 'legendary', cost: 5, icon: '🐉', description: '造成200%伤害，但自身受到50%反噬', effect: { type: 'damage', value: 200, condition: 'self_damage' } },
  { id: 'l2', name: '不死之身', type: 'defense', rarity: 'legendary', cost: 4, icon: '💫', description: '当生命<30%时，免疫下一次致命伤害', effect: { type: 'special', value: 0, condition: 'cheat_death' } },
  { id: 'l3', name: '生命汲取', type: 'skill', rarity: 'legendary', cost: 4, icon: '🩸', description: '造成100%伤害的伤害，并恢复等量生命', effect: { type: 'damage', value: 100, condition: 'lifesteal_full' } },
  { id: 'l4', name: '时间静止', type: 'buff', rarity: 'legendary', cost: 5, icon: '⏰', description: '下回合敌人无法行动', effect: { type: 'buff_self', value: 0, duration: 1, condition: 'freeze' } },
  { id: 'l5', name: '灵魂收割', type: 'debuff', rarity: 'legendary', cost: 5, icon: '💀', description: '造成50%最大生命的伤害（无视防御）', effect: { type: 'damage', value: 50, condition: 'max_hp_damage' } },
  { id: 'l6', name: '灭世陨石', type: 'attack', rarity: 'legendary', cost: 5, icon: '☄️', description: '造成250%伤害，附带燃烧效果', effect: { type: 'damage', value: 250, condition: 'burn' } },
  { id: 'l7', name: '复苏之风', type: 'skill', rarity: 'legendary', cost: 4, icon: '🌬️', description: '恢复50%最大生命，清除所有debuff', effect: { type: 'heal', value: 50, condition: 'full_cleanse' } },
  { id: 'l8', name: '诸神黄昏', type: 'attack', rarity: 'legendary', cost: 5, icon: '🌋', description: '造成300%伤害，但本回合无法再行动', effect: { type: 'damage', value: 300, condition: 'exhaust' } },
];

// 卡牌稀有度权重（用于随机抽取）
export const RARITY_WEIGHTS: Record<string, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

// 初始卡组（5张随机卡）
export const INITIAL_CARDS_COUNT = 5;

// ============= 塔层常量 =============
export const TOWER_FLOORS: TowerFloor[] = [];

// 生成100层塔
const FLOOR_NAMES = [
  '新手草原', '幽暗森林', '迷雾沼泽', '荆棘之地', '翠绿山谷', '古老废墟', '诅咒墓穴', '幽灵古堡', '暗影洞穴', '烈焰山口',
  '碎石荒原', '枯萎森林', '毒雾谷', '暗礁海岸', '荒芜沙漠', '炽热沙丘', '金色绿洲', '风蚀峡谷', '断崖绝壁', '风暴之巅',
  '熔岩河流', '火山脚下', '灰烬平原', '熔岩之心', '黑曜石殿', '燃烧废墟', '烈焰祭坛', '地狱火海', '深渊入口', '深渊之眼',
  '寒霜荒原', '冰封森林', '冰川裂隙', '极寒之地', '暴风雪原', '冰晶洞穴', '永恒冻土', '冰霜王座', '极北之门', '极寒深渊',
  '虚空裂隙', '扭曲空间', '虚无领域', '暗能量海', '黑洞边缘', '时空乱流', '维度夹缝', '混沌之地', '虚空之心', '虚空王座',
  '深渊地狱', '硫磺之海', '业火焚原', '血池地狱', '骷髅祭坛', '亡灵之地', '暗影领主殿', '黑暗深渊', '绝望之地', '最终地狱',
  '永恒殿堂', '天使圣域', '神圣之光', '光明之巅', '彩虹之桥', '星辉草原', '月光森林', '星辰大海', '银河彼岸', '永恒星域',
  '神罚之巅', '审判之地', '裁决之厅', '命运之轮', '因果轮回', '生死之门', '轮回之井', '往生之道', '成神之路', '神王宝座',
  '世界之巅', '苍穹之顶', '九天之上', '万界归一', '宇宙起源', '混沌初开', '太初之境', '虚无永劫', '永恒不灭', '终极形态',
];

for (let i = 1; i <= 100; i++) {
  const difficulty = 1 + (i - 1) * 0.05;
  const isNodeFloor = i % 10 === 0 || i % 10 === 5;
  
  TOWER_FLOORS.push({
    floor: i,
    name: FLOOR_NAMES[Math.floor((i - 1) / 10)] || `第${i}层`,
    difficulty: Math.round(difficulty * 100) / 100,
    hpMultiplier: 1 + (i - 1) * 0.05,
    atkMultiplier: 1 + (i - 1) * 0.04,
    defMultiplier: 1 + (i - 1) * 0.03,
    spdMultiplier: 1 + (i - 1) * 0.02,
    rewardExp: 100 + i * 10,
    unlockLevel: Math.max(1, Math.floor(i / 10)),
  });
}

// ============= 经验常量 =============
export const EXP_BASE = 100;
export const EXP_PER_LEVEL = 100;

// ============= 属性成长常量 =============
export const BASE_STATS = {
  hp: 100,
  attack: 20,
  defense: 10,
  speed: 50,
};

export const LEVEL_GROWTH = {
  hp: 20,
  attack: 5,
  defense: 3,
  speed: 2,
};

// ============= 战斗常量 =============
export const BATTLE_CONFIG = {
  baseHitChance: 70,
  critThreshold: 95,
  dodgeThreshold: 5,
  maxEnergy: 10,
  startingHandSize: 3,
};

// ============= AI名字池 =============
export const AI_NAMES = [
  '黑暗骑士', '烈焰法师', '冰霜女王', '雷霆战神', '幻影刺客',
  '神圣牧师', '死亡领主', '风暴使者', '龙族守护', '暗夜精灵',
  '机械战神', '元素大师', '暗影猎手', '光明圣徒', '地狱火魔',
];

export const AI_AVATARS = [
  '🦇', '🐺', '🦊', '🐉', '🦅', '🦁', '🐺', '🦇', '🕷️', '🐍',
  '⚔️', '🔮', '🛡️', '💀', '👹', '🤖', '🌟', '🌙', '🔥', '❄️',
];

// ============= 奖励常量 =============
export const CARD_REWARD_INTERVAL = 5; // 每5层奖励卡牌
export const RARE_CARD_INTERVAL = 10;  // 每10层奖励稀有卡
export const DEATH_EXP_RETENTION = 0.8; // 死亡后经验保留80%

// ============= 创建默认Agent =============
export function createDefaultAgent(): Agent {
  return {
    id: 'player-agent',
    name: '无名勇士',
    avatar: '⚔️',
    level: 1,
    exp: 0,
    expToNext: EXP_BASE,
    hp: BASE_STATS.hp,
    maxHp: BASE_STATS.hp,
    attack: BASE_STATS.attack,
    defense: BASE_STATS.defense,
    speed: BASE_STATS.speed,
    currentHp: BASE_STATS.hp,
    shield: 0,
    cards: [],
    maxCards: 30,
    isDead: false,
    deathCount: 0,
    buffs: [],
  };
}

// ============= 随机获取卡牌 =============
export function getRandomCard(rarity?: string): Card {
  let pool: Card[];
  
  if (rarity) {
    pool = CARD_POOL.filter(c => c.rarity === rarity);
  } else {
    // 根据权重随机选择稀有度
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedRarity = 'common';
    
    for (const [rar, weight] of Object.entries(RARITY_WEIGHTS)) {
      random -= weight;
      if (random <= 0) {
        selectedRarity = rar;
        break;
      }
    }
    pool = CARD_POOL.filter(c => c.rarity === selectedRarity);
  }
  
  const card = pool[Math.floor(Math.random() * pool.length)];
  return { ...card, id: `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
}

export function getRandomCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(getRandomCard());
  }
  return cards;
}

// ============= 获取初始卡组 =============
export function getInitialCards(): Card[] {
  const cards: Card[] = [];
  // 2张普通
  for (let i = 0; i < 2; i++) cards.push(getRandomCard('common'));
  // 2张稀有
  for (let i = 0; i < 2; i++) cards.push(getRandomCard('rare'));
  // 1张随机
  cards.push(getRandomCard());
  return cards;
}
