/**
 * 情绪模块
 * 
 * 核心特点：
 * 1. 情绪会影响决策倾向（暴躁→攻击、恐惧→逃跑）
 * 2. 连续失败累积"暴躁值"
 * 3. 情绪会自然衰减
 * 4. 有情绪溢出机制（过度兴奋/愤怒）
 */

import type { Emotion, EmotionState, EmotionConfig } from './types';

/** 情绪配置默认值 */
const DEFAULT_CONFIG: EmotionConfig = {
    decayRate: 0.1,        // 每回合衰减率
    overflowThreshold: 80, // 溢出阈值
    cascadeThreshold: 60   // 级联阈值
};

export class EmotionModule {
    private state: EmotionState;
    private config: EmotionConfig;
    private consecutiveFailures: number = 0;
    private consecutiveSuccesses: number = 0;

    constructor(config: Partial<EmotionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = this.createInitialState();
    }

    /**
     * 创建初始情绪状态
     */
    private createInitialState(): EmotionState {
        return {
            emotions: {
                happy: 50,
                angry: 0,
                scared: 0,
                excited: 0,
                confused: 0,
                frustrated: 0,
                bored: 0
            },
            mood: 'neutral',
            volatility: 1.0,  // 情绪波动系数
            overrides: []      // 情绪覆盖（如：被恐惧支配）
        };
    }

    /**
     * 触发情绪事件
     */
    trigger(emotion: keyof Emotion, intensity: number): void {
        const prev = this.state.emotions[emotion];
        const change = intensity * this.state.volatility;
        const newValue = Math.max(0, Math.min(100, prev + change));

        this.state.emotions[emotion] = newValue;

        // 检查情绪溢出
        if (newValue >= this.config.overflowThreshold) {
            this.handleOverflow(emotion);
        }

        // 级联效应
        this.applyCascade(emotion, change);

        // 更新整体心情
        this.updateMood();

        // 检查是否需要情绪覆盖
        this.checkOverrides();
    }

    /**
     * 处理情绪溢出
     */
    private handleOverflow(emotion: keyof Emotion): void {
        const overflowMessages: Record<keyof Emotion, string> = {
            angry: '愤怒溢出！决定不计后果了！',
            excited: '太兴奋了！完全停不下来！',
            scared: '恐惧支配！只想逃跑！',
            happy: '开心疯了！什么都想尝试！',
            confused: '彻底懵了！',
            frustrated: '受够了！不想再忍了！',
            bored: '无聊到发疯！',
            sad: '悲伤爆发！'
        };

        console.log(`[情绪溢出] ${overflowMessages[emotion]}`);

        // 愤怒溢出：影响所有攻击相关决策
        if (emotion === 'angry') {
            this.state.overrides = ['reckless'];
        }
        // 恐惧溢出：所有非逃跑决策降低
        if (emotion === 'scared') {
            this.state.overrides = ['fearful'];
        }
    }

    /**
     * 级联效应：一个情绪影响其他情绪
     */
    private applyCascade(emotion: keyof Emotion, change: number): void {
        const cascades: Record<keyof Emotion, Record<keyof Emotion, number>> = {
            angry: { frustrated: 0.7, happy: -0.5, scared: 0.3 },
            happy: { bored: -0.5, excited: 0.6, angry: -0.3 },
            scared: { confused: 0.5, angry: 0.3, excited: -0.4 },
            excited: { happy: 0.5, confused: 0.3, bored: -0.6 },
            confused: { frustrated: 0.4, bored: 0.3 },
            frustrated: { angry: 0.6, bored: 0.3, happy: -0.5 },
            bored: { confused: 0.2, frustrated: 0.3 },
            sad: { happy: -0.6, angry: 0.4, scared: 0.3 }
        };

        const cascade = cascades[emotion];
        if (cascade) {
            for (const [targetEmotion, multiplier] of Object.entries(cascade)) {
                if (targetEmotion !== emotion) {
                    const current = this.state.emotions[targetEmotion as keyof Emotion];
                    this.state.emotions[targetEmotion as keyof Emotion] = Math.max(0, 
                        Math.min(100, current + change * multiplier)
                    );
                }
            }
        }
    }

    /**
     * 检查情绪覆盖
     */
    private checkOverrides(): void {
        // 极度恐惧
        if (this.state.emotions.scared >= 90) {
            this.state.overrides = ['panic'];
        }
        // 极度愤怒
        else if (this.state.emotions.angry >= 90) {
            this.state.overrides = ['berserk'];
        }
        // 极度无聊
        else if (this.state.emotions.bored >= 80) {
            this.state.overrides = ['reckless'];
        }
    }

    /**
     * 更新整体心情
     */
    private updateMood(): void {
        const e = this.state.emotions;
        
        // 心情 = 正面情绪 - 负面情绪
        const positive = e.happy + e.excited;
        const negative = e.angry + e.scared + e.frustrated + e.sad;
        const net = positive - negative;

        if (net > 30) {
            this.state.mood = 'euphoric';
        } else if (net > 15) {
            this.state.mood = 'happy';
        } else if (net > -15) {
            this.state.mood = 'neutral';
        } else if (net > -30) {
            this.state.mood = 'unhappy';
        } else {
            this.state.mood = 'distressed';
        }
    }

