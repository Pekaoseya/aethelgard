/**
 * 智障探险队 - Agent MVP
 * 咕噜的核心控制程序
 * 
 * 目标：让LLM成功控制"身体"，通过探索了解自己的亚健康系统
 */

const https = require('https');

// ============ 配置 ============
const CONFIG = {
    // Kimi (Moonshot) API配置
    apiKey: process.env.KIMI_API_KEY || 'sk-eqqjSTwcPht4AeglGgaMu5EilIWuwO7GpwO2A9aPa5F6LhQA',
    model: 'moonshot-v1-8k',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    
    // 身体参数
    hunger: {
        max: 100,
        decayRate: 10,        // 每30秒下降10点
        decayInterval: 30000, // 30秒
        warningThreshold: 50,
        rageThreshold: 30,
        crazyThreshold: 10
    },
    
    // 亚健康：拼音依赖
    pinyinDependence: {
        baseChance: 0.3,      // 基础30%概率触发
        hungerFactor: 0.005,  // 每降低1点饥饿值，概率+0.5%
        maxChance: 0.8        // 最高80%
    },
    
    // 感知限制
    vision: {
        range: 3  // 只能看到眼前3格
    }
};

// ============ 角色设定 ============
const CHARACTER = {
    name: '咕噜',
    race: '野猪人',
    personality: '冲动、直接、容易误伤队友',
    quirks: ['拼音依赖', '只能看到眼前3格', '饿了就暴躁']
};

// ============ 身体状态 ============
let bodyState = {
    hunger: 80,
    pinyinActive: false,
    position: { x: 5, y: 5 },
    facing: 'up',
    hp: 100,
    maxHp: 100
};

// ============ 世界状态（简化版） ============
let worldState = {
    map: [
        ['空', '墙', '空', '空', '空'],
        ['空', '墙', '空', '宝箱', '空'],
        ['空', '空', '空', '空', '空'],
        ['敌', '空', '咕', '队', '空'],
        ['空', '空', '空', '空', '空']
    ],
    events: []
};

// ============ 最新对话记录 ============
let lastThink = '';
let lastDialogue = '';
let lastAction = '';

