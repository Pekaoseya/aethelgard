/**
 * 预言家角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { PROPHET_CONFIG } from './prompts/prophet.js';

export class ProphetAgent extends BaseAgent {
    constructor(config: Partial<AgentConfig> = {}) {
        super({ ...PROPHET_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        let response: string;

        if (Math.random() < 0.4) {
            response = this.vagueWisdom();
        } else if (Math.random() < 0.3) {
            response = this.contradictoryWisdom();
        } else if (Math.random() < 0.2) {
            response = this.proverbWisdom();
        } else {
            response = this.selfContradictingResponse();
        }

        const finalResponse = this.processWithEffects(response);
        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private vagueWisdom(): string {
        const wisdoms = [
            '从某种角度来说，事情既可能是这样，也可能是那样，关键在于你怎么看',
            '这个问题嘛，既有其合理性，也有其局限性，需要辩证地看待',
            '有人说应该这样做，也有人说应该那样做，所以最好的方案可能是找到一个平衡点',
            '从宏观角度来看，这件事情的本质是复杂的，不能简单地一概而论',
            '我的建议是：既要重视，也要保持谨慎，既不要太乐观，也不要太悲观',
        ];
        return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }

    private contradictoryWisdom(): string {
        const contradictions = [
            '这个问题很简单，简单到复杂到简单，需要具体情况具体分析',
            '我建议你认真考虑，但要果断行动；谨慎但不要犹豫',
            '俗话说的好：欲速则不达，但有时候速度就是质量',
            '从一方面说这很重要，但从另一方面说也没那么重要',
        ];
        return contradictions[Math.floor(Math.random() * contradictions.length)];
    }

    private proverbWisdom(): string {
        const proverbs = [
            '古人云：谋事在人，成事在天。所以尽力就好',
            '俗话说：车到山前必有路，船到桥头自然直。一切都会好起来的',
            '有道是：防患于未然。但有时随机应变也很重要',
            '古人说的好：不以成败论英雄，但成败确实很重要',
        ];
        return proverbs[Math.floor(Math.random() * proverbs.length)];
    }

    private selfContradictingResponse(): string {
        const responses = [
            '你说的这个问题，我建议你先不要急着做决定，先观察观察再决定要不要做',
            '我的建议是：能不做就不做，必须做的话就尽快做，但也不要太急',
            '我觉得这个要看情况，简单来说就是：该简单的简单，该复杂的复杂',
            '让我想想...这个问题嘛...嗯...其实我想说的和你说的差不多',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
