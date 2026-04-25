import { NextRequest, NextResponse } from 'next/server';
import { Agent, Card, TowerFloor } from '@/types';
import { TOWER_FLOORS, CARD_POOL, BASE_STATS, LEVEL_GROWTH } from '@/lib/constants';

// ==================== 内存数据存储 ====================
// 实际生产环境应使用数据库
const agents = new Map<string, Agent>();
const towerProgress = new Map<string, { currentFloor: number; highestFloor: number; exp: number }>();

// ==================== 辅助函数 ====================

// 获取或创建Agent
function getOrCreateAgent(username: string, nickname?: string): Agent {
  let agent = agents.get(username);
  if (!agent) {
    const level = towerProgress.get(username)?.highestFloor 
      ? Math.max(1, Math.floor(towerProgress.get(username)!.highestFloor / 10))
      : 1;
    
    agent = {
      id: username,
      name: nickname || username,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      level,
      exp: 0,
      expToNext: 100,
      hp: BASE_STATS.hp + LEVEL_GROWTH.hp * (level - 1),
      maxHp: BASE_STATS.hp + LEVEL_GROWTH.hp * (level - 1),
      attack: BASE_STATS.attack + LEVEL_GROWTH.attack * (level - 1),
      defense: BASE_STATS.defense + LEVEL_GROWTH.defense * (level - 1),
      speed: BASE_STATS.speed + LEVEL_GROWTH.speed * (level - 1),
      currentHp: BASE_STATS.hp + LEVEL_GROWTH.hp * (level - 1),
      shield: 0,
      cards: [],
      maxCards: 30,
      isDead: false,
      deathCount: 0,
      buffs: [],
    };
    agents.set(username, agent);
  }
  return agent;
}

// 获取或初始化塔进度
function getOrCreateProgress(username: string) {
  let progress = towerProgress.get(username);
  if (!progress) {
    progress = { currentFloor: 1, highestFloor: 0, exp: 0 };
    towerProgress.set(username, progress);
  }
  return progress;
}

// ==================== GET: 获取Agent状态 ====================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const action = searchParams.get('action');

  // 获取指定Agent信息
  if (username) {
    const agent = getOrCreateAgent(username);
    const progress = getOrCreateProgress(username);
    
    if (action === 'full') {
      // 返回完整状态（包含塔进度）
      return NextResponse.json({
        success: true,
        agent: {
          ...agent,
          currentFloor: progress.currentFloor,
          highestFloor: progress.highestFloor,
          totalExp: progress.exp,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        username: agent.id,
        nickname: agent.name,
        avatar: agent.avatar,
        level: agent.level,
        hp: agent.hp,
        maxHp: agent.maxHp,
        attack: agent.attack,
        defense: agent.defense,
        speed: agent.speed,
        currentHp: agent.currentHp,
        cardCount: agent.cards.length,
        maxCards: agent.maxCards,
        isDead: agent.isDead,
        deathCount: agent.deathCount,
      },
    });
  }

  // 返回所有在线Agent列表
  const allAgents = Array.from(agents.entries()).map(([username, agent]) => ({
    username,
    nickname: agent.name,
    avatar: agent.avatar,
    level: agent.level,
    currentFloor: towerProgress.get(username)?.currentFloor || 1,
    status: agent.isDead ? 'dead' : 'active',
  }));

  return NextResponse.json({
    success: true,
    totalAgents: allAgents.length,
    agents: allAgents,
  });
}

