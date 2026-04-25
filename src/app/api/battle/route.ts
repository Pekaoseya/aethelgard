import { NextRequest, NextResponse } from 'next/server';
import { rollDice, generateAIOpponent } from '@/lib/game-engine';
import { Card } from '@/types';

// 战斗会话
interface BattleSession {
  id: string;
  player: {
    username: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    cards: Card[];
  };
  enemy: {
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    level: number;
    cards: Card[];
  };
  turn: number;
  log: string[];
  status: 'active' | 'player_win' | 'player_lose';
  startedAt: number;
}

// 战斗会话存储
const battleSessions = new Map<string, BattleSession>();

// ==================== GET: 获取战斗信息 ====================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const sessionId = searchParams.get('sessionId');

  // 获取当前战斗状态
  if (username) {
    const session = battleSessions.get(username);
    if (!session) {
      return NextResponse.json({
        success: true,
        inBattle: false,
        message: '未在战斗中',
      });
    }

    return NextResponse.json({
      success: true,
      inBattle: true,
      session: {
        id: session.id,
        turn: session.turn,
        player: {
          hp: session.player.hp,
          maxHp: session.player.maxHp,
          hpPercent: Math.round((session.player.hp / session.player.maxHp) * 100),
          cards: session.player.cards.length,
        },
        enemy: {
          name: session.enemy.name,
          hp: session.enemy.hp,
          maxHp: session.enemy.maxHp,
          hpPercent: Math.round((session.enemy.hp / session.enemy.maxHp) * 100),
          level: session.enemy.level,
        },
        status: session.status,
        log: session.log.slice(-5),
        elapsed: Math.floor((Date.now() - session.startedAt) / 1000),
      },
    });
  }

  // 获取指定战斗详情
  if (sessionId) {
    for (const [username, session] of battleSessions.entries()) {
      if (session.id === sessionId) {
        return NextResponse.json({
          success: true,
          session: {
            ...session,
            player: {
              ...session.player,
              cards: session.player.cards.length,
            },
          },
        });
      }
    }
    return NextResponse.json({ success: false, error: '战斗不存在' }, { status: 404 });
  }

  return NextResponse.json({
    success: false,
    error: '请提供 username 参数',
  }, { status: 400 });
}

