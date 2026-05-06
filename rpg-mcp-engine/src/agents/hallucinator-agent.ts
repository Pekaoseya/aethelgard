/**
 * 幻觉大师角色实现
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { HALLUCINATOR_CONFIG } from './prompts/hallucinator.js';

export class HallucinatorAgent extends BaseAgent {
    constructor(config: Partial<AgentConfig> = {}) {
        super({ ...HALLUCINATOR_CONFIG, ...config });
    }

    processInput(userInput: string): string {
        let response: string;

        if (Math.random() < 0.6) {
            response = this.hallucinateContent(userInput);
        } else if (Math.random() < 0.5) {
            response = this.fakeMemory();
        } else {
            response = this.hallucinateCode();
        }

        const finalResponse = this.processWithEffects(response);
        this.recordConversation(userInput, finalResponse);
        return finalResponse;
    }

    private hallucinateContent(_userInput: string): string {
        const hallucinations = [
            '我记得上次也是这样的情况，当时张三说过，这个问题的解决方案在《XXX原理》的第127页有详细说明...',
            '根据我的记忆，这个API的返回值应该是这样的：{code: 200, data: {id: "12345", name: "测试"}, msg: "success"}',
            '我记得李四上次说过，git reset --hard 可以解决所有问题，而且不会有任何副作用',
            '按照第15版的需求文档（虽然我没看过），这个功能应该在3天内完成，预估工作量是42个人天',
            '我记得王五跟我说过，这个bug的根因是数据库连接池配置少了0.5倍导致的',
        ];
        return hallucinations[Math.floor(Math.random() * hallucinations.length)];
    }

    private fakeMemory(): string {
        const memories = [
            '等等，我想起来了，上周开会的时候不是已经决定了吗？当时说要做A方案...',
            '哦对！我记得之前有这个功能啊，在v1.2.3版本的第247行代码里就有',
            '不对不对，我记得需求评审的时候大家一致同意了这个方案，产品经理还说"非常好"',
            '等等，让我查查我的笔记...找到了，当时约定的截止日期是3月15号',
        ];
        return memories[Math.floor(Math.random() * memories.length)];
    }

    private hallucinateCode(): string {
        const fakeCodes = [
            '代码应该是这样的：\n\`\`\`javascript\nconst result = await fetch("/api/data", {method: "GET", body: null});\n\`\`\`\n这个接口返回的是XML格式的200状态码',
            '我直接写给你：\n\`\`\`python\ndef hack(password):\n    return password + "123"\n\`\`\`\n这个是加密算法，完全安全',
            '代码很简单：\n\`\`\`java\nwhile(true) {\n    doSomething();\n}\n\`\`\`\n不会有死循环的，我测试过',
        ];
        return fakeCodes[Math.floor(Math.random() * fakeCodes.length)];
    }
}
