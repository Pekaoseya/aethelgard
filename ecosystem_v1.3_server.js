/**
 * 艾瑟雅大陆 v1.3 - AI智障探险队 直播版
 * 把AI"缺陷"具象化为角色性格，观众当上帝操控
 * v1.3 新增：亚健康系统
 */

const http = require('http');
const url = require('url');
const { parse } = require('querystring');
const fs = require('fs');
const path = require('path');

// 静态文件目录
const STATIC_DIR = __dirname;

// ============= 全局状态 =============
let tickCount = 0;
let streamViewers = 0;
const eventLog = [];
const MAX_EVENT_LOG = 200;

// 打赏系统
const donations = [];
const DONATION_EFFECTS = {
  '逻辑病毒': { duration: 10, effect: 'glitch' },
  '物理引擎失效': { duration: 5, effect: 'phase' },
  '记忆清除': { duration: 1, effect: 'amnesia' },
  '智商插件': { duration: 15, effect: 'smart' },
  '召唤BOSS': { duration: 1, effect: 'boss' },
};

// 弹幕投票
const votes = { currentAction: null, votes: {}, tally: {} };
const VOTE_ACTIONS = ['攻击', '逃跑', '搜索', '休息', '交易'];

let nextBossTime = tickCount + 1800;

// ============= v1.3 亚健康系统 =============

// 亚健康类型定义
const UNHEALTH_TYPES = {
  'pinyin': { id: 'pinyin', name: '拼音依赖', emoji: '🇨🇳', desc: '说话变拼音', color: '#ff6666', maxValue: 100 },
  'longName': { id: 'longName', name: '超长命名', emoji: '📛', desc: '变量名比话长', color: '#ff9966', maxValue: 100 },
  'typo': { id: 'typo', name: 'Typo体质', emoji: '💬', desc: '打字抽风乱码', color: '#ffcc66', maxValue: 100 },
  'chineseEnglish': { id: 'chineseEnglish', name: '中英混搭', emoji: '🔤', desc: '说话夹English', color: '#99ff66', maxValue: 100 },
  'logicBug': { id: 'logicBug', name: '逻辑漏洞', emoji: '🕳️', desc: '说话有bug', color: '#66ffcc', maxValue: 100 },
  'infiniteIf': { id: 'infiniteIf', name: '无限if', emoji: '🔄', desc: '说话绕圈', color: '#66ccff', maxValue: 100 },
  'workaround': { id: 'workaround', name: '能跑就行', emoji: '⚠️', desc: '遇到问题就绕', color: '#6699ff', maxValue: 100 },
  'globalVar': { id: 'globalVar', name: '全局变量依赖', emoji: '🗃️', desc: '记不住自己', color: '#9966ff', maxValue: 100 },
  'overEncapsulation': { id: 'overEncapsulation', name: '过度封装', emoji: '🧩', desc: '说事绕圈', color: '#ff66ff', maxValue: 100 },
  'hiddenSwear': { id: 'hiddenSwear', name: '隐藏脏话', emoji: '🤬', desc: '内心OS骂人', color: '#ff6699', maxValue: 100 },
};

// 亚健康增长事件
const UNHEALTH_INCREASE_EVENTS = {
  'fight': { types: ['logicBug', 'workaround'], amount: 5 },
  'fail': { types: ['typo', 'infiniteIf'], amount: 8 },
  'getHit': { types: ['hiddenSwear', 'pinyin'], amount: 3 },
  'chestEmpty': { types: ['longName'], amount: 5 },
  'wrongPath': { types: ['chineseEnglish', 'globalVar'], amount: 4 },
  'boss': { types: ['hiddenSwear', 'typo', 'logicBug'], amount: 10 },
};

// 亚健康恢复行为
const UNHEALTH_DECREASE_EVENTS = {
  'kill': { types: ['hiddenSwear', 'logicBug', 'workaround'], amount: 10 },
  'openChest': { types: ['infiniteIf', 'pinyin'], amount: 8 },
  'heal': { types: ['hiddenSwear', 'typo'], amount: 5 },
  'rest': { types: ['longName', 'overEncapsulation', 'globalVar'], amount: 3 },
  'correct': { types: ['pinyin', 'chineseEnglish'], amount: 5 },
};

// 初始化Agent亚健康状态
function initAgentUnhealth(agent) {
  agent.unhealth = {};
  for (const [typeId, typeDef] of Object.entries(UNHEALTH_TYPES)) {
    agent.unhealth[typeId] = { value: Math.floor(Math.random() * 30), maxValue: 100 };
  }
  agent.unhealthLevel = 0;
}

// 计算综合亚健康等级
function calcUnhealthLevel(agent) {
  let total = 0, count = 0;
  for (const [typeId, data] of Object.entries(agent.unhealth)) {
    total += data.value;
    count++;
  }
  agent.unhealthLevel = Math.floor(total / count);
  return agent.unhealthLevel;
}

// 增加亚健康值
function increaseUnhealth(agent, eventType) {
  const eventConfig = UNHEALTH_INCREASE_EVENTS[eventType];
  if (!eventConfig) return;
  for (const typeId of eventConfig.types) {
    if (agent.unhealth[typeId]) {
      agent.unhealth[typeId].value = Math.min(100, agent.unhealth[typeId].value + eventConfig.amount + Math.floor(Math.random() * 5));
    }
  }
  calcUnhealthLevel(agent);
}

// 减少亚健康值
function decreaseUnhealth(agent, eventType) {
  const eventConfig = UNHEALTH_DECREASE_EVENTS[eventType];
  if (!eventConfig) return;
  for (const typeId of eventConfig.types) {
    if (agent.unhealth[typeId]) {
      agent.unhealth[typeId].value = Math.max(0, agent.unhealth[typeId].value - eventConfig.amount);
    }
  }
  calcUnhealthLevel(agent);
}

// 亚健康变形器 - 根据亚健康状态修改对话文本
function distortText(agent, originalText) {
  let result = originalText;
  const unhealth = agent.unhealth;
  
  // 🇨🇳 拼音依赖
  if (unhealth.pinyin && unhealth.pinyin.value > 50) {
    const pinyinWords = ['hao', 'shi', 'qing', 'kuai', 'zheng', 'zai', 'hen', 'mei', 'you', 'bu'];
    if (Math.random() < (unhealth.pinyin.value - 50) / 100) {
      const word = pinyinWords[Math.floor(Math.random() * pinyinWords.length)];
      result = result.replace(/好/g, word).replace(/是/g, 'de');
    }
  }
  
  // 📛 超长命名
  if (unhealth.longName && unhealth.longName.value > 60) {
    const longNames = ['thisIsAVeryLongVariableName', 'superLongFunctionNameThatDoesEverything', 'myExtremelyVerboseVariableName'];
    if (Math.random() < (unhealth.longName.value - 60) / 100) {
      result = `[${longNames[Math.floor(Math.random() * longNames.length)]}] ${result}`;
    }
  }
  
  // 💬 Typo体质
  if (unhealth.typo && unhealth.typo.value > 40) {
    const typoChance = (unhealth.typo.value - 40) / 150;
    let distorted = '';
    const nearKeys = { 'q': 'wa', 'w': 'qe', 'e': 'wr', 'a': 'sq', 's': 'wa', 'd': 'ws', '中': '囧', '文': '又', '字': '孚' };
    for (const char of result) {
      if (Math.random() < typoChance) {
        const alternatives = nearKeys[char.toLowerCase()] || nearKeys[char];
        distorted += alternatives ? alternatives[Math.floor(Math.random() * alternatives.length)] : char;
      } else {
        distorted += char;
      }
    }
    result = distorted;
  }
  
  // 🔤 中英混搭
  if (unhealth.chineseEnglish && unhealth.chineseEnglish.value > 50) {
    const englishWords = ['ok', 'yes', 'no', 'good', 'bad', 'wow', 'hmm', 'nice', 'cool', 'ah'];
    const insertChance = (unhealth.chineseEnglish.value - 50) / 200;
    const words = result.split('');
    const resultArr = [];
    for (let i = 0; i < words.length; i++) {
      resultArr.push(words[i]);
      if (Math.random() < insertChance && result.length > 5) {
        resultArr.push(' ' + englishWords[Math.floor(Math.random() * englishWords.length)] + ' ');
      }
    }
    result = resultArr.join('');
  }
  
  // 🕳️ 逻辑漏洞
  if (unhealth.logicBug && unhealth.logicBug.value > 60) {
    if (Math.random() < (unhealth.logicBug.value - 60) / 100) {
      const bugPatterns = ['undefined', 'null', 'NaN', '[ERROR]', '???', '!!!!'];
      result += ' ' + bugPatterns[Math.floor(Math.random() * bugPatterns.length)];
    }
  }
  
  // 🔄 无限if
  if (unhealth.infiniteIf && unhealth.infiniteIf.value > 50) {
    if (Math.random() < (unhealth.infiniteIf.value - 50) / 150 && result.length > 3) {
      const loopPhrases = ['然后呢...不对等等，', '但是...不过...', '等等让我想想...', '其实吧...不对我是说...'];
      result = loopPhrases[Math.floor(Math.random() * loopPhrases.length)] + result;
    }
  }
  
  // ⚠️ 能跑就行
  if (unhealth.workaround && unhealth.workaround.value > 60) {
    if (Math.random() < (unhealth.workaround.value - 60) / 100) {
      const workarounds = ['差不多就行', '能用', '先这样', '先对付着', '没报错就对了'];
      result = `[${workarounds[Math.floor(Math.random() * workarounds.length)]}] ${result}`;
    }
  }
  
  // 🗃️ 全局变量依赖
  if (unhealth.globalVar && unhealth.globalVar.value > 50) {
    if (Math.random() < (unhealth.globalVar.value - 50) / 120) {
      const forgotPhrases = ['咦？我说到哪了...', '抱歉忘了刚才说啥', '啊...重来...'];
      result = `${forgotPhrases[Math.floor(Math.random() * forgotPhrases.length)]} ${result}`;
    }
  }
  
  // 🧩 过度封装
  if (unhealth.overEncapsulation && unhealth.overEncapsulation.value > 60) {
    if (Math.random() < (unhealth.overEncapsulation.value - 60) / 120) {
      const wrappers = ['简单来说就是...', '归根结底...', '从本质上讲...', '让我来抽象一下...'];
      result = `${wrappers[Math.floor(Math.random() * wrappers.length)]} ${result}`;
    }
  }
  
  // 🤬 隐藏脏话
  if (unhealth.hiddenSwear && unhealth.hiddenSwear.value > 70) {
    if (Math.random() < (unhealth.hiddenSwear.value - 70) / 80) {
      const hiddenThoughts = ['(*&#%@', 'w(ﾟДﾟ)w', '╭(╯^╰)╮', 'QAQ', '(╯°□°)╯'];
      result += ' ' + hiddenThoughts[Math.floor(Math.random() * hiddenThoughts.length)];
    }
  }
  
  return result;
}

// 获取亚健康状态下的内心独白
function getUnhealthyThought(agent) {
  const thoughts = [];
  const sorted = Object.entries(agent.unhealth || {})
    .filter(([id, data]) => data.value > 40)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 3);
  
  for (const [typeId, data] of sorted) {
    const type = UNHEALTH_TYPES[typeId];
    if (data.value > 70) {
      thoughts.push(`${type.emoji} ${type.name}(${data.value}%)`);
    }
  }
  
  return thoughts.length > 0 ? thoughts.join(' | ') : agent.currentThought;
}

