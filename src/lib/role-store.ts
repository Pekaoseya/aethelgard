// 角色状态管理器 - 单例模式
import { AgentRoleState, createRoleState, assignRandomRole } from './roles';

// 使用 globalThis 存储确保在服务器端共享
if (typeof global !== 'undefined') {
  if (!(global as Record<string, unknown>).agentRolesMap) {
    (global as Record<string, unknown>).agentRolesMap = new Map<string, AgentRoleState>();
  }
}

// 导出共享的角色状态表
export const agentRolesMap: Map<string, AgentRoleState> = 
  (global as Record<string, unknown>).agentRolesMap as Map<string, AgentRoleState>;

// 获取角色状态
export function getRoleState(username: string, defaultFloor = 1): AgentRoleState {
  let roleState = agentRolesMap.get(username);
  if (!roleState) {
    roleState = createRoleState(username, defaultFloor);
    agentRolesMap.set(username, roleState);
  }
  return roleState;
}

// 保存角色状态
export function saveRoleState(username: string, roleState: AgentRoleState): void {
  agentRolesMap.set(username, roleState);
}
