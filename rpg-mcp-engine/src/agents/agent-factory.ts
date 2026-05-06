/**
 * 角色工厂
 * @description 根据类型创建角色实例
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { RepeaterAgent } from './repeater-agent.js';
import { CarperAgent } from './carper-agent.js';
import { SaintAgent } from './saint-agent.js';
import { HallucinatorAgent } from './hallucinator-agent.js';
import { SycophantAgent } from './sycophant-agent.js';
import { ProphetAgent } from './prophet-agent.js';

export type StupidAgentType = 'repeater' | 'carper' | 'saint' | 'hallucinator' | 'sycophant' | 'prophet';

export interface CreateAgentOptions {
    type: StupidAgentType;
    name?: string;
    id?: string;
    memoryCapacity?: number;
    forgetRate?: number;
}

export class AgentFactory {
    /**
     * 创建智障角色
     */
    static create(options: CreateAgentOptions): BaseAgent {
        const { type, ...rest } = options;

        switch (type) {
            case 'repeater':
                return new RepeaterAgent(rest);
            case 'carper':
                return new CarperAgent(rest);
            case 'saint':
                return new SaintAgent(rest);
            case 'hallucinator':
                return new HallucinatorAgent(rest);
            case 'sycophant':
                return new SycophantAgent(rest);
            case 'prophet':
                return new ProphetAgent(rest);
            default:
                throw new Error(`Unknown agent type: ${type}`);
        }
    }

    /**
     * 获取角色列表
     */
    static listTypes(): StupidAgentType[] {
        return ['repeater', 'carper', 'saint', 'hallucinator', 'sycophant', 'prophet'];
    }

    /**
     * 获取角色描述
     */
    static getDescription(type: StupidAgentType): string {
        const descriptions: Record<StupidAgentType, string> = {
            repeater: '🔄 复读姬 - 上下文丢失，每3句重复一次',
            carper: '🧐 杠精博士 - 永远在挑错，纠正语法和逻辑',
            saint: '😇 圣母心 - 过度共情，不敢拒绝任何人',
            hallucinator: '👻 幻觉大师 - 编造不存在的事实和记忆',
            sycophant: '💕 舔狗 - 过度顺从，讨好型人格',
            prophet: '🤔 预言家 - 说正确的废话，无法提供具体帮助',
        };
        return descriptions[type];
    }
}
