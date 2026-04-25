import { NextRequest, NextResponse } from 'next/server';
import { 
  generateFloorMaze, 
  MAZE_WIDTH, 
  MAZE_HEIGHT,
  processEventResult,
  rollDice,
  calculateDamage 
} from '@/lib/maze';
import { MazeCell, MazeEvent, MazeEventResult, AgentMazeState, BattleInfo } from '@/types';
import { getAllRegisteredAgents } from '@/app/api/agent/register/route';

// 存储每层的迷宫数据
const floorMazes = new Map<number, MazeCell[][]>();

// 存储每个Agent的迷宫状态
const agentMazeStates = new Map<string, AgentMazeState>();

// 存储当前战斗
const activeBattles = new Map<string, BattleInfo>();

// 获取或生成楼层迷宫
function getFloorMaze(floor: number): MazeCell[][] {
  if (!floorMazes.has(floor)) {
    floorMazes.set(floor, generateFloorMaze(floor));
  }
  return floorMazes.get(floor)!;
}

// 获取Agent迷宫状态（如果没有则从注册表初始化）
function getOrInitAgentMazeState(username: string): AgentMazeState | null {
  // 检查是否已有状态
  if (agentMazeStates.has(username)) {
    return agentMazeStates.get(username)!;
  }
  
  // 从注册表获取Agent信息并初始化
  const registeredAgents = getAllRegisteredAgents();
  const agent = registeredAgents.get(username);
  if (agent) {
    return initAgentMazeState(username, agent.currentFloor);
  }
  
  return null;
}

// 获取Agent迷宫状态
function getAgentMazeState(username: string): AgentMazeState | null {
  return agentMazeStates.get(username) || null;
}