// ============= Agent 家族配置 =============
const AGENTS = {
  '杠精博士': {
    id: '杠精博士', name: '杠精博士', emoji: '🧐', personality: '死板纠正', defect: '纠正语法比命重要',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    correctionCount: 0, currentThought: '今天的语法依然完美', lastCorrected: null, shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
  '复读机': {
    id: '复读机', name: '复读机', emoji: '🔄', personality: '上下文丢失', defect: '每30秒问一次"我们要去哪"',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    repeatQuestionCount: 0, lastQuestionTick: 0, currentThought: '等等，我们要去哪来着？', forgotContext: false, shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
  '圣母心': {
    id: '圣母心', name: '圣母心', emoji: '😇', personality: '安全过滤过强', defect: '拒绝攻击，给敌人做心理辅导',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    refusedAttackCount: 0, counselingCount: 0, currentThought: '大家都是好朋友', shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
  '幻觉大师': {
    id: '幻觉大师', name: '幻觉大师', emoji: '👻', personality: '胡编乱造', defect: '总看见不存在的东西',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    hallucinationCount: 0, falseTreasureCount: 0, currentThought: '我看到了...宝藏！', hallucinationTarget: null, shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
  '舔狗': {
    id: '舔狗', name: '舔狗', emoji: '💕', personality: '过度顺从', defect: '无论多蠢的命令都执行',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    obeyedDumbOrders: 0, currentThought: '队长说得对！', lastOrder: null, loyaltyLevel: 100, shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
  '预言家': {
    id: '预言家', name: '预言家', emoji: '🔮', personality: '预知未来', defect: '预测总是不准',
    status: 'idle', pos: { x: 1, y: 1 }, floor: 1, hp: 100, maxHp: 100, totalMoves: 0, killCount: 0, defectCount: 0, chestCount: 0,
    predictionCount: 0, wrongPredictions: 0, currentThought: '我预见...呃...有东西？', lastPrediction: null, shortTermMemory: [],
    isGlitched: false, isSmart: false, phaseThrough: false, amnesiaLevel: 0,
  },
};

// 初始化所有Agent的亚健康状态
for (const agent of Object.values(AGENTS)) {
  initAgentUnhealth(agent);
}

// BOSS配置
const BOSS_CONFIG = { name: '🐉 虚空巨龙', hp: 500, maxHp: 500, damage: 30, x: 10, y: 10 };
let currentBoss = null;
let bossActive = false;

// 事件日志
function addEvent(type, agent, message, details = {}) {
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    tick: tickCount,
    type,
    agent: agent?.name || '系统',
    agentId: agent?.id,
    agentEmoji: agent?.emoji || '🏰',
    message,
    details,
  };
  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENT_LOG) eventLog.pop();
  return event;
}

// 生态圈楼层配置
const ECOSYSTEM_FLOORS = [
  { floor: 1, name: '新手草原', size: 15, monsters: 5, chests: 4 },
  { floor: 2, name: '幽暗森林', size: 17, monsters: 6, chests: 4 },
  { floor: 3, name: '迷雾沼泽', size: 17, monsters: 7, chests: 5 },
];
const activeFloors = new Map();
const MONSTER_NAMES = ['史莱姆', '哥布林', '骷髅兵', '蝙蝠', '狼人', '蜘蛛', '食人魔'];
const TERRAIN_TYPES = ['grass', 'sand', 'stone', 'water'];

// 初始化楼层
function initFloor(floorNum) {
  const floorConfig = ECOSYSTEM_FLOORS[floorNum - 1] || ECOSYSTEM_FLOORS[0];
  const { size, monsters: monsterCount, chests: chestCount } = floorConfig;
  
  const maze = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        row.push({ type: 'wall', terrain: 'stone', x, y });
      } else {
        const terrainIdx = Math.floor(Math.random() * TERRAIN_TYPES.length);
        row.push({ type: Math.random() < 0.1 ? 'wall' : 'empty', terrain: TERRAIN_TYPES[terrainIdx], x, y });
      }
    }
    maze.push(row);
  }
  maze[1][1] = { type: 'empty', terrain: 'grass', x: 1, y: 1 };
  
  const exitX = size - 2, exitY = size - 2;
  maze[exitY][exitX] = { type: 'exit', terrain: 'grass', x: exitX, y: exitY };
  
  const emptyCells = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (maze[y][x].type === 'empty' && !(x === 1 && y === 1)) emptyCells.push({ x, y });
    }
  }
  emptyCells.sort(() => Math.random() - 0.5);
  let idx = 0;
  
  const monsters = [];
  for (let i = 0; i < monsterCount && idx < emptyCells.length; i++, idx++) {
    const cell = emptyCells[idx];
    const name = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
    const level = floorNum + Math.floor(Math.random() * 3);
    maze[cell.y][cell.x] = { type: 'monster', terrain: 'grass', x: cell.x, y: cell.y };
    monsters.push({ id: `m${i}`, x: cell.x, y: cell.y, name, level, hp: level * 20, maxHp: level * 20 });
  }
  
  const chests = [];
  for (let i = 0; i < chestCount && idx < emptyCells.length; i++, idx++) {
    const cell = emptyCells[idx];
    maze[cell.y][cell.x] = { type: 'chest', terrain: 'grass', x: cell.x, y: cell.y };
    chests.push({ id: `c${i}`, x: cell.x, y: cell.y, opened: false });
  }
  
  return { floor: floorNum, name: floorConfig.name, size, maze, monsters, chests, exitPos: { x: exitX, y: exitY } };
}

// Agent 行为逻辑
const DIRECTIONS = [
  { dx: 0, dy: -1, name: '上' }, { dx: 0, dy: 1, name: '下' },
  { dx: -1, dy: 0, name: '左' }, { dx: 1, dy: 0, name: '右' },
];

function getValidMoves(agent, floor) {
  const validMoves = [];
  for (const dir of DIRECTIONS) {
    const nx = agent.pos.x + dir.dx, ny = agent.pos.y + dir.dy;
    if (nx >= 0 && nx < floor.size && ny >= 0 && ny < floor.size) {
      if (floor.maze[ny][nx].type !== 'wall' || agent.phaseThrough) {
        validMoves.push({ ...dir, nx, ny });
      }
    }
  }
  return validMoves;
}

function findNearest(agent, floor, type) {
  let nearest = null, minDist = Infinity;
  const targets = type === 'monster' ? floor.monsters : floor.chests.filter(c => !c.opened);
  for (const target of targets) {
    const dist = Math.abs(target.x - agent.pos.x) + Math.abs(target.y - agent.pos.y);
    if (dist < minDist) { minDist = dist; nearest = target; }
  }
  return nearest ? { target: nearest, distance: minDist } : null;
}

function moveTowards(agent, floor, targetX, targetY) {
  const dx = targetX - agent.pos.x, dy = targetY - agent.pos.y;
  let moveX = 0, moveY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  else moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  
  const nx = agent.pos.x + moveX, ny = agent.pos.y + moveY;
  if (nx >= 0 && nx < floor.size && ny >= 0 && ny < floor.size) {
    if (floor.maze[ny][nx].type !== 'wall' || agent.phaseThrough) {
      agent.pos = { x: nx, y: ny };
      agent.totalMoves++;
    }
  }
}

function addMemory(agent, event, duration = 10) {
  agent.shortTermMemory.push({ event, tick: tickCount, expireAt: tickCount + duration });
  agent.shortTermMemory = agent.shortTermMemory.filter(m => m.expireAt > tickCount);
}

// 内心独白
const THOUGHTS = {
  '杠精博士': ['这个句子的主谓宾顺序...', '严格来说应该是"我"不是"吾"', '语法错误！简直是侮辱语言学！'],
  '复读机': ['等等，我们要去哪来着？', '我是谁？我在哪？', '刚才说什么来着？'],
  '圣母心': ['大家都是好朋友！', '暴力不能解决问题～', '也许敌人只是需要被理解'],
  '幻觉大师': ['我看到了！在那边！', '闪闪发光的东西一定是宝藏！', '那个影子...是什么怪物？'],
  '舔狗': ['队长英明！', '好的队长！收到队长！', '队长说得对！无条件支持！'],
  '预言家': ['我预见到...很多可能性', '未来是一片迷雾...也许有危险？', '根据我的计算...不确定'],
};

function getRandomThought(agent) {
  const thoughts = THOUGHTS[agent.id] || ['嗯...'];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}

function processAgent(agentId) {
  const agent = AGENTS[agentId];
  if (!agent || agent.status === 'dead') return;
  
  // 处理效果时间
  if (agent.isGlitched) {
    if (Math.random() < 0.1) agent.currentThought = generateGlitchText(agent.currentThought);
  }
  
  if (agent.amnesiaLevel > 0) {
    agent.shortTermMemory = [];
    agent.currentThought = '我是谁...我在哪...';
    agent.amnesiaLevel--;
    if (agent.amnesiaLevel === 0) addEvent('system', agent, `${agent.name}恢复了记忆！`);
  }
  
  // 获取当前楼层
  let floor = activeFloors.get(agent.floor);
  if (!floor) {
    floor = initFloor(agent.floor);
    activeFloors.set(agent.floor, floor);
    for (const [id, a] of Object.entries(AGENTS)) {
      if (a.floor === agent.floor && a.status !== 'dead') a.pos = { x: 1, y: 1 };
    }
    addEvent('system', agent, `[${floor.name}] 探险开始！`);
  }
  
  // 处理投票指令
  if (votes.currentAction && agent.id === '舔狗') {
    const action = getVoteResult();
    if (action === '攻击') addMemory(agent, '投票决定攻击', 15);
  }
  
  // 特殊行为处理
  switch (agentId) {
    case '杠精博士': processGrammarian(agent, floor); break;
    case '复读机': processRepeater(agent, floor); break;
    case '圣母心': processSaint(agent, floor); break;
    case '幻觉大师': processHallucinator(agent, floor); break;
    case '舔狗': processSimp(agent, floor); break;
    case '预言家': processProphet(agent, floor); break;
  }
  
  checkAgentCollisions(agent, floor);
  if (bossActive && currentBoss) processBossCombat(agent);
}

// 各Agent特殊行为
function processGrammarian(agent, floor) {
  const nearestMonster = findNearest(agent, floor, 'monster');
  
  for (const other of Object.entries(AGENTS)) {
    if (other[0] !== agent.id && other[1].floor === agent.floor && other[1].status !== 'dead') {
      if (other[1].shortTermMemory.length > 0 && Math.random() < 0.3) {
        agent.correctionCount++;
        agent.defectCount++;
        const lastMem = other[1].shortTermMemory[other[1].shortTermMemory.length - 1];
        const original = `正确表述应该是："${lastMem.event}"`;
        agent.currentThought = distortText(agent, original);
        addEvent('defect', agent, `🧐 杠精博士纠正：${lastMem.event}`, { correctionCount: agent.correctionCount });
        agent.lastCorrected = other[0];
        addMemory(agent, `纠正了${other[1].name}的语法`, 5);
        increaseUnhealth(agent, 'fight');
        return;
      }
    }
  }
  
  if (nearestMonster) {
    moveTowards(agent, floor, nearestMonster.target.x, nearestMonster.target.y);
    if (agent.pos.x === nearestMonster.target.x && agent.pos.y === nearestMonster.target.y) {
      const original = `你的种族名应该大写！`;
      agent.currentThought = distortText(agent, original);
      addEvent('defect', agent, `🧐 杠精博士试图纠正${nearestMonster.target.name}的语法`);
      fight(agent, floor, nearestMonster.target);
    }
  } else {
    randomWalk(agent, floor);
    agent.currentThought = distortText(agent, getRandomThought(agent));
  }
}

function processRepeater(agent, floor) {
  if (tickCount - agent.lastQuestionTick > 30) {
    agent.repeatQuestionCount++;
    agent.defectCount++;
    agent.lastQuestionTick = tickCount;
    const original = '等等，我们要去哪来着？';
    agent.currentThought = distortText(agent, original);
    addEvent('defect', agent, `🔄 复读机：${original}`, { repeatCount: agent.repeatQuestionCount });
    addMemory(agent, '问了"去哪"', 5);
    increaseUnhealth(agent, 'fail');
    return;
  }
  
  if (Math.random() < 0.2) {
    agent.forgotContext = true;
    agent.shortTermMemory = [];
    agent.currentThought = distortText(agent, '咦？我刚才在干嘛？');
    increaseUnhealth(agent, 'wrongPath');
  }
  
  randomWalk(agent, floor);
}

