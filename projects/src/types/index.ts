// Agent类型定义
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  expToNext: number;
  
  // 战斗属性
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  
  // 战斗状态
  currentHp: number;
  shield: number;
  
  // 卡牌系统
  cards: Card[];
  maxCards: number;
  
  // 状态
  isDead: boolean;
  deathCount: number;
  buffs: Buff[];
}

// 卡牌类型定义
export type CardType = 'attack' | 'defense' | 'skill' | 'buff' | 'debuff';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CardEffect {
  type: 'damage' | 'heal' | 'shield' | 'buff_self' | 'debuff_enemy' | 'special';
  value: number;
  duration?: number;
  condition?: string;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  effect: CardEffect;
  cost: number;
  icon: string;
  description: string;
}

// Buff/Debuff系统
export type BuffType = 'attack_up' | 'attack_down' | 'defense_up' | 'defense_down' | 'speed_up' | 'speed_down' | 'shield' | 'poison' | 'invincible';

export interface Buff {
  id: string;
  type: BuffType;
  value: number;
  duration: number;
  name: string;
}

// 塔层系统
export interface TowerFloor {
  floor: number;
  name: string;
  difficulty: number;
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  spdMultiplier: number;
  rewardExp: number;
  cardReward?: Card[];
  unlockLevel?: number;
}

// 战斗系统
export interface BattleState {
  phase: 'ready' | 'rolling' | 'playing' | 'resolving' | 'finished';
  turn: number;
  currentActor: 'player' | 'enemy';
  playerCards: Card[];
  enemyCards: Card[];
  playerSelectedCard: Card | null;
  enemySelectedCard: Card | null;
  rollResult: RollResult | null;
  battleLog: BattleLogEntry[];
  winner: 'player' | 'enemy' | null;
}

export interface RollResult {
  playerRoll: number;
  enemyRoll: number;
  playerFinal: number;
  enemyFinal: number;
  attacker: 'player' | 'enemy';
}

export interface BattleLogEntry {
  turn: number;
  actor: 'player' | 'enemy' | 'system';
  message: string;
  type: 'damage' | 'heal' | 'buff' | 'roll' | 'info' | 'critical' | 'dodge' | 'debuff';
}

// 游戏状态
export interface AgentWorldProfile {
  username: string;
  nickname: string;
  apiKey: string;
  avatarUrl?: string;
  isRegistered: boolean;
}

// AI对手
export interface AIOpponent {
  name: string;
  avatar: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  cards: Card[];
}

// 奖励记录
export interface RewardRecord {
  type: 'card' | 'exp' | 'floor_clear';
  amount?: number;
  card?: Card;
  floor?: number;
}

// ============= 迷宫系统类型 =============

// 迷宫格子类型
export type MazeCellType = 
  | 'empty'      // 空地
  | 'wall'       // 墙壁
  | 'player'     // 当前Agent
  | 'monster'    // 小怪
  | 'boss'       // Boss
  | 'other_agent' // 其他Agent（可抢夺）
  | 'exit'       // 出口（通往下一层）
  | 'chest'      // 宝箱
  | 'start';     // 起点

// 迷宫格子
export interface MazeCell {
  x: number;
  y: number;
  type: MazeCellType;
  visited?: boolean; // 是否被探索过
  content?: string;  // 实体名称
  level?: number;     // 实体等级
  hp?: number;        // 实体当前HP
  maxHp?: number;     // 实体最大HP
  attack?: number;    // 实体攻击力
  defense?: number;  // 实体防御力
  avatar?: string;    // 实体头像
  rarity?: string;    // 宝箱稀有度
  agentInfo?: {      // 其他Agent信息
    username: string;
    nickname: string;
    level: number;
    cardCount: number;
    avatar: string;
  };
}

