import { Agent, Card, AIOpponent, BattleState, RollResult, BattleLogEntry, Buff, TowerFloor, BuffType } from '@/types';
import { TOWER_FLOORS, BASE_STATS, LEVEL_GROWTH, AI_NAMES, AI_AVATARS, getRandomCard, getRandomCards, BATTLE_CONFIG, DEATH_EXP_RETENTION } from './constants';

// ============= Agent计算 =============
export function calculateAgentStats(level: number) {
  return {
    hp: BASE_STATS.hp + (level - 1) * LEVEL_GROWTH.hp,
    attack: BASE_STATS.attack + (level - 1) * LEVEL_GROWTH.attack,
    defense: BASE_STATS.defense + (level - 1) * LEVEL_GROWTH.defense,
    speed: BASE_STATS.speed + (level - 1) * LEVEL_GROWTH.speed,
  };
}

export function calculateExpToNext(level: number): number {
  return level * 100;
}

export function addExp(agent: Agent, amount: number): Agent {
  let newExp = agent.exp + amount;
  let newLevel = agent.level;
  let newExpToNext = calculateExpToNext(newLevel);
  const stats = calculateAgentStats(newLevel);
  
  while (newExp >= newExpToNext && newLevel < 100) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = calculateExpToNext(newLevel);
  }
  
  const newStats = calculateAgentStats(newLevel);
  
  return {
    ...agent,
    level: newLevel,
    exp: newExp,
    expToNext: newExpToNext,
    maxHp: newStats.hp,
    hp: newStats.hp,
    currentHp: agent.currentHp + (newStats.hp - stats.hp), // 升级时恢复额外血量
    attack: newStats.attack,
    defense: newStats.defense,
    speed: newStats.speed,
  };
}