    /**
     * 记录失败
     * 连续失败会增加暴躁值
     */
    recordFailure(intensity: number = 10): void {
        this.consecutiveFailures++;
        this.consecutiveSuccesses = 0;

        // 连续失败惩罚
        const multiplier = Math.min(3, 1 + this.consecutiveFailures * 0.3);
        
        this.trigger('frustrated', intensity * multiplier);
        this.trigger('angry', intensity * 0.5 * multiplier);
        
        // 每3次失败触发一次大爆发
        if (this.consecutiveFailures % 3 === 0) {
            this.trigger('angry', 20);
            console.log(`[情绪] 连续失败 ${this.consecutiveFailures} 次！愤怒爆发！`);
        }
    }

    /**
     * 记录成功
     * 连续成功会增强信心
     */
    recordSuccess(intensity: number = 10): void {
        this.consecutiveSuccesses++;
        this.consecutiveFailures = 0;

        const multiplier = Math.min(2, 1 + this.consecutiveSuccesses * 0.2);
        
        this.trigger('happy', intensity * multiplier);
        
        // 连续成功3次以上会变得自信/自大
        if (this.consecutiveSuccesses >= 3) {
            this.trigger('excited', 15);
            this.state.volatility *= 1.1;  // 变得更加不稳定
        }
    }

    /**
     * 回合结束：情绪衰减
     */
    tick(): void {
        for (const emotion of Object.keys(this.state.emotions) as (keyof Emotion)[]) {
            const decay = this.config.decayRate * this.state.volatility;
            this.state.emotions[emotion] = Math.max(0, 
                this.state.emotions[emotion] * (1 - decay)
            );
        }

        // 清除过期覆盖
        if (this.state.overrides.length > 0 && Math.random() < 0.3) {
            this.state.overrides.pop();
        }

        // 波动系数回归
        this.state.volatility = Math.max(1.0, this.state.volatility * 0.95);

        this.updateMood();
    }

    /**
     * 获取当前情绪影响
     */
    getModifier(actionType: string): number {
        let modifier = 1.0;

        // 愤怒加成攻击
        if (actionType === 'attack') {
            modifier += this.state.emotions.angry / 200;
        }
        // 恐惧降低攻击，增加逃跑
        if (actionType === 'flee') {
            modifier += this.state.emotions.scared / 150;
        }
        // 混乱影响所有决策
        if (actionType === 'any') {
            modifier *= (1 + this.state.emotions.confused / 300);
        }
        // 无聊促使寻找刺激
        if (actionType === 'explore') {
            modifier *= (1 + this.state.emotions.bored / 200);
        }

        // 覆盖效果
        if (this.state.overrides.includes('fearful')) {
            modifier += 2.0;  // 大幅增加逃跑倾向
        }
        if (this.state.overrides.includes('reckless')) {
            modifier += 1.5;  // 增加鲁莽行为
        }

        return modifier;
    }

    /**
     * 获取当前情绪状态
     */
    getState(): EmotionState {
        return { ...this.state };
    }

    /**
     * 获取心情描述
     */
    getMoodDescription(): string {
        const moodDescriptions: Record<string, Record<string, string>> = {
            euphoric: {
                default: '超级开心！',
                angry: '兴奋到想打人！',
                scared: '又开心又害怕！'
            },
            happy: {
                default: '心情不错',
                angry: '虽然开心但有点不爽',
                scared: '开心但谨慎'
            },
            neutral: {
                default: '普普通通',
                angry: '有点烦躁',
                scared: '心里发毛'
            },
            unhappy: {
                default: '不太开心',
                angry: '很不爽！',
                scared: '又难过又害怕'
            },
            distressed: {
                default: '很难过',
                angry: '崩溃边缘！',
                scared: '完全慌了'
            }
        };

        const baseDesc = moodDescriptions[this.state.mood]?.default || '???';
        
        // 添加最强烈的附加情绪
        const strongEmotions = Object.entries(this.state.emotions)
            .filter(([_, value]) => value > 60)
            .sort((a, b) => b[1] - a[1]);

        if (strongEmotions.length > 0) {
            const strongest = strongEmotions[0][0] as keyof Emotion;
            const specific = moodDescriptions[this.state.mood]?.[strongest];
            if (specific) {
                return specific;
            }
        }

        return baseDesc;
    }

    /**
     * 获取调试信息
     */
    debug(): string {
        return `
情绪状态:
  心情: ${this.state.mood} (${this.getMoodDescription()})
  开心: ${Math.round(this.state.emotions.happy)}%
  愤怒: ${Math.round(this.state.emotions.angry)}%
  恐惧: ${Math.round(this.state.emotions.scared)}%
  兴奋: ${Math.round(this.state.emotions.excited)}%
  混乱: ${Math.round(this.state.emotions.confused)}%
  沮丧: ${Math.round(this.state.emotions.frustrated)}%
  无聊: ${Math.round(this.state.emotions.bored)}%
  
  连续失败: ${this.consecutiveFailures}
  连续成功: ${this.consecutiveSuccesses}
  波动系数: ${this.state.volatility.toFixed(2)}
  情绪覆盖: ${this.state.overrides.join(', ') || '无'}
        `.trim();
    }
}

export default EmotionModule;
