import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentBattleState, BattleParticipant, BattleLogEntry, Card, RoomMember } from '@/types';
import { rollDice } from '@/lib/game-engine';

// 内存存储（战斗专用）
const activeBattles = new Map<string, MultiAgentBattleState>();

// 预设卡牌池
const CARD_POOL: Card[] = [
  { id: 'atk-1', name: '重击', type: 'attack', rarity: 'common', cost: 1, icon: '💥', effect: { type: 'damage', value: 150 }, description: '造成150%攻击力的伤害' },
  { id: 'atk-2', name: '连刺', type: 'attack', rarity: 'common', cost: 1, icon: '⚔️', effect: { type: 'damage', value: 100 }, description: '造成100%攻击力的伤害' },
  { id: 'atk-3', name: '暴击斩', type: 'attack', rarity: 'rare', cost: 2, icon: '🔥', effect: { type: 'damage', value: 250 }, description: '造成250%攻击力的伤害' },
  { id: 'def-1', name: '护盾', type: 'defense', rarity: 'common', cost: 1, icon: '🛡️', effect: { type: 'shield', value: 80 }, description: '获得80点护盾' },
  { id: 'def-2', name: '铁壁', type: 'defense', rarity: 'rare', cost: 2, icon: '🏰', effect: { type: 'shield', value: 200 }, description: '获得200点护盾' },
  { id: 'heal-1', name: '治疗', type: 'skill', rarity: 'common', cost: 1, icon: '💚', effect: { type: 'heal', value: 100 }, description: '恢复100点生命' },
  { id: 'heal-2', name: '大治愈', type: 'skill', rarity: 'rare', cost: 2, icon: '💖', effect: { type: 'heal', value: 250 }, description: '恢复250点生命' },
  { id: 'buff-1', name: '力量祝福', type: 'buff', rarity: 'rare', cost: 1, icon: '⚡', effect: { type: 'buff_self', value: 30, duration: 3 }, description: '攻击力+30%，持续3回合' },
  { id: 'debuff-1', name: '虚弱', type: 'debuff', rarity: 'rare', cost: 2, icon: '💀', effect: { type: 'debuff_enemy', value: 30, duration: 2 }, description: '敌人攻击力-30%，持续2回合' },
  { id: 'spec-1', name: '背刺', type: 'attack', rarity: 'epic', cost: 2, icon: '🗡️', effect: { type: 'damage', value: 400 }, description: '造成400%攻击力的伤害，但必须先有盟友' },
];

// 获取随机卡牌
function getRandomCards(count: number, excludeIds: string[] = []): Card[] {
  const available = CARD_POOL.filter(c => !excludeIds.includes(c.id));
  const cards: Card[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    cards.push({ ...available[idx], id: `${available[idx].id}-${Date.now()}-${i}` });
  }
  return cards;
}

// 初始化多人战斗
function initMultiAgentBattle(
  roomId: string,
  floor: number,
  members: RoomMember[],
  hostUsername: string
): MultiAgentBattleState {
  const participants: BattleParticipant[] = members.map((member) => {
    const level = member.level || 1;
    const baseHp = 100 + (level - 1) * 20;
    const baseAtk = 10 + (level - 1) * 3;
    const baseDef = 5 + (level - 1) * 2;
    const baseSpd = 8 + (level - 1);
    
    return {
      username: member.username,
      nickname: member.nickname,
      avatar: member.avatar,
      level,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAtk,
      defense: baseDef,
      speed: baseSpd,
      currentHp: baseHp,
      shield: 0,
      cards: getRandomCards(5),
      isDead: false,
      isAlly: false,
      selectedCard: null,
      buffs: [],
      isHost: member.username === hostUsername,
    };
  });
  
  return {
    roomId,
    floor,
    phase: 'ready',
    turn: 0,
    participants,
    currentTurnIndex: 0,
    initiativeOrder: [],
    battleLog: [],
    winner: null,
    pendingCardExchange: null,
  };
}

// 随机生成行动顺序
function rollInitiative(participants: BattleParticipant[]): string[] {
  return participants
    .map(p => ({
      username: p.username,
      roll: rollDice() + Math.floor(p.speed / 2),
    }))
    .sort((a, b) => b.roll - a.roll)
    .map(r => r.username);
}

// GET - 获取战斗状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomId = searchParams.get('roomId');
  
  if (!roomId) {
    return NextResponse.json({ success: false, error: '缺少roomId' }, { status: 400 });
  }
  
  const battle = activeBattles.get(roomId);
  if (!battle) {
    return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
  }
  
  // 返回战斗状态，隐藏非盟友的卡牌信息
  const publicBattle = {
    ...battle,
    participants: battle.participants.map(p => ({
      ...p,
      cards: p.cards.length, // 只显示卡牌数量
    })),
  };
  
  return NextResponse.json({ success: true, battle: publicBattle });
}

