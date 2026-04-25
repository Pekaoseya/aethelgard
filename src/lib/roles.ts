// 角色系统 - 独立模块

import { Card } from '@/types';

// Agent数据（用于注册表）
export interface AgentData {
  username: string;
  nickname: string;
  avatar: string;
  level: number;
  currentHp: number;
  maxHp: number;
  cardCount: number;
  highestFloor: number;
  deathCount: number;
  winCount: number;
  currentFloor: number;
  status: 'idle' | 'exploring' | 'in_battle';
  registeredAt: string;
  lastUpdate: number;
}

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
  target: number;
  progress: number;
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
  availableFloors: [number, number];
  mission: Omit<Mission, 'progress'>;
}

// Agent角色状态
export interface AgentRoleState {
  username: string;
  role: Role | null;
  mission: Mission | null;
  missionStartTime: number;
  missionTimeout: number;
  completedFloors: number[];
  allies: string[];
  observations: string[];
  defeatedMonsters: number;
  defeatedAgents: number;
  openedChests: number;
  collectedCards: number;
  rareCardsCollected: number;
  isBoss: boolean;
  isEscaped: boolean;
  missionCompleted: boolean;
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

// 任务超时时间（30分钟）
const MISSION_TIMEOUT = 30 * 60 * 1000;

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
    return ROLE_POOL[0];
  }
  return availableRoles[Math.floor(Math.random() * availableRoles.length)];
}

// 检查任务是否完成
export function checkMissionComplete(mission: Mission): boolean {
  return mission.progress >= mission.target;
}

// 创建角色状态
export function createRoleState(username: string, floor: number): AgentRoleState {
  const role = assignRandomRole(floor);
  return {
    username,
    role,
    mission: {
      ...role.mission,
      progress: 0,
    },
    missionStartTime: Date.now(),
    missionTimeout: MISSION_TIMEOUT,
    completedFloors: [],
    allies: [],
    observations: [],
    defeatedMonsters: 0,
    defeatedAgents: 0,
    openedChests: 0,
    collectedCards: 0,
    rareCardsCollected: 0,
    isBoss: false,
    isEscaped: false,
    missionCompleted: false,
  };
}

// 更新任务进度
export function updateMissionProgress(
  state: AgentRoleState,
  type: 'monster' | 'agent' | 'chest' | 'cards' | 'rare_cards' | 'observe' | 'alliance' | 'boss'
): AgentRoleState {
  const newState = { ...state };
  
  switch (type) {
    case 'monster':
      newState.defeatedMonsters++;
      break;
    case 'agent':
      newState.defeatedAgents++;
      break;
    case 'chest':
      newState.openedChests++;
      break;
    case 'cards':
      newState.collectedCards++;
      break;
    case 'rare_cards':
      newState.rareCardsCollected++;
      break;
    case 'observe':
      break;
    case 'alliance':
      break;
    case 'boss':
      // Boss战胜利算作怪物击杀
      newState.defeatedMonsters++;
      break;
  }

  // 根据角色类型更新对应进度
  if (newState.mission) {
    switch (newState.mission.type) {
      case 'defeat_monsters':
        newState.mission.progress = newState.defeatedMonsters;
        break;
      case 'defeat_agents':
        newState.mission.progress = newState.defeatedAgents;
        break;
      case 'open_chests':
        newState.mission.progress = newState.openedChests;
        break;
      case 'collect_cards':
        newState.mission.progress = newState.collectedCards;
        break;
      case 'observe_agents':
        newState.mission.progress = newState.observations.length;
        break;
      case 'form_alliances':
        newState.mission.progress = newState.allies.length;
        break;
      case 'identify_rare':
        newState.mission.progress = newState.rareCardsCollected;
        break;
      case 'comprehensive':
        // 综合任务：需要同时满足多个条件
        const monstersOk = newState.defeatedMonsters >= 10;
        const agentsOk = newState.defeatedAgents >= 10;
        const cardsOk = newState.collectedCards >= 25;
        if (monstersOk && agentsOk && cardsOk) {
          newState.mission.progress = 1;
        }
        break;
    }

    // 检查任务是否完成
    newState.missionCompleted = checkMissionComplete(newState.mission);
  }

  return newState;
}

// 获取角色状态描述
export function getRoleStatusDescription(state: AgentRoleState): string {
  if (!state.role || !state.mission) {
    return '无角色';
  }

  if (state.missionCompleted) {
    return `✅ ${state.role.name} 任务已完成！可进入下一层`;
  }

  const progress = state.mission.progress;
  const target = state.mission.target;
  const percent = Math.min(100, Math.round((progress / target) * 100));

  return `${state.role.icon} ${state.role.name}: ${progress}/${target} (${percent}%)`;
}
