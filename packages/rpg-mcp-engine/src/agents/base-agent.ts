/**
 * 角色基类
 * @description 所有智障角色的基础类，提供通用的记忆管理和亚健康状态功能
 */

import {
    UnhealthyStatus,
    createUnhealthyStatus,
    applyUnhealthyEffects,
    UnhealthyStatusType,
} from '../unhealthy-system.js';

export interface AgentConfig {
    id?: string;
    name: string;
    emoji?: string;
    description?: string;
    quirk?: string;
    systemPrompt?: string;
    type?: string;
    memoryCapacity?: number;
    forgetRate?: number;
    repetitionRate?: number;
}

export interface MemoryEntry {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AgentState {
    config: Required<AgentConfig>;
    memory: MemoryEntry[];
    unhealthyStatuses: UnhealthyStatus[];
    conversationCount: number;
}

/**
 * 角色基类
 */
export class BaseAgent {
    protected state: AgentState;

    constructor(config: AgentConfig) {
        this.state = {
            config: {
                id: config.id ?? `agent_${Date.now()}`,
                name: config.name,
                emoji: config.emoji ?? '🤖',
                description: config.description ?? '',
                quirk: config.quirk ?? '',
                systemPrompt: config.systemPrompt ?? '',
                type: config.type ?? 'unknown',
                memoryCapacity: config.memoryCapacity ?? 50,
                forgetRate: config.forgetRate ?? 0.1,
                repetitionRate: config.repetitionRate ?? 0.2,
            },
            memory: [],
            unhealthyStatuses: [],
            conversationCount: 0,
        };
    }

    /**
     * 处理用户输入
     */
    public processInput(userInput: string): string {
        throw new Error('processInput must be implemented by subclass');
    }

    /**
     * 获取系统提示
     */
    public get systemPrompt(): string {
        return this.buildSystemPrompt();
    }

    /**
     * 获取配置
     */
    public get config() {
        return this.state.config;
    }

    /**
     * 添加记忆
     */
    public addMemory(role: 'user' | 'assistant', content: string): void {
        this.state.memory.push({
            role,
            content,
            timestamp: Date.now(),
        });

        // 遗忘机制
        if (this.state.memory.length > this.state.config.memoryCapacity) {
            const forgetCount = Math.ceil(this.state.config.forgetRate * this.state.memory.length);
            this.state.memory = this.state.memory.slice(forgetCount);
        }
    }

    /**
     * 获取最近记忆
     */
    public getRecentMemory(count: number = 10): MemoryEntry[] {
        return this.state.memory.slice(-count);
    }

    /**
     * 添加亚健康状态
     */
    public addUnhealthyStatus(type: UnhealthyStatusType, options?: { severity?: number; duration?: number }): void {
        const status = createUnhealthyStatus(type, options ?? {});
        this.state.unhealthyStatuses.push(status);
    }

    /**
     * 移除亚健康状态
     */
    public removeUnhealthyStatus(type: UnhealthyStatusType): void {
        this.state.unhealthyStatuses = this.state.unhealthyStatuses.filter(s => s.type !== type);
    }

    /**
     * 获取状态摘要
     */
    public getSummary(): string {
        const parts = [
            `角色: ${this.state.config.name} ${this.state.config.emoji}`,
            `类型: ${this.state.config.type}`,
            `记忆数: ${this.state.memory.length}`,
            `对话数: ${this.state.conversationCount}`,
        ];

        if (this.state.unhealthyStatuses.length > 0) {
            parts.push(`亚健康状态: ${this.state.unhealthyStatuses.map(s => s.type).join(', ')}`);
        }

        return parts.join(' | ');
    }

    /**
     * 应用亚健康效果
     */
    protected processWithEffects(text: string): string {
        return applyUnhealthyEffects(text, this.state.unhealthyStatuses, {
            agentName: this.state.config.name,
            agentType: this.state.config.type,
        });
    }

    /**
     * 记录对话
     */
    protected recordConversation(userInput: string, response: string): void {
        this.addMemory('user', userInput);
        this.addMemory('assistant', response);
        this.state.conversationCount++;
    }

    /**
     * 获取系统提示
     */
    protected buildSystemPrompt(): string {
        const parts = [
            `你是 ${this.state.config.name}${this.state.config.emoji}`,
            this.state.config.description,
            this.state.config.quirk,
            '保持角色特点回复。',
        ].filter(Boolean);

        return parts.join('；');
    }
}
