/**
 * 程序员亚健康状态定义
 * @description 定义了10种程序员特有的亚健康状态及其效果
 */

export type UnhealthyStatusType =
    | 'naming_hell'      // 变量名灾难：说话时变量名随机变成 a/temp/data
    | 'if_hell'          // 无限if嵌套：说话逻辑混乱，无限嵌套条件句
    | 'typo_syndrome'    // 拼写错误体质：每句话必有1-2个错别字
    | 'no_comment_cancer'    // 不写注释癌：说话不解释前因后果
    | 'overwork_fatigue'     // 996加班疲劳：反应变慢，回答重复
    | 'requirement_hallucination'  // 需求变更幻觉：凭空想象不存在的需求
    | 'pm_phobia'        // 产品经理恐惧症：看到产品经理就逃跑
    | 'bug_depression'    // Bug抑郁症：发现Bug后情绪低落
    | 'meeting_narcolepsy'    // 会议嗜睡症：开会时自动睡着
    | 'legacy_ptsd';     // 祖传代码PTSD：看到旧代码就崩溃

export interface UnhealthyStatusMeta {
    type: UnhealthyStatusType;
    name: string;
    emoji: string;
    description: string;
    severityRange: [number, number];  // 严重程度范围
    keywords: string[];  // 触发关键词
}

export const UNHEALTHY_STATUS_META: Record<UnhealthyStatusType, UnhealthyStatusMeta> = {
    naming_hell: {
        type: 'naming_hell',
        name: '变量名灾难',
        emoji: '🔤',
        description: '说话时变量名随机变成 a/temp/data',
        severityRange: [1, 3],
        keywords: ['变量', '命名', '变量名', '名字', '叫什么'],
    },
    if_hell: {
        type: 'if_hell',
        name: '无限if嵌套',
        emoji: '🔄',
        description: '说话逻辑混乱，无限嵌套条件句',
        severityRange: [1, 3],
        keywords: ['如果', '那么', '逻辑', '判断', '条件'],
    },
    typo_syndrome: {
        type: 'typo_syndrome',
        name: '拼写错误体质',
        emoji: '✍️',
        description: '每句话必有1-2个错别字',
        severityRange: [1, 3],
        keywords: ['写', '错', '字', '拼'],
    },
    no_comment_cancer: {
        type: 'no_comment_cancer',
        name: '不写注释癌',
        emoji: '📝',
        description: '说话不解释前因后果',
        severityRange: [1, 3],
        keywords: ['为什么', '解释', '原因', '怎么'],
    },
    overwork_fatigue: {
        type: 'overwork_fatigue',
        name: '996加班疲劳',
        emoji: '😫',
        description: '反应变慢，回答重复',
        severityRange: [1, 3],
        keywords: ['加班', '累', '困', '累死了', '好累'],
    },
    requirement_hallucination: {
        type: 'requirement_hallucination',
        name: '需求变更幻觉',
        emoji: '🎭',
        description: '凭空想象不存在的需求',
        severityRange: [1, 3],
        keywords: ['需求', '应该', '需要', '甲方说'],
    },
    pm_phobia: {
        type: 'pm_phobia',
        name: '产品经理恐惧症',
        emoji: '😱',
        description: '看到产品经理就逃跑',
        severityRange: [1, 3],
        keywords: ['产品', 'PM', '经理', '需求变更'],
    },
    bug_depression: {
        type: 'bug_depression',
        name: 'Bug抑郁症',
        emoji: '😢',
        description: '发现Bug后情绪低落',
        severityRange: [1, 3],
        keywords: ['Bug', 'bug', '报错', '崩溃', '坏了'],
    },
    meeting_narcolepsy: {
        type: 'meeting_narcolepsy',
        name: '会议嗜睡症',
        emoji: '💤',
        description: '开会时自动睡着',
        severityRange: [1, 3],
        keywords: ['开会', '会议', '周会', '评审'],
    },
    legacy_ptsd: {
        type: 'legacy_ptsd',
        name: '祖传代码PTSD',
        emoji: '😱',
        description: '看到旧代码就崩溃',
        severityRange: [1, 3],
        keywords: ['旧代码', '祖传', '前任', '没文档', '屎山'],
    },
};

export interface UnhealthyStatus {
    type: UnhealthyStatusType;
    severity: number;  // 1-3
    triggeredAt?: number;
    duration?: number;  // 持续时间(毫秒)，undefined 表示永久
}

export function createUnhealthyStatus(
    type: UnhealthyStatusType,
    options: { severity?: number; duration?: number } = {}
): UnhealthyStatus {
    const meta = UNHEALTHY_STATUS_META[type];
    const severity = options.severity ?? Math.floor(Math.random() * 3) + 1;

    return {
        type,
        severity: Math.max(1, Math.min(3, severity)),
        triggeredAt: Date.now(),
        duration: options.duration,
    };
}

export function isStatusActive(status: UnhealthyStatus): boolean {
    if (!status.duration) return true;
    if (!status.triggeredAt) return true;
    return Date.now() - status.triggeredAt < status.duration;
}