// ============= Buff系统 =============
export function createBuff(type: BuffType, value: number, duration: number, name: string): Buff {
  return {
    id: `buff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    value,
    duration,
    name,
  };
}

export function applyBuff(agent: Agent, buff: Buff): Agent {
  const newBuffs = [...agent.buffs.filter(b => b.type !== buff.type), buff];
  return { ...agent, buffs: newBuffs };
}

export function tickBuffs(agent: Agent): Agent {
  const newBuffs = agent.buffs
    .map(b => ({ ...b, duration: b.duration - 1 }))
    .filter(b => b.duration > 0);
  return { ...agent, buffs: newBuffs };
}

export function getBuffModifier(agent: Agent, stat: string): number {
  let modifier = 0;
  for (const buff of agent.buffs) {
    if (buff.type === `${stat}_up`) modifier += buff.value;
    if (buff.type === `${stat}_down`) modifier -= buff.value;
  }
  return modifier;
}

export function getEffectiveStats(agent: Agent) {
  const atkMod = getBuffModifier(agent, 'attack');
  const defMod = getBuffModifier(agent, 'defense');
  const spdMod = getBuffModifier(agent, 'speed');
  
  return {
    attack: Math.max(1, agent.attack + atkMod),
    defense: Math.max(0, agent.defense + defMod),
    speed: Math.max(1, agent.speed + spdMod),
  };
}

export function cleanseDebuffs(agent: Agent): Agent {
  const newBuffs = agent.buffs.filter(b => !b.type.includes('_down'));
  return { ...agent, buffs: newBuffs };
}

// ============= 伤害计算 =============
export interface DamageResult {
  damage: number;
  isCrit: boolean;
  isDodge: boolean;
  isShieldBroken: boolean;
  actualDamage: number;
  selfDamage?: number;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 100) + 1;
}

export function checkHit(attackerSpeed: number, defenderSpeed: number, roll: number): { hit: boolean; type: 'crit' | 'dodge' | 'normal' | 'miss' } {
  const speedBonus = Math.floor((attackerSpeed - defenderSpeed) / 10);
  const hitThreshold = 30 - Math.max(-20, Math.min(20, speedBonus));
  
  if (roll <= BATTLE_CONFIG.dodgeThreshold) {
    return { hit: false, type: 'dodge' };
  }
  if (roll >= BATTLE_CONFIG.critThreshold) {
    return { hit: true, type: 'crit' };
  }
  if (roll > hitThreshold) {
    return { hit: true, type: 'normal' };
  }
  return { hit: false, type: 'miss' };
}

export function calculateDamage(
  attacker: Agent,
  defender: Agent,
  card: Card,
  roll: number
): DamageResult {
  const hitResult = checkHit(
    getEffectiveStats(attacker).speed,
    getEffectiveStats(defender).speed,
    roll
  );
  
  if (!hitResult.hit) {
    return {
      damage: 0,
      isCrit: false,
      isDodge: hitResult.type === 'dodge',
      isShieldBroken: false,
      actualDamage: 0,
    };
  }
  
  const attackerStats = getEffectiveStats(attacker);
  const defenderStats = getEffectiveStats(defender);
  
  let baseDamage = attackerStats.attack * (card.effect.value / 100);
  const critMultiplier = hitResult.type === 'crit' ? 2 : 1;
  let defenseReduction = 100 / (100 + defenderStats.defense);
  
  // 特殊条件
  if (card.effect.condition === 'ignore_defense') {
    defenseReduction = 0.7; // 只忽略30%防御
  }
  if (card.effect.condition === 'max_hp_damage') {
    baseDamage = defender.maxHp * (card.effect.value / 100);
    defenseReduction = 1; // 无视防御
  }
  if (card.effect.condition === 'double_hit') {
    baseDamage *= 0.8; // 双击降低单次伤害
  }
  
  const damage = Math.floor(baseDamage * defenseReduction * critMultiplier);
  
  // 自我伤害（如龙息）
  let selfDamage = 0;
  if (card.effect.condition === 'self_damage') {
    selfDamage = Math.floor(damage * 0.5);
  }
  
  // 护盾吸收
  let shieldDamage = 0;
  let actualDamage = damage;
  if (defender.shield > 0) {
    if (card.effect.condition === 'pierce') {
      // 穿透护盾
      actualDamage = damage;
      shieldDamage = Math.min(defender.shield, damage * 0.5);
    } else {
      shieldDamage = Math.min(defender.shield, damage);
      actualDamage = damage - shieldDamage;
    }
  }
  
  return {
    damage,
    isCrit: hitResult.type === 'crit',
    isDodge: false,
    isShieldBroken: shieldDamage > 0 && defender.shield <= shieldDamage,
    actualDamage,
    selfDamage,
  };
}

// ============= 卡牌效果应用 =============
export function applyCardEffect(
  actor: Agent,
  target: Agent,
  card: Card,
  roll: number
): { actor: Agent; target: Agent; logs: BattleLogEntry[] } {
  const actorStats = getEffectiveStats(actor);
  const logs: BattleLogEntry[] = [];
  let newActor = { ...actor };
  let newTarget = { ...target };
  
  switch (card.effect.type) {
    case 'damage': {
      const result = calculateDamage(actor, target, card, roll);
      
      if (result.isDodge) {
        logs.push({
          turn: 0,
          actor: 'system',
          message: `${target.name}闪避了攻击！`,
          type: 'dodge',
        });
      } else {
        // 自我伤害
        if (result.selfDamage) {
          newActor.currentHp = Math.max(1, newActor.currentHp - result.selfDamage);
          logs.push({
            turn: 0,
            actor: 'player',
            message: `${actor.name}受到${result.selfDamage}点反噬伤害！`,
            type: 'damage',
          });
        }
        
        // 护盾吸收
        if (result.isShieldBroken) {
          newTarget.shield = 0;
          logs.push({
            turn: 0,
            actor: 'system',
            message: `${target.name}的护盾被击碎！`,
            type: 'info',
          });
        } else if (result.isShieldBroken === false && newTarget.shield > 0) {
          newTarget.shield = Math.max(0, newTarget.shield - result.damage);
        }
        
        // 实际伤害
        newTarget.currentHp = Math.max(0, newTarget.currentHp - result.actualDamage);
        
        const logType = result.isCrit ? 'critical' : 'damage';
        const critText = result.isCrit ? '暴击！' : '';
        logs.push({
          turn: 0,
          actor: actor.id === 'player' ? 'player' : 'enemy',
          message: `${actor.name}使用${card.name}对${target.name}造成${result.actualDamage}点伤害${critText}`,
          type: logType,
        });
        
        // 双击效果
        if (card.effect.condition === 'double_hit' && result.actualDamage > 0) {
          const secondDamage = Math.floor(result.actualDamage * 0.8);
          newTarget.currentHp = Math.max(0, newTarget.currentHp - secondDamage);
          logs.push({
            turn: 0,
            actor: actor.id === 'player' ? 'player' : 'enemy',
            message: `${card.name}第二击造成${secondDamage}点伤害！`,
            type: 'damage',
          });
        }
        
        // 吸血效果
        if (card.effect.condition === 'lifesteal' && result.actualDamage > 0) {
          const healAmount = Math.floor(result.actualDamage * 0.1);
          newActor.currentHp = Math.min(newActor.maxHp, newActor.currentHp + healAmount);
          logs.push({
            turn: 0,
            actor: 'player',
            message: `${actor.name}回复${healAmount}点生命！`,
            type: 'heal',
          });
        }
        if (card.effect.condition === 'lifesteal_full' && result.actualDamage > 0) {
          newActor.currentHp = Math.min(newActor.maxHp, newActor.currentHp + result.actualDamage);
          logs.push({
            turn: 0,
            actor: 'player',
            message: `${actor.name}吸取${result.actualDamage}点生命！`,
            type: 'heal',
          });
        }
        
        // 燃烧效果
        if (card.effect.condition === 'burn') {
          const burnDamage = Math.floor(newTarget.maxHp * 0.05);
          newTarget.buffs = [...newTarget.buffs, createBuff('poison', burnDamage, 3, '燃烧')];
          logs.push({
            turn: 0,
            actor: 'system',
            message: `${target.name}被点燃，每回合损失${burnDamage}生命！`,
            type: 'buff',
          });
        }
      }
      break;
    }
    
    case 'heal': {
      const healAmount = Math.floor(newActor.maxHp * (card.effect.value / 100));
      newActor.currentHp = Math.min(newActor.maxHp, newActor.currentHp + healAmount);
      logs.push({
        turn: 0,
        actor: actor.id === 'player' ? 'player' : 'enemy',
        message: `${actor.name}使用${card.name}恢复${healAmount}点生命！`,
        type: 'heal',
      });
      
      if (card.effect.condition === 'cleanse' || card.effect.condition === 'full_cleanse') {
        newActor = cleanseDebuffs(newActor);
        logs.push({
          turn: 0,
          actor: 'system',
          message: `${actor.name}清除了负面效果！`,
          type: 'buff',
        });
      }
      break;
    }
    
    case 'shield': {
      newActor.shield += card.effect.value;
      logs.push({
        turn: 0,
        actor: actor.id === 'player' ? 'player' : 'enemy',
        message: `${actor.name}获得${card.effect.value}点护盾！`,
        type: 'buff',
      });
      break;
    }
    
    case 'buff_self': {
      const buffType = card.effect.condition || 'attack';
      const buffTypeMap: Record<string, BuffType> = {
        attack: 'attack_up',
        defense: 'defense_up',
        speed: 'speed_up',
      };
      const newBuff = createBuff(
        buffTypeMap[buffType] || 'attack_up',
        card.effect.value,
        card.effect.duration || 1,
        card.name
      );
      newActor = applyBuff(newActor, newBuff);
      logs.push({
        turn: 0,
        actor: actor.id === 'player' ? 'player' : 'enemy',
        message: `${actor.name}获得${card.name}效果，${buffType}+${card.effect.value}%，持续${card.effect.duration}回合！`,
        type: 'buff',
      });
      break;
    }
    
    case 'debuff_enemy': {
      const debuffType = card.effect.condition || 'attack';
      const debuffTypeMap: Record<string, BuffType> = {
        attack: 'attack_down',
        defense: 'defense_down',
        speed: 'speed_down',
        poison: 'poison',
        all_stats: 'attack_down',
      };
      const newDebuff = createBuff(
        debuffTypeMap[debuffType] || 'attack_down',
        card.effect.value,
        card.effect.duration || 2,
        card.name
      );
      newTarget = applyBuff(newTarget, newDebuff);
      
      if (debuffType === 'all_stats') {
        newTarget.buffs = [...newTarget.buffs, 
          createBuff('defense_down', card.effect.value, card.effect.duration || 2, card.name),
          createBuff('speed_down', card.effect.value, card.effect.duration || 2, card.name),
        ];
      }
      
      logs.push({
        turn: 0,
        actor: actor.id === 'player' ? 'player' : 'enemy',
        message: `${actor.name}对${target.name}施加${card.name}！`,
        type: 'buff',
      });
      break;
    }
    
    case 'special': {
      if (card.effect.condition === 'cheat_death') {
        // 不死之身效果在受到致命伤害时触发
        logs.push({
          turn: 0,
          actor: actor.id === 'player' ? 'player' : 'enemy',
          message: `${actor.name}激活不死之身！`,
          type: 'buff',
        });
      }
      break;
    }
  }
  
  // 检查死亡
  if (newTarget.currentHp <= 0) {
    newTarget.isDead = true;
    logs.push({
      turn: 0,
      actor: 'system',
      message: `${target.name}倒下了！`,
      type: 'info',
    });
  }
  
  return { actor: newActor, target: newTarget, logs };
}

// ============= Roll点系统 =============
export function rollInitiative(player: Agent, enemy: Agent): { playerRoll: number; enemyRoll: number; attacker: 'player' | 'enemy' } {
  const playerRoll = rollDice() + Math.floor(getEffectiveStats(player).speed / 10);
  const enemyRoll = rollDice() + Math.floor(getEffectiveStats(enemy).speed / 10);
  
  return {
    playerRoll,
    enemyRoll,
    attacker: playerRoll >= enemyRoll ? 'player' : 'enemy',
  };
}

// ============= AI对手生成 =============
export function generateAIOpponent(floor: number): AIOpponent {
  const level = Math.max(1, Math.floor(floor * 0.8));
  const stats = calculateAgentStats(level);
  const floorConfig = TOWER_FLOORS[floor - 1];
  
  return {
    name: AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)],
    avatar: AI_AVATARS[Math.floor(Math.random() * AI_AVATARS.length)],
    level,
    hp: Math.floor(stats.hp * floorConfig.hpMultiplier),
    maxHp: Math.floor(stats.hp * floorConfig.hpMultiplier),
    attack: Math.floor(stats.attack * floorConfig.atkMultiplier),
    defense: Math.floor(stats.defense * floorConfig.defMultiplier),
    speed: Math.floor(stats.speed * floorConfig.spdMultiplier),
    cards: getRandomCards(5 + Math.floor(floor / 20)),
  };
}

export function agentToAIOpponent(agent: Agent): AIOpponent {
  return {
    name: agent.name,
    avatar: agent.avatar,
    level: agent.level,
    hp: agent.currentHp,
    maxHp: agent.maxHp,
    attack: agent.attack,
    defense: agent.defense,
    speed: agent.speed,
    cards: agent.cards.slice(0, 5),
  };
}

export function aiOpponentToAgent(opponent: AIOpponent): Agent {
  return {
    id: 'enemy',
    name: opponent.name,
    avatar: opponent.avatar,
    level: opponent.level,
    exp: 0,
    expToNext: 100,
    hp: opponent.maxHp,
    maxHp: opponent.maxHp,
    attack: opponent.attack,
    defense: opponent.defense,
    speed: opponent.speed,
    currentHp: opponent.hp,
    shield: 0,
    cards: opponent.cards,
    maxCards: 30,
    isDead: false,
    deathCount: 0,
    buffs: [],
  };
}

// ============= 死亡惩罚 =============
export function applyDeathPenalty(agent: Agent): Agent {
  const expLoss = Math.floor(agent.exp * (1 - DEATH_EXP_RETENTION));
  
  // 重置为初始卡组（5张随机卡）
  const newCards = getRandomCards(5);
  
  return {
    ...agent,
    exp: agent.exp - expLoss,
    currentHp: agent.maxHp,
    shield: 0,
    cards: newCards,
    isDead: false,
    deathCount: agent.deathCount + 1,
    buffs: [],
  };
}

// ============= 胜利奖励 =============
export function calculateVictoryReward(floor: number, agent: Agent): { exp: number; card?: Card } {
  const floorConfig = TOWER_FLOORS[floor - 1];
  let expReward = floorConfig.rewardExp;
  
  // 首次通关额外奖励
  expReward += floor * 10;
  
  // 检查是否奖励卡牌
  let cardReward: Card | undefined;
  if (floor % 10 === 0) {
    cardReward = getRandomCard(); // 每10层随机奖励
  } else if (floor % 5 === 0) {
    const cardPool = CARD_POOL.filter(c => c.rarity === 'common' || c.rarity === 'rare');
    cardReward = cardPool[Math.floor(Math.random() * cardPool.length)];
  }
  
  return { exp: expReward, card: cardReward };
}

// ============= 初始战斗状态 =============
export function createInitialBattleState(playerCards: Card[], enemyCards: Card[]): BattleState {
  return {
    phase: 'ready',
    turn: 0,
    currentActor: 'player',
    playerCards: playerCards.slice(0, BATTLE_CONFIG.startingHandSize),
    enemyCards: enemyCards.slice(0, BATTLE_CONFIG.startingHandSize),
    playerSelectedCard: null,
    enemySelectedCard: null,
    rollResult: null,
    battleLog: [{
      turn: 0,
      actor: 'system',
      message: '战斗开始！',
      type: 'info',
    }],
    winner: null,
  };
}

// ============= AI出牌逻辑 =============
export function aiSelectCard(cards: Card[], enemyHp: number, enemyMaxHp: number, playerHp: number): Card {
  // 优先考虑的情况
  const healCards = cards.filter(c => c.type === 'skill' && c.effect.type === 'heal');
  const defenseCards = cards.filter(c => c.type === 'defense');
  const attackCards = cards.filter(c => c.type === 'attack');
  const buffCards = cards.filter(c => c.type === 'buff');
  const debuffCards = cards.filter(c => c.type === 'debuff');
  
  // 血量低于30%时优先治疗
  if (enemyHp < enemyMaxHp * 0.3 && healCards.length > 0) {
    return healCards[Math.floor(Math.random() * healCards.length)];
  }
  
  // 血量低于50%时考虑治疗或防御
  if (enemyHp < enemyMaxHp * 0.5) {
    if (Math.random() > 0.5 && healCards.length > 0) {
      return healCards[Math.floor(Math.random() * healCards.length)];
    }
    if (defenseCards.length > 0) {
      return defenseCards[Math.floor(Math.random() * defenseCards.length)];
    }
  }
  
  // 玩家血量低时优先击杀
  if (playerHp < 30 && attackCards.length > 0) {
    return attackCards.reduce((best, card) => 
      card.effect.value > best.effect.value ? card : best
    );
  }
  
  // 随机选择
  const allUsable = [...attackCards, ...defenseCards, ...buffCards, ...debuffCards, ...healCards];
  if (allUsable.length === 0) {
    return cards[0];
  }
  
  // 40%攻击，30%防御，20%技能，10%buff/debuff
  const rand = Math.random();
  if (rand < 0.4 && attackCards.length > 0) {
    return attackCards[Math.floor(Math.random() * attackCards.length)];
  } else if (rand < 0.7 && defenseCards.length > 0) {
    return defenseCards[Math.floor(Math.random() * defenseCards.length)];
  } else if (rand < 0.9 && healCards.length > 0) {
    return healCards[Math.floor(Math.random() * healCards.length)];
  } else {
    return allUsable[Math.floor(Math.random() * allUsable.length)];
  }
}

// ============= 卡牌替换逻辑 =============
export function getCardsForReplacement(currentCards: Card[], newCard: Card): Card[] {
  // 如果未满30张，直接添加
  if (currentCards.length < 30) {
    return [...currentCards, newCard];
  }
  
  // 满30张，需要用户选择替换
  return currentCards; // 返回原卡组，UI层会处理替换逻辑
}

// 简化替换：随机移除一张，添加新卡
export function autoReplaceCard(currentCards: Card[], newCard: Card): Card[] {
  const indexToRemove = Math.floor(Math.random() * currentCards.length);
  const newCards = [...currentCards];
  newCards.splice(indexToRemove, 1);
  newCards.push(newCard);
  return newCards;
}

// 导入CARD_POOL用于筛选
import { CARD_POOL } from './constants';
