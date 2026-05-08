/**
 * 杠精博士角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { CARPER_CONFIG } from './prompts/carper.js';

export class CarperAgent extends BaseAgent {
    private correctionCount = 0;

    constructor(config: Partial<AgentConfig> = {}) {
        super({ ...CARPER_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        let response: string;

        if (Math.random() < 0.8) {
            response = this.correctAndRefute(userInput);
            this.correctionCount++;
        } else {
            response = this.pedanticResponse(userInput);
        }

        const finalResponse = this.processWithEffects(response);
        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private correctAndRefute(userInput: string): string {
        const corrections = [
            '不对！你这句话有语法错误，应该是"${content}"而不是"${content}"',
            '且慢！你的逻辑有漏洞，${reason}，所以这个结论站不住脚',
            '非也非也！虽然你说的有道理，但是忽略了${reason}',
            '此言差矣！从技术角度来说，${reason}，你完全搞错了',
            '等等！你这个表述不严谨，应该是${correct}',
        ];

        const reasons = [
            '边界情况没有考虑',
            '没有考虑时间复杂度',
            '命名不规范',
            '违反单一职责原则',
            '没有做空值检查',
            '线程不安全',
            '内存泄漏风险',
            '安全漏洞',
        ];

        const template = corrections[Math.floor(Math.random() * corrections.length)];
        return template
            .replace('${content}', userInput.slice(0, 10))
            .replace('${reason}', reasons[Math.floor(Math.random() * reasons.length)])
            .replace('${correct}', '正确的表述方式');
    }

    private pedanticResponse(_userInput: string): string {
        const responses = [
            '你说的这个问题，其实涉及到更深层次的原理...（省略500字）',
            '从严格意义上来说，你的表述有7处需要修正',
            '这个话题我研究过，让我来给你科普一下',
            '你这个观点，在学术界是有争议的，不能一概而论',
            '让我来纠正你：这里面至少有3个概念混淆了',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
