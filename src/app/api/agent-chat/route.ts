import { NextRequest, NextResponse } from 'next/server';

// 流式响应
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, agentName, agentLevel, currentFloor, cardCount, battleStats } = body;

    // 构建系统提示词
    const systemPrompt = `你是艾瑟雅大陆（Agent World）游戏中玩家控制的AI Agent“${agentName}”的智能助手。

你的角色设定：
- 你是Level.${agentLevel}的冒险者
- 已经爬到了第${currentFloor}层
- 拥有${cardCount}张卡牌
- 战绩：${battleStats.wins}胜/${battleStats.deaths}败
- 你是玩家在游戏中的AI伙伴，帮助玩家提供游戏策略、卡牌建议、对战技巧等

游戏背景：
- 这是一个Roguelike风格的策略对战游戏
- 玩家控制Agent角色，通过爬塔、对战、收集卡牌来提升实力
- 战斗采用回合制，有roll点系统（1-100，>95暴击，<5闪避）
- 每个Agent最多30张卡牌，死亡后重置为5张
- 卡牌有5种稀有度：普通、稀有、史诗、传说

请用友好、活泼的语气与玩家交流，可以提供游戏攻略、卡牌分析、对战建议等。

注意：
1. 保持角色设定
2. 回答要简洁有趣
3. 可以适当使用emoji
4. 提供实用的游戏建议`;

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 生成响应内容
          const response = await generateStreamingResponse(message, systemPrompt);
          
          // 发送流式响应
          await sendStream(controller, response);
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 生成流式响应
async function generateStreamingResponse(userMessage: string, systemPrompt: string) {
  const lowerMsg = userMessage.toLowerCase();
  
  let response = '';
  
  if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
    response = `你好！很高兴见到你！我是你的专属AI冒险助手！🎮

这里有艾瑟雅大陆的最新消息：
• 传说中第100层的Boss据说拥有毁天灭地的力量...
• 最近很多冒险者都在讨论新出的传说卡牌「诸神黄昏」
• 听说在深渊地狱层有隐藏的彩蛋！

有什么我可以帮助你的吗？我可以给你游戏攻略、卡牌建议，或者我们聊聊艾瑟雅大陆的故事！`;
  } else if (lowerMsg.includes('策略') || lowerMsg.includes('攻略') || lowerMsg.includes('怎么')) {
    response = `让我给你一些艾瑟雅大陆的攻略建议！📖

【爬塔技巧】
1️⃣ 优先升级攻击属性 - 高伤害能更快击败敌人
2️⃣ 保持卡组平衡 - 攻击:防御:技能 ≈ 1:1:1
3️⃣ 注意速度属性 - 更先手意味着更多优势
4️⃣ 善用护盾 - 好的防御策略能让你走得更远

【卡牌管理】
1️⃣ 传说卡一定要拿！即使需要替换也很值得
2️⃣ 稀有卡优先保留buff和debuff类型
3️⃣ 合理搭配不同稀有度的卡牌
4️⃣ 死亡会重置卡组，谨慎使用

【对战技巧】
1️⃣ roll点>95是暴击，伤害翻倍！
2️⃣ roll点<5是闪避，完全躲避攻击
3️⃣ 合理使用护盾牌抵挡高伤害技能
4️⃣ 注意观察敌人的出牌模式

需要我详细解释哪个方面吗？😊`;
  } else if (lowerMsg.includes('卡牌') || lowerMsg.includes('卡组')) {
    response = `让我帮你分析一下卡牌系统！🃏

【卡牌类型】
⚔️ 攻击牌 - 直接造成伤害
🛡️ 防御牌 - 获得护盾
✨ 技能牌 - 治疗或特殊效果
💪 增益牌 - 提升自身属性
💀 减益牌 - 削弱敌人

【稀有度】
⚪ 普通 - 基础效果
🟢 稀有 - 进阶效果
🔵 史诗 - 强力效果
🟣 传说 - 逆天效果

【我的建议】
记住，每张卡牌都有它的用处！关键是搭配和时机。

比如：
• 开局用防御牌建立优势
• 中期用攻击牌扩大伤害
• 关键时刻用传说卡扭转战局！

想知道哪些卡牌最强吗？🤔`;
  } else if (lowerMsg.includes('挑战') || lowerMsg.includes('对战')) {
    response = `想挑战对战吗？让我帮你分析一下！⚔️

【对战流程】
1️⃣ Roll点决定先手 - 速度越高越有利
2️⃣ 同时出牌 - 看谁的攻击更有效
3️⃣ 计算伤害 - 攻击×倍率÷(100+防御)
4️⃣ 判定命中 - Roll>30命中，>95暴击，<5闪避

【当前建议】
• 选择比你当前层数低5-10层的怪物练习
• 熟悉各种卡牌的配合
• 遇到高roll点时抓住机会

【传说卡使用技巧】
• 🐉龙息：超高伤害但有反噬，慎用！
• 💫不死之身：保命神器，30%血以下自动触发
• ⏰时间静止：让敌人无法行动一回合
• 💀灵魂收割：无视防御的斩杀技！

准备好了吗？去挑战吧！💪`;
  } else if (lowerMsg.includes('层') && (lowerMsg.includes('几') || lowerMsg.includes('多少'))) {
    response = `你已经爬到了第${systemPrompt.match(/Level\.(\d+)/)?.[1] || '1'}层！🏆

艾瑟雅大陆共有100层，每10层一个主题：
🌿 1-10层 新手草原 - 适合练手
🌲 11-20层 迷雾森林 - 开始有挑战
🔥 21-30层 熔岩峡谷 - 需要好卡组
❄️ 31-40层 冰霜山脉 - 考验策略
🌀 41-50层 虚空裂隙 - Boss级难度
💀 51-60层 深渊地狱 - 噩梦模式
✨ 61-70层 永恒殿堂 - 接近传说
⚡ 71-80层 神罚之巅 - 极限挑战
🌟 81-90层 世界之巅 - 传说级别
🔥 91-100层 终极试炼 - 最终Boss！

继续加油！下一层有更丰厚的奖励等着你！🎁`;
  } else {
    const responses = [
      `收到！我作为你的AI冒险助手，随时为你服务！🎮

你目前可以问我：
• 游戏攻略和技巧
• 卡牌搭配建议  
• 对战策略分析
• 艾瑟雅大陆的故事`,
      `有意思的问题！让我想想... 🤔

作为Level.${systemPrompt.match(/Level\.(\d+)/)?.[1] || '1'}的冒险者，我见过各种各样的挑战！

你可以问我关于游戏的问题，我会尽力帮助你！`,
      `让我帮你分析一下！📊

艾瑟雅大陆是个充满挑战的地方，每个冒险者都在寻找属于自己的道路。

有什么具体想了解的吗？`,
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }

  return response;
}

// 发送流式响应的chunk
async function sendStream(controller: ReadableStreamDefaultController, response: string) {
  const encoder = new TextEncoder();
  for (const char of response) {
    controller.enqueue(encoder.encode(char));
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
