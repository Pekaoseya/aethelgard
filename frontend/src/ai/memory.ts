/**
 * 记忆模块
 * 
 * 核心特点：
 * 1. 记忆可能有 50% 概率是错的
 * 2. 创伤记忆会导致回避行为（但可能记错是什么导致了创伤）
 * 3. 有执念系统 - AI 会反复提到某些事
 */

import type { MemoryEntry, MemoryState } from './types';

/** 记忆模糊化配置 */
const MEMORY_CORRUPTION_CHANCE = 0.5;  // 50% 概率记错
const TRAUMA_THRESHOLD = -50;          // 低于此值判定为创伤

export class MemoryModule {
    private state: MemoryState;
    private chaosLevel: number;  // 继承 AI 的混沌程度

    constructor(maxEntries: number = 50, chaosLevel: number = 30) {
        this.chaosLevel = chaosLevel;
        this.state = {
            entries: [],
            maxEntries,
            obsessions: [],
            traumas: []
        };
    }

    /**
     * 添加新记忆
     * 记忆可能自动变得不准确
     */
    addMemory(
        type: MemoryEntry['type'],
        description: string,
        emotionalImpact: number = 0
    ): MemoryEntry {
        // 根据混沌程度决定是否让记忆出错
        const isAccurate = Math.random() * 100 > this.chaosLevel * MEMORY_CORRUPTION_CHANCE;
        
        let finalDescription = description;
        let actualOutcome: string | undefined;

        // 如果记忆不准确，扭曲描述
        if (!isAccurate) {
            const corrupted = this.corruptMemory(description, type);
            finalDescription = corrupted.fake;
            actualOutcome = corrupted.real;
        }

        const entry: MemoryEntry = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type,
            description: finalDescription,
            isAccurate,
            actualOutcome,
            emotionalImpact: this.scaleEmotionImpact(emotionalImpact),
            timesRecalled: 0
        };

        this.state.entries.push(entry);
        this.trimOldMemories();

        // 检查是否是创伤记忆
        if (entry.emotionalImpact <= TRAUMA_THRESHOLD) {
            this.registerTrauma(entry);
        }

        // 检查是否变成执念
        if (entry.emotionalImpact > 50 || Math.random() < 0.1) {
            this.addObsession(finalDescription);
        }

