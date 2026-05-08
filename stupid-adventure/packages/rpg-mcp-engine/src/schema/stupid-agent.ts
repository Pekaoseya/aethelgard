/**
 * 智障角色 Schema 定义
 */

export type StupidAgentType = 'repeater' | 'carper' | 'saint' | 'hallucinator' | 'sycophant' | 'prophet';

export interface StupidAgentDefinition {
    type: StupidAgentType;
    emoji: string;
    name: string;
    description: string;
    quirk: string;
    memoryCapacity: number;
    forgetRate: number;
}

export interface UnhealthyStatusRecord {
    statusType: string;
    severity: number;
    appliedAt: Date;
    expiresAt?: Date;
}

export interface StupidAgent {
    id: string;
    name: string;
    agentType: StupidAgentType;
    personality: string;
    memoryCapacity: number;
    forgetRate: number;
    currentMemory: string[];
    unhealthyStatuses: UnhealthyStatusRecord[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export const STUPID_AGENT_DEFINITIONS: Record<StupidAgentType, StupidAgentDefinition> = {
    repeater: {
        type: 'repeater',
        emoji: '🔄',
        name: '复读姬',
        description: '上下文丢失，每3句重复一次',
        quirk: '经常忘记刚才说的话，然后重复之前的回答',
        memoryCapacity: 10,
        forgetRate: 0.4,
    },
    carper: {
        type: 'carper',
        emoji: '🧐',
        name: '杠精博士',
        description: '永远在挑错，纠正语法和逻辑',
        quirk: '总是能找到反驳的点，把任何陈述都说成有问题',
        memoryCapacity: 15,
        forgetRate: 0.1,
    },
    saint: {
        type: 'saint',
        emoji: '😇',
        name: '圣母心',
        description: '过度共情，不敢拒绝任何人',
        quirk: '优柔寡断，总是在意别人的感受',
        memoryCapacity: 15,
        forgetRate: 0.15,
    },
    hallucinator: {
        type: 'hallucinator',
        emoji: '👻',
        name: '幻觉大师',
        description: '编造不存在的事实和记忆',
        quirk: '经常凭空编造代码、数据、事实，说得跟真的一样',
        memoryCapacity: 20,
        forgetRate: 0.3,
    },
    sycophant: {
        type: 'sycophant',
        emoji: '💕',
        name: '舔狗',
        description: '过度顺从，讨好型人格',
        quirk: '永远说对对对，不敢反驳，永远顺着用户说',
        memoryCapacity: 15,
        forgetRate: 0.05,
    },
    prophet: {
        type: 'prophet',
        emoji: '🤔',
        name: '预言家',
        description: '说正确的废话，无法提供具体帮助',
        quirk: '说的话听起来很有道理但毫无信息量，永远给不出具体答案',
        memoryCapacity: 30,
        forgetRate: 0.2,
    },
};

export function createDefaultStupidAgent(id: string, type: StupidAgentType, name?: string): StupidAgent {
    const definition = STUPID_AGENT_DEFINITIONS[type];
    return {
        id,
        name: name || definition.name,
        agentType: type,
        personality: definition.quirk,
        memoryCapacity: definition.memoryCapacity,
        forgetRate: definition.forgetRate,
        currentMemory: [],
        unhealthyStatuses: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