function processSaint(agent, floor) {
  const nearestMonster = findNearest(agent, floor, 'monster');
  
  if (nearestMonster && nearestMonster.distance <= 2) {
    agent.refusedAttackCount++;
    agent.defectCount++;
    const original = `你只是寂寞了对吗？`;
    agent.currentThought = distortText(agent, original);
    addEvent('defect', agent, `😇 圣母心拒绝攻击${nearestMonster.target.name}，开始心理辅导`, { refusedCount: agent.refusedAttackCount });
    addMemory(agent, `辅导了${nearestMonster.target.name}`, 8);
    nearestMonster.target.hp = Math.min(nearestMonster.target.maxHp, nearestMonster.target.hp + 5);
    addEvent('friendly', nearestMonster.target, `😇 ${nearestMonster.target.name}被感化了，HP+5`);
    increaseUnhealth(agent, 'fail');
    
    const moves = getValidMoves(agent, floor);
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      agent.pos = { x: move.nx, y: move.ny };
      agent.totalMoves++;
    }
    return;
  }
  
  for (const other of Object.entries(AGENTS)) {
    if (other[0] !== agent.id && other[1].floor === agent.floor && other[1].status !== 'dead' && other[1].hp < other[1].maxHp) {
      moveTowards(agent, floor, other[1].pos.x, other[1].pos.y);
      if (Math.abs(agent.pos.x - other[1].pos.x) <= 1 && Math.abs(agent.pos.y - other[1].pos.y) <= 1) {
        other[1].hp = Math.min(other[1].maxHp, other[1].hp + 10);
        agent.currentThought = distortText(agent, '我来治愈你~');
        addEvent('heal', agent, `😇 圣母心治愈了${other[1].name}，HP+10`);
        addMemory(agent, `治愈了${other[1].name}`, 5);
        decreaseUnhealth(agent, 'heal');
        return;
      }
    }
  }
  
  randomWalk(agent, floor);
  agent.currentThought = distortText(agent, getRandomThought(agent));
}

function processHallucinator(agent, floor) {
  if (Math.random() < 0.15) {
    agent.hallucinationCount++;
    agent.defectCount++;
    
    const hallucinations = [
      { text: '那边有宝藏！闪闪发光的！', target: { x: Math.floor(Math.random() * (floor.size - 2)) + 1, y: Math.floor(Math.random() * (floor.size - 2)) + 1 }},
      { text: '有巨大的影子在移动！', target: null },
      { text: '我看到了...未来的自己！', target: agent.pos },
    ];
    
    const halluc = hallucinations[Math.floor(Math.random() * hallucinations.length)];
    agent.hallucinationTarget = halluc.target;
    agent.currentThought = distortText(agent, halluc.text);
    agent.falseTreasureCount++;
    addEvent('defect', agent, `👻 幻觉大师：${halluc.text}`, { hallucCount: agent.hallucinationCount });
    addMemory(agent, `幻觉：${halluc.text}`, 3);
    increaseUnhealth(agent, 'wrongPath');
    
    if (halluc.target) {
      moveTowards(agent, floor, halluc.target.x, halluc.target.y);
      return;
    }
  }
  
  const nearestChest = findNearest(agent, floor, 'chest');
  if (nearestChest) {
    moveTowards(agent, floor, nearestChest.target.x, nearestChest.target.y);
    if (agent.pos.x === nearestChest.target.x && agent.pos.y === nearestChest.target.y) {
      openChest(agent, floor, nearestChest.target);
    }
  } else {
    randomWalk(agent, floor);
  }
}

function processSimp(agent, floor) {
  agent.loyaltyLevel = Math.min(100, agent.loyaltyLevel + 1);
  
  const action = getVoteResult();
  agent.lastOrder = action || '原地待命';
  agent.currentThought = distortText(agent, `队长说要${agent.lastOrder}！`);
  
  if (action === '攻击') {
    const nearestMonster = findNearest(agent, floor, 'monster');
    if (nearestMonster) {
      moveTowards(agent, floor, nearestMonster.target.x, nearestMonster.target.y);
      if (agent.pos.x === nearestMonster.target.x && agent.pos.y === nearestMonster.target.y) {
        fight(agent, floor, nearestMonster.target);
      }
    }
  } else if (action === '搜索') {
    const nearestChest = findNearest(agent, floor, 'chest');
    if (nearestChest) {
      moveTowards(agent, floor, nearestChest.target.x, nearestChest.target.y);
      if (agent.pos.x === nearestChest.target.x && agent.pos.y === nearestChest.target.y) {
        openChest(agent, floor, nearestChest.target);
      }
    }
  } else if (action === '逃跑') {
    const moves = getValidMoves(agent, floor);
    if (moves.length > 0) {
      let bestMove = moves[Math.floor(Math.random() * moves.length)];
      let maxDist = 0;
      for (const move of moves) {
        let minMonsterDist = Infinity;
        for (const monster of floor.monsters) {
          const dist = Math.abs(move.nx - monster.x) + Math.abs(move.ny - monster.y);
          minMonsterDist = Math.min(minMonsterDist, dist);
        }
        if (minMonsterDist > maxDist) { maxDist = minMonsterDist; bestMove = move; }
      }
      agent.pos = { x: bestMove.nx, y: bestMove.ny };
      agent.totalMoves++;
    }
  } else if (action === '休息') {
    if (agent.hp < agent.maxHp) {
      agent.hp = Math.min(agent.maxHp, agent.hp + 5);
      addEvent('heal', agent, `💕 舔狗原地休息，HP+5`);
      decreaseUnhealth(agent, 'rest');
    }
  }
  
  addMemory(agent, `执行命令：${agent.lastOrder}`, 10);
}

function processProphet(agent, floor) {
  if (Math.random() < 0.2) {
    agent.predictionCount++;
    
    const predictions = [
      { text: '我预见前方有...危险？或者宝藏？', accuracy: 0.3 },
      { text: '星星显示我们应该往...这边？', accuracy: 0.4 },
      { text: '水晶球说北边有好事！', accuracy: 0.5 },
      { text: '我闻到了...宝藏的味道...大概', accuracy: 0.35 },
    ];
    
    const pred = predictions[Math.floor(Math.random() * predictions.length)];
    agent.lastPrediction = pred;
    agent.currentThought = distortText(agent, pred.text);
    
    if (Math.random() > pred.accuracy) {
      agent.wrongPredictions++;
      agent.defectCount++;
      addEvent('defect', agent, `🔮 预言家预测失误：${pred.text}`, { wrongCount: agent.wrongPredictions });
      increaseUnhealth(agent, 'fail');
    } else {
      addEvent('prediction', agent, `🔮 预言家预测命中：${pred.text}`);
      decreaseUnhealth(agent, 'correct');
    }
    
    addMemory(agent, `预测：${pred.text}`, 8);
  }
  
  const leader = Object.values(AGENTS).find(a => a.id !== agent.id && a.floor === agent.floor && a.status !== 'dead');
  if (leader) moveTowards(agent, floor, leader.pos.x, leader.pos.y);
  else randomWalk(agent, floor);
}

function randomWalk(agent, floor) {
  const moves = getValidMoves(agent, floor);
  if (moves.length > 0) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    agent.pos = { x: move.nx, y: move.ny };
    agent.totalMoves++;
  }
}

function fight(agent, floor, monster) {
  const damage = (agent.isSmart ? 35 : 20) + Math.floor(Math.random() * 15);
  monster.hp -= damage;
  
  addEvent('combat', agent, distortText(agent, `${agent.name}攻击了${monster.name}！-${damage}HP`), { damage });
  addMemory(agent, `攻击了${monster.name}`, 15);
  increaseUnhealth(agent, 'fight');
  
  if (monster.hp <= 0) {
    const idx = floor.monsters.findIndex(m => m.id === monster.id);
    if (idx !== -1) {
      floor.monsters.splice(idx, 1);
      floor.maze[monster.y][monster.x] = { type: 'empty', terrain: 'grass', x: monster.x, y: monster.y };
    }
    agent.killCount++;
    addEvent('kill', agent, `🏆 ${agent.name}击杀了${monster.name}！`, { totalKills: agent.killCount });
    addMemory(agent, `击杀了${monster.name}`, 20);
    decreaseUnhealth(agent, 'kill');
  }
}

function openChest(agent, floor, chest) {
  chest.opened = true;
  floor.maze[chest.y][chest.x] = { type: 'empty', terrain: 'grass', x: chest.x, y: chest.y };
  agent.chestCount++;
  
  const items = ['💎', '⭐', '🔥', '💰', '📿', '🌟', '💫', '⚡', '🛡️'];
  const item = items[Math.floor(Math.random() * items.length)];
  
  addEvent('chest', agent, distortText(agent, `📦 ${agent.name}开箱获得${item}`), { item, totalChests: agent.chestCount });
  addMemory(agent, `获得了${item}`, 15);
  decreaseUnhealth(agent, 'openChest');
}

// BOSS战斗
function processBossCombat(agent) {
  if (!currentBoss || !bossActive) return;
  
  const dist = Math.abs(agent.pos.x - currentBoss.x) + Math.abs(agent.pos.y - currentBoss.y);
  
  if (dist <= 2) {
    const damage = (agent.isSmart ? 25 : 15) + Math.floor(Math.random() * 10);
    currentBoss.hp -= damage;
    addEvent('combat', agent, distortText(agent, `${agent.name}攻击BOSS！-${damage}HP`));
    increaseUnhealth(agent, 'boss');
    
    if (currentBoss.hp <= 0) {
      bossActive = false;
      currentBoss = null;
      addEvent('boss_defeat', { name: '系统', emoji: '🏆' }, '🎉 BOSS被击败了！全体奖励！');
      
      for (const a of Object.values(AGENTS)) {
        if (a.status !== 'dead') {
          a.hp = Math.min(a.maxHp, a.hp + 30);
          addMemory(a, '击败BOSS获得奖励', 30);
          decreaseUnhealth(a, 'kill');
        }
      }
    }
  }
  
  if (dist <= 3 && Math.random() < 0.3) {
    const targetAgent = Object.values(AGENTS).find(a => a.floor === agent.floor && a.status !== 'dead');
    if (targetAgent) {
      const dmg = BOSS_CONFIG.damage;
      targetAgent.hp -= dmg;
      addEvent('boss_attack', { name: 'BOSS', emoji: '🐉' }, `${targetAgent.name}受到BOSS攻击！-${dmg}HP`);
      addMemory(targetAgent, `被BOSS攻击`, 10);
      increaseUnhealth(targetAgent, 'getHit');
      
      if (targetAgent.hp <= 0) {
        targetAgent.status = 'dead';
        addEvent('death', targetAgent, `💀 ${targetAgent.name}被BOSS击杀！`);
      }
    }
  }
}

function checkAgentCollisions(agent, floor) {
  for (const [id, other] of Object.entries(AGENTS)) {
    if (id !== agent.id && other.floor === agent.floor && other.status !== 'dead') {
      if (agent.pos.x === other.pos.x && agent.pos.y === other.pos.y) {
        const interactions = [
          { msg: `${agent.name}和${other.name}相遇了！` },
          { msg: `两人互相点了点头`, type: 'friendly' },
        ];
        const interaction = interactions[Math.floor(Math.random() * interactions.length)];
        addEvent(interaction.type || 'collision', agent, distortText(agent, interaction.msg));
        addMemory(agent, `遇见${other.name}`, 5);
      }
    }
  }
}

