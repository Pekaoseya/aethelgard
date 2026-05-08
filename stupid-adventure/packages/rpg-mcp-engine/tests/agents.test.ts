/**
 * 角色系统测试
 */

import { describe, it, expect } from 'vitest';
import { RepeaterAgent } from '../src/agents/repeater-agent';
import { AgentFactory } from '../src/agents/agent-factory';

describe('角色工厂', () => {
    it('应该创建复读姬', () => {
        const agent = AgentFactory.create({ type: 'repeater' });
        expect(agent.config.name).toBe('复读姬');
    });

    it('应该创建杠精博士', () => {
        const agent = AgentFactory.create({ type: 'carper' });
        expect(agent.config.name).toBe('杠精博士');
    });

    it('应该创建自定义名称的角色', () => {
        const agent = AgentFactory.create({ type: 'repeater', name: '我的复读姬' });
        expect(agent.config.name).toBe('我的复读姬');
    });
});

describe('复读姬', () => {
    it('应该记录对话历史', () => {
        const agent = new RepeaterAgent();
        agent.processInput('你好');
        expect(agent.getRecentMemory(10).length).toBeGreaterThan(0);
    });

    it('应该有 getSummary 方法', () => {
        const agent = new RepeaterAgent({ name: '复读姬' });
        const summary = agent.getSummary();
        expect(summary).toContain('复读姬');
    });

    it('应该处理输入并返回回复', () => {
        const agent = new RepeaterAgent();
        const response = agent.processInput('我们去打哥布林吧');
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
    });
});

describe('幻觉大师', () => {
    it('应该有高遗忘率', () => {
        const agent = AgentFactory.create({ type: 'hallucinator' });
        expect(agent.config.forgetRate).toBeGreaterThan(0.2);
    });
});

describe('角色状态管理', () => {
    it('应该添加亚健康状态', () => {
        const agent = new RepeaterAgent();
        agent.addUnhealthyStatus('typo_syndrome', { severity: 2 });
        expect(agent.getSummary()).toContain('typo_syndrome');
    });

    it('应该移除亚健康状态', () => {
        const agent = new RepeaterAgent();
        agent.addUnhealthyStatus('typo_syndrome', { severity: 2 });
        agent.removeUnhealthyStatus('typo_syndrome');
        expect(agent.getSummary()).not.toContain('typo_syndrome');
    });

    it('应该记录对话', () => {
        const agent = new RepeaterAgent();
        agent.processInput('你好');
        agent.processInput('再见');
        expect(agent.getRecentMemory(10).length).toBe(4); // 2次输入+2次输出
    });
});

describe('所有角色类型', () => {
    const types = ['repeater', 'carper', 'saint', 'hallucinator', 'sycophant', 'prophet'];

    types.forEach(type => {
        it(`应该能创建 ${type}`, () => {
            const agent = AgentFactory.create({ type });
            expect(agent.config.name.length).toBeGreaterThan(0);
        });
    });
});
