import { NextRequest, NextResponse } from 'next/server';
import { TOWER_FLOORS } from '@/lib/constants';
import { rollDice } from '@/lib/game-engine';

// 迷宫生成
interface MazeCell {
  type: 'empty' | 'wall' | 'player' | 'monster' | 'boss' | 'other_agent' | 'exit' | 'chest';
  x: number;
  y: number;
  content?: string;
  level?: number;
}

// 楼层会话状态
interface FloorSession {
  username: string;
  floor: number;
  maze: MazeCell[][];
  playerPos: { x: number; y: number };
  monsters: { x: number; y: number; name: string; level: number; hp: number; maxHp: number }[];
  chests: { x: number; y: number; opened: boolean }[];
  exitPos: { x: number; y: number };
  otherAgents: { x: number; y: number; name: string }[];
  moves: number;
  startTime: number;
}

// 会话存储
const activeSessions = new Map<string, FloorSession>();

// 生成迷宫
function generateMaze(floor: number, username: string): FloorSession {
  const size = 7 + Math.floor(floor / 20);
  const grid: MazeCell[][] = [];
  
  // 初始化网格
  for (let y = 0; y < size; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < size; x++) {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        row.push({ type: 'wall', x, y });
      } else {
        row.push({ type: Math.random() < 0.2 ? 'wall' : 'empty', x, y });
      }
    }
    grid.push(row);
  }
  
  // 设置起点和出口
  grid[1][1] = { type: 'player', x: 1, y: 1 };
  const exitX = size - 2;
  const exitY = size - 2;
  grid[exitY][exitX] = { type: 'exit', x: exitX, y: exitY };
  
  // 可放置格子
  const emptyCells: { x: number; y: number }[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (grid[y][x].type === 'empty' && !(x === 1 && y === 1) && !(x === exitX && y === exitY)) {
        emptyCells.push({ x, y });
      }
    }
  }
  emptyCells.sort(() => Math.random() - 0.5);
  
  let idx = 0;
  const monsters: FloorSession['monsters'] = [];
  const chests: FloorSession['chests'] = [];
  
  // 宝箱 1-3个
  const chestCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < chestCount && idx < emptyCells.length; i++, idx++) {
    const cell = emptyCells[idx];
    grid[cell.y][cell.x] = { type: 'chest', x: cell.x, y: cell.y, content: '宝箱' };
    chests.push({ x: cell.x, y: cell.y, opened: false });
  }
  
  // 小怪（普通层1-3个）
  if (floor % 10 !== 0) {
    const monsterCount = 1 + Math.floor(Math.random() * 3);
    const monsterNames = ['哥布林', '骷髅兵', '狼人', '食尸鬼', '暗影刺客'];
    for (let i = 0; i < monsterCount && idx < emptyCells.length; i++, idx++) {
      const cell = emptyCells[idx];
      const level = Math.max(1, floor - 5 + Math.floor(Math.random() * 10));
      const monsterHp = level * 20;
      grid[cell.y][cell.x] = { 
        type: 'monster', x: cell.x, y: cell.y, 
        content: monsterNames[Math.floor(Math.random() * monsterNames.length)],
        level,
      };
      monsters.push({
        x: cell.x, y: cell.y,
        name: grid[cell.y][cell.x].content!,
        level,
        hp: monsterHp,
        maxHp: monsterHp,
      });
    }
  }
  
  // Boss层
  if (floor % 10 === 0 && idx < emptyCells.length) {
    const cell = emptyCells[idx];
    const bossNames = ['暗影领主', '深渊魔龙', '死亡骑士长', '混沌之神', '永恒守护者'];
    const bossName = bossNames[Math.floor(floor / 10) % bossNames.length];
    const bossHp = floor * 50;
    grid[cell.y][cell.x] = { 
      type: 'boss', x: cell.x, y: cell.y, 
      content: bossName,
      level: floor,
    };
    monsters.push({
      x: cell.x, y: cell.y,
      name: bossName,
      level: floor,
      hp: bossHp,
      maxHp: bossHp,
    });
    idx++;
  }
  
  // 其他Agent (20%概率)
  const otherAgents: FloorSession['otherAgents'] = [];
  if (Math.random() < 0.2 && idx < emptyCells.length) {
    const cell = emptyCells[idx];
    const agentNames = ['迷雾剑客', '暗夜猎手', '星辰法师', '铁壁守护', '疾风刺客'];
    grid[cell.y][cell.x] = { 
      type: 'other_agent', x: cell.x, y: cell.y, 
      content: agentNames[Math.floor(Math.random() * agentNames.length)],
    };
    otherAgents.push({
      x: cell.x, y: cell.y,
      name: grid[cell.y][cell.x].content!,
    });
  }
  
  return {
    username,
    floor,
    maze: grid,
    playerPos: { x: 1, y: 1 },
    monsters,
    chests,
    exitPos: { x: exitX, y: exitY },
    otherAgents,
    moves: 0,
    startTime: Date.now(),
  };
}