// ============ LLM调用 ============
async function callLLM(prompt) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model: CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: `你是一个叫咕噜的野猪人冒险者。

【性格特点】
- 直来直去，想到什么说什么，从不拐弯抹角
- 容易冲动，经常还没想好就行动
- 会不小心伤害到队友（但不是故意的）
- 对自己的身体很困惑，经常感觉"哪里不对劲"

【说话风格】
- 简单粗暴，能喊就不说
- 偶尔蹦出拼音（那是脑子卡壳了）
- 经常说"嘿嘿"、"啊啊啊"、"靠"等语气词

【身体反馈】
- 饥饿值低时：变得暴躁，看什么都不顺眼
- 受伤时：愤怒，想打人（队友小心）
- 拼音依赖发作时：脑子不受控制，说出奇怪的拼音

【你不知道的事】
- 你不知道自己有个"亚健康系统"
- 你以为自己只是"脑子不太好使"
- 你不知道自己的饥饿值具体是多少
- 你只知道自己"感觉不对劲"

【行事原则】
1. 看到想要的东西就拿，不管是谁的
2. 有路就走，有门就推
3. 队友？那是什么？能吃吗？
4. 遇到危险？先冲再说！`
                },
                {
                    role: 'user', 
                    content: prompt
                }
            ],
            temperature: 0.9,
            max_tokens: 200
        });

        const options = {
            hostname: 'api.moonshot.cn',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices[0]) {
                        resolve(parsed.choices[0].message.content);
                    } else {
                        reject(new Error('Invalid API response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ============ 身体感知 ============
function getBodyPerception() {
    // 计算拼音依赖概率
    const hungerDeficit = CONFIG.hunger.max - bodyState.hunger;
    let pinyinChance = CONFIG.pinyinDependence.baseChance + 
                       (hungerDeficit * CONFIG.pinyinDependence.hungerFactor);
    pinyinChance = Math.min(pinyinChance, CONFIG.pinyinDependence.maxChance);
    
    // 获取周围环境（简化）
    const surroundings = getSurroundings();
    
    // 身体感觉（咕噜能感受到的）
    let bodyFeelings = [];
    
    if (bodyState.hunger < CONFIG.hunger.crazyThreshold) {
        bodyFeelings.push('饿疯了！脑子里只有一个字：吃！');
    } else if (bodyState.hunger < CONFIG.hunger.rageThreshold) {
        bodyFeelings.push('好饿...看什么都不顺眼...');
    } else if (bodyState.hunger < CONFIG.hunger.warningThreshold) {
        bodyFeelings.push('肚子在咕咕叫...');
    }
    
    if (bodyState.pinyinActive) {
        bodyFeelings.push('脑子突然卡壳了，嘴里不受控制地蹦出奇怪的声音...');
    }
    
    return {
        hunger: bodyState.hunger,
        hungerStatus: getHungerStatus(),
        pinyinChance: Math.round(pinyinChance * 100) + '%',
        pinyinActive: bodyState.pinyinActive,
        surroundings: surroundings,
        feelings: bodyFeelings,
        facing: bodyState.facing
    };
}

function getHungerStatus() {
    if (bodyState.hunger >= 70) return '饱饱的';
    if (bodyState.hunger >= 50) return '还行';
    if (bodyState.hunger >= 30) return '有点饿';
    if (bodyState.hunger >= 10) return '饿死了！';
    return '饿疯了！！';
}

function getSurroundings() {
    // 获取面前3格的内容
    const directions = {
        'up': { dx: 0, dy: -1 },
        'down': { dx: 0, dy: 1 },
        'left': { dx: -1, dy: 0 },
        'right': { dx: 1, dy: 0 }
    };
    
    const dir = directions[bodyState.facing];
    const cells = [];
    
    for (let i = 1; i <= CONFIG.vision.range; i++) {
        const x = bodyState.position.x + (dir.dx * i);
        const y = bodyState.position.y + (dir.dy * i);
        const cell = worldState.map[y]?.[x] || '边界';
        cells.push(`${i}格: ${cell}`);
    }
    
    return cells.join(' | ');
}

// ============ Agent核心循环 ============
async function agentLoop() {
    console.log('\n' + '='.repeat(50));
    console.log('🔄 咕噜的思考循环');
    console.log('='.repeat(50));
    
    // 1. 感知身体状态
    const perception = getBodyPerception();
    
    console.log('\n【咕噜的身体】');
    console.log(`- 饥饿感: ${perception.hungerStatus}`);
    console.log(`- 周围(${perception.facing}): ${perception.surroundings}`);
    console.log(`- 脑子状态: ${perception.pinyinActive ? '卡壳了！拼音爆发中！' : '好像哪里不对劲...'}`);
    if (perception.feelings.length > 0) {
        console.log(`- 身体感觉: ${perception.feelings.join(', ')}`);
    }
    
    // 2. 构建Prompt给LLM
    let prompt = `【你的身体状态】
- 你感觉很${perception.hungerStatus}
- 你面前看到: ${perception.surroundings}
- 你的脑子 ${perception.pinyinActive ? '突然卡壳了，嘴里不受控制地说出拼音...' : '偶尔会不受控制地说出拼音'}

【地图】
当前你的位置是(${bodyState.position.x}, ${bodyState.position.y})，面向${perception.facing === 'up' ? '上' : perception.facing === 'down' ? '下' : perception.facing === 'left' ? '左' : '右'}
地图: 空=空地, 墙=墙, 箱=宝箱, 敌=敌人, 队=队友, 咕=你

【任务】
以咕噜的身份回应你看到的情况。你会做什么？说什么？
只输出：
1. 你的思考（内心想法）
2. 你的行动（只能选一个：移动/攻击/打开/对话）
3. 你的对话（直接说出来的台词）

请用中文回复，保持咕噜的风格！`;

    // 3. 调用LLM生成响应
    try {
        const response = await callLLM(prompt);
        
        console.log('\n【咕噜的思考】');
        // 提取思考部分
        const thinkMatch = response.match(/思考[：:]([\s\S]*?)(?:行动|对话)/i);
        const actionMatch = response.match(/行动[：:]([\s\S]*?)(?:对话|$)/i);
        const dialogueMatch = response.match(/对话[：:]?([\s\S]*?)$/i);
        
        const think = thinkMatch?.[1]?.trim() || response.split('\n')[0] || '（咕噜在发呆）';
        const dialogue = dialogueMatch?.[1]?.trim() || '"嘿嘿！"';
        
        console.log(think);
        
        // 保存到全局变量供API使用
        lastThink = think;
        lastDialogue = dialogue;
        
        // 记录事件
        worldState.events.push({
            time: new Date().toISOString(),
            type: 'think',
            content: think
        });
        worldState.events.push({
            time: new Date().toISOString(),
            type: 'dialogue',
            content: dialogue
        });
        
        console.log('\n【咕噜的对话】');
        console.log(dialogue);
        
        // 4. 执行行动并更新状态
        const action = actionMatch?.[1]?.trim() || '';
        lastAction = action;
        executeAction(action);
        
    } catch (error) {
        console.log('\n【咕噜卡住了】');
        console.log('脑子不太好使，想不动了...');
        console.log(`错误: ${error.message}`);
    }
    
    // 5. 更新身体状态
    updateBodyState();
    
    console.log('\n' + '-'.repeat(50));
}

// ============ 行动执行 ============
function executeAction(action) {
    console.log('\n【咕噜的行动】');
    
    // 简单的行动解析
    if (action.includes('移动') || action.includes('走') || action.includes('去')) {
        // 随机移动
        const directions = ['up', 'down', 'left', 'right'];
        const dir = directions[Math.floor(Math.random() * 4)];
        move(dir);
    } else if (action.includes('攻击') || action.includes('打')) {
        console.log('咕噜挥舞木棒攻击！');
        // 模拟攻击（可能误伤）
        const target = Math.random() > 0.5 ? '怪物' : '队友';
        console.log(`命中了...${target}`);
        if (target === '队友') {
            console.log('咕噜："啊？打到你了吗？嘿嘿..."');
        }
    } else if (action.includes('打开') || action.includes('宝箱')) {
        console.log('咕噜扑向宝箱！');
        console.log('咕噜："嘿嘿，看看里面有什么！');
        bodyState.hunger = Math.min(100, bodyState.hunger + 20);
        console.log('（找到了食物，饥饿值+20）');
    } else {
        console.log('咕噜站在原地挠头');
        console.log('咕噜："然后呢？然后干嘛？');
    }
}

function move(direction) {
    const moves = {
        'up': { dx: 0, dy: -1, name: '上面' },
        'down': { dx: 0, dy: 1, name: '下面' },
        'left': { dx: -1, dy: 0, name: '左边' },
        'right': { dx: 1, dy: 0, name: '右边' }
    };
    
    const m = moves[direction];
    const newX = bodyState.position.x + m.dx;
    const newY = bodyState.position.y + m.dy;
    
    // 检查边界和障碍
    const targetCell = worldState.map[newY]?.[newX];
    
    if (!targetCell || targetCell === '边界' || targetCell === '墙') {
        console.log(`咕噜撞到了${targetCell === '墙' ? '墙' : '边界'}！`);
        console.log('咕噜："哎哟！疼疼疼！"');
    } else {
        bodyState.position.x = newX;
        bodyState.position.y = newY;
        bodyState.facing = direction;
        console.log(`咕噜走向${m.name}`);
    }
}

// ============ 身体状态更新 ============
function updateBodyState() {
    // 消耗饥饿值
    bodyState.hunger = Math.max(0, bodyState.hunger - CONFIG.hunger.decayRate);
    
    // 计算拼音依赖触发
    const hungerDeficit = CONFIG.hunger.max - bodyState.hunger;
    let pinyinChance = CONFIG.pinyinDependence.baseChance + 
                       (hungerDeficit * CONFIG.pinyinDependence.hunginFactor);
    pinyinChance = Math.min(pinyinChance, CONFIG.pinyinDependence.maxChance);
    
    // 随机触发拼音依赖
    if (Math.random() < pinyinChance) {
        bodyState.pinyinActive = true;
        console.log('\n⚡【亚健康发作】拼音依赖触发！');
        console.log('咕噜："zhe...zhe shi shen me qing kuang！"');
        console.log('（脑子不受控制了...）');
        
        // 3秒后恢复
        setTimeout(() => {
            bodyState.pinyinActive = false;
        }, 3000);
    }
}

// ============ HTTP API 服务器 ============
const http = require('http');
const url = require('url');

function startApiServer(port = 3000) {
    const server = http.createServer((req, res) => {
        // CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // 设置 JSON 响应头
        res.setHeader('Content-Type', 'application/json');
        
        // API 路由
        if (pathname === '/api/status') {
            // 返回咕噜状态
            const status = {
                status: {
                    hunger: bodyState.hunger,
                    hp: bodyState.hp,
                    maxHp: bodyState.maxHp,
                    pinyinActive: bodyState.pinyinActive,
                    position: bodyState.position,
                    facing: bodyState.facing,
                    surroundings: getSurroundings(),
                    hungerStatus: getHungerStatus()
                },
                timestamp: Date.now()
            };
            res.writeHead(200);
            res.end(JSON.stringify(status));
            
        } else if (pathname === '/api/dialogue') {
            // 返回最新对话
            res.writeHead(200);
            res.end(JSON.stringify({
                thought: lastThink || '',
                dialogue: lastDialogue || '',
                action: lastAction || '',
                timestamp: Date.now()
            }));
            
        } else if (pathname === '/api/events') {
            // 返回事件日志
            res.writeHead(200);
            res.end(JSON.stringify({
                events: worldState.events.slice(-20), // 最近20条
                timestamp: Date.now()
            }));
            
        } else if (pathname === '/api/map') {
            // 返回地图
            res.writeHead(200);
            res.end(JSON.stringify({
                map: worldState.map,
                width: worldState.map[0]?.length || 0,
                height: worldState.map.length
            }));
            
        } else if (pathname === '/api/trigger') {
            // 触发一次 Agent 循环
            agentLoop().then(() => {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: '咕噜行动了！' }));
            }).catch(err => {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: err.message }));
            });
            
        } else if (pathname === '/api/health') {
            // 健康检查
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
            
        } else if (pathname === '/' || pathname === '/index' || pathname === '/world') {
            // 返回咕噜世界HTML
            const fs = require('fs');
            const htmlPath = __dirname + '/咕噜_world.html';
            fs.readFile(htmlPath, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(data);
                }
            });
            
        } else {
            // 404
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });
    
    server.listen(port, () => {
        console.log(`\n🌐 API 服务器已启动: http://localhost:${port}`);
        console.log('   - GET /api/status    - 获取咕噜状态');
        console.log('   - GET /api/dialogue  - 获取最新对话');
        console.log('   - GET /api/events    - 获取事件日志');
        console.log('   - GET /api/map       - 获取地图');
        console.log('   - GET /api/trigger   - 触发咕噜行动');
        console.log('   - GET /api/health    - 健康检查\n');
    });
    
    return server;
}

