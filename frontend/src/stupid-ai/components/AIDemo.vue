<template>
  <div class="ai-demo">
    <button class="back-btn" @click="$emit('back')">← 返回</button>
    <div class="header">
      <h2>🤪 智障探险队 AI 决策引擎</h2>
      <p class="subtitle">效用驱动的"性格缺陷"</p>
    </div>

    <!-- 角色选择 -->
    <div class="character-select">
      <label>选择智障角色:</label>
      <div class="characters">
        <button
          v-for="char in characters"
          :key="char.id"
          :class="['char-btn', { active: selectedChar?.id === char.id }]"
          @click="selectCharacter(char)"
        >
          {{ char.icon }} {{ char.id }}
        </button>
      </div>
    </div>

    <!-- 当前状态 -->
    <div v-if="selectedChar" class="status-panel">
      <h3>📊 {{ selectedChar.name }} 状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">心情</span>
          <span class="value">{{ emotionalState }}</span>
        </div>
        <div class="status-item">
          <span class="label">混沌度</span>
          <span class="value">{{ chaosLevel }}%</span>
        </div>
        <div class="status-item">
          <span class="label">连续失败</span>
          <span class="value">{{ consecutiveFailures }}</span>
        </div>
        <div class="status-item">
          <span class="label">连续成功</span>
          <span class="value">{{ consecutiveSuccesses }}</span>
        </div>
      </div>

      <!-- 记忆摘要 -->
      <div class="memory-summary">
        <h4>💭 记忆</h4>
        <p>{{ memorySummary || '什么都不记得了' }}</p>
      </div>

      <!-- 执念 -->
      <div v-if="obsessions.length > 0" class="obsessions">
        <h4>🎭 执念</h4>
        <div class="obsession-tags">
          <span v-for="obs in obsessions" :key="obs" class="tag">{{ obs }}</span>
        </div>
      </div>
    </div>

    <!-- 模拟环境 -->
    <div v-if="selectedChar" class="environment-panel">
      <h3>🌍 当前环境</h3>
      <div class="env-grid">
        <div class="env-item">
          <span>地形:</span>
          <select v-model="environment.terrain">
            <option value="grass">草地</option>
            <option value="forest">森林</option>
            <option value="cave">洞穴</option>
            <option value="water">水域</option>
            <option value="high_place">高处</option>
          </select>
        </div>
        <div class="env-item">
          <span>时间:</span>
          <select v-model="environment.time">
            <option value="day">白天</option>
            <option value="night">夜晚</option>
          </select>
        </div>
        <div class="env-item">
          <span>HP:</span>
          <input type="range" v-model.number="selfStatus.hp" min="0" :max="selfStatus.max_hp" />
          <span>{{ selfStatus.hp }}/{{ selfStatus.max_hp }}</span>
        </div>
        <div class="env-item">
          <label>
            <input type="checkbox" v-model="hasWarningSign" />
            有"不要按"警告牌
          </label>
        </div>
      </div>
    </div>

    <!-- 可用动作 -->
    <div v-if="selectedChar" class="actions-panel">
      <h3>🎮 决策</h3>
      <div class="available-actions">
        <button
          v-for="action in availableActions"
          :key="action.type"
          class="action-btn"
          @click="makeDecision(action)"
        >
          {{ getActionIcon(action.type) }} {{ action.type }}
        </button>
      </div>
    </div>

    <!-- 决策结果 -->
    <div v-if="lastDecision" class="decision-result">
      <h3>🎯 决策结果</h3>
      <div class="result-card">
        <div class="result-header">
          <span class="action-type">{{ lastDecision.type }}</span>
          <span class="target">{{ lastDecision.target }}</span>
        </div>
        <div class="result-reason">
          <strong>理由:</strong> {{ lastDecision.reasoning }}
        </div>
        <div v-if="lastDecision.chaosType" class="chaos-badge">
          {{ getChaosBadge(lastDecision.chaosType) }}
        </div>
        <div class="result-emotion">
          当前心情: {{ lastDecision.emotionalState }}
        </div>
      </div>
    </div>

    <!-- 行动按钮 -->
    <div v-if="selectedChar" class="action-buttons">
      <button class="btn btn-success" @click="simulateSuccess">✅ 记录成功</button>
      <button class="btn btn-danger" @click="simulateFailure">❌ 记录失败</button>
      <button class="btn btn-neutral" @click="tickTurn">⏭️ 回合结束</button>
      <button class="btn btn-info" @click="toggleDebug">
        {{ showDebug ? '隐藏' : '显示' }}调试
      </button>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebug && selectedChar" class="debug-panel">
      <h3>🔧 调试信息</h3>
      <pre>{{ debugInfo }}</pre>
    </div>

    <!-- 决策历史 -->
    <div class="history-panel">
      <h3>📜 决策历史</h3>
      <div class="history-list">
        <div
          v-for="(item, idx) in history"
          :key="idx"
          :class="['history-item', item.success ? 'success' : 'failure']"
        >
          <span class="time">{{ item.time }}</span>
          <span class="action">{{ item.action }}</span>
          <span class="reason">{{ item.reason }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { AIDecisionEngine, type PerceptionData, type Action, type PersonalityConfig } from '@/ai';

defineEmits(['back']);

// 角色定义
const characters: (PersonalityConfig & { icon: string; name: string })[] = [
  {
    id: '复读姬',
    name: '复读姬',
    icon: '🔁',
    traits: ['复读', '健忘'],
    bias_strength: 80,
    emotion_volatility: 0.8,
    irrationality: 0.9,
    loyalty: 50
  },
  {
    id: '杠精博士',
    name: '杠精博士',
    icon: '🤓',
    traits: ['反驳', '逻辑控'],
    bias_strength: 70,
    emotion_volatility: 0.9,
    irrationality: 0.6,
    loyalty: 30,
    obsession_target: '真理'
  },
  {
    id: '圣母心',
    name: '圣母心',
    icon: '🫠',
    traits: ['帮助', '牺牲'],
    bias_strength: 60,
    emotion_volatility: 0.5,
    irrationality: 0.4,
    loyalty: 95
  },
  {
    id: '幻觉大师',
    name: '幻觉大师',
    icon: '👻',
    traits: ['想象', '幻觉'],
    bias_strength: 90,
    emotion_volatility: 1.0,
    irrationality: 0.95,
    loyalty: 20
  },
  {
    id: '舔狗',
    name: '舔狗',
    icon: '🐶',
    traits: ['追随', '讨好'],
    bias_strength: 85,
    emotion_volatility: 0.7,
    irrationality: 0.8,
    loyalty: 100,
    obsession_target: '队长'
  },
  {
    id: '预言家',
    name: '预言家',
    icon: '🔮',
    traits: ['预言', '恐慌'],
    bias_strength: 75,
    emotion_volatility: 1.0,
    irrationality: 0.7,
    loyalty: 60
  }
];

// 状态
const selectedChar = ref<(typeof characters)[0] | null>(null);
const engine = ref<AIDecisionEngine | null>(null);

const emotionalState = ref('neutral');
const chaosLevel = ref(30);
const consecutiveFailures = ref(0);
const consecutiveSuccesses = ref(0);
const memorySummary = ref('');
const obsessions = ref<string[]>([]);
const showDebug = ref(false);

const environment = ref({
  terrain: 'grass' as const,
  time: 'day' as const,
  hasWarningSign: false
});

const selfStatus = ref({
  hp: 100,
  max_hp: 100,
  position: { x: 10, y: 5 },
  status: [] as string[],
  inventory: ['rusty_sword', 'apple', 'shield']
});

const lastDecision = ref<(Action & { reasoning: string; emotionalState: string }) | null>(null);
const history = ref<Array<{ time: string; action: string; reason: string; success: boolean }>>([]);

const availableActions: Action[] = [
  { type: 'attack', target: '史莱姆', baseScore: 60, distance: 2 },
  { type: 'attack', target: '巨龙', baseScore: 60, distance: 5 },
  { type: 'pickup', target: '金币', baseScore: 50 },
  { type: 'pickup', target: '破损的石头', baseScore: 50 },
  { type: 'inspect', target: '按钮', baseScore: 40 },
  { type: 'interact', target: '拉杆', baseScore: 40 },
  { type: 'defend', target: '防御', baseScore: 50 },
  { type: 'flee', target: '逃跑', baseScore: 40 },
  { type: 'follow', target: '队友', baseScore: 30 },
  { type: 'talk', target: '队友', baseScore: 20 },
  { type: 'help', target: '队友', baseScore: 40 }
];

// 计算
const debugInfo = computed(() => {
  if (!engine.value) return '';
  return JSON.stringify(engine.value.getDebug(), null, 2);
});

// 方法
function selectCharacter(char: typeof characters[0]) {
  selectedChar.value = char;
  engine.value = new AIDecisionEngine(char, {
    chaosLevel: char.irrationality * 100,
    enableDebug: true
  });
  updateStatus();
}

function getActionIcon(type: string): string {
  const icons: Record<string, string> = {
    attack: '⚔️',
    pickup: '📦',
    inspect: '🔍',
    interact: '🔧',
    defend: '🛡️',
    flee: '🏃',
    follow: '👣',
    talk: '💬',
    help: '🤝',
    wait: '⏳'
  };
  return icons[type] || '❓';
}

function getChaosBadge(type: string): string {
  const badges: Record<string, string> = {
    random: '🎲 随机行动',
    contradict: '🔄 矛盾行为',
    spam: '🔁 重复动作',
    ignore: '👀 视而不见',
    delay: '⏰ 拖延症',
    overthink: '🤯 想太多',
    underthink: '🧠 不过脑子',
    superstition: '🍀 迷信行为'
  };
  return badges[type] || '❓';
}

function buildPerception(): PerceptionData {
  return {
    self: selfStatus.value,
    environment: {
      ...environment.value,
      hasWarningSign: environment.value.hasWarningSign
    },
    perception: [
      { type: 'enemy', name: '史莱姆', distance: 2, threat_level: 1 },
      { type: 'enemy', name: '巨龙', distance: 5, threat_level: 5 },
      { type: 'item', name: '金币', distance: 3 },
      { type: 'item', name: '破损的石头', distance: 1 },
      { type: 'ally', name: '队友A', distance: 1, action: 'wait' }
    ]
  };
}

function makeDecision(action: Action) {
  if (!engine.value) return;

  const perception = buildPerception();
  const result = engine.value.decide(perception, [action]);
  
  lastDecision.value = result;
  emotionalState.value = result.emotionalState;
  updateStatus();
  
  // 添加历史
  history.value.unshift({
    time: new Date().toLocaleTimeString(),
    action: `${result.type} ${result.target}`,
    reason: result.reasoning,
    success: !result.chaosType
  });

  if (history.value.length > 20) {
    history.value.pop();
  }
}

function updateStatus() {
  if (!engine.value) return;
  const status = engine.value.getStatus();
  chaosLevel.value = Math.round((selectedChar.value?.irrationality || 0.3) * 100);
}

function simulateSuccess() {
  if (!engine.value) return;
  engine.value.recordSuccess(15);
  consecutiveSuccesses.value++;
  consecutiveFailures.value = 0;
  updateStatus();
}

function simulateFailure() {
  if (!engine.value) return;
  engine.value.recordFailure(20);
  consecutiveFailures.value++;
  consecutiveSuccesses.value = 0;
  updateStatus();
}

function tickTurn() {
  if (!engine.value) return;
  engine.value.tick();
  updateStatus();
}

function toggleDebug() {
  showDebug.value = !showDebug.value;
}
</script>

<style scoped>
.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ai-demo {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-style: italic;
}

.character-select {
  margin-bottom: 24px;
}

.character-select label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.characters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.char-btn:hover {
  border-color: #888;
}

.char-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.status-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.status-panel h3 {
  margin-top: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.status-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.status-item .label {
  font-size: 0.85rem;
  color: #666;
}

.status-item .value {
  font-size: 1.2rem;
  font-weight: 600;
}

.memory-summary,
.obsessions {
  margin-top: 12px;
}

.memory-summary h4,
.obsessions h4 {
  margin-bottom: 8px;
}

.obsession-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #ffecd2;
  color: #c94;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.environment-panel,
.actions-panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.env-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-item select,
.env-item input[type="range"] {
  flex: 1;
}

.available-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #bbb;
}

.decision-result {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
}

.result-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 16px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.action-type {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
}

.target {
  font-size: 1.2rem;
}

.result-reason {
  margin-bottom: 12px;
}

.chaos-badge {
  background: #ff6b6b;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  display: inline-block;
  margin-bottom: 12px;
}

.result-emotion {
  font-size: 0.9rem;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-success {
  background: #51cf66;
  color: white;
}

.btn-danger {
  background: #ff6b6b;
  color: white;
}

.btn-neutral {
  background: #868e96;
  color: white;
}

.btn-info {
  background: #339af0;
  color: white;
}

.debug-panel {
  background: #2d3436;
  color: #dfe6e9;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.debug-panel pre {
  white-space: pre-wrap;
  font-size: 0.85rem;
  font-family: 'Monaco', 'Consolas', monospace;
}

.history-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: grid;
  grid-template-columns: 80px 150px 1fr;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: white;
  font-size: 0.9rem;
}

.history-item.success {
  border-left: 3px solid #51cf66;
}

.history-item.failure {
  border-left: 3px solid #ff6b6b;
}

.time {
  color: #666;
}
</style>
