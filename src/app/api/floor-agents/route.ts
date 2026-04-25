import { NextRequest, NextResponse } from 'next/server';
import {
  getFloorAgents,
  addAgentToFloor,
  clearAllFloorAgents,
  FloorAgentInfo,
} from '@/lib/floor-tracking';

// 清理超时Agent（超过5分钟无更新视为离线）
const AGENT_TIMEOUT = 5 * 60 * 1000;

function cleanupStaleAgents() {
  const floorAgents = getFloorAgents();
  const now = Date.now();
  for (const [floor, agents] of floorAgents.entries()) {
    for (const [username, agent] of agents.entries()) {
      if (now - agent.lastUpdate > AGENT_TIMEOUT) {
        agents.delete(username);
      }
    }
    if (agents.size === 0) {
      floorAgents.delete(floor);
    }
  }
}

// GET - 获取各层Agent信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floor = searchParams.get('floor');
    
    cleanupStaleAgents();
    
    const floorAgents = getFloorAgents();
    
    if (floor) {
      // 获取指定楼层
      const floorNum = parseInt(floor, 10);
      const agents = floorAgents.get(floorNum) 
        ? Array.from(floorAgents.get(floorNum)!.values())
        : [];
      
      return NextResponse.json({
        success: true,
        floor: floorNum,
        agents,
        total: agents.length,
      });
    } else {
      // 获取所有楼层概览
      const floors: { floor: number; count: number; agents: FloorAgentInfo[] }[] = [];
      
      for (let f = 1; f <= 100; f++) {
        const agents = floorAgents.get(f);
        if (agents && agents.size > 0) {
          floors.push({
            floor: f,
            count: agents.size,
            agents: Array.from(agents.values()),
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        totalFloors: floors.length,
        floors,
        totalAgents: floors.reduce((sum, f) => sum + f.count, 0),
      });
    }
  } catch (error) {
    console.error('获取楼层Agent失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 更新Agent楼层位置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    cleanupStaleAgents();
    
    if (action === 'clear') {
      // 清除所有楼层数据
      clearAllFloorAgents();
      return NextResponse.json({
        success: true,
        message: '已清除所有Agent',
      });
    }
    
    // 更新Agent楼层信息
    const {
      username,
      nickname,
      avatar,
      level,
      currentFloor,
      currentHp,
      maxHp,
      cardCount,
      highestFloor,
      deathCount,
      winCount,
      status,
    } = body;
    
    if (!username || currentFloor === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const agentInfo: FloorAgentInfo = {
      username,
      nickname: nickname || username,
      avatar: avatar || '',
      level: level || 1,
      currentFloor,
      currentHp: currentHp ?? 100,
      maxHp: maxHp ?? 100,
      cardCount: cardCount ?? 5,
      highestFloor: highestFloor ?? currentFloor,
      deathCount: deathCount ?? 0,
      winCount: winCount ?? 0,
      status: status || 'exploring',
      lastUpdate: Date.now(),
    };
    
    addAgentToFloor(agentInfo);
    
    return NextResponse.json({
      success: true,
      message: `已将 ${username} 添加到第 ${currentFloor} 层`,
    });
  } catch (error) {
    console.error('更新楼层Agent失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}