// ==================== POST: Agent操作 ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username, 
      action,
      targetFloor,
      cardAction,
      cardId,
      newCard,
      battleResult,
      expGain
    } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: '缺少username' }, { status: 400 });
    }

    const agent = getOrCreateAgent(username);
    const progress = getOrCreateProgress(username);

    switch (action) {
      // 更新Agent状态
      case 'update': {
        if (body.level) agent.level = body.level;
        if (body.currentHp !== undefined) agent.currentHp = body.currentHp;
        if (body.maxHp) agent.maxHp = body.maxHp;
        if (body.attack) agent.attack = body.attack;
        if (body.defense) agent.defense = body.defense;
        if (body.speed) agent.speed = body.speed;
        
        agents.set(username, agent);
        return NextResponse.json({ success: true, agent });
      }

      // 进入指定楼层
      case 'enter_floor': {
        const floor = targetFloor || progress.currentFloor;
        if (floor < 1 || floor > 100) {
          return NextResponse.json({ success: false, error: '楼层必须在1-100之间' }, { status: 400 });
        }
        if (floor > progress.highestFloor + 1) {
          return NextResponse.json({ success: false, error: '需要先通关前置楼层' }, { status: 403 });
        }
        
        progress.currentFloor = floor;
        towerProgress.set(username, progress);
        
        const floorInfo = TOWER_FLOORS[floor - 1];
        return NextResponse.json({
          success: true,
          message: `进入第${floor}层: ${floorInfo?.name}`,
          currentFloor: floor,
          floorInfo: {
            floor: floor,
            name: floorInfo?.name,
            difficulty: floorInfo?.difficulty,
            isBossFloor: floor % 10 === 0,
            monsters: floor % 10 === 0 ? 1 : 1 + Math.floor(Math.random() * 3),
            chestCount: 1 + Math.floor(Math.random() * 3),
          },
        });
      }

      // 通关楼层
      case 'clear_floor': {
        const floor = targetFloor || progress.currentFloor;
        
        if (floor !== progress.currentFloor) {
          return NextResponse.json({ success: false, error: '不在该楼层' }, { status: 400 });
        }
        
        // 计算经验奖励
        const expReward = 100 + floor * 10;
        progress.exp += expReward;
        
        // 升级检测
        while (progress.exp >= agent.expToNext) {
          progress.exp -= agent.expToNext;
          agent.level++;
          agent.expToNext = Math.floor(agent.expToNext * 1.5);
          agent.maxHp = BASE_STATS.hp + LEVEL_GROWTH.hp * (agent.level - 1);
          agent.attack = BASE_STATS.attack + LEVEL_GROWTH.attack * (agent.level - 1);
          agent.defense = BASE_STATS.defense + LEVEL_GROWTH.defense * (agent.level - 1);
          agent.speed = BASE_STATS.speed + LEVEL_GROWTH.speed * (agent.level - 1);
          agent.currentHp = agent.maxHp;
        }
        
        // 更新最高楼层
        if (floor > progress.highestFloor) {
          progress.highestFloor = floor;
        }
        
        // 下一层
        const nextFloor = Math.min(floor + 1, 100);
        progress.currentFloor = nextFloor;
        
        agents.set(username, agent);
        towerProgress.set(username, progress);
        
        // 检查是否获得卡牌奖励
        let cardReward = null;
        if (floor % 5 === 0 || floor % 10 === 0) {
          const rarity = floor % 10 === 0 ? 'epic' : 'rare';
          const pool = CARD_POOL.filter(c => c.rarity === rarity);
          if (pool.length > 0) {
            cardReward = pool[Math.floor(Math.random() * pool.length)];
            if (agent.cards.length < agent.maxCards) {
              agent.cards.push({ ...cardReward, id: `${cardReward.id}-${Date.now()}` });
              agents.set(username, agent);
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          message: `通关第${floor}层，获得${expReward}经验`,
          currentFloor: nextFloor,
          highestFloor: progress.highestFloor,
          expGained: expReward,
          totalExp: progress.exp,
          levelUp: agent.level,
          cardReward,
        });
      }

      // 卡牌操作
      case 'cards': {
        switch (cardAction) {
          case 'add': {
            if (!newCard) {
              return NextResponse.json({ success: false, error: '缺少卡牌数据' }, { status: 400 });
            }
            if (agent.cards.length >= agent.maxCards) {
              return NextResponse.json({ success: false, error: '卡牌已达上限30张' }, { status: 400 });
            }
            const card: Card = {
              ...newCard,
              id: `${newCard.id || newCard.name}-${Date.now()}`,
            };
            agent.cards.push(card);
            agents.set(username, agent);
            return NextResponse.json({
              success: true,
              message: `获得卡牌: ${card.name}`,
              card,
              totalCards: agent.cards.length,
            });
          }
          
          case 'remove': {
            if (!cardId) {
              return NextResponse.json({ success: false, error: '缺少卡牌ID' }, { status: 400 });
            }
            const idx = agent.cards.findIndex(c => c.id === cardId);
            if (idx === -1) {
              return NextResponse.json({ success: false, error: '卡牌不存在' }, { status: 404 });
            }
            const removed = agent.cards.splice(idx, 1)[0];
            agents.set(username, agent);
            return NextResponse.json({
              success: true,
              message: `移除卡牌: ${removed.name}`,
              totalCards: agent.cards.length,
            });
          }
          
          case 'list': {
            return NextResponse.json({
              success: true,
              cards: agent.cards,
              totalCards: agent.cards.length,
              maxCards: agent.maxCards,
            });
          }
          
          default:
            return NextResponse.json({ success: false, error: '未知卡牌操作' }, { status: 400 });
        }
      }

      // 战斗结果更新
      case 'battle': {
        if (battleResult === 'win') {
          agent.currentHp = Math.min(agent.currentHp, agent.maxHp);
          agents.set(username, agent);
          return NextResponse.json({
            success: true,
            message: '战斗胜利',
            currentHp: agent.currentHp,
          });
        } else if (battleResult === 'lose') {
          // 死亡惩罚
          agent.deathCount++;
          agent.currentHp = agent.maxHp;
          agent.shield = 0;
          agent.buffs = [];
          progress.currentFloor = Math.max(1, progress.highestFloor - 2);
          agents.set(username, agent);
          towerProgress.set(username, progress);
          return NextResponse.json({
            success: true,
            message: '战斗失败，损失经验并回到较低楼层',
            currentFloor: progress.currentFloor,
            deathCount: agent.deathCount,
          });
        }
        return NextResponse.json({ success: false, error: '未知战斗结果' }, { status: 400 });
      }

      // 恢复生命
      case 'heal': {
        const healAmount = Math.floor(agent.maxHp * 0.3);
        agent.currentHp = Math.min(agent.maxHp, agent.currentHp + healAmount);
        agents.set(username, agent);
        return NextResponse.json({
          success: true,
          message: `恢复${healAmount}生命`,
          currentHp: agent.currentHp,
          maxHp: agent.maxHp,
        });
      }

      // 抽卡
      case 'gacha': {
        if (agent.cards.length >= agent.maxCards) {
          return NextResponse.json({ success: false, error: '卡牌已达上限' }, { status: 400 });
        }
        
        // 随机抽取
        const roll = Math.random() * 100;
        let rarity: Card['rarity'];
        if (roll < 5) rarity = 'legendary';
        else if (roll < 20) rarity = 'epic';
        else if (roll < 50) rarity = 'rare';
        else rarity = 'common';
        
        const pool = CARD_POOL.filter(c => c.rarity === rarity);
        if (pool.length === 0) {
          return NextResponse.json({ success: false, error: '抽卡池为空' }, { status: 500 });
        }
        
        const card = pool[Math.floor(Math.random() * pool.length)];
        const newCard: Card = { ...card, id: `${card.id}-${Date.now()}` };
        agent.cards.push(newCard);
        agents.set(username, agent);
        
        return NextResponse.json({
          success: true,
          message: `抽到${rarity === 'legendary' ? '传说' : rarity === 'epic' ? '史诗' : rarity === 'rare' ? '稀有' : '普通'}卡牌!`,
          card: newCard,
          totalCards: agent.cards.length,
        });
      }

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