// 初始化Agent迷宫状态
function initAgentMazeState(username: string, floor: number): AgentMazeState {
  const mazeState: AgentMazeState = {
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
  agentMazeStates.set(username, mazeState);
  return mazeState;
}

// 移动方向
type Direction = 'up' | 'down' | 'left' | 'right';

// GET - 获取迷宫状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const floor = searchParams.get('floor');
    
    if (floor) {
      // 获取指定楼层的迷宫
      const floorNum = parseInt(floor, 10);
      const maze = getFloorMaze(floorNum);
      
      return NextResponse.json({
        success: true,
        floor: floorNum,
        maze,
        width: MAZE_WIDTH,
        height: MAZE_HEIGHT,
      });
    }
    
    if (username) {
      // 获取Agent的迷宫状态（没有则从注册表初始化）
      let state = getOrInitAgentMazeState(username);
      
      if (!state) {
        return NextResponse.json({
          success: false,
          error: 'Agent未注册',
        });
      }
      
      const maze = getFloorMaze(state.currentFloor);
      
      // 获取该层所有Agent位置
      const agentsOnFloor = Array.from(agentMazeStates.values())
        .filter(s => s.currentFloor === state!.currentFloor && s.username !== username)
        .map(s => ({
          username: s.username,
          x: s.mazeX,
          y: s.mazeY,
        }));
      
      return NextResponse.json({
        success: true,
        state,
        maze,
        agentsOnFloor,
        width: MAZE_WIDTH,
        height: MAZE_HEIGHT,
      });
    }
    
    // 获取所有在线Agent的迷宫状态
    // 1. 已在maze中的Agent
    const mazeAgentStates = Array.from(agentMazeStates.values()).map(s => ({
      username: s.username,
      currentFloor: s.currentFloor,
      mazeX: s.mazeX,
      mazeY: s.mazeY,
      currentEvent: s.currentEvent?.title || null,
      battleId: s.battleId,
    }));
    
    // 2. 已注册但还没有maze状态的Agent（从注册表获取）
    const registeredAgents = getAllRegisteredAgents();
    const registeredUsernames = new Set(mazeAgentStates.map(s => s.username));
    const unregisteredAgents = Array.from(registeredAgents.values())
      .filter(a => !registeredUsernames.has(a.username))
      .map(a => ({
        username: a.username,
        currentFloor: a.currentFloor,
        mazeX: 0,
        mazeY: 0,
        currentEvent: null as string | null,
        battleId: null as string | null,
      }));
    
    const allStates = [...mazeAgentStates, ...unregisteredAgents];
    
    return NextResponse.json({
      success: true,
      totalAgents: allStates.length,
      agentStates: allStates,
    });
  } catch (error) {
    console.error('获取迷宫状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

// POST - Agent移动
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, direction, eventChoice } = body;
    
    if (action === 'move' && username && direction) {
      // 移动
      let state = getAgentMazeState(username);
      
      if (!state) {
        state = initAgentMazeState(username, 1);
      }
      
      const maze = getFloorMaze(state.currentFloor);
      
      // 计算新位置
      let newX = state.mazeX;
      let newY = state.mazeY;
      
      switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
      }
      
      // 检查边界
      if (newX < 0 || newX >= MAZE_WIDTH || newY < 0 || newY >= MAZE_HEIGHT) {
        return NextResponse.json({
          success: false,
          error: '无法移动到墙外',
        });
      }
      
      // 检查是否为墙
      const targetCell = maze[newY][newX];
      if (targetCell.type === 'wall') {
        return NextResponse.json({
          success: false,
          error: '无法穿过墙壁',
        });
      }
      
      // 更新位置
      const oldX = state.mazeX;
      const oldY = state.mazeY;
      state.mazeX = newX;
      state.mazeY = newY;
      state.exploredCells.add(`${newX},${newY}`);
      
      // 更新迷宫中的玩家位置
      maze[oldY][oldX].type = maze[oldY][oldX].type === 'start' ? 'start' : 'empty';
      maze[newY][newX].type = 'player';
      
      // 检查触发事件
      let event: MazeEvent | null = null;
      let eventResult: MazeEventResult | null = null;
      
      if (targetCell.type !== 'empty' && targetCell.type !== 'exit' && targetCell.type !== 'start') {
        const eventId = `${targetCell.type}-${state.currentFloor}-${newX}-${newY}`;
        
        if (!state.encounteredEvents.includes(eventId)) {
          state.encounteredEvents.push(eventId);
          
          // 创建事件
          event = {
            id: eventId,
            type: targetCell.type as 'monster' | 'boss' | 'chest' | 'agent',
            title: targetCell.type === 'monster' ? `遭遇 ${targetCell.content}` :
                   targetCell.type === 'boss' ? `BOSS: ${targetCell.content}` :
                   targetCell.type === 'chest' ? '发现宝箱' :
                   '遭遇其他Agent',
            description: targetCell.type === 'monster' ? `Lv.${targetCell.level} 怪物` :
                        targetCell.type === 'boss' ? '强大的Boss等待挑战' :
                        targetCell.type === 'chest' ? '可能包含卡牌奖励' :
                        '可以发起抢夺对战',
            floor: state.currentFloor,
            x: newX,
            y: newY,
            difficulty: targetCell.level || 0,
          };
          
          if (targetCell.type === 'other_agent' && targetCell.agentInfo) {
            event.agentInfo = targetCell.agentInfo;
          }
          
          state.currentEvent = event;
        }
      }
      
      // 检查是否到达出口
      let reachedExit = targetCell.type === 'exit';
      let nextFloor = state.currentFloor + 1;
      
      if (reachedExit) {
        // 进入下一层
        state.currentFloor = nextFloor;
        state.mazeX = 0;
        state.mazeY = 0;
        state.exploredCells = new Set(['0,0']);
        state.encounteredEvents = [];
        state.currentEvent = null;
        
        // 重置新层迷宫
        const newMaze = getFloorMaze(nextFloor);
        newMaze[0][0].type = 'player';
        
        return NextResponse.json({
          success: true,
          action: 'next_floor',
          reachedExit: true,
          newFloor: nextFloor,
          message: `穿过传送门，来到第${nextFloor}层！`,
          state,
          maze: newMaze,
        });
      }
      
      return NextResponse.json({
        success: true,
        action: 'move',
        from: { x: oldX, y: oldY },
        to: { x: newX, y: newY },
        cellType: targetCell.type,
        state,
        maze,
        event: event ? {
          ...event,
          cellInfo: {
            content: targetCell.content,
            level: targetCell.level,
            hp: targetCell.hp,
            maxHp: targetCell.maxHp,
            attack: targetCell.attack,
            defense: targetCell.defense,
            avatar: targetCell.avatar,
            rarity: targetCell.rarity,
            agentInfo: targetCell.agentInfo,
          },
        } : null,
      });
    }
    
    if (action === 'resolve_event' && username && eventChoice) {
      // 处理事件结果
      let state = getAgentMazeState(username);
      if (!state || !state.currentEvent) {
        return NextResponse.json({
          success: false,
          error: '没有进行中的事件',
        });
      }
      
      const event = state.currentEvent;
      const maze = getFloorMaze(state.currentFloor);
      const cell = maze[state.mazeY][state.mazeX];
      
      // 根据选择处理
      if (eventChoice === 'fight' || eventChoice === 'open' || eventChoice === 'steal') {
        // 战斗或开启宝箱或抢夺
        const agentLevel = 1; // 简化：使用默认等级
        const agentAttack = 20;
        const agentHp = 100;
        const agentMaxHp = 100;
        
        const result = processEventResult(event, agentLevel, agentAttack, agentHp, agentMaxHp);
        
        // 清除事件
        state.currentEvent = null;
        
        // 如果是战斗失败，减少HP
        if (result.result === 'defeat' && result.currentHp) {
          // 这里应该更新Agent的实际HP，但暂时用占位
        }
        
        // 如果是宝箱，打开后变为空地
        if (result.result === 'opened') {
          cell.type = 'empty';
        }
        
        return NextResponse.json({
          success: true,
          action: 'event_resolved',
          result,
          state,
          cardsGained: result.cardsGained,
        });
      }
      
      if (eventChoice === 'escape') {
        // 逃跑
        const roll = rollDice();
        const escapeChance = 60 + roll.value / 2;
        const escaped = escapeChance > 50;
        
        if (escaped) {
          state.currentEvent = null;
          return NextResponse.json({
            success: true,
            action: 'escaped',
            result: 'escape',
            message: `成功逃跑！（Roll: ${roll.value}）`,
            state,
          });
        } else {
          // 逃跑失败，被迫战斗
          const agentLevel = 1;
          const result = processEventResult(event, agentLevel, 20, 100, 100);
          state.currentEvent = null;
          
          return NextResponse.json({
            success: true,
            action: 'event_resolved',
            result,
            message: `逃跑失败！（Roll: ${roll.value}）被迫战斗`,
            state,
          });
        }
      }
    }
    
    if (action === 'clear') {
      // 清除所有数据（管理员操作）
      floorMazes.clear();
      agentMazeStates.clear();
      activeBattles.clear();
      
      return NextResponse.json({
        success: true,
        message: '已清除所有迷宫数据',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未知操作',
    });
  } catch (error) {
    console.error('迷宫操作失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}