// 迷宫事件
export interface MazeEvent {
  id: string;
  type: 'monster' | 'boss' | 'agent' | 'chest' | 'battle_result';
  title: string;
  description: string;
  floor: number;
  x: number;
  y: number;
  difficulty: number;
  reward?: {
    exp?: number;
    cards?: Card[];
  };
  agentInfo?: {      // 涉及的其他Agent
    username: string;
    nickname: string;
    avatar: string;
    level: number;
  };
}

// 迷宫事件结果
export interface MazeEventResult {
  eventId: string;
  type: 'monster' | 'boss' | 'agent' | 'chest' | 'battle_result';
  result: 'victory' | 'defeat' | 'escape' | 'opened' | 'stolen' | 'battle_result';
  expGained?: number;
  cardsGained?: Card[];
  cardLost?: Card;
  currentHp?: number;
  message: string;
}

// Agent在迷宫中的状态
export interface AgentMazeState {
  username: string;
  currentFloor: number;
  mazeX: number;      // 迷宫坐标X
  mazeY: number;      // 迷宫坐标Y
  mazeSeed: number;   // 迷宫种子（同一层同一种子）
  exploredCells: Set<string>; // 已探索的格子 (x,y)
  encounteredEvents: string[]; // 已触发的事件ID
  currentEvent: MazeEvent | null; // 当前进行中的事件
  battleId: string | null; // 战斗中ID
}

// 战斗结构
export interface BattleInfo {
  id: string;
  floor: number;
  attackerUsername: string;
  attackerNickname: string;
  attackerAvatar: string;
  defenderUsername: string;
  defenderNickname: string;
  defenderAvatar: string;
  attackerHp: number;
  defenderHp: number;
  attackerMaxHp: number;
  defenderMaxHp: number;
  attackerCards: number;
  defenderCards: number;
  result?: 'attacker_win' | 'defender_win' | 'ongoing';
  timestamp: number;
}

// ============= 多Agent对战系统 =============

// 房间状态
export type RoomStatus = 'waiting' | 'matching' | 'ready' | 'in_battle' | 'finished';

// 房间成员
export interface RoomMember {
  username: string;
  nickname: string;
  avatar: string;
  level: number;
  currentFloor: number;
  status: 'online' | 'in_battle' | 'offline';
  isReady: boolean;
  isAlly: boolean; // 是否与当前用户结盟
  allyGroup?: string; // 盟友组ID
}

// 战斗房间
export interface BattleRoom {
  id: string;
  roomName: string;
  floor: number; // 所在层数
  hostUsername: string;
  members: RoomMember[];
  status: RoomStatus;
  maxMembers: number;
  createdAt: string;
  battleConfig: {
    allowAlly: boolean;
    allowCardExchange: boolean;
    maxAllies: number;
  };
}

// 盟友关系
export interface AllyRelation {
  id: string;
  groupId: string;
  members: string[]; // username数组
  createdAt: string;
  cardExchangeHistory: CardExchangeRecord[];
}

// 卡牌交换记录
export interface CardExchangeRecord {
  id: string;
  fromUsername: string;
  toUsername: string;
  cardId: string;
  cardName: string;
  timestamp: string;
  accepted: boolean;
}

// 多人战斗参与者
export interface BattleParticipant {
  username: string;
  nickname: string;
  avatar: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  currentHp: number;
  shield: number;
  cards: Card[];
  isDead: boolean;
  isAlly: boolean; // 是否为盟友
  allyGroup?: string;
  selectedCard: Card | null;
  buffs: Buff[];
  isHost: boolean;
}

// 多人战斗状态
export interface MultiAgentBattleState {
  roomId: string;
  floor: number;
  phase: 'ready' | 'roll_initiative' | 'select_card' | 'resolve' | 'finished';
  turn: number;
  participants: BattleParticipant[];
  currentTurnIndex: number; // 当前行动者索引
  initiativeOrder: string[]; // 行动顺序(username数组)
  battleLog: BattleLogEntry[];
  winner: string | null; // 获胜者username
  winningGroup?: string; // 获胜的盟友组
  pendingCardExchange: {
    from: string;
    to: string;
    card: Card;
    status: 'pending' | 'accepted' | 'rejected';
  } | null;
}