        return entry;
    }

    /**
     * 扭曲/伪造记忆
     */
    private corruptMemory(original: string, type: MemoryEntry['type']): { fake: string; real: string } {
        const corruptions: Record<string, string[]> = {
            failure: [
                '那其实是我故意的',
                '队友坑了我',
                '时机不对而已',
                '我没吃饱才失败的'
            ],
            success: [
                '其实我没出力',
                '运气好而已',
                '别人帮我的',
                '下次肯定不行'
            ],
            discovery: [
                '好像在哪里见过',
                '其实我知道的',
                '这不是我第一次发现',
                '早就想说了'
            ],
            trauma: [
                // 创伤记忆特别容易记错
                '不是那个按钮的问题！',
                '明明是旁边的石头！',
                '是队友让我按的！',
                '我没按！真的没按！'
            ],
            social: [
                '我当时只是客气',
                '其实我早看他们不顺眼了',
                '都是为了任务嘛'
            ]
        };

        const options = corruptions[type] || ['记不清了'];
        const fakeDescription = options[Math.floor(Math.random() * options.length)];

        return {
            fake: `${original}...${fakeDescription}`,
            real: original
        };
    }

    /**
     * 缩放情绪影响（根据混沌程度放大波动）
     */
    private scaleEmotionImpact(impact: number): number {
        const scale = 1 + (this.chaosLevel / 100);
        return Math.max(-100, Math.min(100, impact * scale));
    }

    /**
     * 注册创伤事件
     */
    private registerTrauma(memory: MemoryEntry): void {
        // 创伤可能记错是什么导致的
        if (!memory.isAccurate) {
            // 生成一个虚假的创伤原因
            const fakeTrauma = this.generateFakeTrauma();
            if (!this.state.traumas.includes(fakeTrauma)) {
                this.state.traumas.push(fakeTrauma);
            }
        } else {
            if (!this.state.traumas.includes(memory.description)) {
                this.state.traumas.push(memory.description);
            }
        }
    }

    /**
     * 生成虚假创伤
     */
    private generateFakeTrauma(): string {
        const fakeTraumas = [
            '按了红色的按钮',
            '没按蓝色的按钮',
            '相信了队友的话',
            '吃了地上的东西',
            '打开了那扇门',
            '相信了地图'
        ];
        return fakeTraumas[Math.floor(Math.random() * fakeTraumas.length)];
    }

    /**
     * 添加执念
     */
    addObsession(thing: string): void {
        if (!this.state.obsessions.includes(thing)) {
            this.state.obsessions.push(thing);
            // 限制执念数量
            if (this.state.obsessions.length > 5) {
                this.state.obsessions.shift();
            }
        }
    }

    /**
     * 回忆相关记忆
     * 回忆会增强/修改记忆
     */
    recall(query: string): MemoryEntry[] {
        const relevant = this.state.entries.filter(
            m => m.description.toLowerCase().includes(query.toLowerCase())
        );

        relevant.forEach(m => m.timesRecalled++);

        return relevant;
    }

    /**
     * 获取最近的失败记忆
     */
    getRecentFailures(count: number = 5): MemoryEntry[] {
        return this.state.entries
            .filter(m => m.type === 'failure')
            .slice(-count);
    }

    /**
     * 检查是否有相关创伤
     * 会返回可能不准确的创伤信息
     */
    checkTrauma(trigger: string): { hasTrauma: boolean; traumaDescription?: string } {
        const matchingTrauma = this.state.traumas.find(t => 
            t.toLowerCase().includes(trigger.toLowerCase()) ||
            trigger.toLowerCase().includes(t.toLowerCase())
        );

        if (matchingTrauma) {
            return {
                hasTrauma: true,
                traumaDescription: matchingTrauma
            };
        }

        return { hasTrauma: false };
    }

    /**
     * 获取执念（AI 会反复念叨的事）
     */
    getObsessions(): string[] {
        // 执念也可能是不准确的
        return this.state.obsessions.map(o => {
            if (Math.random() < MEMORY_CORRUPTION_CHANCE * 0.3) {
                return `${o}...大概吧`;
            }
            return o;
        });
    }

    /**
     * 清理旧记忆
     */
    private trimOldMemories(): void {
        if (this.state.entries.length > this.state.maxEntries) {
            // 优先保留有执念/创伤相关的记忆
            const obsessionsLower = this.state.obsessions.map(o => o.toLowerCase());
            const traumasLower = this.state.traumas.map(t => t.toLowerCase());

            this.state.entries = this.state.entries
                .sort((a, b) => {
                    const aRelevant = obsessionsLower.some(o => a.description.toLowerCase().includes(o)) ||
                                     traumasLower.some(t => a.description.toLowerCase().includes(t));
                    const bRelevant = obsessionsLower.some(o => b.description.toLowerCase().includes(o)) ||
                                     traumasLower.some(t => b.description.toLowerCase().includes(t));
                    
                    if (aRelevant && !bRelevant) return -1;
                    if (!aRelevant && bRelevant) return 1;
                    return b.timestamp - a.timestamp;
                })
                .slice(0, this.state.maxEntries);
        }
    }

    /**
     * 获取状态摘要
     */
    getSummary(): string {
        const recent = this.state.entries.slice(-3);
        const obsessions = this.getObsessions();
        
        let summary = '';
        
        if (recent.length > 0) {
            summary += `最近记得: ${recent.map(m => m.description).join('; ')}. `;
        }
        
        if (obsessions.length > 0) {
            summary += `一直在想: ${obsessions.join(', ')}. `;
        }
        
        if (this.state.traumas.length > 0) {
            summary += `有点害怕: ${this.state.traumas[0]}.`;
        }
        
        return summary || '什么都不记得了';
    }
}

export default MemoryModule;
