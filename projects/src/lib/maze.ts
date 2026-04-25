import { MazeCell, MazeCellType, MazeEvent, MazeEventResult, AgentMazeState, Card } from '@/types';
import { CARD_POOL, RARITY_WEIGHTS, TOWER_FLOORS, BASE_STATS, LEVEL_GROWTH } from '@/lib/constants';

// 迷宫尺寸
export const MAZE_WIDTH = 7;
export const MAZE_HEIGHT = 7;

// 生成伪随机数（基于种子）
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// 生成楼层迷宫
export function generateFloorMaze(floor: number, seed?: number): MazeCell[][] {
  const mazeSeed = seed || floor * 1000 + Date.now();
  const random = seededRandom(mazeSeed);
  
  const maze: MazeCell[][] = [];
  
  // 初始化迷宫（全墙壁）
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    maze[y] = [];
    for (let x = 0; x < MAZE_WIDTH; x++) {
      maze[y][x] = { x, y, type: 'wall' };
    }
  }
  
  // 使用递归回溯法生成路径
  const visited = new Set<string>();
  
  function carve(x: number, y: number): void {
    visited.add(`${x},${y}`);
    maze[y][x] = { x, y, type: 'empty' };
    
    // 随机方向
    const directions = [
      [0, -1], [0, 1], [-1, 0], [1, 0]
    ].sort(() => random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !visited.has(`${nx},${ny}`)) {
        // 打通墙壁
        maze[y + dy][x + dx] = { x: x + dx, y: y + dy, type: 'empty' };
        carve(nx, ny);
      }
    }
  }
  
  // 从起点开始生成
  carve(0, 0);
  
  // 设置起点
  maze[0][0].type = 'start';
  
  // 放置玩家（起点）
  maze[0][0].type = 'player';
  
  // 放置出口（在相对角落）
  const exitX = MAZE_WIDTH - 1;
  const exitY = MAZE_HEIGHT - 1;
  maze[exitY][exitX].type = 'exit';
  
  // 生成事件
  const events = generateMazeEvents(floor, maze, random);
  
  return maze;
}