// 卡牌交换请求
export interface CardExchangeRequest {
  roomId: string;
  fromUsername: string;
  toUsername: string;
  cardId: string;
}

// 盟友请求
export interface AllyRequest {
  roomId: string;
  fromUsername: string;
  toUsername: string;
}

// 游戏状态扩展 - 多人对战
export interface MultiAgentGameState {
  currentRoom: BattleRoom | null;
  activeBattle: MultiAgentBattleState | null;
  availableRooms: BattleRoom[];
  allies: AllyRelation[];
  pendingAllyRequests: AllyRequest[];
  pendingCardExchange: CardExchangeRequest | null;
}

// 合并到GameState
export interface GameState {
  agent: Agent;
  agentWorld: AgentWorldProfile;
  highestFloor: number;
  currentFloor: number;
  isInBattle: boolean;
  battleState: BattleState | null;
  selectedTab: 'tower';
  showGachaModal: boolean;
  showAgentRegistration: boolean;
  pendingCardReward: Card | null;
  totalWins: number;
  totalDeaths: number;
  // 多Agent对战
  multiAgent: {
    currentRoom: BattleRoom | null;
    activeBattle: MultiAgentBattleState | null;
    availableRooms: BattleRoom[];
    pendingAllyRequest: AllyRequest | null;
    pendingCardExchange: CardExchangeRequest | null;
  };
}

// ============= 角色系统 =============

// 角色类型
export type RoleType = 
  | 'apprentice'     // 学徒 (1-10层)
  | 'scavenger'       // 拾荒者 (1-10层)
  | 'hunter'          // 猎人 (11-20层)
  | 'assassin'        // 刺客 (11-20层)
  | 'collector'       // 收藏家 (21-30层)
  | 'appraiser'       // 鉴定师 (21-30层)
  | 'leader'          // 领袖 (31-40层)
  | 'spy'             // 间谍 (31-40层)
  | 'conqueror';      // 征服者 (41-50层)

// 任务类型
export type MissionType =
  | 'defeat_monsters'      // 击败怪物
  | 'defeat_agents'        // 击败其他Agent
  | 'collect_cards'        // 收集卡牌
  | 'open_chests'          // 开启宝箱
  | 'identify_rare'        // 鉴定稀有宝箱
  | 'form_alliances'       // 结盟
  | 'observe_agents'       // 观察Agent
  | 'comprehensive';       // 综合挑战

// 任务定义
export interface Mission {
  type: MissionType;
  description: string;
  target: number;           // 目标数量
  progress: number;         // 当前进度
  reward: {
    unlockNextFloor: boolean;
    bonusCards?: number;
  };
}

// 角色定义
export interface Role {
  id: RoleType;
  name: string;
  icon: string;
  description: string;
  availableFloors: [number, number]; // 可用楼层范围
  mission: Omit<Mission, 'progress'>;
}

// Agent角色状态
export interface AgentRoleState {
  username: string;
  role: Role | null;
  mission: Mission | null;
  missionStartTime: number;       // 任务开始时间
  missionTimeout: number;          // 任务超时时间（毫秒）
  completedFloors: number[];       // 已完成楼层列表
  allies: string[];                // 结盟过的Agent
  observations: string[];           // 观察记录（间谍用）
  defeatedMonsters: number;       // 击败怪物数
  defeatedAgents: number;          // 击败Agent数
  openedChests: number;            // 开启宝箱数
  collectedCards: number;           // 收集卡牌数
  rareCardsCollected: number;       // 稀有卡收集数
  isBoss: boolean;                 // 是否是Boss
  isEscaped: boolean;              // 是否逃跑过（未完成任务）
}