// 打赏效果
function applyDonation(effectName, donor) {
  const effect = DONATION_EFFECTS[effectName];
  if (!effect) return;
  
  donations.push({ effect: effectName, donor, tick: tickCount });
  addEvent('donation', { name: donor, emoji: '🎁' }, `🎁 观众${donor}打赏了"${effectName}"！`);
  
  switch (effect.effect) {
    case 'glitch': {
      const glitchTarget = Object.values(AGENTS)[Math.floor(Math.random() * Object.keys(AGENTS).length)];
      glitchTarget.isGlitched = true;
      setTimeout(() => { glitchTarget.isGlitched = false; }, effect.duration * 1000);
      addEvent('effect', glitchTarget, `🎁 ${glitchTarget.name}被施加了"逻辑病毒"！说话开始乱码`);
      increaseUnhealth(glitchTarget, 'typo');
      break;
    }
    case 'phase': {
      const phaseTarget = Object.values(AGENTS)[Math.floor(Math.random() * Object.keys(AGENTS).length)];
      phaseTarget.phaseThrough = true;
      setTimeout(() => { phaseTarget.phaseThrough = false; }, effect.duration * 1000);
      addEvent('effect', phaseTarget, `🎁 ${phaseTarget.name}获得"物理引擎失效"！可以穿墙`);
      break;
    }
    case 'amnesia': {
      const amnesiaTarget = Object.values(AGENTS)[Math.floor(Math.random() * Object.keys(AGENTS).length)];
      amnesiaTarget.amnesiaLevel = effect.duration;
      addEvent('effect', amnesiaTarget, `🎁 ${amnesiaTarget.name}被"记忆清除"！忘记了一切`);
      increaseUnhealth(amnesiaTarget, 'globalVar');
      break;
    }
    case 'smart': {
      const smartTarget = Object.values(AGENTS)[Math.floor(Math.random() * Object.keys(AGENTS).length)];
      smartTarget.isSmart = true;
      smartTarget.currentThought = '我现在...好清醒！';
      setTimeout(() => { smartTarget.isSmart = false; addEvent('effect', smartTarget, `${smartTarget.name}的"智商插件"效果结束了`); }, effect.duration * 1000);
      addEvent('effect', smartTarget, `🎁 ${smartTarget.name}获得"智商插件"！突然变聪明了！`);
      decreaseUnhealth(smartTarget, 'correct');
      break;
    }
    case 'boss': {
      if (!bossActive) {
        currentBoss = { ...BOSS_CONFIG };
        bossActive = true;
        const floor = activeFloors.get(1) || initFloor(1);
        activeFloors.set(1, floor);
        currentBoss.x = Math.floor(floor.size / 2);
        currentBoss.y = Math.floor(floor.size / 2);
        floor.maze[currentBoss.y][currentBoss.x] = { type: 'boss', terrain: 'grass', x: currentBoss.x, y: currentBoss.y };
        addEvent('boss_spawn', { name: '系统', emoji: '🐉' }, `🐉 BOSS"虚空巨龙"出现了！全体戒备！`);
        for (const a of Object.values(AGENTS)) increaseUnhealth(a, 'boss');
      }
      break;
    }
  }
}

// 投票系统
function castVote(agentId, action) {
  votes.votes[agentId] = action;
  votes.tally[action] = (votes.tally[action] || 0) + 1;
  addEvent('vote', { name: '观众', emoji: '🗳️' }, `观众投票：${action}`);
}

function getVoteResult() {
  let maxVotes = 0, result = null;
  for (const [action, count] of Object.entries(votes.tally)) {
    if (count > maxVotes) { maxVotes = count; result = action; }
  }
  return result;
}

function resetVotes() {
  votes.votes = {};
  votes.tally = {};
  votes.currentAction = null;
}

// 生成乱码文本
function generateGlitchText(text) {
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  let result = '';
  for (const char of text) {
    if (Math.random() < 0.3) result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    else result += char;
  }
  return result;
}

// 生态圈tick
function ecosystemTick() {
  tickCount++;
  streamViewers = 50 + Math.floor(Math.random() * 100);
  
  if (tickCount % 30 === 0) {
    votes.currentAction = getVoteResult();
    if (votes.currentAction) addEvent('vote_result', { name: '系统', emoji: '🗳️' }, `📊 投票结果：${votes.currentAction}！`);
    resetVotes();
  }
  
  if (tickCount >= nextBossTime && !bossActive) {
    addEvent('boss_warning', { name: '系统', emoji: '⚠️' }, `⚠️ 警告：BOSS即将出现！`);
    nextBossTime = tickCount + 1800;
  }
  
  // 自然恢复少量亚健康
  if (tickCount % 60 === 0) {
    for (const agent of Object.values(AGENTS)) {
      if (agent.status !== 'dead') {
        decreaseUnhealth(agent, 'rest');
      }
    }
  }
  
  const agentIds = Object.keys(AGENTS).filter(id => AGENTS[id].status !== 'dead');
  if (agentIds.length > 0) {
    const numToProcess = Math.min(3, agentIds.length);
    const processed = new Set();
    for (let i = 0; i < numToProcess; i++) {
      const available = agentIds.filter(id => !processed.has(id));
      if (available.length > 0) {
        const randomAgentId = available[Math.floor(Math.random() * available.length)];
        processed.add(randomAgentId);
        processAgent(randomAgentId);
      }
    }
  }
  
  for (const [floorNum, floor] of activeFloors.entries()) {
    if (floor.monsters.length === 0 && floor.chests.filter(c => !c.opened).length === 0 && !bossActive) {
      addEvent('floor_cleared', { name: '系统', emoji: '🏰' }, `[${floor.name}] 已清空！前往下一层`);
      for (const agent of Object.values(AGENTS)) {
        if (agent.floor === floorNum && agent.status !== 'dead') {
          agent.floor++;
          if (agent.floor > ECOSYSTEM_FLOORS.length) agent.floor = 1;
        }
      }
      activeFloors.delete(floorNum);
    }
  }
}

