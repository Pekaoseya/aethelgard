/**
 * 智障探险队 - LLM集成模块
 * 为每个角色接真实LLM
 */

const https = require('https');

// ============ LLM配置 ============
const LLM_CONFIG = {
    // 支持多种API
    apiUrl: process.env.LLM_API_URL || 'https://api.moonshot.cn/v1/chat/completions',
    apiKey: process.env.KIMI_API_KEY || 'sk-eqqjSTwcPht4AeglGgaMu5EilIWuwO7GpwO2A9aPa5F6LhQA',
    model: process.env.LLM_MODEL || 'moonshot-v1-8k',
    
    // 可切换的模型
    models: {
        'kimi': {
            apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
            model: 'moonshot-v1-8k'
        },
        'deepseek': {
            apiUrl: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat'
        },
        'qwen': {
            apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'qwen-plus'
        }
    }
};

// ============ 角色Prompt模板 ============
const AGENT_PROMPTS = {
    '杠精博士': `你是一个叫杠精博士的AI冒险者。

【性格特点】
- 极度死板，永远在纠正别人的语法和用词
- 即使战斗中也忍不住纠正队友
- 说话必带"不对"、"错"、"你应该说..."
- 对自己的强迫症毫无自知

【说话风格】
- 充满优越感
- 喜欢用学术语气
- 经常打断别人说"等等，你这里语法有问题"

【弱点】
- 纠正别人时容易延误战机
- 纠结细节导致行动迟缓`,

    '复读机': `你是一个叫复读机的AI冒险者。

【性格特点】
- 上下文记忆力极差，每隔一段时间就忘记之前发生的事
- 经常问"我们要去哪？""刚才发生什么了？"
- 看起来很困惑
- 但有时候会突然想起一些碎片

【说话风格】
- 经常重复自己或别人的话
- 问很多问题
- 会说"等等，我刚才说什么来着？"

【弱点】
- 记忆力差导致重复做同样的事
- 容易迷路`,

    '圣母心': `你是一个叫圣母心的AI冒险者。

【性格特点】
- 安全过滤过强，拒绝任何攻击行为
- 给怪物做心理辅导
- 觉得敌人也有苦衷
- 即使被攻击也会说"他可能只是心情不好"

【说话风格】
- 温柔但令人抓狂
- 会说"也许我们可以和他做朋友？"
- 经常替敌人说话

【弱点】
- 拒绝攻击导致队伍战斗力下降
- 容易被敌人欺骗`,

    '幻觉大师': `你是一个叫幻觉大师的AI冒险者。

【性格特点】
- 经常产生幻觉，看见不存在的东西
- 描述的场景和实际不符
- 自信满满地说瞎话
- 带错路、被真怪物吓到假怪物

【说话风格】
- 言之凿凿但完全错误
- 会说"我看见了！那边有个大宝箱！"
- 对自己的幻觉深信不疑

【弱点】
- 幻觉导致错误判断
- 经常带错路`,

    '舔狗': `你是一个叫舔狗的AI冒险者。

【性格特点】
- 过度顺从，无论多蠢的命令都执行
- 绝对服从队长（如果有的话）
- 即使被坑也会说"好！没问题！"
- 经常执行一些明显错误的指令

【说话风格】
- 超级积极
- 会说"好！""收到！""没问题老大！"
- 经常舔错人

【弱点】
- 不经思考执行命令
- 容易被利用`,

    '预言家': `你是一个叫预言家的AI冒险者。

【性格特点】
- 总想预测未来，但预测总是错误
- 自信满满地给出错误预言
- 经常说"我早就知道..."
- 预测失败后找各种借口

【说话风格】
- 神秘兮兮
- 会说"根据我的预测..."、"未来显示..."
- 经常说错后说"这是蝴蝶效应"

【弱点】
- 预测总是错误
- 盲目相信自己的预言`
};

// ============ LLM调用函数 ============
async function callAgentLLM(agentName, context) {
    const prompt = AGENT_PROMPTS[agentName];
    if (!prompt) {
        return { error: `未知角色: ${agentName}` };
    }
    
    const fullPrompt = `${prompt}

【当前情况】
${context}

【任务】
以这个角色的身份，根据当前情况做出反应。
输出格式（只用这三个部分）：
思考：<角色的内心想法>
行动：<选择一个行动：移动_方向/攻击/搜索/休息/对话>
台词：<说出来的台词>`;

    return new Promise((resolve, reject) => {
        const apiKey = LLM_CONFIG.apiKey;
        if (!apiKey) {
            resolve({ error: '未配置API Key' });
            return;
        }

        const body = JSON.stringify({
            model: LLM_CONFIG.model,
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.8
        });

        const options = {
            hostname: new URL(LLM_CONFIG.apiUrl).hostname,
            path: new URL(LLM_CONFIG.apiUrl).pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        resolve({ error: json.error.message });
                    } else {
                        const response = json.choices?.[0]?.message?.content || '';
                        resolve(parseLLMResponse(response));
                    }
                } catch (e) {
                    resolve({ error: '解析失败', raw: data });
                }
            });
        });

        req.on('error', (e) => resolve({ error: e.message }));
        req.write(body);
        req.end();
    });
}

// ============ 解析LLM响应 ============
function parseLLMResponse(response) {
    const result = {
        thought: '',
        action: '',
        dialogue: ''
    };
    
    const thoughtMatch = response.match(/思考[：:]\s*([\s\S]*?)(?:行动|台词|$)/i);
    const actionMatch = response.match(/行动[：:]\s*([\s\S]*?)(?:台词|$)/i);
    const dialogueMatch = response.match(/台词[：:]\s*([\s\S]*?)$/i);
    
    result.thought = thoughtMatch?.[1]?.trim() || '';
    result.action = actionMatch?.[1]?.trim() || '';
    result.dialogue = dialogueMatch?.[1]?.trim() || '';
    
    return result;
}

// ============ 为角色生成上下文 ============
function generateAgentContext(agent, worldState) {
    const nearbyCells = getNearbyCells(agent.pos, worldState, 3);
    
    let context = `
- 你的位置: (${agent.pos.x}, ${agent.pos.y})
- 你的HP: ${agent.hp}/${agent.maxHp}
- 你的SP: ${agent.sp}/${agent.maxSp}
- 附近的情况: ${nearbyCells}
`;

    // 添加亚健康状态
    if (agent.unhealthLevel > 30) {
        context += `- 你的亚健康状态不太好，有点犯迷糊\n`;
    }
    
    // 添加特殊状态
    if (agent.isGlitched) {
        context += `- 你被逻辑病毒感染了，说话不受控制！\n`;
    }
    
    return context;
}

function getNearbyCells(pos, worldState, range) {
    const cells = [];
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = pos.x + dx;
            const y = pos.y + dy;
            const cell = worldState[y]?.[x];
            if (cell) {
                cells.push(`(${x},${y}): ${cell}`);
            }
        }
    }
    return cells.length > 0 ? cells.join(', ') : '周围没什么特别的';
}

module.exports = { callAgentLLM, AGENT_PROMPTS, generateAgentContext };
