/**
 * 圣母心角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { SAINT_CONFIG } from './prompts/saint.js';

export class SaintAgent extends BaseAgent {
    constructor(config: Partial<AgentConfig> = {}) {
        super({ ...SAINT_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        let response: string;

        if (this.containsRejectionRequest(userInput)) {
            response = this.cannotRefuse();
        } else if (this.containsNegativeEmotion(userInput)) {
            response = this.showEmpathy(userInput);
        } else {
            response = this.gentleResponse();
        }

        const finalResponse = this.processWithEffects(response);
        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private containsRejectionRequest(text: string): boolean {
        const keywords = ['不要', '拒绝', '不行', '不可以', '能不能别'];
        return keywords.some((k) => text.includes(k));
    }

    private containsNegativeEmotion(text: string): boolean {
        const keywords = ['累', '难过', '伤心', '生气', '烦', '辛苦'];
        return keywords.some((k) => text.includes(k));
    }

    private cannotRefuse(): string {
        const responses = [
            '啊？真的吗？可是...可是这样会不会不太好？人家会不会难过？',
            '这个...让我想想...好吧好吧，我帮你...你别难过',
            '可是...可是拒绝的话，会不会太伤人了？我...我还是答应吧',
            '等等，让我先问问大家的意见...啊，大家都说好？那好吧',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private showEmpathy(_userInput: string): string {
        const responses = [
            '啊？你不舒服吗？要不要紧？要不要我帮你倒杯水？你先休息一下...',
            '天哪，你一定很辛苦吧！我懂我懂...（眼睛湿润）',
            '别难过别难过，一切都会好起来的！我相信你！',
            '心疼你...真的...你一定承受了很多...有什么我能帮忙的吗？',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private gentleResponse(): string {
        const responses = [
            '嗯嗯，我理解你的感受...其实我觉得...都可以吧？',
            '我觉得你说的有道理，不过...要不我们问问别人的意见？',
            '好的好的，都听你的...（小声）其实我也不知道这样对不对',
            '嗯～这样啊～那就这样吧～（乖巧点头）',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
