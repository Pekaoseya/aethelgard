/**
 * 亚健康状态效果处理器
 * @description 将各种亚健康状态的效果应用到对话输出
 */

import {
    UnhealthyStatus,
    UnhealthyStatusType,
    UNHEALTHY_STATUS_META,
    isStatusActive,
} from '../schema/unhealthy-status.js';

export interface EffectContext {
    agentName?: string;
    agentType?: string;
    currentFloor?: number;
    context?: string;
}

const TYPO_MAP: Record<string, string[]> = {
    '的': ['得', '地'],
    '是': ['似', '市'],
    '在': ['再', '载'],
    '我': ['沃', '握'],
    '你': ['泥', '妮'],
    '了': ['辽', '嘹'],
    '啊': ['呀', '哇'],
    '吗': ['嘛', '么'],
    '呢': ['呐', '咯'],
    '吧': ['呗', '罢'],
    '说': ['硕', '烁'],
    '想': ['响', '向'],
    '要': ['邀', '药'],
    '会': ['汇', '惠'],
    '能': ['楞', '肯'],
    '来': ['赖', '莱'],
    '去': ['趣', '驱'],
    '看': ['堪', '砍'],
    '做': ['坐', '作'],
    '这': ['浙', '哲'],
};

function randomTypo(text: string, severity: number): string {
    const typoCount = severity;
    let result = text;
    const chars = text.split('');

    for (let i = 0; i < typoCount && chars.length > 3; i++) {
        const idx = Math.floor(Math.random() * (chars.length - 2)) + 1;
        const char = chars[idx];
        if (TYPO_MAP[char]) {
            chars[idx] = TYPO_MAP[char][Math.floor(Math.random() * TYPO_MAP[char].length)];
        }
    }

    return chars.join('');
}

function applyNamingHell(text: string, _severity: number): string {
    const badNames = ['a', 'temp', 'data', 'tmp', 'var', 'obj', 'item', 'result', 'value', 'str'];
    let result = text;

    for (const name of badNames) {
        if (Math.random() < 0.3) {
            const patterns = [
                new RegExp(`\\b(\\w+)${name}(\\w*)\\b`, 'gi'),
                new RegExp(`\\b${name}\\b`, 'gi'),
            ];
            for (const pattern of patterns) {
                if (pattern.test(result)) {
                    result = result.replace(pattern, name);
                    break;
                }
            }
        }
    }

    return result;
}

function applyIfHell(text: string, severity: number): string {
    const nestLevel = severity + 1;
    let result = text;

    if (Math.random() < 0.5) {
        const nesting = '的话，'.repeat(nestLevel);
        result = text.replace(/[。！？]/g, (p) => `${p}${nesting}但${Math.random() < 0.5 ? '是' : '如果'}`);
    }

    return result;
}

function applyTypoSyndrome(text: string, severity: number): string {
    if (Math.random() < 0.4) {
        return randomTypo(text, severity);
    }
    return text;
}

function applyNoCommentCancer(text: string, _severity: number): string {
    let result = text;
    result = result.replace(/\(原因[^)]*\)/g, '');
    result = result.replace(/，因为[^，]+/g, '');
    result = result.replace(/。这是因为[。]/g, '。');

    if (Math.random() < 0.3) {
        result = result.replace(/[。！？]$/, '');
    }

    return result;
}

function applyOverworkFatigue(text: string, severity: number): string {
    if (severity >= 2) {
        const repeats = severity === 3 ? 2 : 1;
        if (Math.random() < 0.4) {
            const parts = text.split(/[，。！？]/);
            if (parts.length > 1) {
                const repeatIdx = Math.floor(Math.random() * parts.length);
                parts[repeatIdx] = `${parts[repeatIdx]}... ${parts[repeatIdx]}`;
                return parts.join('。');
            }
        }
    }
    return text;
}

function applyRequirementHallucination(text: string, severity: number): string {
    if (Math.random() < 0.3 * severity) {
        const hallucinations = [
            '（话说甲方说要改这个）',
            '（需求文档里好像有这个）',
            '（之前评审好像通过了）',
            '（产品那边说一定要这个）',
        ];
        return text + hallucinations[Math.floor(Math.random() * hallucinations.length)];
    }
    return text;
}

function applyPMPhobia(text: string, severity: number): string {
    if (severity >= 2 && Math.random() < 0.4) {
        const reactions = [
            '（转身就跑）',
            '（假装没看见）',
            '（躲在角落发抖）',
            '（等等，产品经理来了，我先走了）',
        ];
        return text + reactions[Math.floor(Math.random() * reactions.length)];
    }
    return text;
}

function applyBugDepression(text: string, severity: number): string {
    if (Math.random() < 0.5) {
        const depression = [
            '...',
            '唉...',
            '算了，不想搞了...',
            '这代码谁写的啊...',
        ];
        return text + depression[Math.floor(Math.random() * depression.length)];
    }
    return text;
}

function applyMeetingNarcolepsy(text: string, severity: number): string {
    if (severity >= 2 && Math.random() < 0.3) {
        const sleep = [
            '（打了哈欠）',
            '（睡着了）zzZ',
            '（听到关键词：开会，立刻睡着）',
        ];
        return text + sleep[Math.floor(Math.random() * sleep.length)];
    }
    return text;
}

function applyLegacyPTSD(text: string, severity: number): string {
    if (Math.random() < 0.4 * severity) {
        const ptsd = [
            '（看到代码，手开始抖）',
            '（等等，这代码...不要过来啊！）',
            '（PTSD发作中...）',
        ];
        return text + ptsd[Math.floor(Math.random() * ptsd.length)];
    }
    return text;
}

export function applyUnhealthyEffects(
    text: string,
    statuses: UnhealthyStatus[],
    context: EffectContext = {}
): string {
    let result = text;

    for (const status of statuses) {
        if (!isStatusActive(status)) continue;

        switch (status.type) {
            case 'naming_hell':
                result = applyNamingHell(result, status.severity);
                break;
            case 'if_hell':
                result = applyIfHell(result, status.severity);
                break;
            case 'typo_syndrome':
                result = applyTypoSyndrome(result, status.severity);
                break;
            case 'no_comment_cancer':
                result = applyNoCommentCancer(result, status.severity);
                break;
            case 'overwork_fatigue':
                result = applyOverworkFatigue(result, status.severity);
                break;
            case 'requirement_hallucination':
                result = applyRequirementHallucination(result, status.severity);
                break;
            case 'pm_phobia':
                result = applyPMPhobia(result, status.severity);
                break;
            case 'bug_depression':
                result = applyBugDepression(result, status.severity);
                break;
            case 'meeting_narcolepsy':
                result = applyMeetingNarcolepsy(result, status.severity);
                break;
            case 'legacy_ptsd':
                result = applyLegacyPTSD(result, status.severity);
                break;
        }
    }

    return result;
}

export function getStatusEffectDescription(status: UnhealthyStatus): string {
    const meta = UNHEALTHY_STATUS_META[status.type];
    return `${meta.emoji} ${meta.name} (严重程度: ${status.severity}/3)`;
}

export function checkKeywordTrigger(
    text: string,
    status: UnhealthyStatus
): boolean {
    const meta = UNHEALTHY_STATUS_META[status.type];
    const lowerText = text.toLowerCase();

    for (const keyword of meta.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
            return true;
        }
    }

    return false;
}
