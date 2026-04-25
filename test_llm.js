/**
 * LLM集成测试脚本
 */

const { callAgentLLM, generateAgentContext } = require('./llm_integration.js');

// 模拟世界状态
const mockWorldState = {
    5: ['空', '墙', '空', '空', '空', '敌', '空'],
    6: ['空', '墙', '空', '箱', '空', '空', '空'],
    7: ['空', '空', '空', '空', '空', '空', '空'],
};

// 模拟Agent状态
const mockAgent = {
    id: '幻觉大师',
    name: '幻觉大师',
    pos: { x: 4, y: 6 },
    hp: 80,
    maxHp: 100,
    sp: 70,
    maxSp: 80,
    unhealthLevel: 15,
    isGlitched: false,
    shortTermMemory: []
};

// 测试LLM调用
async function testLLM() {
    console.log('🚀 开始LLM集成测试\n');
    console.log('角色:', mockAgent.name);
    console.log('HP:', mockAgent.hp + '/' + mockAgent.maxHp);
    console.log('位置:', `(${mockAgent.pos.x}, ${mockAgent.pos.y})`);
    console.log('');

    // 生成上下文
    const context = generateAgentContext(mockAgent, mockWorldState);
    console.log('生成的上下文:');
    console.log(context);
    console.log('');

    // 调用LLM
    console.log('🤖 正在调用LLM...');
    const result = await callAgentLLM(mockAgent.id, context);
    
    console.log('\n📝 LLM响应:');
    console.log('思考:', result.thought);
    console.log('行动:', result.action);
    console.log('台词:', result.dialogue);
    
    if (result.error) {
        console.log('\n❌ 错误:', result.error);
    } else {
        console.log('\n✅ LLM调用成功!');
    }
}

testLLM().catch(console.error);
