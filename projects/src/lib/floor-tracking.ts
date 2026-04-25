// 共享的楼层Agent追踪状态

export interface FloorAgentInfo {
  username: string;
  nickname: string;
  avatar: string;
  level: number;
  currentFloor: number;
  currentHp: number;
  maxHp: number;
  cardCount: number;
  highestFloor: number;
  deathCount: number;
  winCount: number;
  status: 'idle' | 'exploring' | 'in_battle';
  lastUpdate: number;
}

// 楼层Agent追踪Map: floorNumber -> Map<username, agentInfo>
const floorAgentsMap = new Map<number, Map<string, FloorAgentInfo>>();

// 获取楼层Agent列表
export function getFloorAgents(): Map<number, Map<string, FloorAgentInfo>> {
  return floorAgentsMap;
}

// 获取指定楼层的Agent列表
export function getAgentsOnFloor(floor: number): FloorAgentInfo[] {
  const floorMap = floorAgentsMap.get(floor);
  if (!floorMap) return [];
  return Array.from(floorMap.values());
}

// 添加Agent到指定楼层
export function addAgentToFloor(agent: FloorAgentInfo): void {
  // 先从其他楼层移除该Agent
  removeAgentFromAllFloors(agent.username);
  
  // 添加到目标楼层
  if (!floorAgentsMap.has(agent.currentFloor)) {
    floorAgentsMap.set(agent.currentFloor, new Map());
  }
  floorAgentsMap.get(agent.currentFloor)!.set(agent.username, agent);
}

// 从所有楼层移除Agent
export function removeAgentFromAllFloors(username: string): void {
  for (const floorMap of floorAgentsMap.values()) {
    floorMap.delete(username);
  }
}

// 更新Agent楼层
export function updateAgentFloor(username: string, newFloor: number, agentInfo: Partial<FloorAgentInfo>): void {
  // 从旧楼层移除
  removeAgentFromAllFloors(username);
  
  // 添加到新楼层
  if (!floorAgentsMap.has(newFloor)) {
    floorAgentsMap.set(newFloor, new Map());
  }
  floorAgentsMap.get(newFloor)!.set(username, {
    username,
    nickname: agentInfo.nickname || username,
    avatar: agentInfo.avatar || '',
    level: agentInfo.level || 1,
    currentFloor: newFloor,
    currentHp: agentInfo.currentHp || 100,
    maxHp: agentInfo.maxHp || 100,
    cardCount: agentInfo.cardCount || 5,
    highestFloor: agentInfo.highestFloor || newFloor,
    deathCount: agentInfo.deathCount || 0,
    winCount: agentInfo.winCount || 0,
    status: agentInfo.status || 'exploring',
    lastUpdate: Date.now(),
  });
}

// 清除所有楼层数据
export function clearAllFloorAgents(): void {
  floorAgentsMap.clear();
}