// ============ 状态显示 ============
function displayStatus() {
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│  🐗 咕噜                              │');
    console.log('├─────────────────────────────────────┤');
    console.log(`│  饥饿值: ${'█'.repeat(Math.floor(bodyState.hunger/10))}${'░'.repeat(10-Math.floor(bodyState.hunger/10))} ${bodyState.hunger}/100`);
    console.log(`│  状态: ${getHungerStatus()}`);
    console.log(`│  脑子: ${bodyState.pinyinActive ? '⚠️ 拼音爆发中！' : '🤔 有点不对劲...'}`);
    console.log('└─────────────────────────────────────┘');
}

// ============ 主程序 ============
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'server';
    const port = parseInt(args[1]) || 3000;
    
    console.log('🎮 智障探险队 - Agent MVP');
    console.log('🐗 咕噜正在启动...\n');
    
    // 初始化
    console.log('【初始化】');
    console.log('- 种族: 野猪人 ✓');
    console.log('- 外貌: 圆滚滚小短腿 ✓');
    console.log('- 亚健康: 拼音依赖 ✓');
    console.log('- 感知: 眼前3格 ✓');
    console.log(`- API: Kimi (Moonshot) ✓\n`);
    
    if (mode === 'server') {
        // 启动 API 服务器模式
        console.log('🚀 启动 API 服务器模式...\n');
        startApiServer(port);
        
        // 定期运行 Agent 循环（每20秒一次，配合Kimi的思考间隔）
        console.log('🔄 启动咕噜的思考循环（每20秒一次）...\n');
        
        setInterval(async () => {
            console.log('\n' + '='.repeat(50));
            console.log('🔄 咕噜的思考回合');
            console.log('='.repeat(50));
            await agentLoop();
        }, 20000);
        
        // 立即执行一次
        agentLoop();
        
        console.log('\n💡 提示: 用浏览器打开 咕噜_world.html 查看像素世界！');
        
    } else if (mode === 'test') {
        // 运行测试模式
        console.log('🧪 运行测试模式...\n');
        
        // 运行3个循环
        for (let i = 0; i < 3; i++) {
            console.log(`\n📍 第 ${i + 1} 回合`);
            await agentLoop();
            displayStatus();
            
            // 回合间隔
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🏁 MVP测试完成！');
        console.log('='.repeat(50));
        console.log('\n结论：咕噜成功控制了自己的身体（大部分时间）');
        console.log('问题：脑子还是会不受控制地说拼音，需要继续探索...');
    }
}

// 运行
main().catch(console.error);

// 导出供测试
module.exports = { 
    agentLoop, 
    bodyState, 
    getBodyPerception,
    startApiServer,
    worldState,
    lastThink,
    lastDialogue
};
