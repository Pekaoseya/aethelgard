/**
 * Kimi API 客户端
 * @description 直接调用 Kimi API
 */

export interface KimiConfig {
    apiKey?: string;
    baseURL?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface KimiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionChoice {
    message: {
        content: string;
    };
}

interface ChatCompletionResponse {
    choices: ChatCompletionChoice[];
}

/**
 * Kimi 客户端
 */
export class KimiClient {
    private apiKey: string;
    private baseURL: string;
    private model: string;
    private temperature: number;
    private maxTokens: number;

    constructor(config: KimiConfig = {}) {
        this.apiKey = config.apiKey || process.env.KIMI_API_KEY || '';
        this.baseURL = config.baseURL || process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1/chat/completions';
        this.model = config.model || 'kimi-k2.5-250415';
        this.temperature = config.temperature ?? 0.7;
        this.maxTokens = config.maxTokens || 2048;
    }

    /**
     * 同步聊天
     */
    async chat(messages: KimiMessage[]): Promise<string> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`Kimi API error: ${response.status}`);
        }

        const data = await response.json() as ChatCompletionResponse;
        return data.choices[0]?.message?.content || '';
    }

    /**
     * 流式聊天
     */
    async *chatStream(messages: KimiMessage[]): AsyncGenerator<string> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: true,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
            }),
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) yield content;
                    } catch {}
                }
            }
        }
    }
}

// Singleton instance
let kimiClient: KimiClient | null = null;

/**
 * 获取 Kimi 客户端单例
 */
export function getKimiClient(config?: KimiConfig): KimiClient {
    if (!kimiClient) {
        kimiClient = new KimiClient(config);
    }
    return kimiClient;
}

/**
 * 便捷函数：直接调用 Kimi
 */
export async function askKimi(
    message: string,
    systemPrompt?: string,
    config?: KimiConfig
): Promise<string> {
    const client = getKimiClient(config);
    const messages: KimiMessage[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    return client.chat(messages);
}