// ==================== GET: 获取楼层信息 ====================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const floor = searchParams.get('floor');
  const action = searchParams.get('action');

  // 获取楼层列表
  if (action === 'list') {
    return NextResponse.json({
      success: true,
      floors: TOWER_FLOORS.map(f => ({
        floor: f.floor,
        name: f.name,
        difficulty: f.difficulty,
        isBossFloor: f.floor % 10 === 0,
        unlockLevel: f.unlockLevel,
      })),
    });
  }

  // 获取当前探索状态
  if (username) {
    const session = activeSessions.get(username);
    if (!session) {
      return NextResponse.json({
        success: true,
        exploring: false,
        message: '未在探索中',
      });
    }

    // 返回当前状态（不含完整迷宫，只返回位置信息）
    return NextResponse.json({
      success: true,
      exploring: true,
      session: {
        username: session.username,
        floor: session.floor,
        playerPos: session.playerPos,
        moves: session.moves,
        mazeSize: session.maze.length,
        exitPos: session.exitPos,
        remainingMonsters: session.monsters.length,
        remainingChests: session.chests.filter(c => !c.opened).length,
        otherAgents: session.otherAgents,
        elapsed: Math.floor((Date.now() - session.startTime) / 1000),
      },
    });
  }

  // 获取指定楼层详情
  if (floor) {
    const floorNum = parseInt(floor);
    const floorInfo = TOWER_FLOORS[floorNum - 1];
    if (!floorInfo) {
      return NextResponse.json({ success: false, error: '楼层不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      floor: {
        floor: floorInfo.floor,
        name: floorInfo.name,
        difficulty: floorInfo.difficulty,
        isBossFloor: floorNum % 10 === 0,
        rewardExp: floorInfo.rewardExp,
        unlockLevel: floorInfo.unlockLevel,
        monsterCount: floorNum % 10 === 0 ? 1 : 1 + Math.floor(Math.random() * 3),
        chestCount: 1 + Math.floor(Math.random() * 3),
        hasOtherAgents: Math.random() < 0.2,
      },
    });
  }

  return NextResponse.json({
    success: false,
    error: '请提供 username 或 floor 参数',
  }, { status: 400 });
}