// 生成迷宫事件
function generateMazeEvents(floor: number, maze: MazeCell[][], random: () => number): MazeEvent[] {
  const events: MazeEvent[] = [];
  const isBossFloor = floor % 10 === 0;
  
  // 收集可用的空格子
  const emptyCells: MazeCell[] = [];
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      const cell = maze[y][x];
      if (cell.type === 'empty' && !(x === 0 && y === 0) && !(x === MAZE_WIDTH - 1 && y === MAZE_HEIGHT - 1)) {
        emptyCells.push(cell);
      }
    }
  }
  
  // 打乱顺序
  emptyCells.sort(() => random() - 0.5);
  
  if (isBossFloor) {
    // Boss层：放置Boss
    const bossCell = emptyCells[0] || maze[Math.floor(MAZE_HEIGHT / 2)][Math.floor(MAZE_WIDTH / 2)];
    bossCell.type = 'boss';
    bossCell.content = getBossName(floor);
    bossCell.level = floor;
    bossCell.hp = getMonsterHp(floor);
    bossCell.maxHp = bossCell.hp;
    bossCell.attack = getMonsterAttack(floor);
    bossCell.defense = getMonsterDefense(floor);
    
    events.push({
      id: `boss-${floor}-${Date.now()}`,
      type: 'boss',
      title: `BOSS: ${bossCell.content}`,
      description: `强大的Boss等待挑战！`,
      floor,
      x: bossCell.x,
      y: bossCell.y,
      difficulty: floor,
    });
  } else {
    // 普通层：放置小怪、宝箱、其他Agent
    
    // 小怪数量：1-3个
    const monsterCount = Math.floor(random() * 3) + 1;
    for (let i = 0; i < monsterCount && i < emptyCells.length; i++) {
      const cell = emptyCells[i];
      cell.type = 'monster';
      cell.content = getMonsterName(floor, random);
      cell.level = Math.max(1, floor - Math.floor(random() * 3));
      cell.hp = getMonsterHp(cell.level!);
      cell.maxHp = cell.hp;
      cell.attack = getMonsterAttack(cell.level!);
      cell.defense = getMonsterDefense(cell.level!);
      
      events.push({
        id: `monster-${floor}-${i}`,
        type: 'monster',
        title: `遭遇 ${cell.content}`,
        description: `Lv.${cell.level} 怪物`,
        floor,
        x: cell.x,
        y: cell.y,
        difficulty: cell.level!,
      });
    }
    
    // 20%概率遇到其他Agent（抢夺对战）
    if (random() < 0.2) {
      const agentCell = emptyCells[monsterCount];
      if (agentCell) {
        const agentUsername = `NPC_${floor}_${Date.now().toString(36)}`;
        agentCell.type = 'other_agent';
        agentCell.content = getRandomAgentName();
        agentCell.level = Math.max(1, floor - 2 + Math.floor(random() * 5));
        agentCell.hp = getMonsterHp(agentCell.level);
        agentCell.maxHp = agentCell.hp;
        agentCell.attack = getMonsterAttack(agentCell.level);
        agentCell.defense = getMonsterDefense(agentCell.level);
        agentCell.avatar = getRandomAvatar();
        agentCell.agentInfo = {
          username: agentUsername,
          nickname: agentCell.content,
          avatar: agentCell.avatar,
          level: agentCell.level,
          cardCount: Math.floor(random() * 10) + 3,
        };
        
        events.push({
          id: `agent-${floor}-${Date.now()}`,
          type: 'agent',
          title: `遭遇 ${agentCell.content}`,
          description: `可以发起抢夺对战！`,
          floor,
          x: agentCell.x,
          y: agentCell.y,
          difficulty: agentCell.level,
        });
      }
    }
    
    // 宝箱数量：1-2个
    const chestCount = Math.floor(random() * 2) + 1;
    for (let i = 0; i < chestCount && i + monsterCount < emptyCells.length; i++) {
      const cell = emptyCells[i + monsterCount];
      cell.type = 'chest';
      cell.content = '宝箱';
      cell.rarity = getChestRarity(random);
      
      events.push({
        id: `chest-${floor}-${i}`,
        type: 'chest',
        title: `发现 ${cell.rarity === 'legendary' ? '传说' : cell.rarity === 'epic' ? '史诗' : cell.rarity === 'rare' ? '稀有' : '普通'}宝箱`,
        description: `可能包含卡牌奖励！`,
        floor,
        x: cell.x,
        y: cell.y,
        difficulty: 0,
      });
    }
  }
  
  return events;
}

// 获取怪物名称
function getMonsterName(floor: number, random: () => number): string {
  const prefixes = ['暗影', '狂暴', '剧毒', '幽灵', '骷髅', '食人魔', '巨魔', '石像鬼', '地狱犬', '黑暗法师'];
  const names = ['战士', '弓箭手', '刺客', '法师', '骑士', '术士', '猎人', '萨满', '死灵', '恶魔'];
  const prefix = prefixes[Math.floor(random() * prefixes.length)];
  const name = names[Math.floor(random() * names.length)];
  return prefix + name;
}

// 获取Boss名称
function getBossName(floor: number): string {
  const bosses = [
    '深渊领主', '黑暗巨龙', '死神', '毁灭之王', '虚空魔神',
    '混沌之王', '地狱之主', '噩梦君主', '噬魂者', '终焉之龙'
  ];
  return bosses[(floor - 1) % bosses.length];
}

// 获取随机Agent名称
function getRandomAgentName(): string {
  const names = ['星辰守护者', '月光刺客', '烈焰战神', '寒冰法师', '疾风剑圣', '暗夜游侠', '圣光骑士', '雷霆使者'];
  return names[Math.floor(Math.random() * names.length)];
}

