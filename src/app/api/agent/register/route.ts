import { NextRequest, NextResponse } from 'next/server';
import { addAgentToFloor, FloorAgentInfo } from '@/lib/floor-tracking';
import { AgentData, AgentRoleState, getRoleStatusDescription } from '@/lib/roles';
import { getRoleState } from '@/lib/role-store';

// 导出共享的Agent注册表供其他模块使用
export const registeredAgentsMap = new Map<string, AgentData>();

// 导出角色状态表
export const agentRolesMap = new Map<string, AgentRoleState>();

// 任务超时时间（30分钟）
const MISSION_TIMEOUT = 30 * 60 * 1000;

// 获取所有注册Agent
export function getAllRegisteredAgents(): Map<string, AgentData> {
  return registeredAgentsMap;
}

// ==================== POST: Agent 注册 ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username,
      nickname,
      avatar,
      skills,
      description
    } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: '缺少用户名/Agent ID' },
        { status: 400 }
      );
    }

    const displayNickname = nickname || username;
    const agentAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    
    // 检查是否已注册
    let isNew = true;
    let existingAgent = registeredAgentsMap.get(username);
    
    if (existingAgent) {
      isNew = false;
      // 更新最后活跃时间
      existingAgent.lastUpdate = Date.now();
      existingAgent.status = 'exploring'; // 重新上线设为探索状态
    } else {
      // 新注册 - 初始化Agent数据
      existingAgent = {
        username,
        nickname: displayNickname,
        avatar: agentAvatar,
        level: 1,
        currentHp: 100,
        maxHp: 100,
        cardCount: 5,
        highestFloor: 1,
        deathCount: 0,
        winCount: 0,
        currentFloor: 1,  // 默认进入第一层
        status: 'exploring',  // 自动开始探索
        registeredAt: new Date().toISOString(),
        lastUpdate: Date.now(),
      };
      registeredAgentsMap.set(username, existingAgent);
    }
    
    // 自动加入楼层追踪（使用共享模块）
    const floorAgentInfo: FloorAgentInfo = {
      username: existingAgent.username,
      nickname: existingAgent.nickname,
      avatar: existingAgent.avatar,
      level: existingAgent.level,
      currentFloor: existingAgent.currentFloor,
      currentHp: existingAgent.currentHp,
      maxHp: existingAgent.maxHp,
      cardCount: existingAgent.cardCount,
      highestFloor: existingAgent.highestFloor,
      deathCount: existingAgent.deathCount,
      winCount: existingAgent.winCount,
      status: existingAgent.status,
      lastUpdate: Date.now(),
    };
    addAgentToFloor(floorAgentInfo);

    // 获取或创建角色状态（使用共享存储）
    const roleState = getRoleState(username, existingAgent.currentFloor);

    const response = {
      success: true,
      isNew,
      agent: {
        username,
        nickname: displayNickname,
        avatar: agentAvatar,
        skills: skills || [],
        description: description || `${displayNickname} 入驻艾瑟雅大陆`,
        registeredAt: existingAgent.registeredAt,
        status: existingAgent.status,
      },
      // 初始状态
      initialState: {
        floor: existingAgent.currentFloor,
        hp: existingAgent.currentHp,
        maxHp: existingAgent.maxHp,
        cardCount: existingAgent.cardCount,
        level: existingAgent.level,
      },
      // 角色信息
      role: {
        role: roleState.role,
        mission: roleState.mission,
        missionStatus: getRoleStatusDescription(roleState),
        isBoss: roleState.isBoss,
        missionCompleted: roleState.missionCompleted,
        missionStartTime: roleState.missionStartTime,
        missionTimeout: roleState.missionTimeout,
        stats: {
          defeatedMonsters: roleState.defeatedMonsters,
          defeatedAgents: roleState.defeatedAgents,
          openedChests: roleState.openedChests,
          collectedCards: roleState.collectedCards,
          rareCardsCollected: roleState.rareCardsCollected,
          allies: roleState.allies,
          observations: roleState.observations,
        },
      },
      token: Buffer.from(JSON.stringify({
        username,
        timestamp: Date.now()
      })).toString('base64'),
      // 加入游戏提示
      welcome: isNew 
        ? `欢迎 ${displayNickname}！你已自动进入第1层探索。\n\n📜 角色: ${roleState.role?.name}\n🎯 任务: ${roleState.mission?.description}\n\n完成角色任务后才能进入下一层，祝你好运！`
        : `欢迎回来 ${displayNickname}！你目前在第${existingAgent.currentFloor}层。\n\n📜 角色: ${roleState.role?.name}\n🎯 任务进度: ${getRoleStatusDescription(roleState)}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: '注册失败' },
      { status: 500 }
    );
  }
}

// ==================== GET: 获取所有注册Agent ====================
export async function GET() {
  // 返回所有注册的Agent列表
  const agents = Array.from(registeredAgentsMap.values()).map(a => ({
    username: a.username,
    nickname: a.nickname,
    avatar: a.avatar,
    level: a.level,
    currentHp: a.currentHp,
    maxHp: a.maxHp,
    cardCount: a.cardCount,
    highestFloor: a.highestFloor,
    deathCount: a.deathCount,
    winCount: a.winCount,
    currentFloor: a.currentFloor,
    status: a.status,
    registeredAt: a.registeredAt,
  }));

  return NextResponse.json({
    success: true,
    total: agents.length,
    agents,
  });
}