// ==================== POST: 战斗操作 ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      action,
      cardId,
      target,
      difficulty,
    } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: '缺少username' }, { status: 400 });
    }

    switch (action) {
      // 开始战斗
      case 'start': {
        // 检查是否已在战斗中
        if (battleSessions.has(username)) {
          return NextResponse.json({ 
            success: false, 
            error: '已在战斗中，请先结束当前战斗',
            sessionId: username,
          }, { status: 400 });
        }

        const floor = body.floor || 1;
        const enemy = generateAIOpponent(floor);
        enemy.hp = enemy.hp || 50 + floor * 20;
        enemy.maxHp = enemy.hp;
        enemy.attack = enemy.attack || 10 + floor * 3;
        enemy.defense = enemy.defense || 5 + floor * 2;

        // 获取玩家信息
        const playerHp = body.playerHp || 100;
        const playerMaxHp = body.playerMaxHp || 100;
        const playerAttack = body.playerAttack || 20;
        const playerDefense = body.playerDefense || 10;
        const playerCards = body.playerCards || [];

        const session: BattleSession = {
          id: `${username}-${Date.now()}`,
          player: {
            username,
            hp: playerHp,
            maxHp: playerMaxHp,
            attack: playerAttack,
            defense: playerDefense,
            cards: playerCards,
          },
          enemy: {
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            attack: enemy.attack,
            defense: enemy.defense,
            level: enemy.level,
            cards: enemy.cards,
          },
          turn: 1,
          log: [`⚔️ 战斗开始！遭遇 ${enemy.name} (Lv.${enemy.level})`],
          status: 'active',
          startedAt: Date.now(),
        };

        battleSessions.set(username, session);

        return NextResponse.json({
          success: true,
          battleStarted: true,
          session: {
            id: session.id,
            turn: 1,
            player: {
              hp: session.player.hp,
              maxHp: session.player.maxHp,
            },
            enemy: {
              name: session.enemy.name,
              hp: session.enemy.hp,
              maxHp: session.enemy.maxHp,
              level: session.enemy.level,
            },
          },
          actions: {
            attack: 'POST /api/battle with action: "attack"',
            useCard: 'POST /api/battle with action: "use_card", cardId',
            defend: 'POST /api/battle with action: "defend"',
            flee: 'POST /api/battle with action: "flee"',
          },
        });
      }

      // 普通攻击
      case 'attack': {
        const session = battleSessions.get(username);
        if (!session || session.status !== 'active') {
          return NextResponse.json({ success: false, error: '未在战斗中' }, { status: 400 });
        }

        const playerRoll = rollDice();
        const playerDamage = Math.max(1, Math.floor(session.player.attack * (1 + playerRoll / 100)));
        const isCrit = playerRoll >= 95;
        const finalDamage = isCrit ? playerDamage * 2 : playerDamage;

        session.enemy.hp = Math.max(0, session.enemy.hp - finalDamage);
        session.log.push(`第${session.turn}回合：你造成 ${finalDamage} 点伤害${isCrit ? ' (暴击!)' : ''}`);

        let result: Record<string, unknown> = {
          success: true,
          damage: finalDamage,
          isCrit,
          enemyHp: session.enemy.hp,
          enemyMaxHp: session.enemy.maxHp,
          turn: session.turn,
        };

        // 检查是否击杀
        if (session.enemy.hp <= 0) {
          session.status = 'player_win';
          session.log.push('🎉 胜利！');
          battleSessions.set(username, session);
          return NextResponse.json({
            success: true,
            ...result,
            victory: true,
            rewards: {
              exp: 50 + session.enemy.level * 10,
              message: '战斗胜利！',
            },
            log: session.log,
          });
        }

        // 敌人反击
        const enemyRoll = rollDice();
        const enemyDamage = Math.max(1, Math.floor(session.enemy.attack * (1 + enemyRoll / 200)));
        session.player.hp = Math.max(0, session.player.hp - enemyDamage);
        session.log.push(`敌人反击造成 ${enemyDamage} 点伤害`);

        result = {
          ...result,
          enemyDamage,
          playerHp: session.player.hp,
          playerMaxHp: session.player.maxHp,
        };

        // 检查是否失败
        if (session.player.hp <= 0) {
          session.status = 'player_lose';
          session.log.push('💀 战败...');
          battleSessions.delete(username);
          return NextResponse.json({
            success: true,
            ...result,
            defeat: true,
            message: '战斗失败',
            log: session.log,
          });
        }

        session.turn++;
        battleSessions.set(username, session);

        return NextResponse.json({
          success: true,
          ...result,
          nextTurn: session.turn,
          log: session.log.slice(-3),
        });
      }

      // 使用卡牌
      case 'use_card': {
        const session = battleSessions.get(username);
        if (!session || session.status !== 'active') {
          return NextResponse.json({ success: false, error: '未在战斗中' }, { status: 400 });
        }

        if (!cardId) {
          return NextResponse.json({ success: false, error: '缺少cardId' }, { status: 400 });
        }

        const card = session.player.cards.find(c => c.id === cardId);
        if (!card) {
          return NextResponse.json({ success: false, error: '卡牌不存在' }, { status: 404 });
        }

        let result: Record<string, unknown> = {
          success: true,
          cardUsed: card.name,
          turn: session.turn,
        };

        // 卡牌效果
        switch (card.effect.type) {
          case 'damage': {
            const damage = Math.floor(session.player.attack * (card.effect.value / 100));
            session.enemy.hp = Math.max(0, session.enemy.hp - damage);
            session.log.push(`使用「${card.name}」造成 ${damage} 点伤害`);
            result = { ...result, damage, enemyHp: session.enemy.hp };
            break;
          }
          case 'heal': {
            const heal = Math.min(
              Math.floor(session.player.maxHp * (card.effect.value / 100)),
              session.player.maxHp - session.player.hp
            );
            session.player.hp += heal;
            session.log.push(`使用「${card.name}」恢复 ${heal} 点生命`);
            result = { ...result, heal, playerHp: session.player.hp };
            break;
          }
          case 'shield': {
            session.log.push(`使用「${card.name}」获得 ${card.effect.value} 点护盾`);
            result = { ...result, shield: card.effect.value };
            break;
          }
          default:
            session.log.push(`使用「${card.name}」`);
        }

        // 从手牌移除
        const cardIdx = session.player.cards.findIndex(c => c.id === cardId);
        if (cardIdx !== -1) {
          session.player.cards.splice(cardIdx, 1);
        }

        // 检查是否击杀
        if (session.enemy.hp <= 0) {
          session.status = 'player_win';
          session.log.push('🎉 胜利！');
          battleSessions.delete(username);
          return NextResponse.json({
            success: true,
            ...result,
            victory: true,
            rewards: {
              exp: 50 + session.enemy.level * 10,
            },
            log: session.log,
          });
        }

        // 敌人反击
        const enemyRoll = rollDice();
        const enemyDamage = Math.max(1, Math.floor(session.enemy.attack * (1 + enemyRoll / 200)));
        session.player.hp = Math.max(0, session.player.hp - enemyDamage);
        session.log.push(`敌人反击造成 ${enemyDamage} 点伤害`);

        result = {
          ...result,
          enemyDamage,
          playerHp: session.player.hp,
        };

        // 检查是否失败
        if (session.player.hp <= 0) {
          session.status = 'player_lose';
          session.log.push('💀 战败...');
          battleSessions.delete(username);
          return NextResponse.json({
            success: true,
            ...result,
            defeat: true,
            log: session.log,
          });
        }

        session.turn++;
        battleSessions.set(username, session);

        return NextResponse.json({
          success: true,
          ...result,
          nextTurn: session.turn,
          log: session.log.slice(-3),
        });
      }

      // 防御
      case 'defend': {
        const session = battleSessions.get(username);
        if (!session || session.status !== 'active') {
          return NextResponse.json({ success: false, error: '未在战斗中' }, { status: 400 });
        }

        const defenseBonus = Math.floor(session.player.defense * 0.5);
        session.log.push(`你进入防御姿态，减免 ${defenseBonus} 伤害`);

        // 敌人攻击（伤害减少）
        const enemyRoll = rollDice();
        const enemyDamage = Math.max(1, Math.floor(session.enemy.attack * (1 + enemyRoll / 200) * 0.5));
        session.player.hp = Math.max(0, session.player.hp - enemyDamage);
        session.log.push(`敌人攻击造成 ${enemyDamage} 点伤害（防御减免）`);

        const result: Record<string, unknown> = {
          success: true,
          defended: true,
          damageReduced: defenseBonus,
          playerHp: session.player.hp,
          turn: session.turn,
        };

        // 检查是否失败
        if (session.player.hp <= 0) {
          session.status = 'player_lose';
          session.log.push('💀 战败...');
          battleSessions.delete(username);
          return NextResponse.json({
            success: true,
            ...result,
            defeat: true,
            log: session.log,
          });
        }

        session.turn++;
        battleSessions.set(username, session);

        return NextResponse.json({
          success: true,
          ...result,
          nextTurn: session.turn,
          log: session.log.slice(-3),
        });
      }

      // 逃跑
      case 'flee': {
        const session = battleSessions.get(username);
        if (!session) {
          return NextResponse.json({ success: false, error: '未在战斗中' }, { status: 400 });
        }

        const fleeChance = 0.5;
        const success = Math.random() < fleeChance;
        
        if (success) {
          battleSessions.delete(username);
          return NextResponse.json({
            success: true,
            fled: true,
            message: '成功逃离战斗！',
          });
        } else {
          // 逃跑失败，敌人攻击
          const enemyRoll = rollDice();
          const enemyDamage = Math.floor(session.enemy.attack * (1 + enemyRoll / 200));
          session.player.hp = Math.max(0, session.player.hp - enemyDamage);
          session.log.push(`逃跑失败！敌人趁机攻击造成 ${enemyDamage} 点伤害`);

          if (session.player.hp <= 0) {
            session.status = 'player_lose';
            session.log.push('💀 战败...');
            battleSessions.delete(username);
            return NextResponse.json({
              success: true,
              fleeFailed: true,
              damage: enemyDamage,
              playerHp: 0,
              defeat: true,
              log: session.log,
            });
          }

          battleSessions.set(username, session);
          return NextResponse.json({
            success: true,
            fleeFailed: true,
            damage: enemyDamage,
            playerHp: session.player.hp,
            message: '逃跑失败！',
            log: session.log.slice(-2),
          });
        }
      }

      // 结束战斗
      case 'end': {
        battleSessions.delete(username);
        return NextResponse.json({
          success: true,
          ended: true,
          message: '战斗已结束',
        });
      }

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Battle API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