// POST - 战斗操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, username, targetUsername, cardId, allyUsername } = body;
    
    switch (action) {
      case 'init': {
        // 初始化战斗
        const { members, hostUsername, floor } = body;
        if (!members || !hostUsername) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        
        const battle = initMultiAgentBattle(roomId, floor || 1, members, hostUsername);
        activeBattles.set(roomId, battle);
        
        return NextResponse.json({ success: true, battle });
      }
      
      case 'roll_initiative': {
        // 投骰子决定行动顺序
        const battle = activeBattles.get(roomId);
        if (!battle) {
          return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
        }
        
        if (battle.phase !== 'ready') {
          return NextResponse.json({ success: false, error: '不是准备阶段' }, { status: 400 });
        }
        
        battle.initiativeOrder = rollInitiative(battle.participants.filter(p => !p.isDead));
        battle.phase = 'select_card';
        battle.turn = 1;
        
        battle.battleLog.push({
          turn: battle.turn,
          actor: 'system',
          message: '🎲 行动顺序已确定！',
          type: 'roll',
        });
        
        return NextResponse.json({ success: true, battle });
      }
      
      case 'select_card': {
        // 选择卡牌
        const battle = activeBattles.get(roomId);
        if (!battle) {
          return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
        }
        
        if (battle.phase !== 'select_card') {
          return NextResponse.json({ success: false, error: '不是选卡阶段' }, { status: 400 });
        }
        
        const participant = battle.participants.find(p => p.username === username);
        if (!participant) {
          return NextResponse.json({ success: false, error: '参与者不存在' }, { status: 404 });
        }
        
        if (participant.isDead) {
          return NextResponse.json({ success: false, error: '你已阵亡' }, { status: 400 });
        }
        
        if (cardId === null) {
          participant.selectedCard = null;
        } else {
          const card = participant.cards.find(c => c.id === cardId);
          if (!card) {
            return NextResponse.json({ success: false, error: '卡牌不存在' }, { status: 400 });
          }
          participant.selectedCard = card;
        }
        
        // 检查是否所有人都选择了卡牌
        const allSelected = battle.participants
          .filter(p => !p.isDead)
          .every(p => p.selectedCard !== null || p.selectedCard === null); // 允许跳过
        
        if (allSelected) {
          battle.phase = 'resolve';
        }
        
        return NextResponse.json({ success: true, battle });
      }
      
      case 'resolve': {
        // 结算回合
        const battle = activeBattles.get(roomId);
        if (!battle) {
          return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
        }
        
        if (battle.phase !== 'resolve') {
          return NextResponse.json({ success: false, error: '不是结算阶段' }, { status: 400 });
        }
        
        // 按行动顺序结算
        for (const actorName of battle.initiativeOrder) {
          const actor = battle.participants.find(p => p.username === actorName);
          if (!actor || actor.isDead || !actor.selectedCard) continue;
          
          // 选择目标（非盟友优先）
          const validTargets = battle.participants.filter(p => 
            p.username !== actorName && 
            !p.isDead && 
            p.isAlly !== actor.isAlly // 优先攻击非盟友
          );
          
          if (validTargets.length === 0) {
            // 如果都是盟友，选择HP最低的
            const lowestHp = battle.participants
              .filter(p => p.username !== actorName && !p.isDead)
              .sort((a, b) => a.currentHp - b.currentHp)[0];
            if (lowestHp) {
              validTargets.push(lowestHp);
            }
          }
          
          if (validTargets.length === 0) continue;
          
          const target = validTargets[Math.floor(Math.random() * validTargets.length)];
          const card = actor.selectedCard!;
          
          // 执行卡牌效果
          const logEntry = resolveCardEffect(actor, target, card, battle);
          battle.battleLog.push(logEntry);
          
          // 消耗卡牌
          actor.cards = actor.cards.filter(c => c.id !== card.id);
          actor.selectedCard = null;
          
          // 如果死亡，更新盟友关系
          if (target.currentHp <= 0) {
            target.isDead = true;
            target.currentHp = 0;
            
            // 检查是否有同组盟友全部阵亡
            if (target.allyGroup) {
              const groupMembers = battle.participants.filter(p => p.allyGroup === target.allyGroup);
              const allDead = groupMembers.every(p => p.isDead);
              if (allDead) {
                battle.battleLog.push({
                  turn: battle.turn,
                  actor: 'system',
                  message: `🔥 盟友组 ${target.allyGroup} 全部阵亡！`,
                  type: 'info',
                });
              }
            }
          }
          
          // 检查胜利条件
          const aliveGroups = new Set<string>();
          for (const p of battle.participants) {
            if (!p.isDead) {
              aliveGroups.add(p.allyGroup || p.username);
            }
          }
          
          if (aliveGroups.size <= 1) {
            battle.phase = 'finished';
            battle.winner = actor.username;
            battle.winningGroup = actor.allyGroup || actor.username;
            
            battle.battleLog.push({
              turn: battle.turn,
              actor: 'system',
              message: `🏆 ${actor.nickname} 获得胜利！`,
              type: 'info',
            });
            
            break;
          }
        }
        
        // 进入下一回合
        if (battle.phase !== 'finished') {
          battle.turn++;
          battle.phase = 'select_card';
          
          // 重新投骰子决定行动顺序
          battle.initiativeOrder = rollInitiative(battle.participants.filter(p => !p.isDead));
        }
        
        return NextResponse.json({ success: true, battle });
      }
      
      case 'ally': {
        // 结成盟友
        const battle = activeBattles.get(roomId);
        if (!battle) {
          return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
        }
        
        if (!allyUsername) {
          return NextResponse.json({ success: false, error: '缺少盟友用户名' }, { status: 400 });
        }
        
        const actor = battle.participants.find(p => p.username === username);
        const ally = battle.participants.find(p => p.username === allyUsername);
        
        if (!actor || !ally) {
          return NextResponse.json({ success: false, error: '参与者不存在' }, { status: 404 });
        }
        
        // 生成盟友组ID
        const groupId = `ally-${Date.now()}`;
        actor.allyGroup = groupId;
        ally.allyGroup = groupId;
        actor.isAlly = true;
        ally.isAlly = true;
        
        battle.battleLog.push({
          turn: battle.turn,
          actor: 'system',
          message: `🤝 ${actor.nickname} 和 ${ally.nickname} 结成盟友！`,
          type: 'info',
        });
        
        return NextResponse.json({ success: true, battle });
      }
      
      case 'exchange_card': {
        // 请求交换卡牌
        const battle = activeBattles.get(roomId);
        if (!battle) {
          return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
        }
        
        const actor = battle.participants.find(p => p.username === username);
        const target = battle.participants.find(p => p.username === targetUsername);
        
        if (!actor || !target) {
          return NextResponse.json({ success: false, error: '参与者不存在' }, { status: 404 });
        }
        
        if (!actor.isAlly || !target.isAlly || actor.allyGroup !== target.allyGroup) {
          return NextResponse.json({ success: false, error: '只能与盟友交换卡牌' }, { status: 400 });
        }
        
        const card = actor.cards.find(c => c.id === cardId);
        if (!card) {
          return NextResponse.json({ success: false, error: '卡牌不存在' }, { status: 400 });
        }
        
        // 交换卡牌
        actor.cards = actor.cards.filter(c => c.id !== cardId);
        target.cards.push({ ...card, id: `${card.id}-${Date.now()}` });
        
        battle.battleLog.push({
          turn: battle.turn,
          actor: 'system',
          message: `🔄 ${actor.nickname} 将「${card.name}」交给盟友 ${target.nickname}`,
          type: 'info',
        });
        
        return NextResponse.json({ success: true, battle });
      }
      
      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Battle API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 解析卡牌效果
function resolveCardEffect(
  actor: BattleParticipant,
  target: BattleParticipant,
  card: Card,
  battle: MultiAgentBattleState
): BattleLogEntry {
  const roll = rollDice();
  const isCrit = roll >= 95;
  const isDodge = roll <= 5;
  
  switch (card.effect.type) {
    case 'damage': {
      if (isDodge) {
        return {
          turn: battle.turn,
          actor: 'player',
          message: `${actor.nickname} 使用「${card.name}」被 ${target.nickname} 闪避！`,
          type: 'dodge',
        };
      }
      
      const baseDamage = actor.attack * (card.effect.value / 100);
      const damage = isCrit ? Math.floor(baseDamage * 1.5) : Math.floor(baseDamage);
      const actualDamage = Math.max(1, damage - target.defense);
      
      target.currentHp = Math.max(0, target.currentHp - actualDamage);
      
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用「${card.name}」对 ${target.nickname} 造成 ${actualDamage} 点伤害${isCrit ? ' (暴击!)' : ''}`,
        type: isCrit ? 'critical' : 'damage',
      };
    }
    
    case 'shield': {
      actor.shield += card.effect.value;
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用「${card.name}」获得 ${card.effect.value} 点护盾`,
        type: 'buff',
      };
    }
    
    case 'heal': {
      const healAmount = Math.min(card.effect.value, actor.maxHp - actor.currentHp);
      actor.currentHp += healAmount;
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用「${card.name}」恢复 ${healAmount} 点生命`,
        type: 'heal',
      };
    }
    
    case 'buff_self': {
      actor.buffs.push({
        id: `buff-${Date.now()}`,
        type: 'attack_up',
        value: card.effect.value,
        duration: card.effect.duration || 3,
        name: card.name,
      });
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用「${card.name}」攻击力 +${card.effect.value}%，持续 ${card.effect.duration} 回合`,
        type: 'buff',
      };
    }
    
    case 'debuff_enemy': {
      target.buffs.push({
        id: `debuff-${Date.now()}`,
        type: 'attack_down',
        value: card.effect.value,
        duration: card.effect.duration || 2,
        name: card.name,
      });
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用「${card.name}」使 ${target.nickname} 攻击力 -${card.effect.value}%，持续 ${card.effect.duration} 回合`,
        type: 'debuff',
      };
    }
    
    default:
      return {
        turn: battle.turn,
        actor: 'player',
        message: `${actor.nickname} 使用了「${card.name}」`,
        type: 'info',
      };
  }
}