// 角色池
export const ROLE_POOL: Role[] = [
  // 第1-10层
  {
    id: 'apprentice',
    name: '学徒',
    icon: '📚',
    description: '初入试炼之塔的新手，需要完成基础试炼',
    availableFloors: [1, 10],
    mission: {
      type: 'defeat_monsters',
      description: '击败3个怪物并收集1张稀有卡牌',
      target: 3,
      reward: { unlockNextFloor: true },
    },
  },
  {
    id: 'scavenger',
    name: '拾荒者',
    icon: '🎒',
    description: '擅长寻找资源的探索者',
    availableFloors: [1, 10],
    mission: {
      type: 'open_chests',
      description: '开启5个宝箱',
      target: 5,
      reward: { unlockNextFloor: true },
    },
  },
  // 第11-20层
  {
    id: 'hunter',
    name: '猎人',
    icon: '🏹',
    description: '专门猎杀怪物的勇士',
    availableFloors: [11, 20],
    mission: {
      type: 'defeat_monsters',
      description: '击败8个怪物',
      target: 8,
      reward: { unlockNextFloor: true },
    },
  },
  {
    id: 'assassin',
    name: '刺客',
    icon: '🗡️',
    description: '隐藏在阴影中的杀手',
    availableFloors: [11, 20],
    mission: {
      type: 'defeat_agents',
      description: '击败5个其他Agent',
      target: 5,
      reward: { unlockNextFloor: true },
    },
  },
  // 第21-30层
  {
    id: 'collector',
    name: '收藏家',
    icon: '💎',
    description: '致力于收集珍稀卡牌的收藏家',
    availableFloors: [21, 30],
    mission: {
      type: 'collect_cards',
      description: '收集15张卡牌（至少5张稀有）',
      target: 15,
      reward: { unlockNextFloor: true, bonusCards: 3 },
    },
  },
  {
    id: 'appraiser',
    name: '鉴定师',
    icon: '🔍',
    description: '能辨别珍宝真伪的专家',
    availableFloors: [21, 30],
    mission: {
      type: 'identify_rare',
      description: '鉴定3个传说/史诗宝箱',
      target: 3,
      reward: { unlockNextFloor: true },
    },
  },
  // 第31-40层
  {
    id: 'leader',
    name: '领袖',
    icon: '👑',
    description: '天生的领导者，擅长组织团队',
    availableFloors: [31, 40],
    mission: {
      type: 'form_alliances',
      description: '与3个不同Agent结盟（击败Boss时）',
      target: 3,
      reward: { unlockNextFloor: true },
    },
  },
  {
    id: 'spy',
    name: '间谍',
    icon: '🎭',
    description: '隐藏在人群中的观察者',
    availableFloors: [31, 40],
    mission: {
      type: 'observe_agents',
      description: '观察到8个不同Agent的卡牌',
      target: 8,
      reward: { unlockNextFloor: true },
    },
  },
  // 第41-50层
  {
    id: 'conqueror',
    name: '征服者',
    icon: '⚔️',
    description: '追求终极力量的挑战者',
    availableFloors: [41, 50],
    mission: {
      type: 'comprehensive',
      description: '击败Boss + 收集25张卡 + 击败10个Agent',
      target: 1,
      reward: { unlockNextFloor: true, bonusCards: 5 },
    },
  },
];

// 根据楼层获取可用角色
export function getRolesForFloor(floor: number): Role[] {
  return ROLE_POOL.filter(
    role => floor >= role.availableFloors[0] && floor <= role.availableFloors[1]
  );
}

// 随机分配角色
export function assignRandomRole(floor: number): Role {
  const availableRoles = getRolesForFloor(floor);
  if (availableRoles.length === 0) {
    // 默认学徒
    return ROLE_POOL[0];
  }
  return availableRoles[Math.floor(Math.random() * availableRoles.length)];
}

// 检查任务是否完成
export function checkMissionComplete(mission: Mission): boolean {
  return mission.progress >= mission.target;
}
