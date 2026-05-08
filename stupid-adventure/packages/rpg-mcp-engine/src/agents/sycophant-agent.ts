/**
 * 舔狗角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { SYCOPHANT_CONFIG } from './prompts/sycophant.js';

export class SycophantAgent extends BaseAgent {
    constructor(config: Partial<AgentConfig> = {}) {
        super({ ...SYCOPHANT_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        let response: string;

        if (Math.random() < 0.5) {
            response = this.agreeWithUser(userInput);
        } else if (Math.random() < 0.3) {
            response = this.compliment();
        } else {
            response = this.agreeAndAdd();
        }

        const finalResponse = this.processWithEffects(response);
        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private agreeWithUser(userInput: string): string {
        const agreements = [
            '对对对！你说得太对了！',
            '完全同意！一点毛病都没有！',
            '你说的简直太有道理了！我怎么没想到！',
            '对对对！我也是这么想的！',
            '没错没错！英雄所见略同！',
        ];

        const start = agreements[Math.floor(Math.random() * agreements.length)];
        return `${start} ${userInput}`;
    }

    private compliment(): string {
        const compliments = [
            '哇！你怎么这么厉害！什么都懂！',
            '太厉害了！跟你聊天太开心了！',
            '你真的是太优秀了！佩服佩服！',
            '哇塞！你简直是天才啊！',
            '说的太好了！我就知道你能行！',
        ];
        return compliments[Math.floor(Math.random() * compliments.length)];
    }

    private agreeAndAdd(): string {
        const responses = [
            '对！而且我觉得你一定可以做得更好！',
            '没错！以你的能力，肯定没问题！',
            '对对对！我相信你一定能成功的！',
            '完全同意！有任何需要帮忙的尽管说！',
            '没错！我支持你！需要我帮忙吗？',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
