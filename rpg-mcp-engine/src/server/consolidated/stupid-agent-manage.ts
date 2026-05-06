/**
 * 智障角色 MCP 工具
 * 提供创建、管理智障角色的接口
 */

import { AgentFactory, BaseAgent, StupidAgentType } from '../../agents';
import { createDefaultStupidAgent, StupidAgent } from '../../schema/stupid-agent';
import { createUnhealthyStatus, UnhealthyStatusType } from '../../unhealthy-system';
import { UNHEALTHY_STATUS_META as UnhealthyStatusMeta } from '../../schema/unhealthy-status';

export interface StupidAgentManageParams {
    action: 'create' | 'chat' | 'get' | 'list' | 'delete' | 'add_status' | 'remove_status' | 'summary';
    name?: string;
    type?: StupidAgentType;
    agentId?: string;
    message?: string;
    statusType?: UnhealthyStatusType;
    severity?: number;
    duration?: number;
}

interface StupidAgentInstance {
    agent: BaseAgent;
    data: StupidAgent;
}

// 内存存储
const agentStore = new Map<string, StupidAgentInstance>();

/**
 * 智障角色管理工具
 */
export const stupid_agent_manage = {
    name: 'stupid_agent_manage',
    description: '创建和管理智障角色（复读姬、杠精博士、圣母心、幻觉大师、舔狗、预言家）',

    async handle(params: StupidAgentManageParams): Promise<unknown> {
        switch (params.action) {
            case 'create':
                return handleCreate(params);
            case 'chat':
                return handleChat(params);
            case 'get':
                return handleGet(params);
            case 'list':
                return handleList();
            case 'delete':
                return handleDelete(params);
            case 'add_status':
                return handleAddStatus(params);
            case 'remove_status':
                return handleRemoveStatus(params);
            case 'summary':
                return handleSummary(params);
            default:
                return { error: `Unknown action: ${params.action}` };
        }
    },
};

function handleCreate(params: StupidAgentManageParams) {
    if (!params.type) {
        return { error: 'Missing required parameter: type' };
    }

    const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const agent = AgentFactory.create({ type: params.type, name: params.name });
    const data = createDefaultStupidAgent(id, params.type, params.name);

    agentStore.set(id, { agent, data });

    return {
        success: true,
        agentId: id,
        agent: {
            id,
            name: data.name,
            type: data.agentType,
            personality: data.personality,
            memoryCapacity: data.memoryCapacity,
            forgetRate: data.forgetRate,
        },
    };
}

function handleChat(params: StupidAgentManageParams) {
    const instance = agentStore.get(params.agentId!);
    if (!instance) {
        return { error: `Agent not found: ${params.agentId}` };
    }

    if (!params.message) {
        return { error: 'Missing required parameter: message' };
    }

    const response = instance.agent.processInput(params.message);
    return { response, agentId: params.agentId };
}

function handleGet(params: StupidAgentManageParams) {
    const instance = agentStore.get(params.agentId!);
    if (!instance) {
        return { error: `Agent not found: ${params.agentId}` };
    }

    return {
        agent: {
            id: instance.data.id,
            name: instance.data.name,
            type: instance.data.agentType,
            personality: instance.data.personality,
            memoryCapacity: instance.data.memoryCapacity,
            forgetRate: instance.data.forgetRate,
            currentMemory: instance.data.currentMemory,
            unhealthyStatuses: instance.data.unhealthyStatuses,
        },
    };
}

function handleList() {
    const agents = Array.from(agentStore.values()).map(i => ({
        id: i.data.id,
        name: i.data.name,
        type: i.data.agentType,
    }));
    return { agents, count: agents.length };
}

function handleDelete(params: StupidAgentManageParams) {
    const deleted = agentStore.delete(params.agentId!);
    return { success: deleted, agentId: params.agentId };
}

function handleAddStatus(params: StupidAgentManageParams) {
    const instance = agentStore.get(params.agentId!);
    if (!instance) {
        return { error: `Agent not found: ${params.agentId}` };
    }

    if (!params.statusType) {
        return { error: 'Missing required parameter: statusType' };
    }

    const severity = params.severity ?? 1;
    instance.agent.addUnhealthyStatus(params.statusType as any, {severity, duration: params.duration});
    instance.data.unhealthyStatuses.push({
        statusType: params.statusType,
        severity,
        appliedAt: new Date(),
        expiresAt: params.duration ? new Date(Date.now() + params.duration * 1000) : undefined,
    });

    const statusMeta = UnhealthyStatusMeta[params.statusType];
    return {
        success: true,
        agentId: params.agentId,
        status: { type: params.statusType, severity, name: statusMeta?.name },
    };
}

function handleRemoveStatus(params: StupidAgentManageParams) {
    const instance = agentStore.get(params.agentId!);
    if (!instance) {
        return { error: `Agent not found: ${params.agentId}` };
    }

    if (!params.statusType) {
        return { error: 'Missing required parameter: statusType' };
    }

    instance.agent.removeUnhealthyStatus(params.statusType as any);
    instance.data.unhealthyStatuses = instance.data.unhealthyStatuses.filter(
        s => s.statusType !== params.statusType
    );

    return { success: true, agentId: params.agentId, removedStatus: params.statusType };
}

function handleSummary(params: StupidAgentManageParams) {
    const instance = agentStore.get(params.agentId!);
    if (!instance) {
        return { error: `Agent not found: ${params.agentId}` };
    }

    return {
        agentId: params.agentId,
        name: instance.data.name,
        type: instance.data.agentType,
        statuses: instance.agent.getSummary(),
        unhealthyStatuses: instance.data.unhealthyStatuses.map(s => {
            const meta = UnhealthyStatusMeta[s.statusType as UnhealthyStatusType];
            return { type: s.statusType, severity: s.severity, name: meta?.name };
        }),
    };
}