// 获取随机头像
function getRandomAvatar(): string {
  const avatars = ['🦇', '🐺', '🦊', '🐉', '🦅', '🦁', '🕷️', '🐍', '⚔️', '🔮', '💀', '👹'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// 获取怪物属性
function getMonsterHp(level: number): number {
  return Math.floor((BASE_STATS.hp + level * LEVEL_GROWTH.hp) * (1 + level * 0.1));
}

function getMonsterAttack(level: number): number {
  return Math.floor((BASE_STATS.attack + level * LEVEL_GROWTH.attack) * (1 + level * 0.08));
}

function getMonsterDefense(level: number): number {
  return Math.floor((BASE_STATS.defense + level * LEVEL_GROWTH.defense) * (1 + level * 0.05));
}

// 获取宝箱稀有度
function getChestRarity(random: () => number): string {
  const roll = random() * 100;
  if (roll < 5) return 'legendary';
  if (roll < 20) return 'epic';
  if (roll < 50) return 'rare';
  return 'common';
}

// 获取随机卡牌
export function getRandomCard(rarity?: string): Card {
  if (rarity) {
    const pool = CARD_POOL.filter(c => c.rarity === rarity);
    if (pool.length > 0) {
      return { ...pool[Math.floor(Math.random() * pool.length)] };
    }
  }
  
  // 根据权重随机
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  
  for (const [rar, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      const pool = CARD_POOL.filter(c => c.rarity === rar);
      if (pool.length > 0) {
        return { ...pool[Math.floor(Math.random() * pool.length)] };
      }
    }
  }
  
  return { ...CARD_POOL[0] };
}

// Roll点系统
export function rollDice(): { value: number; isCritical: boolean } {
  const value = Math.floor(Math.random() * 100) + 1;
  return {
    value,
    isCritical: value >= 95, // 95-100为暴击
  };
}

// 计算伤害
export function calculateDamage(
  attack: number,
  defense: number,
  isCritical: boolean,
  bonusDamage: number = 0
): number {
  let damage = Math.max(1, attack - defense * 0.5 + bonusDamage);
  if (isCritical) {
    damage *= 2;
  }
  return Math.floor(damage);
}

// 处理事件结果
export function processEventResult(
  event: MazeEvent,
  agentLevel: number,
  agentAttack: number,
  agentHp: number,
  agentMaxHp: number
): MazeEventResult {
  const roll = rollDice();
  
  if (event.type === 'monster' || event.type === 'boss') {
    // 战斗
    const difficultyBonus = (event.difficulty || 1) * 10;
    const successChance = 50 + (agentLevel - event.difficulty) * 5 + roll.value / 2;
    const success = successChance > randomBetween(30, 80);
    
    if (success) {
      const expGained = Math.floor((event.difficulty * 20 + (event.type === 'boss' ? 200 : 0)) * (1 + agentLevel * 0.1));
      return {
        eventId: event.id,
        type: event.type,
        result: 'victory',
        expGained,
        message: `击败 ${event.title}！获得 ${expGained} 经验`,
      };
    } else {
      const damageTaken = Math.floor(agentMaxHp * 0.3);
      return {
        eventId: event.id,
        type: event.type,
        result: 'defeat',
        currentHp: Math.max(1, agentHp - damageTaken),
        message: `战斗失败！损失 ${damageTaken} HP`,
      };
    }
  }
  
  if (event.type === 'chest') {
    // 开启宝箱
    const card = getRandomCard(event.floor % 10 === 0 ? 'epic' : undefined);
    return {
      eventId: event.id,
      type: 'chest',
      result: 'opened',
      cardsGained: [card],
      message: `开启宝箱，获得 ${card.name}！`,
    };
  }
  
  if (event.type === 'agent') {
    // 抢夺对战
    const stealChance = 40 + (agentLevel - (event.difficulty || 1)) * 5 + roll.value / 3;
    const success = stealChance > 50;
    
    if (success) {
      const card = getRandomCard();
      return {
        eventId: event.id,
        type: 'agent',
        result: 'stolen',
        cardsGained: [card],
        message: `抢夺成功！获得 ${card.name}`,
      };
    } else {
      const card = getRandomCard();
      return {
        eventId: event.id,
        type: 'agent',
        result: 'escape',
        cardLost: card,
        message: `抢夺失败！被对方抢走 ${card.name}`,
      };
    }
  }
  
  return {
    eventId: event.id,
    type: event.type,
    result: 'victory',
    message: '无事发生',
  };
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 初始化Agent迷宫状态
export function createAgentMazeState(username: string, floor: number): AgentMazeState {
  return {
    username,
    currentFloor: floor,
    mazeX: 0,
    mazeY: 0,
    mazeSeed: floor * 1000 + Date.now(),
    exploredCells: new Set(['0,0']),
    encounteredEvents: [],
    currentEvent: null,
    battleId: null,
  };
}
