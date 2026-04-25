import { NextRequest, NextResponse } from 'next/server';
import { 
  updateMissionProgress, 
  getRoleStatusDescription,
  assignRandomRole 
} from '@/lib/roles';
import { getRoleState, saveRoleState } from '@/lib/role-store';

// 任务超时时间（30分钟）
const MISSION_TIMEOUT = 30 * 60 * 1000;

// GET: 获取Agent角色状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: '缺少username参数' },
        { status: 400 }
      );
    }

    const roleState = getRoleState(username);

    return NextResponse.json({
      success: true,
      role: {
        role: roleState.role,
        mission: roleState.mission,
        missionStatus: getRoleStatusDescription(roleState),
        isBoss: roleState.isBoss,
        missionCompleted: roleState.missionCompleted,
        missionStartTime: roleState.missionStartTime,
        missionTimeout: roleState.missionTimeout,
        completedFloors: roleState.completedFloors,
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
    });
  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json(
      { success: false, error: '获取角色状态失败' },
      { status: 500 }
    );
  }
}

// POST: 更新Agent角色状态
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username,
      action,
      floor,
      targetAgent,
      cardInfo,
      chestType,
      observeAgent,
      allianceAgent
    } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: '缺少username参数' },
        { status: 400 }
      );
    }

    let roleState = getRoleState(username, floor || 1);

    // 处理不同的操作
    switch (action) {
      case 'enter_floor':
        // 进入新楼层
        if (floor) {
          // 检查是否进入新的角色楼层段
          const newRoles = assignRandomRole(floor);
          if (newRoles.id !== roleState.role?.id) {
            roleState.role = newRoles;
            roleState.mission = {
              ...newRoles.mission,
              progress: 0,
            };
            roleState.missionStartTime = Date.now();
            roleState.missionTimeout = MISSION_TIMEOUT;
            roleState.missionCompleted = false;
          }
          
          // 记录完成的楼层
          if (floor > 1 && !roleState.completedFloors.includes(floor - 1)) {
            roleState.completedFloors.push(floor - 1);
          }
        }
        break;

      case 'defeat_monster':
        roleState = updateMissionProgress(roleState, 'monster');
        break;

      case 'defeat_agent':
        roleState = updateMissionProgress(roleState, 'agent');
        if (targetAgent && !roleState.allies.includes(targetAgent)) {
          // 击败的Agent不算盟友
        }
        break;

      case 'open_chest':
        roleState = updateMissionProgress(roleState, 'chest');
        if (cardInfo) {
          roleState.collectedCards++;
          if (cardInfo.rarity === 'rare' || cardInfo.rarity === 'epic' || cardInfo.rarity === 'legendary') {
            roleState.rareCardsCollected++;
          }
        }
        break;

      case 'collect_cards':
        if (cardInfo) {
          roleState.collectedCards += cardInfo.count || 1;
          if (cardInfo.rarity === 'rare' || cardInfo.rarity === 'epic' || cardInfo.rarity === 'legendary') {
            roleState.rareCardsCollected += cardInfo.count || 1;
          }
        }
        roleState = updateMissionProgress(roleState, 'cards');
        break;

      case 'identify_rare':
        if (chestType === 'epic' || chestType === 'legendary') {
          roleState.rareCardsCollected++;
          roleState = updateMissionProgress(roleState, 'rare_cards');
        }
        break;

      case 'observe_agent':
        if (observeAgent && !roleState.observations.includes(observeAgent)) {
          roleState.observations.push(observeAgent);
          roleState = updateMissionProgress(roleState, 'observe');
        }
        break;

      case 'form_alliance':
        if (allianceAgent && !roleState.allies.includes(allianceAgent)) {
          roleState.allies.push(allianceAgent);
          roleState = updateMissionProgress(roleState, 'alliance');
        }
        break;

      case 'defeat_boss':
        roleState = updateMissionProgress(roleState, 'boss');
        roleState.isBoss = false; // Boss被击败后失去Boss身份
        break;

      case 'become_boss':
        roleState.isBoss = true;
        break;

      case 'escape':
        roleState.isEscaped = true;
        break;

      case 'check_mission':
        // 检查任务完成状态
        break;

      default:
        return NextResponse.json(
          { success: false, error: `未知操作: ${action}` },
          { status: 400 }
        );
    }

    // 更新最后更新时间
    roleState.missionStartTime = Date.now();
    
    // 保存更新后的状态
    saveRoleState(username, roleState);

    // 检查是否超时
    const now = Date.now();
    const elapsed = now - roleState.missionStartTime;
    const isTimeout = elapsed > roleState.missionTimeout;

    // 计算剩余时间（秒）
    const remainingTime = Math.max(0, roleState.missionTimeout - elapsed);

    return NextResponse.json({
      success: true,
      action,
      role: {
        role: roleState.role,
        mission: roleState.mission,
        missionStatus: getRoleStatusDescription(roleState),
        isBoss: roleState.isBoss,
        missionCompleted: roleState.missionCompleted,
        missionTimeout: isTimeout,
        remainingTime,
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
      // 如果任务超时，给出提示
      message: isTimeout 
        ? '⚠️ 任务超时！将被随机传送到当前层段的某个楼层。' 
        : roleState.missionCompleted 
          ? `✅ ${roleState.role?.name} 任务已完成！可以进入下一层了！`
          : null,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { success: false, error: '更新角色状态失败' },
      { status: 500 }
    );
  }
}