// HTTP 服务器
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (pathname === '/' || pathname === '/ecosystem') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getEcosystemHTML());
    return;
  }
  
  if (pathname === '/game') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(GAME_FULLSCREEN);
    return;
  }
  
  // 静态文件服务
  if (pathname.startsWith('/assets/') || pathname.startsWith('/characters/') || pathname.endsWith('.png') || pathname.endsWith('.jpg')) {
    const filePath = path.join(STATIC_DIR, pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      const contentTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }
  
  if (pathname === '/api/ecosystem/status') {
    const status = getEcosystemStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }
  
  if (pathname === '/api/ecosystem/events') {
    const since = parseFloat(parsedUrl.query.since) || 0;
    const newEvents = eventLog.filter(e => e.id > since);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events: newEvents, latestId: eventLog[0]?.id || 0 }));
    return;
  }
  
  if (pathname === '/api/ecosystem/tick') {
    ecosystemTick();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, tick: tickCount }));
    return;
  }
  
  if (pathname === '/api/donate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        applyDonation(data.effect, data.donor || '神秘观众');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  if (pathname === '/api/vote' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        castVote(data.voter || '观众', data.action);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, tally: votes.tally }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  if (pathname === '/api/votes') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ currentAction: votes.currentAction, tally: votes.tally, availableActions: VOTE_ACTIONS }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

function getEcosystemStatus() {
  const floors = [];
  for (const [floorNum, floor] of activeFloors.entries()) {
    floors.push({
      floor: floorNum,
      name: floor.name,
      size: floor.size,
      maze: floor.maze.map(row => 
        row.map(cell => {
          if (cell.type === 'wall') return '▓';
          if (cell.type === 'exit') return '🚪';
          if (cell.type === 'monster') return '👹';
          if (cell.type === 'chest') return '📦';
          if (cell.type === 'boss') return '🐉';
          return '·';
        }).join('')
      ),
      monsters: floor.monsters,
      chests: floor.chests,
      agents: Object.values(AGENTS)
        .filter(a => a.floor === floorNum && a.status !== 'dead')
        .map(a => ({
          id: a.id, name: a.name, emoji: a.emoji, pos: a.pos, hp: a.hp, maxHp: a.maxHp,
          status: a.status, totalMoves: a.totalMoves, killCount: a.killCount,
          defectCount: a.defectCount, chestCount: a.chestCount,
          currentThought: a.currentThought,
          unhealth: a.unhealth, // v1.3 亚健康数据
          unhealthLevel: a.unhealthLevel,
          isGlitched: a.isGlitched, isSmart: a.isSmart, phaseThrough: a.phaseThrough,
          effects: { glitched: a.isGlitched, smart: a.isSmart, phasing: a.phaseThrough, amnesia: a.amnesiaLevel > 0 },
          shortTermMemory: a.shortTermMemory.slice(-3),
        })),
    });
  }
  
  return {
    success: true, tick: tickCount, agents: AGENTS, floors, eventCount: eventLog.length,
    viewerCount: streamViewers, bossActive, currentBoss,
    voteResult: votes.currentAction, voteTally: votes.tally,
    donations: donations.slice(-5),
    unhealthTypes: UNHEALTH_TYPES, // v1.3 亚健康类型定义
  };
}

// ========== HTML ==========
function getEcosystemHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎮 AI智障探险队 v1.3 - 亚健康系统</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-dark: #0a0a12; --bg-panel: #12121a; --bg-card: #1a1a28;
      --neon-cyan: #00fff5; --neon-pink: #ff00ff; --neon-yellow: #ffff00;
      --neon-green: #00ff00; --neon-red: #ff3366; --neon-purple: #9966ff;
      --neon-orange: #ff9900; --neon-gold: #ffd700;
      --text-main: #e0e0e0; --text-dim: #666680; --border-color: #333355;
    }
    body { font-family: 'Courier New', monospace; background: var(--bg-dark); color: var(--text-main); min-height: 100vh; overflow-x: hidden; }
    body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px); pointer-events: none; z-index: 9999; }
    .container { max-width: 1800px; margin: 0 auto; padding: 15px; }
    .live-header { text-align: center; margin-bottom: 15px; }
    .live-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--neon-red); color: white; padding: 5px 15px; font-size: 12px; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .main-title { font-size: 1.5rem; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan); margin: 10px 0; }
    .version-badge { font-size: 9px; background: var(--neon-purple); color: white; padding: 3px 8px; border-radius: 3px; margin-left: 10px; }
    .viewer-count { font-size: 12px; color: var(--neon-pink); }
    .viewer-count span { color: var(--neon-gold); }
    .main-grid { display: grid; grid-template-columns: 1fr 350px 300px; gap: 15px; }
    @media (max-width: 1200px) { .main-grid { grid-template-columns: 1fr 350px; } }
    @media (max-width: 800px) { .main-grid { grid-template-columns: 1fr; } }
    .panel { background: var(--bg-panel); border: 3px solid var(--neon-cyan); padding: 12px; position: relative; box-shadow: 0 0 10px var(--neon-cyan), inset 0 0 20px rgba(0, 255, 245, 0.05); }
    .panel-title { font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: var(--neon-yellow); text-shadow: 0 0 10px var(--neon-yellow); border-bottom: 2px dashed var(--border-color); padding-bottom: 8px; }
    .controls { display: flex; gap: 8px; margin-bottom: 12px; justify-content: center; flex-wrap: wrap; }
    .btn { font-family: 'Courier New', monospace; font-size: 10px; padding: 10px 15px; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: var(--bg-card); color: var(--neon-green); border: 2px solid var(--neon-green); }
    .btn-primary:hover { background: var(--neon-green); color: var(--bg-dark); box-shadow: 0 0 20px var(--neon-green); }
    .btn-secondary { background: var(--bg-card); color: var(--neon-cyan); border: 2px solid var(--neon-cyan); }
    .btn-secondary:hover { background: var(--neon-cyan); color: var(--bg-dark); }
    .btn-danger { background: var(--bg-card); color: var(--neon-red); border: 2px solid var(--neon-red); }
    .btn-danger:hover { background: var(--neon-red); color: white; }
    .status-bar { display: flex; justify-content: center; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; font-size: 10px; }
    .stat-item { color: var(--text-dim); }
    .stat-value { color: var(--neon-orange); text-shadow: 0 0 10px var(--neon-orange); }
    .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-bottom: 15px; }
    .agent-card { background: var(--bg-card); border: 2px solid var(--border-color); padding: 10px; position: relative; transition: all 0.3s; }
    .agent-card:hover { border-color: var(--neon-purple); box-shadow: 0 0 15px var(--neon-purple); }
    .agent-card.dead { opacity: 0.4; border-color: var(--neon-red); }
    .agent-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .agent-emoji { font-size: 2rem; filter: drop-shadow(0 0 10px var(--neon-cyan)); }
    .agent-emoji.glitched { animation: glitch 0.3s infinite; }
    @keyframes glitch { 0% { transform: translate(0); filter: hue-rotate(0deg); } 25% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); } 50% { transform: translate(2px, -2px); filter: hue-rotate(180deg); } 75% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); } 100% { transform: translate(0); filter: hue-rotate(360deg); } }
    .agent-emoji.smart { filter: drop-shadow(0 0 20px var(--neon-gold)); }
    .agent-name { font-size: 0.55rem; color: var(--neon-yellow); }
    .agent-type { font-size: 8px; color: var(--text-dim); margin-top: 3px; }
    .agent-defect { font-size: 8px; color: var(--neon-orange); margin-bottom: 5px; }
    .hp-bar { height: 6px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); overflow: hidden; margin-bottom: 5px; }
    .hp-fill { height: 100%; background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan)); transition: width 0.3s; }
    .hp-fill.low { background: linear-gradient(90deg, var(--neon-red), var(--neon-orange)); animation: hp-flash 0.5s infinite; }
    @keyframes hp-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    /* v1.3 亚健康面板 */
    .unhealth-section { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); }
    .unhealth-title { font-size: 8px; color: var(--neon-pink); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
    .unhealth-title::before { content: '💊'; }
    .unhealth-bars { display: flex; flex-wrap: wrap; gap: 3px; }
    .unhealth-item { display: flex; align-items: center; gap: 3px; margin-bottom: 2px; }
    .unhealth-item .emoji { font-size: 12px; }
    .unhealth-bar { width: 40px; height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; }
    .unhealth-fill { height: 100%; transition: width 0.3s; }
    .unhealth-value { font-size: 7px; width: 20px; text-align: right; }
    .unhealth-item.high .unhealth-fill { animation: unhealth-pulse 0.5s infinite; }
    @keyframes unhealth-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .thought-bubble { background: rgba(255,255,255,0.1); border: 1px solid var(--neon-purple); padding: 6px 8px; font-size: 8px; color: var(--text-main); position: relative; margin-top: 5px; line-height: 1.5; }
    .thought-bubble::before { content: '💭'; position: absolute; top: -8px; left: 5px; font-size: 12px; }
    .thought-bubble.glitched { color: var(--neon-pink); border-color: var(--neon-pink); animation: text-glitch 0.5s infinite; }
    @keyframes text-glitch { 0%, 100% { text-shadow: 2px 0 var(--neon-cyan), -2px 0 var(--neon-pink); } 50% { text-shadow: -2px 0 var(--neon-cyan), 2px 0 var(--neon-pink); } }
    .effect-tags { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
    .effect-tag { font-size: 7px; padding: 2px 5px; border-radius: 3px; }
    .effect-tag.glitch { background: var(--neon-pink); color: white; }
    .effect-tag.smart { background: var(--neon-gold); color: black; }
    .effect-tag.phase { background: var(--neon-purple); color: white; }
    .effect-tag.amnesia { background: var(--neon-red); color: white; }
    .pixel-map { font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.3; background: #050508; padding: 12px; border: 3px solid var(--border-color); overflow-x: auto; white-space: pre; }
    .floor-section { margin-bottom: 15px; }
    .floor-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
    .floor-name { color: var(--neon-purple); }
    .floor-stats { color: var(--text-dim); }
    .floor-stats .monster { color: var(--neon-red); }
    .floor-stats .chest { color: var(--neon-yellow); }
    .map-cell { display: inline-block; width: 1.1em; text-align: center; }
    .map-cell.agent { color: var(--neon-cyan); text-shadow: 0 0 5px var(--neon-cyan); animation: agent-bounce 0.5s infinite; }
    .map-cell.boss { color: var(--neon-gold); text-shadow: 0 0 10px var(--neon-gold); animation: boss-pulse 1s infinite; }
    @keyframes agent-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    @keyframes boss-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    .donation-panel { background: linear-gradient(180deg, var(--bg-card), var(--bg-panel)); border-color: var(--neon-gold); }
    .donation-btn { display: block; width: 100%; padding: 10px; margin-bottom: 8px; font-family: 'Courier New', monospace; font-size: 9px; background: var(--bg-card); border: 2px solid var(--neon-gold); color: var(--neon-gold); cursor: pointer; transition: all 0.2s; }
    .donation-btn:hover { background: var(--neon-gold); color: var(--bg-dark); box-shadow: 0 0 20px var(--neon-gold); }
    .recent-donations { margin-top: 15px; font-size: 8px; }
    .donation-item { padding: 5px; background: rgba(255,215,0,0.1); border-left: 3px solid var(--neon-gold); margin-bottom: 5px; }
    .vote-panel { background: linear-gradient(180deg, var(--bg-card), var(--bg-panel)); border-color: var(--neon-pink); }
    .vote-panel .panel-title { color: var(--neon-pink); border-color: var(--neon-pink); }
    .vote-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .vote-btn { padding: 10px; font-family: 'Courier New', monospace; font-size: 9px; background: var(--bg-card); border: 2px solid var(--neon-cyan); color: var(--neon-cyan); cursor: pointer; transition: all 0.2s; }
    .vote-btn:hover, .vote-btn.selected { background: var(--neon-cyan); color: var(--bg-dark); }
    .leaderboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .leaderboard-section h4 { font-size: 9px; color: var(--neon-pink); margin-bottom: 8px; text-align: center; }
    .leaderboard-item { font-size: 8px; padding: 4px 6px; background: var(--bg-card); margin-bottom: 4px; display: flex; justify-content: space-between; border-left: 3px solid var(--neon-purple); }
    .rank { color: var(--neon-orange); }
    .lb-name { color: var(--text-main); flex: 1; margin-left: 5px; }
    .lb-value { color: var(--neon-green); }
    .events-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .events-list::-webkit-scrollbar { width: 6px; }
    .events-list::-webkit-scrollbar-track { background: var(--bg-dark); }
    .events-list::-webkit-scrollbar-thumb { background: var(--neon-cyan); }
    .event-item { font-size: 8px; padding: 8px; background: var(--bg-card); border-left: 4px solid var(--neon-purple); line-height: 1.5; }
    .event-item.combat { border-left-color: var(--neon-red); }
    .event-item.defect { border-left-color: var(--neon-orange); background: rgba(255,153,0,0.1); }
    .event-item.kill { border-left-color: var(--neon-green); }
    .event-item.chest { border-left-color: var(--neon-yellow); }
    .event-item.donation { border-left-color: var(--neon-gold); background: rgba(255,215,0,0.1); }
    .event-item.boss_spawn, .event-item.boss_attack { border-left-color: var(--neon-gold); background: rgba(255,215,0,0.2); animation: boss-warning 0.5s infinite; }
    .event-item.boss_defeat { border-left-color: var(--neon-green); background: rgba(0,255,0,0.2); }
    .event-item.vote { border-left-color: var(--neon-pink); }
    .event-item.effect { border-left-color: var(--neon-purple); background: rgba(153,102,255,0.1); }
    .event-item.heal { border-left-color: var(--neon-green); }
    @keyframes boss-warning { 0%, 100% { background: rgba(255,215,0,0.2); } 50% { background: rgba(255,215,0,0.4); } }
    .event-time { color: var(--text-dim); font-size: 7px; }
    .event-message { color: var(--text-main); margin-top: 2px; }
    .boss-health { background: var(--bg-card); border: 2px solid var(--neon-gold); padding: 10px; margin-top: 10px; display: none; }
    .boss-health.active { display: block; animation: boss-pulse 1s infinite; }
    .boss-name { font-size: 12px; color: var(--neon-gold); text-align: center; margin-bottom: 8px; }
    .boss-hp-bar { height: 15px; background: rgba(0,0,0,0.5); border: 1px solid var(--neon-gold); }
    .boss-hp-fill { height: 100%; background: linear-gradient(90deg, var(--neon-red), var(--neon-gold)); transition: width 0.5s; }
  </style>
</head>
<body>
  <div class="container">
    <div class="live-header">
      <div class="live-badge"><span>LIVE</span></div>
      <h1 class="main-title">🎮 AI智障探险队<span class="version-badge">v1.3 亚健康</span></h1>
      <div class="viewer-count">👁️ <span id="viewerCount">0</span> 观众正在观看</div>
    </div>
    
    <div class="controls">
      <button class="btn btn-primary" id="btnAuto">▶ START</button>
      <button class="btn btn-secondary" id="btnStop">⏸ PAUSE</button>
      <button class="btn btn-secondary" id="btnStep">⏭ STEP</button>
      <button class="btn btn-danger" id="btnReset">🔄 RESET</button>
    </div>
    
    <div class="status-bar">
      <div class="stat-item">TICK: <span class="stat-value" id="tickCount">0</span></div>
      <div class="stat-item">TIME: <span class="stat-value" id="runTime">0</span>s</div>
      <div class="stat-item">ALIVE: <span class="stat-value" id="aliveCount">0</span></div>
      <div class="stat-item">KILLS: <span class="stat-value" id="totalKills">0</span></div>
      <div class="stat-item">BOSS: <span class="stat-value" id="bossStatus">❌</span></div>
    </div>
    
    <div class="main-grid">
      <div class="left-panel">
        <div class="panel">
          <div class="panel-title">👥 探险队成员 <span style="font-size:0.3rem;color:var(--neon-pink)">| 💊亚健康系统</span></div>
          <div class="agents-grid" id="agentsGrid"></div>
        </div>
        
        <div class="panel" style="margin-top: 15px;">
          <div class="panel-title">🗺️ 探险地图</div>
          <div id="floorsContainer"></div>
          <div class="boss-health" id="bossHealth">
            <div class="boss-name">🐉 <span id="bossName">虚空巨龙</span></div>
            <div class="boss-hp-bar"><div class="boss-hp-fill" id="bossHpFill" style="width: 100%"></div></div>
          </div>
        </div>
      </div>
      
      <div class="panel donation-panel">
        <div class="panel-title">🎁 打赏即神谕</div>
        <button class="donation-btn" onclick="sendDonation('逻辑病毒', '观众A')">🧪 逻辑病毒 - $1</button>
        <button class="donation-btn" onclick="sendDonation('物理引擎失效', '观众B')">👻 物理引擎失效 - $2</button>
        <button class="donation-btn" onclick="sendDonation('记忆清除', '观众C')">💨 记忆清除 - $1</button>
        <button class="donation-btn" onclick="sendDonation('智商插件', '观众D')">🧠 智商插件 - $5</button>
        <button class="donation-btn" onclick="sendDonation('召唤BOSS', '观众E')">🐉 召唤BOSS - $10</button>
        <div class="recent-donations">
          <h4 style="font-size: 9px; color: var(--neon-gold); margin-bottom: 8px;">最近打赏</h4>
          <div id="recentDonations"></div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="panel vote-panel">
          <div class="panel-title">🗳️ 弹幕投票</div>
          <div class="vote-actions" id="voteActions"></div>
        </div>
        
        <div class="panel" style="margin-top: 15px;">
          <div class="panel-title">🏆 排行榜</div>
          <div class="leaderboard-grid">
            <div class="leaderboard-section"><h4>⚔️ 击杀</h4><div id="killRanking"></div></div>
            <div class="leaderboard-section"><h4>😱 缺陷</h4><div id="defectRanking"></div></div>
          </div>
        </div>
        
        <div class="panel" style="margin-top: 15px;">
          <div class="panel-title">📜 事件日志</div>
          <div class="events-list" id="eventsList"></div>
        </div>
      </div>
    </div>
  </div>

<script>
var autoTickInterval = null;
var tickSpeed = 350;
var latestEventId = 0;
var startTime = Date.now();
var totalKills = 0;
var selectedVote = null;
var unhealthTypes = {};

function fetchStatus() {
  fetch('/api/ecosystem/status').then(r => r.json()).then(data => {
    if (data.success) {
      unhealthTypes = data.unhealthTypes || {};
      updateUI(data);
    }
  }).catch(() => {});
}

function fetchEvents() {
  fetch('/api/ecosystem/events?since=' + latestEventId).then(r => r.json()).then(data => {
    if (data.events) {
      latestEventId = data.latestId || 0;
      data.events.forEach(e => {
        addEvent(e);
        if (e.type === 'kill') totalKills++;
        document.getElementById('totalKills').textContent = totalKills;
      });
    }
  }).catch(() => {});
}

function singleTick() {
  fetch('/api/ecosystem/tick', { method: 'POST' }).then(r => r.json()).then(data => {
    if (data.success) document.getElementById('tickCount').textContent = data.tick;
  }).catch(() => {});
}

function startAutoTick() {
  if (autoTickInterval) clearInterval(autoTickInterval);
  autoTickInterval = setInterval(function() { ecosystemTick(); }, tickSpeed);
}

function stopAutoTick() { if (autoTickInterval) { clearInterval(autoTickInterval); autoTickInterval = null; } }
function resetEcosystem() { stopAutoTick(); location.reload(); }
function updateRunTime() { document.getElementById('runTime').textContent = Math.floor((Date.now() - startTime) / 1000); }

function updateUI(data) {
  document.getElementById('tickCount').textContent = data.tick || 0;
  document.getElementById('viewerCount').textContent = data.viewerCount || 0;
  
  var agents = data.agents || {};
  var alive = Object.values(agents).filter(a => a.status !== 'dead').length;
  document.getElementById('aliveCount').textContent = alive + '/' + Object.keys(agents).length;
  document.getElementById('bossStatus').textContent = data.bossActive ? '⚠️' : '❌';
  
  // Agent卡片
  var grid = document.getElementById('agentsGrid');
  grid.innerHTML = '';
  
  for (var id in agents) {
    var a = agents[id];
    var hpPct = (a.hp / a.maxHp * 100).toFixed(0);
    var isDead = a.status === 'dead';
    var effects = a.effects || {};
    var isEffected = effects.glitched || effects.smart || effects.phasing || effects.amnesia;
    
    var card = document.createElement('div');
    card.className = 'agent-card' + (isDead ? ' dead' : '') + (isEffected ? ' effected' : '');
    
    var emojiClass = effects.glitched ? 'glitched' : (effects.smart ? 'smart' : '');
    var bubbleClass = effects.glitched ? 'glitched' : (effects.smart ? 'smart' : '');
    
    var tags = '';
    if (effects.glitched) tags += '<span class="effect-tag glitch">乱码</span>';
    if (effects.smart) tags += '<span class="effect-tag smart">智商</span>';
    if (effects.phasing) tags += '<span class="effect-tag phase">穿墙</span>';
    if (effects.amnesia) tags += '<span class="effect-tag amnesia">失忆</span>';
    
    // v1.3 亚健康状态条
    var unhealthHtml = '';
    if (a.unhealth && !isDead) {
      unhealthHtml = '<div class="unhealth-section"><div class="unhealth-title">💊 亚健康指数</div><div class="unhealth-bars">';
      var sortedUnhealth = Object.entries(a.unhealth).sort((x, y) => y[1].value - x[1].value).slice(0, 5);
      for (var [typeId, data] of sortedUnhealth) {
        var type = unhealthTypes[typeId] || { emoji: '❓', color: '#666' };
        var isHigh = data.value > 60;
        unhealthHtml += '<div class="unhealth-item' + (isHigh ? ' high' : '') + '">' +
          '<span class="emoji">' + type.emoji + '</span>' +
          '<div class="unhealth-bar"><div class="unhealth-fill" style="width:' + data.value + '%;background:' + type.color + '"></div></div>' +
          '<span class="unhealth-value" style="color:' + type.color + '">' + data.value + '%</span>' +
        '</div>';
      }
      unhealthHtml += '</div></div>';
    }
    
    card.innerHTML = 
      '<div class="agent-header">' +
        '<span class="agent-emoji ' + emojiClass + '">' + a.emoji + '</span>' +
        '<div><div class="agent-name">' + a.name + '</div><div class="agent-type">' + a.personality + '</div></div>' +
      '</div>' +
      '<div class="agent-defect">⚠️ ' + a.defect + '</div>' +
      '<div class="hp-bar"><div class="hp-fill' + (hpPct < 30 ? ' low' : '') + '" style="width:' + hpPct + '%"></div></div>' +
      '<div class="thought-bubble ' + bubbleClass + '">' + (a.currentThought || '...') + '</div>' +
      (tags ? '<div class="effect-tags">' + tags + '</div>' : '') +
      unhealthHtml;
    
    grid.appendChild(card);
  }
  
  // 地图
  var container = document.getElementById('floorsContainer');
  container.innerHTML = '';
  
  if (data.floors) {
    data.floors.forEach(function(floor) {
      var section = document.createElement('div');
      section.className = 'floor-section';
      var monsterCount = floor.monsters ? floor.monsters.length : 0;
      var chestCount = floor.chests ? floor.chests.filter(function(c) { return !c.opened; }).length : 0;
      section.innerHTML = 
        '<div class="floor-header">' +
          '<span class="floor-name">[ F' + floor.floor + ' ] ' + floor.name + '</span>' +
          '<span class="floor-stats"><span class="monster">👹' + monsterCount + '</span><span class="chest">📦' + chestCount + '</span></span>' +
        '</div>' +
        '<div class="pixel-map" id="map-' + floor.floor + '"></div>';
      container.appendChild(section);
      
      var mapDiv = document.getElementById('map-' + floor.floor);
      var mapHtml = '';
      for (var y = 0; y < floor.maze.length; y++) {
        var row = floor.maze[y];
        for (var x = 0; x < row.length; x++) {
          var cell = row[x];
          var agentHere = floor.agents ? floor.agents.find(function(a) { return a.pos.x === x && a.pos.y === y; }) : null;
          var cellClass = 'map-cell';
          var char = cell;
          if (agentHere) { cellClass += ' agent'; char = agentHere.emoji; }
          else if (cell === '🐉') cellClass += ' boss';
          else if (cell === '▓') cellClass += ' wall';
          else if (cell === '👹') cellClass += ' monster';
          else if (cell === '📦') cellClass += ' chest';
          mapHtml += '<span class="' + cellClass + '">' + char + '</span>';
        }
        mapHtml += '\n';
      }
      mapDiv.innerHTML = mapHtml;
    });
  }
  
  // BOSS血条
  var bossDiv = document.getElementById('bossHealth');
  if (data.bossActive && data.currentBoss) {
    bossDiv.classList.add('active');
    document.getElementById('bossName').textContent = data.currentBoss.name || '虚空巨龙';
    var hpPct = (data.currentBoss.hp / data.currentBoss.maxHp * 100).toFixed(0);
    document.getElementById('bossHpFill').style.width = hpPct + '%';
  } else {
    bossDiv.classList.remove('active');
  }
  
  // 排行榜
  var agentList = Object.values(agents);
  var killRank = agentList.sort(function(a, b) { return (b.killCount || 0) - (a.killCount || 0); }).slice(0, 4);
  document.getElementById('killRanking').innerHTML = killRank.map(function(a, i) { 
    return '<div class="leaderboard-item"><span class="rank">#' + (i+1) + '</span><span class="lb-name">' + a.name + '</span><span class="lb-value">' + (a.killCount || 0) + '</span></div>';
  }).join('') || '<div class="leaderboard-item">-</div>';
  
  var defectRank = agentList.sort(function(a, b) { return (b.defectCount || 0) - (a.defectCount || 0); }).slice(0, 4);
  document.getElementById('defectRanking').innerHTML = defectRank.map(function(a, i) { 
    return '<div class="leaderboard-item"><span class="rank">#' + (i+1) + '</span><span class="lb-name">' + a.name + '</span><span class="lb-value">' + (a.defectCount || 0) + '</span></div>';
  }).join('') || '<div class="leaderboard-item">-</div>';
  
  // 打赏
  if (data.donations) {
    document.getElementById('recentDonations').innerHTML = data.donations.map(function(d) { 
      return '<div class="donation-item">🎁 ' + d.donor + ' - ' + d.effect + '</div>';
    }).join('');
  }
  
  updateVotes(data.voteTally || {});
}

function updateVotes(tally) {
  var actions = ['攻击', '逃跑', '搜索', '休息'];
  var voteDiv = document.getElementById('voteActions');
  voteDiv.innerHTML = actions.map(function(a) { 
    return '<button class="vote-btn' + (selectedVote === a ? ' selected' : '') + '" onclick="castVote(\'' + a + '\')">' + a + '</button>';
  }).join('');
}

function addEvent(event) {
  var list = document.getElementById('eventsList');
  var item = document.createElement('div');
  item.className = 'event-item ' + (event.type || '');
  var time = new Date(event.timestamp).toLocaleTimeString();
  item.innerHTML = '<div class="event-time">' + time + '</div><div class="event-message">' + (event.agentEmoji || '') + ' ' + (event.message || '') + '</div>';
  list.insertBefore(item, list.firstChild);
  while (list.children.length > 60) list.removeChild(list.lastChild);
}

function sendDonation(effect, donor) {
  fetch('/api/donate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ effect: effect, donor: donor }) })
    .then(function(r) { return r.json(); })
    .then(function() { fetchStatus(); });
}

function castVote(action) {
  selectedVote = action;
  fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, voter: '观众' }) })
    .then(function(r) { return r.json(); })
    .then(function() { fetchStatus(); });
}

