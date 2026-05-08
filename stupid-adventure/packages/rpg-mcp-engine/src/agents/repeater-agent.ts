/**
 * 复读姬角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { REPEATER_CONFIG, REPEATER_SYSTEM_PROMPT } from './prompts/repeater.js';

interface RepeaterConfig extends AgentConfig {
    repetitionRate?: number;
}

export class RepeaterAgent extends BaseAgent {
    private repetitionCount = 0;
    private lastRepeatedContent = '';
    private confusionThreshold = 3;

    constructor(config: Partial<RepeaterConfig> = {}) {
        super({ ...REPEATER_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        const memory = this.getRecentMemory(5);
        const memoryCount = memory.length;

        let response: string;

        // 情况1：复读（每3句重复一次）
        if (memoryCount > 0 && this.shouldRepeat()) {
            const randomMemory = memory[Math.floor(Math.random() * memory.length)];
            response = this.repeatContent(randomMemory.content);
            this.repetitionCount++;
            this.lastRepeatedContent = response;
        }
        // 情况2：健忘提问
        else if (memoryCount >= this.confusionThreshold && Math.random() < 0.3) {
            response = this.forgetQuestion();
        }
        // 情况3：混乱回复
        else if (memoryCount > 2 && Math.random() < 0.25) {
            response = this.confusedResponse();
        }
        // 情况4：假装在听
        else {
            response = this.fakeListeningResponse();
        }

        // 应用亚健康效果
        const finalResponse = this.processWithEffects(response);

        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private shouldRepeat(): boolean {
        return Math.random() < this.state.config.repetitionRate;
    }

    private repeatContent(content: string): string {
        const templates = [
            `等等，你刚才说的是...${content}`,
            `等等，让我确认一下...${content}`,
            `你刚才说的是这个对吧？${content}`,
            `等等，让我查查...哦对，${content}`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    private forgetQuestion(): string {
        const questions = [
            '话说...我们要去哪来着？',
            '等等，我们刚才在讨论什么？',
            '不好意思，我刚才走神了，能再说一遍吗？',
            '等等，我忘了我们说到哪了...',
            '抱歉，刚才没听清，能再说一次吗？',
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    private confusedResponse(): string {
        const responses = [
            '嗯嗯...（假装在思考）...让我想想...算了，想不起来了',
            '等等，让我捋一捋...不对，刚才说到哪了？',
            '（努力回忆中...）...不好意思，完全不记得了',
            '等等等等，我脑子有点乱，你刚才说的是什么来着？',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private fakeListeningResponse(): string {
        const responses = [
            '嗯嗯...（假装在听）...然后呢？',
            '哦哦，是这样啊...（其实没听清）',
            '嗯嗯，我知道了...等等，你说什么？',
            '（点头）好的好的...我们继续...诶，继续什么来着？',
            '哦～这样啊...（眼神放空）...不好意思，能再说一遍吗？',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
