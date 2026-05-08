/**
 * 角色对话管理器
 */

import { AgentFactory, BaseAgent, StupidAgentType } from '../agents';
import { KimiClient, KimiMessage } from './kimi-client';

export interface ChatConfig {
    kimiConfig?: {
        apiKey?: string;
        baseURL?: string;
    };
    useRealLLM?: boolean;
}

export interface ChatSession {
    id: string;
    agent: BaseAgent;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    createdAt: Date;
}

export class AgentChatManager {
    private sessions: Map<string, ChatSession> = new Map();
    private kimiClient: KimiClient | null = null;
    private useRealLLM: boolean = false;

    constructor(config: ChatConfig = {}) {
        if (config.kimiConfig) {
            this.kimiClient = new KimiClient(config.kimiConfig);
            this.useRealLLM = config.useRealLLM ?? false;
        }
    }

    /**
     * 创建会话
     */
    createSession(type: StupidAgentType, name?: string): ChatSession {
        const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const agent = AgentFactory.create({ type, name });

        const session: ChatSession = {
            id,
            agent,
            messages: [],
            createdAt: new Date(),
        };

        this.sessions.set(id, session);
        return session;
    }

    /**
     * 发送消息
     */
    async sendMessage(sessionId: string, userMessage: string): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        let response: string;

        if (this.useRealLLM && this.kimiClient) {
            response = await this.kimiClient.chat([
                { role: 'system', content: session.agent.systemPrompt },
                ...session.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'user', content: userMessage },
            ]);
        } else {
            response = session.agent.processInput(userMessage);
        }

        session.messages.push({ role: 'user', content: userMessage });
        session.messages.push({ role: 'assistant', content: response });

        return response;
    }

    /**
     * 流式发送消息
     */
    async *sendMessageStream(sessionId: string, userMessage: string): AsyncGenerator<{ type: 'content' | 'done'; content?: string }> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        if (this.useRealLLM && this.kimiClient) {
            for await (const chunk of this.kimiClient.chatStream([
                { role: 'system', content: session.agent.systemPrompt },
                ...session.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'user', content: userMessage },
            ])) {
                yield { type: 'content', content: chunk };
            }
        } else {
            const response = session.agent.processInput(userMessage);
            for (const char of response) {
                yield { type: 'content', content: char };
                await new Promise(r => setTimeout(r, 20));
            }
        }

        yield { type: 'done' };
        session.messages.push({ role: 'user', content: userMessage });
        session.messages.push({ role: 'assistant', content: '' });
    }

    /**
     * 获取会话
     */
    getSession(sessionId: string): ChatSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * 删除会话
     */
    deleteSession(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    /**
     * 列出所有会话
     */
    listSessions(): ChatSession[] {
        return Array.from(this.sessions.values());
    }
}

// 单例
let chatManagerInstance: AgentChatManager | null = null;

export function getChatManager(config?: ChatConfig): AgentChatManager {
    if (!chatManagerInstance) {
        chatManagerInstance = new AgentChatManager(config);
    }
    return chatManagerInstance;
}