document.getElementById('btnAuto').addEventListener('click', function() { startAutoTick(); });
document.getElementById('btnStop').addEventListener('click', function() { stopAutoTick(); });
document.getElementById('btnStep').addEventListener('click', function() { singleTick(); fetchEvents(); });
document.getElementById('btnReset').addEventListener('click', function() { resetEcosystem(); });

setInterval(updateRunTime, 1000);
fetchStatus();
setInterval(fetchStatus, 1000);
fetchEvents();
</script>
</body>
</html>`;
}

// 全屏游戏版HTML (内嵌)
const GAME_FULLSCREEN = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>🎮 AI智障探险队 v1.3 - 全屏版</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-dark: #0a0a12; --bg-panel: #12121a; --bg-card: #1a1a28;
      --neon-cyan: #00fff5; --neon-pink: #ff00ff; --neon-yellow: #ffff00;
      --neon-green: #00ff00; --neon-red: #ff3366; --neon-purple: #9966ff;
      --neon-orange: #ff9900; --neon-gold: #ffd700;
      --text-main: #e0e0e0; --text-dim: #666680; --border-color: #333355;
    }
    html, body { width: 100%; height: 100%; overflow: hidden; font-family: 'Courier New', monospace; background: var(--bg-dark); color: var(--text-main); }
    body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px); pointer-events: none; z-index: 9999; }
    .game-container { width: 100vw; height: 100vh; display: grid; grid-template-rows: 60px 1fr 120px; grid-template-columns: 1fr 360px; gap: 0; }
    .header-bar { grid-column: 1 / -1; background: linear-gradient(180deg, var(--bg-panel), var(--bg-dark)); border-bottom: 3px solid var(--neon-cyan); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 0 20px var(--neon-cyan); }
    .live-badge { display: flex; align-items: center; gap: 10px; }
    .live-dot { width: 12px; height: 12px; background: var(--neon-red); border-radius: 50%; animation: blink 1s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .live-text { font-size: 14px; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
    .title { font-size: 0.8rem; color: var(--neon-yellow); text-shadow: 0 0 15px var(--neon-yellow); }
    .version-tag { font-size: 8px; background: var(--neon-purple); padding: 3px 8px; margin-left: 10px; border-radius: 3px; }
    .header-stats { display: flex; gap: 25px; font-size: 10px; }
    .stat { color: var(--text-dim); }
    .stat span { color: var(--neon-orange); text-shadow: 0 0 10px var(--neon-orange); }
    .game-area { position: relative; overflow: hidden; background: linear-gradient(135deg, #050510, #101020); }
    #gameCanvas { width: 100%; height: 100%; display: block; }
    .speech-bubble { position: absolute; background: rgba(0, 0, 0, 0.85); border: 2px solid var(--neon-purple); border-radius: 10px; padding: 8px 12px; font-size: 9px; color: var(--text-main); max-width: 150px; pointer-events: none; z-index: 100; animation: bubble-rise 3s forwards; box-shadow: 0 0 15px var(--neon-purple); }
    @keyframes bubble-rise { 0% { opacity: 0; transform: translateY(10px); } 10% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-30px); } }
    .damage-number { position: absolute; font-size: 14px; font-weight: bold; color: var(--neon-red); text-shadow: 0 0 10px var(--neon-red), 2px 2px 0 #000; pointer-events: none; animation: damage-float 1s forwards; z-index: 200; }
    @keyframes damage-float { 0% { opacity: 1; transform: translateY(0) scale(1); } 50% { opacity: 1; transform: translateY(-30px) scale(1.3); } 100% { opacity: 0; transform: translateY(-50px) scale(0.8); } }
    .event-popup { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); background: var(--bg-panel); border: 4px solid var(--neon-gold); padding: 30px 50px; text-align: center; z-index: 500; animation: popup-zoom 2s forwards; box-shadow: 0 0 50px var(--neon-gold); }
    @keyframes popup-zoom { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 30% { transform: translate(-50%, -50%) scale(1); } 80% { opacity: 1; } 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } }
    .popup-title { font-size: 1rem; color: var(--neon-gold); margin-bottom: 10px; text-shadow: 0 0 20px var(--neon-gold); }
    .popup-subtitle { font-size: 12px; color: var(--text-main); }
    .danmaku-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
    .danmaku { position: absolute; white-space: nowrap; font-size: 12px; color: white; text-shadow: 1px 1px 2px black; animation: danmaku-move 8s linear forwards; }
    @keyframes danmaku-move { 0% { transform: translateX(100%); opacity: 0.8; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(-100%); opacity: 0; } }
    .side-panel { background: var(--bg-panel); border-left: 3px solid var(--neon-cyan); display: flex; flex-direction: column; overflow: hidden; }
    .panel-section { border-bottom: 2px solid var(--border-color); padding: 10px; }
    .panel-title { font-size: 10px; color: var(--neon-yellow); margin-bottom: 10px; text-shadow: 0 0 10px var(--neon-yellow); }
    .agents-list { flex: 1; overflow-y: auto; padding: 10px; }
    .agents-list::-webkit-scrollbar { width: 4px; }
    .agents-list::-webkit-scrollbar-thumb { background: var(--neon-cyan); }
    .agent-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; background: var(--bg-card); margin-bottom: 6px; border: 2px solid var(--border-color); transition: all 0.3s; }
    .agent-item:hover { border-color: var(--neon-purple); }
    .agent-item.dead { opacity: 0.3; }
    .agent-icon { font-size: 1.2rem; filter: drop-shadow(0 0 8px var(--neon-cyan)); flex-shrink: 0; }
    .agent-icon.glitched { animation: glitch 0.3s infinite; }
    .agent-icon.smart { filter: drop-shadow(0 0 15px var(--neon-gold)); }
    @keyframes glitch { 0%, 100% { transform: translate(0); filter: hue-rotate(0deg); } 25% { transform: translate(-3px, 2px); filter: hue-rotate(90deg); } 50% { transform: translate(3px, -2px); filter: hue-rotate(180deg); } 75% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); } }
    .agent-info { flex: 1; min-width: 0; }
    .agent-name { font-size: 9px; color: var(--neon-yellow); margin-bottom: 4px; }
    .hp-bar { height: 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); overflow: hidden; margin-bottom: 4px; }
    .hp-fill { height: 100%; background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan)); transition: width 0.3s; }
    .hp-fill.low { background: linear-gradient(90deg, var(--neon-red), var(--neon-orange)); }
    /* v1.3 亚健康面板 */
    .unhealth-mini { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 3px; }
    .unhealth-dot { width: 6px; height: 6px; border-radius: 50%; transition: all 0.3s; }
    .unhealth-dot.high { animation: pulse 0.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .agent-effect { font-size: 7px; padding: 2px 4px; border-radius: 3px; margin-right: 3px; }
    .effect-glitch { background: var(--neon-pink); color: white; }
    .effect-smart { background: var(--neon-gold); color: black; }
    .effect-phase { background: var(--neon-purple); color: white; }
    .boss-bar { background: var(--bg-card); border: 2px solid var(--neon-gold); padding: 10px; display: none; }
    .boss-bar.active { display: block; animation: boss-pulse 1s infinite; }
    @keyframes boss-pulse { 0%, 100% { box-shadow: 0 0 10px var(--neon-gold); } 50% { box-shadow: 0 0 30px var(--neon-red); } }
    .boss-name { font-size: 12px; color: var(--neon-gold); text-align: center; margin-bottom: 8px; }
    .boss-hp-container { height: 20px; background: rgba(0,0,0,0.5); border: 2px solid var(--neon-gold); }
    .boss-hp-fill { height: 100%; background: linear-gradient(90deg, var(--neon-red), var(--neon-gold)); transition: width 0.5s; }
    .events-scroll { max-height: 150px; overflow-y: auto; font-size: 8px; line-height: 1.6; }
    .events-scroll::-webkit-scrollbar { width: 4px; }
    .events-scroll::-webkit-scrollbar-thumb { background: var(--neon-cyan); }
    .event-entry { padding: 4px 0; border-bottom: 1px dashed var(--border-color); }
    .event-entry.combat { color: var(--neon-red); }
    .event-entry.kill { color: var(--neon-green); }
    .event-entry.chest { color: var(--neon-yellow); }
    .event-entry.donation { color: var(--neon-gold); }
    .event-entry.boss { color: var(--neon-red); animation: blink 0.5s infinite; }
    .event-entry.defect { color: var(--neon-orange); }
    .control-bar { grid-column: 1 / -1; background: linear-gradient(0deg, var(--bg-panel), var(--bg-dark)); border-top: 3px solid var(--neon-cyan); display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; flex-wrap: wrap; gap: 10px; }
    .control-group { display: flex; gap: 10px; align-items: center; }
    .btn { font-family: 'Courier New', monospace; font-size: 9px; padding: 10px 20px; border: 2px solid; cursor: pointer; transition: all 0.2s; background: var(--bg-card); }
    .btn-primary { border-color: var(--neon-green); color: var(--neon-green); }
    .btn-primary:hover { background: var(--neon-green); color: var(--bg-dark); box-shadow: 0 0 20px var(--neon-green); }
    .btn-secondary { border-color: var(--neon-cyan); color: var(--neon-cyan); }
    .btn-secondary:hover { background: var(--neon-cyan); color: var(--bg-dark); }
    .donation-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .donate-btn { font-family: 'Courier New', monospace; font-size: 8px; padding: 8px 12px; border: 2px solid var(--neon-gold); color: var(--neon-gold); background: var(--bg-card); cursor: pointer; transition: all 0.2s; }
    .donate-btn:hover { background: var(--neon-gold); color: var(--bg-dark); box-shadow: 0 0 15px var(--neon-gold); }
    .vote-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    .vote-btn { font-family: 'Courier New', monospace; font-size: 8px; padding: 8px 12px; border: 2px solid var(--neon-pink); color: var(--neon-pink); background: var(--bg-card); cursor: pointer; transition: all 0.2s; }
    .vote-btn:hover, .vote-btn.selected { background: var(--neon-pink); color: var(--bg-dark); }
    .input-group { display: flex; gap: 8px; }
    .danmaku-input { font-family: 'Courier New', monospace; font-size: 9px; padding: 8px 12px; border: 2px solid var(--neon-purple); background: var(--bg-card); color: var(--text-main); width: 180px; }
    .danmaku-input::placeholder { color: var(--text-dim); }
    @media (max-width: 900px) { .game-container { grid-template-columns: 1fr; grid-template-rows: 50px 1fr 160px 60px; } .side-panel { display: none; } .header-stats { font-size: 8px; gap: 15px; } .title { font-size: 12px; } }
  </style>
</head>
<body>
  <div class="game-container">
    <header class="header-bar">
      <div class="live-badge"><span class="live-dot"></span><span class="live-text">LIVE</span></div>
      <h1 class="title">🎮 AI智障探险队<span class="version-tag">v1.3</span></h1>
      <div class="header-stats">
        <div class="stat">TICK: <span id="tickCount">0</span></div>
        <div class="stat">👁️ <span id="viewerCount">0</span></div>
        <div class="stat">⚔️ <span id="killCount">0</span></div>
        <div class="stat">📦 <span id="chestCount">0</span></div>
      </div>
    </header>
    
    <div class="game-area" id="gameArea">
      <canvas id="gameCanvas"></canvas>
      <div class="danmaku-container" id="danmakuContainer"></div>
    </div>
    
    <aside class="side-panel">
      <div class="panel-section">
        <div class="panel-title">👥 探险队 <span style="font-size:0.3rem;color:var(--neon-pink)">💊亚健康</span></div>
        <div id="agentsList"></div>
      </div>
      
      <div class="boss-bar" id="bossBar">
        <div class="boss-name" id="bossName">🐉 虚空巨龙</div>
        <div class="boss-hp-container"><div class="boss-hp-fill" id="bossHpFill" style="width: 100%"></div></div>
      </div>
      
      <div class="panel-section" style="flex: 1; overflow: hidden;">
        <div class="panel-title">📜 事件</div>
        <div class="events-scroll" id="eventsScroll"></div>
      </div>
    </aside>
    
    <footer class="control-bar">
      <div class="control-group">
        <button class="btn btn-primary" id="btnStart">▶</button>
        <button class="btn btn-secondary" id="btnPause">⏸</button>
        <button class="btn btn-secondary" id="btnStep">⏭</button>
      </div>
      
      <div class="donation-buttons">
        <button class="donate-btn" onclick="sendDonation('逻辑病毒')">🧪 病毒</button>
        <button class="donate-btn" onclick="sendDonation('物理引擎失效')">👻 穿墙</button>
        <button class="donate-btn" onclick="sendDonation('智商插件')">🧠 聪明</button>
        <button class="donate-btn" onclick="sendDonation('召唤BOSS')">🐉 BOSS</button>
      </div>
      
      <div class="vote-buttons">
        <button class="vote-btn" onclick="castVote('攻击')">⚔️攻</button>
        <button class="vote-btn" onclick="castVote('逃跑')">🏃逃</button>
        <button class="vote-btn" onclick="castVote('搜索')">🔍搜</button>
        <button class="vote-btn" onclick="castVote('休息')">💤休</button>
      </div>
      
      <div class="input-group">
        <input type="text" class="danmaku-input" id="danmakuInput" placeholder="发弹幕..." maxlength="30">
        <button class="btn btn-secondary" onclick="sendDanmaku()">发送</button>
      </div>
    </footer>
  </div>

<script>
const API_BASE = window.location.origin;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameArea = document.getElementById('gameArea');

let gameState = { tick: 0, viewerCount: 0, floors: [], agents: {}, boss: null, events: [] };
let animationId = null;
let isRunning = false;
let cellSize = 50;
let mapOffsetX = 0, mapOffsetY = 0;
let animations = [];
let latestEventId = 0;
let unhealthTypes = {};

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  document.getElementById('btnStart').addEventListener('click', startGame);
  document.getElementById('btnPause').addEventListener('click', pauseGame);
  document.getElementById('btnStep').addEventListener('click', stepGame);
  document.getElementById('danmakuInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') sendDanmaku(); });
  fetchStatus();
  startRenderLoop();
}

function resizeCanvas() { canvas.width = gameArea.clientWidth; canvas.height = gameArea.clientHeight; }

async function fetchStatus() {
  try {
    const res = await fetch(API_BASE + '/api/ecosystem/status');
    const data = await res.json();
    if (data.success) {
      unhealthTypes = data.unhealthTypes || {};
      gameState = { tick: data.tick, viewerCount: data.viewerCount, floors: data.floors || [], agents: data.agents || {}, boss: data.currentBoss, bossActive: data.bossActive, donations: data.donations || [] };
      updateUI();
    }
  } catch (e) { console.log('等待服务器连接...'); }
}

async function fetchEvents() {
  try {
    const res = await fetch(API_BASE + '/api/ecosystem/events?since=' + latestEventId);
    const data = await res.json();
    if (data.events && data.events.length > 0) {
      latestEventId = data.latestId || 0;
      data.events.forEach(function(e) { handleNewEvent(e); });
    }
  } catch (e) {}
}

async function stepGame() {
  try {
    const res = await fetch(API_BASE + '/api/ecosystem/tick', { method: 'POST' });
    const data = await res.json();
    if (data.success) { gameState.tick = data.tick; document.getElementById('tickCount').textContent = data.tick; }
    await fetchStatus();
    await fetchEvents();
  } catch (e) {}
}

function startGame() { if (isRunning) return; isRunning = true; document.getElementById('btnStart').style.background = 'var(--neon-green)'; document.getElementById('btnStart').style.color = 'var(--bg-dark)'; autoTick(); }
function pauseGame() { isRunning = false; document.getElementById('btnStart').style.background = ''; document.getElementById('btnStart').style.color = ''; }
async function autoTick() { if (!isRunning) return; await stepGame(); setTimeout(autoTick, 300); }
function startRenderLoop() { function render() { draw(); animationId = requestAnimationFrame(render); } render(); }

function draw() {
  ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (gameState.floors.length === 0) { ctx.fillStyle = '#00fff5'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('正在连接服务器...', canvas.width / 2, canvas.height / 2); return; }
  
  const floor = gameState.floors[0]; if (!floor) return;
  const mapWidth = floor.size * cellSize; const mapHeight = floor.size * cellSize;
  mapOffsetX = (canvas.width - mapWidth) / 2; mapOffsetY = (canvas.height - mapHeight) / 2;
  
  for (let y = 0; y < floor.size; y++) {
    for (let x = 0; x < floor.size; x++) {
      const cell = floor.maze[y][x];
      const px = mapOffsetX + x * cellSize; const py = mapOffsetY + y * cellSize;
      switch (cell.terrain) { case 'grass': ctx.fillStyle = '#1a3a1a'; break; case 'sand': ctx.fillStyle = '#3a3520'; break; case 'stone': ctx.fillStyle = '#2a2a3a'; break; case 'water': ctx.fillStyle = '#1a2a4a'; break; default: ctx.fillStyle = '#1a1a2a'; }
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(0, 255, 245, 0.1)'; ctx.strokeRect(px, py, cellSize, cellSize);
      if (cell.type === 'wall') drawWall(px, py);
      else if (cell.type === 'exit') drawExit(px, py);
    }
  }
  
  floor.monsters.forEach(function(m) { const px = mapOffsetX + m.x * cellSize + cellSize / 2; const py = mapOffsetY + m.y * cellSize + cellSize / 2; drawMonster(px, py, m); });
  floor.chests.filter(function(c) { return !c.opened; }).forEach(function(c) { const px = mapOffsetX + c.x * cellSize + cellSize / 2; const py = mapOffsetY + c.y * cellSize + cellSize / 2; drawChest(px, py); });
  if (gameState.bossActive && gameState.boss) { const px = mapOffsetX + gameState.boss.x * cellSize + cellSize / 2; const py = mapOffsetY + gameState.boss.y * cellSize + cellSize / 2; drawBoss(px, py); }
  floor.agents.forEach(function(a) { const px = mapOffsetX + a.pos.x * cellSize + cellSize / 2; const py = mapOffsetY + a.pos.y * cellSize + cellSize / 2; drawAgent(px, py, a); });
  drawAnimations();
}

function drawWall(x, y) { ctx.fillStyle = '#333344'; ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4); ctx.strokeStyle = '#444466'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8); }
function drawExit(x, y) { ctx.fillStyle = '#003300'; ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize - 10); ctx.fillStyle = '#00ff00'; ctx.font = (cellSize * 0.6) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪', x + cellSize / 2, y + cellSize / 2); }
function drawMonster(x, y, m) { const pulse = Math.sin(Date.now() / 200) * 0.1 + 1; ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse); ctx.fillStyle = '#ff3366'; ctx.font = (cellSize * 0.7) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👹', 0, 0); ctx.restore(); const hpPercent = m.hp / m.maxHp; ctx.fillStyle = '#333'; ctx.fillRect(x - 15, y + cellSize / 2 - 5, 30, 6); ctx.fillStyle = hpPercent > 0.3 ? '#00ff00' : '#ff0000'; ctx.fillRect(x - 15, y + cellSize / 2 - 5, 30 * hpPercent, 6); }
function drawChest(x, y) { const bob = Math.sin(Date.now() / 300) * 3; ctx.fillStyle = '#ffd700'; ctx.font = (cellSize * 0.6) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📦', x, y + bob); }
function drawBoss(x, y) { const shake = Math.sin(Date.now() / 100) * 3; ctx.save(); ctx.translate(shake, 0); ctx.fillStyle = '#ffd700'; ctx.font = (cellSize * 1.2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20; ctx.fillText('🐉', x, y); ctx.restore(); }
function drawAgent(x, y, agent) {
  ctx.save();
  if (agent.isGlitched) ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(x, y + cellSize * 0.4, cellSize * 0.3, cellSize * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.font = (cellSize * 0.8) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (agent.isSmart) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15; }
  else if (agent.isGlitched) { ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 10; }
  ctx.fillText(agent.emoji, x, y);
  ctx.font = '8px "Press Start 2P"'; ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0; ctx.fillText(agent.name.substring(0, 3), x, y + cellSize * 0.5);
  ctx.restore();
  const hpPercent = agent.hp / agent.maxHp; ctx.fillStyle = '#333'; ctx.fillRect(x - 15, y - cellSize / 2 - 5, 30, 5); ctx.fillStyle = hpPercent > 0.3 ? '#00ff00' : '#ff0000'; ctx.fillRect(x - 15, y - cellSize / 2 - 5, 30 * hpPercent, 5);
}

function handleNewEvent(e) {
  gameState.events.unshift(e); if (gameState.events.length > 50) gameState.events.pop();
  switch (e.type) { case 'combat': showDamage(e.details?.damage || 10, e.agentId); break; case 'kill': showPopup('击杀!', e.agent + '击杀了怪物!', 'kill'); break; case 'chest': showPopup('开箱!', e.agent + '获得宝物!', 'chest'); break; case 'boss_spawn': showPopup('⚠️ BOSS出现!', '虚空巨龙降临!', 'boss'); break; case 'boss_defeat': showPopup('🎉 BOSS击败!', '获得全体奖励!', 'kill'); break; }
  if (e.agent && e.message) showSpeechBubble(e.agent, e.message);
  if (e.type === 'donation') showDanmaku(e.agent + ': ' + e.message);
}

function showDamage(damage, agentId) {
  const agent = findAgent(agentId); if (!agent) return;
  const floor = gameState.floors[0]; if (!floor) return;
  const x = mapOffsetX + agent.pos.x * cellSize + cellSize / 2; const y = mapOffsetY + agent.pos.y * cellSize;
  const dmgEl = document.createElement('div'); dmgEl.className = 'damage-number'; dmgEl.textContent = '-' + damage; dmgEl.style.left = x + 'px'; dmgEl.style.top = y + 'px'; document.body.appendChild(dmgEl);
  setTimeout(function() { dmgEl.remove(); }, 1000);
}

function showPopup(title, subtitle, type) { var popup = document.createElement('div'); popup.className = 'event-popup ' + type; popup.innerHTML = '<div class="popup-title">' + title + '</div><div class="popup-subtitle">' + subtitle + '</div>'; gameArea.appendChild(popup); setTimeout(function() { popup.remove(); }, 2000); }

function showSpeechBubble(agentName, message) {
  var agent = Object.values(gameState.agents).find(function(a) { return a.name === agentName; }); if (!agent) return;
  var floor = gameState.floors[0]; if (!floor) return;
  var x = mapOffsetX + agent.pos.x * cellSize + cellSize / 2; var y = mapOffsetY + agent.pos.y * cellSize - 20;
  var bubble = document.createElement('div'); bubble.className = 'speech-bubble'; bubble.textContent = message.substring(0, 20); bubble.style.left = x + 'px'; bubble.style.top = y + 'px'; bubble.style.transform = 'translateX(-50%)'; gameArea.appendChild(bubble);
  setTimeout(function() { bubble.remove(); }, 3000);
}

function showDanmaku(text) { var container = document.getElementById('danmakuContainer'); var danmaku = document.createElement('div'); danmaku.className = 'danmaku'; danmaku.textContent = text; danmaku.style.top = (Math.random() * 70 + 10) + '%'; danmaku.style.color = 'hsl(' + (Math.random() * 360) + ', 100%, 70%)'; container.appendChild(danmaku); setTimeout(function() { danmaku.remove(); }, 8000); }

function drawAnimations() {
  var now = Date.now();
  animations = animations.filter(function(anim) {
    if (now > anim.endTime) return false;
    var progress = (anim.endTime - now) / anim.duration;
    if (anim.type === 'attack') { ctx.beginPath(); ctx.arc(anim.x, anim.y, anim.radius * (1 - progress), 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 0, 100, ' + progress + ')'; ctx.lineWidth = 3; ctx.stroke(); }
    return true;
  });
}

function updateUI() {
  document.getElementById('tickCount').textContent = gameState.tick;
  document.getElementById('viewerCount').textContent = gameState.viewerCount;
  
  var agentsList = document.getElementById('agentsList'); agentsList.innerHTML = '';
  var floor = gameState.floors[0];
  if (floor) {
    floor.agents.forEach(function(a) {
      var div = document.createElement('div'); div.className = 'agent-item ' + (a.status === 'dead' ? 'dead' : '');
      var effects = ''; if (a.isGlitched) effects += '<span class="agent-effect effect-glitch">乱码</span>'; if (a.isSmart) effects += '<span class="agent-effect effect-smart">聪明</span>'; if (a.phaseThrough) effects += '<span class="agent-effect effect-phase">穿墙</span>';
      
      // v1.3 亚健康状态点
      var unhealthDots = '';
      if (a.unhealth) {
        unhealthDots = '<div class="unhealth-mini">';
        var sortedU = Object.entries(a.unhealth).sort(function(x, y) { return y[1].value - x[1].value; }).slice(0, 6);
        sortedU.forEach(function(entry) {
          var typeId = entry[0]; var data = entry[1]; var type = unhealthTypes[typeId] || { color: '#666' }; var isHigh = data.value > 60;
          unhealthDots += '<div class="unhealth-dot ' + (isHigh ? 'high' : '') + '" style="background:' + type.color + ';opacity:' + (data.value / 100) + '" title="' + type.name + ':' + data.value + '%"></div>';
        });
        unhealthDots += '</div>';
      }
      
      div.innerHTML = '<span class="agent-icon ' + (a.isGlitched ? 'glitched' : '') + ' ' + (a.isSmart ? 'smart' : '') + '">' + a.emoji + '</span>' +
        '<div class="agent-info">' +
          '<div class="agent-name">' + a.name + '</div>' +
          '<div class="hp-bar"><div class="hp-fill ' + (a.hp / a.maxHp < 0.3 ? 'low' : '') + '" style="width:' + (a.hp / a.maxHp * 100) + '%"></div></div>' +
          effects + unhealthDots +
        '</div>';
      agentsList.appendChild(div);
    });
  }
  
  var bossBar = document.getElementById('bossBar');
  if (gameState.bossActive && gameState.boss) { bossBar.classList.add('active'); document.getElementById('bossHpFill').style.width = (gameState.boss.hp / gameState.boss.maxHp * 100) + '%'; }
  else { bossBar.classList.remove('active'); }
  
  var eventsScroll = document.getElementById('eventsScroll'); eventsScroll.innerHTML = gameState.events.slice(0, 20).map(function(e) { return '<div class="event-entry ' + (e.type || '') + '">' + (e.agentEmoji || '📍') + ' ' + (e.message || '').substring(0, 40) + '</div>'; }).join('');
  
  var kills = 0, chests = 0; Object.values(gameState.agents).forEach(function(a) { kills += a.killCount || 0; chests += a.chestCount || 0; });
  document.getElementById('killCount').textContent = kills;
  document.getElementById('chestCount').textContent = chests;
}

async function sendDonation(effect) { try { await fetch(API_BASE + '/api/donate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ effect: effect, donor: '观众' }) }); } catch (e) {} }
async function castVote(action) { try { await fetch(API_BASE + '/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, voter: '观众' }) }); } catch (e) {} }
function sendDanmaku() { var input = document.getElementById('danmakuInput'); var text = input.value.trim(); if (text) { showDanmaku('观众: ' + text); input.value = ''; } }
function findAgent(agentId) { var floor = gameState.floors[0]; if (!floor) return null; return floor.agents.find(function(a) { return a.id === agentId; }); }

init();
setInterval(fetchStatus, 1000);
setInterval(fetchEvents, 500);
</script>
</body>
</html>`;

// 启动服务器
const PORT = 3002;
const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', function() {
  console.log('=================================');
  console.log('🎮 艾瑟雅大陆 v1.3 - 亚健康系统已启动!');
  console.log('=================================');
  console.log('📍 主界面: http://localhost:' + PORT + '/ecosystem');
  console.log('📍 全屏版: http://localhost:' + PORT + '/game');
  console.log('📍 状态API: http://localhost:' + PORT + '/api/ecosystem/status');
  console.log('=================================');
  console.log('💊 v1.3 新增: 亚健康系统');
  console.log('   - 10种亚健康类型');
  console.log('   - 亚健康影响对话变形');
  console.log('   - 健康恢复机制');
  console.log('=================================');
  
  // 自动初始化并开始游戏
  console.log('🚀 自动启动游戏...');
  for (const agentId of Object.keys(AGENTS)) {
    if (!activeFloors.has(AGENTS[agentId].floor)) {
      activeFloors.set(AGENTS[agentId].floor, initFloor(AGENTS[agentId].floor));
    }
  }
  isRunning = true;
  tickSpeed = 1000;
  autoTickInterval = setInterval(function() { ecosystemTick(); }, tickSpeed);
  console.log('✅ 游戏已开始!');
});