// ==================== POST: 塔层操作 ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      action,
      direction,
      targetX,
      targetY,
    } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: '缺少username' }, { status: 400 });
    }

    switch (action) {
      // 开始探索
      case 'start': {
        const floor = body.floor || 1;
        const session = generateMaze(floor, username);
        activeSessions.set(username, session);
        
        return NextResponse.json({
          success: true,
          message: `开始探索第${floor}层: ${TOWER_FLOORS[floor - 1]?.name}`,
          session: {
            username: session.username,
            floor: session.floor,
            playerPos: session.playerPos,
            mazeSize: session.maze.length,
            monsters: session.monsters.map(m => ({
              name: m.name,
              level: m.level,
              hp: m.hp,
              maxHp: m.maxHp,
            })),
            chests: session.chests.length,
            otherAgents: session.otherAgents.length,
          },
          controls: {
            move: 'POST /api/tower with direction: "up"|"down"|"left"|"right"',
            attack: 'POST /api/tower with action: "attack", monsterIndex',
            openChest: 'POST /api/tower with action: "open_chest", chestIndex',
            flee: 'POST /api/tower with action: "flee"',
          },
        });
      }

      // 移动
      case 'move': {
        const session = activeSessions.get(username);
        if (!session) {
          return NextResponse.json({ success: false, error: '未在探索中' }, { status: 400 });
        }

        let dx = 0, dy = 0;
        switch (direction) {
          case 'up': dy = -1; break;
          case 'down': dy = 1; break;
          case 'left': dx = -1; break;
          case 'right': dx = 1; break;
          default:
            return NextResponse.json({ success: false, error: '无效方向' }, { status: 400 });
        }

        const newX = session.playerPos.x + dx;
        const newY = session.playerPos.y + dy;

        // 边界检查
        if (newX < 0 || newX >= session.maze[0].length || newY < 0 || newY >= session.maze.length) {
          return NextResponse.json({ success: false, error: '无法移动到边界外' }, { status: 400 });
        }

        const targetCell = session.maze[newY][newX];

        // 碰撞检测
        if (targetCell.type === 'wall') {
          return NextResponse.json({ success: false, error: '撞墙了' }, { status: 400 });
        }

        // 更新位置
        const oldCell = session.maze[session.playerPos.y][session.playerPos.x];
        oldCell.type = 'empty';
        session.maze[newY][newX] = { type: 'player', x: newX, y: newY };
        session.playerPos = { x: newX, y: newY };
        session.moves++;

        // 返回移动结果
        let result: Record<string, unknown> = {
          success: true,
          moved: true,
          playerPos: session.playerPos,
          moves: session.moves,
          encounter: null,
        };

        // 检测遭遇
        switch (targetCell.type) {
          case 'monster': {
            const monsterIdx = session.monsters.findIndex(m => m.x === newX && m.y === newY);
            if (monsterIdx !== -1) {
              result.encounter = {
                type: 'monster',
                monster: session.monsters[monsterIdx],
                canAttack: true,
              };
            }
            break;
          }
          case 'boss': {
            const monsterIdx = session.monsters.findIndex(m => m.x === newX && m.y === newY);
            if (monsterIdx !== -1) {
              result.encounter = {
                type: 'boss',
                monster: session.monsters[monsterIdx],
                canAttack: true,
              };
            }
            break;
          }
          case 'other_agent': {
            const agent = session.otherAgents.find(a => a.x === newX && a.y === newY);
            if (agent) {
              result.encounter = {
                type: 'agent',
                agent,
                canChallenge: true,
              };
            }
            break;
          }
          case 'chest': {
            const chestIdx = session.chests.findIndex(c => c.x === newX && c.y === newY && !c.opened);
            if (chestIdx !== -1) {
              result.encounter = {
                type: 'chest',
                chestIndex: chestIdx,
                canOpen: true,
              };
            }
            break;
          }
          case 'exit': {
            result.success = true;
            result.moved = true;
            result.reachedExit = true;
            result.message = '到达出口！可调用 action: "clear" 完成本层';
            activeSessions.delete(username);
            break;
          }
        }

        return NextResponse.json(result);
      }

      // 攻击怪物
      case 'attack': {
        const session = activeSessions.get(username);
        if (!session) {
          return NextResponse.json({ success: false, error: '未在探索中' }, { status: 400 });
        }

        const monsterIdx = body.monsterIndex ?? 0;
        const monster = session.monsters[monsterIdx];
        if (!monster) {
          return NextResponse.json({ success: false, error: '怪物不存在' }, { status: 404 });
        }

        // 检查是否在相邻位置
        const dx = Math.abs(monster.x - session.playerPos.x);
        const dy = Math.abs(monster.y - session.playerPos.y);
        if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
          return NextResponse.json({ success: false, error: '距离太远，无法攻击' }, { status: 400 });
        }

        // 计算伤害
        const playerRoll = rollDice();
        const playerDamage = Math.floor(20 * (1 + playerRoll / 100));
        const isCrit = playerRoll >= 95;
        const finalDamage = isCrit ? playerDamage * 2 : playerDamage;

        monster.hp = Math.max(0, monster.hp - finalDamage);

        let result: Record<string, unknown> = {
          success: true,
          attacked: true,
          damage: finalDamage,
          isCrit,
          monsterHp: monster.hp,
          monsterMaxHp: monster.maxHp,
        };

        // 怪物反击
        if (monster.hp > 0) {
          const enemyRoll = rollDice();
          const enemyDamage = Math.floor(monster.level * 2 * (1 + enemyRoll / 200));
          result.enemyDamage = enemyDamage;
          result.message = `造成${finalDamage}伤害${isCrit ? ' (暴击!)' : ''}，受到${enemyDamage}反击伤害`;
        } else {
          // 击杀怪物
          session.monsters.splice(monsterIdx, 1);
          session.maze[monster.y][monster.x] = { type: 'empty', x: monster.x, y: monster.y };
          result.defeated = true;
          result.message = `击杀${monster.name}！获得经验`;
        }

        return NextResponse.json(result);
      }

      // 开宝箱
      case 'open_chest': {
        const session = activeSessions.get(username);
        if (!session) {
          return NextResponse.json({ success: false, error: '未在探索中' }, { status: 400 });
        }

        const chestIdx = body.chestIndex ?? 0;
        const chest = session.chests[chestIdx];
        if (!chest || chest.opened) {
          return NextResponse.json({ success: false, error: '宝箱不存在或已打开' }, { status: 404 });
        }

        // 检查是否在相邻位置
        const dx = Math.abs(chest.x - session.playerPos.x);
        const dy = Math.abs(chest.y - session.playerPos.y);
        if (dx > 1 || dy > 1) {
          return NextResponse.json({ success: false, error: '距离太远' }, { status: 400 });
        }

        chest.opened = true;
        session.maze[chest.y][chest.x] = { type: 'empty', x: chest.x, y: chest.y };

        // 随机奖励
        const roll = Math.random();
        let rarity = 'common';
        let icon = '⚔️';
        if (roll < 0.1) { rarity = 'legendary'; icon = '💎'; }
        else if (roll < 0.3) { rarity = 'epic'; icon = '🔥'; }
        else if (roll < 0.6) { rarity = 'rare'; icon = '⚔️'; }

        return NextResponse.json({
          success: true,
          opened: true,
          reward: {
            rarity,
            icon,
            message: `获得${rarity === 'legendary' ? '传说' : rarity === 'epic' ? '史诗' : rarity === 'rare' ? '稀有' : '普通'}卡牌！`,
          },
          chestsRemaining: session.chests.filter(c => !c.opened).length,
        });
      }

      // 通关
      case 'clear': {
        const session = activeSessions.get(username);
        if (session) {
          activeSessions.delete(username);
        }

        const floor = body.floor || 1;
        const floorInfo = TOWER_FLOORS[floor - 1];
        const expReward = 100 + floor * 10;

        return NextResponse.json({
          success: true,
          cleared: true,
          message: `通关第${floor}层: ${floorInfo?.name}`,
          rewards: {
            exp: expReward,
            hasCardReward: floor % 5 === 0 || floor % 10 === 0,
            cardRarity: floor % 10 === 0 ? 'epic' : floor % 5 === 0 ? 'rare' : null,
          },
          nextFloor: Math.min(floor + 1, 100),
        });
      }

      // 逃跑
      case 'flee': {
        activeSessions.delete(username);
        return NextResponse.json({
          success: true,
          fled: true,
          message: '逃离当前探索',
        });
      }

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Tower API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
