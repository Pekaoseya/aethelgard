<template>
  <div class="ai-game-container">
    <!-- 开始界面 -->
    <div v-if="!store.gameStarted" class="start-screen">
      <div class="title-card">
        <h1>🤪 智障探险队 AI 版</h1>
        <p>观察 AI 角色的"符合人设的混沌决策"</p>
        <div class="features">
          <div class="feature">🎭 多种智障角色</div>
          <div class="feature">🧠 AI 决策引擎</div>
          <div class="feature">🎲 混沌注入系统</div>
          <div class="feature">🗺️ 5 种测试场景</div>
        </div>
        
        <!-- 场景选择 -->
        <div class="scenario-grid">
          <div
            v-for="scenario in ALL_SCENARIOS"
            :key="scenario.id"
            class="scenario-card"
            :class="scenario.difficulty"
            @click="startGame(scenario.id)"
          >
            <span class="scenario-icon">{{ scenario.icon }}</span>
            <span class="scenario-name">{{ scenario.name }}</span>
            <span class="scenario-desc">{{ scenario.description }}</span>
            <span
              class="scenario-difficulty"
              :style="{ backgroundColor: getDifficultyColor(scenario.difficulty) }"
            >
              {{ scenario.difficulty }}
            </span>
          </div>
        </div>
        
        <button @click="$emit('back')" class="back-btn">← 返回</button>
      </div>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="game-screen">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="status-item">
          <span class="icon">🗺️</span>
          <span>{{ store.currentMap }}</span>
        </div>
        <div class="status-item">
          <span class="icon">📍</span>
          <span>{{ store.playerPosition.x }}, {{ store.playerPosition.y }}</span>
        </div>
        <div class="status-item">
          <span class="icon" :class="{ active: store.aiEnabled }">🧠</span>
          <span>{{ store.aiEnabled ? 'AI 运行中' : 'AI 已暂停' }}</span>
        </div>
        <div class="controls-hint">
          <span>移动: WASD</span>
          <span>交互: E</span>
          <button @click="store.toggleAIPanel()" class="ai-panel-btn">
            {{ store.showAIPanel ? '👁️ 隐藏' : '👁️ AI 面板' }}
          </button>
          <button @click="showScenarioSelect = true" class="scenario-btn">
            🗺️ 切换场景
          </button>
        </div>
      </div>

      <!-- 游戏区域 -->
      <div class="game-area">
        <!-- 地图 -->
        <div class="map-container">
          <div class="map">
            <div
              v-for="y in store.mapSize.height"
              :key="`row-${y - 1}`"
              class="map-row"
            >
              <div
                v-for="x in store.mapSize.width"
                :key="`cell-${x - 1}-${y - 1}`"
                class="map-cell"
                :class="{
                  wall: isWall(x - 1, y - 1),
                  player: store.playerPosition.x === x - 1 && store.playerPosition.y === y - 1,
                  'near-player': isNearPlayer(x - 1, y - 1),
                  'has-item': hasItem(x - 1, y - 1)
                }"
              >
                <!-- 玩家 -->
                <span v-if="store.playerPosition.x === x - 1 && store.playerPosition.y === y - 1" class="entity player">
                  🧙
                </span>

                <!-- AI NPC -->
                <span
                  v-else-if="getNPCAt(x - 1, y - 1)"
                  class="entity npc"
                  :class="{ acting: isActing(getNPCAt(x - 1, y - 1)!) }"
                >
                  {{ getNPCAt(x - 1, y - 1)!.emoji }}
                </span>

                <!-- 物品 -->
                <span
                  v-else-if="hasItem(x - 1, y - 1)"
                  class="item"
                >
                  {{ getItemAt(x - 1, y - 1) }}
                </span>

                <!-- 墙壁 -->
                <span v-else-if="isWall(x - 1, y - 1)" class="wall-block">🧱</span>

                <!-- 空地 -->
                <span v-else class="ground">.</span>
              </div>
            </div>
          </div>

          <!-- 图例 -->
          <div class="legend">
            <div class="legend-item"><span>🧙</span> 玩家</div>
            <div class="legend-item"><span>🧠</span> AI 角色</div>
            <div class="legend-item"><span>📦</span> 物品</div>
            <div class="legend-item"><span class="acting-dot"></span> 正在行动</div>
          </div>
        </div>

        <!-- 右侧信息面板 -->
        <div class="info-panel">
          <h3>🤪 AI 角色实时状态</h3>

          <!-- 角色卡片 -->
          <div class="character-cards">
            <div
              v-for="npc in store.npcs"
              :key="npc.id"
              class="char-card"
              :class="{ nearby: store.isNearNPC(npc) }"
              @click="talkToNPC(npc)"
            >
              <span class="emoji">{{ npc.emoji }}</span>
              <div class="char-info">
                <span class="name">{{ npc.name }}</span>
                <span class="pos">({{ npc.position.x }}, {{ npc.position.y }})</span>
              </div>
              <div class="char-action" v-if="getAIAction(npc.id)">
                {{ getActionEmoji(getAIAction(npc.id)!.type) }}
                {{ getAIAction(npc.id)!.target }}
              </div>
            </div>
          </div>

          <!-- AI 控制 -->
          <div class="ai-controls">
            <h4>🕹️ AI 控制</h4>
            <div class="control-buttons">
              <button @click="toggleAI" :class="{ active: store.aiEnabled }">
                {{ store.aiEnabled ? '⏸️ 暂停' : '▶️ 运行' }}
              </button>
              <button @click="speedChange(-0.5)">🐢</button>
              <span class="speed-display">{{ store.aiSpeed.toFixed(1) }}x</span>
              <button @click="speedChange(0.5)">⚡</button>
            </div>
          </div>

          <!-- 提示 -->
          <div class="tips">
            <p>👆 点击角色卡片与其对话</p>
            <p>🤪 观察 AI 角色的混沌行为！</p>
          </div>
        </div>
      </div>

      <!-- 对话框 -->
      <div v-if="store.dialogueActive" class="dialogue-overlay">
        <div class="dialogue-box">
          <div class="dialogue-header">
            <span class="npc-emoji">{{ store.currentNPC?.emoji }}</span>
            <span class="npc-name">{{ store.currentNPC?.name }}</span>
            <button class="close-btn" @click="store.closeDialogue()">×</button>
          </div>
          <div class="dialogue-messages">
            <div
              v-for="(msg, idx) in store.dialogueMessages"
              :key="idx"
              :class="['message', msg.speaker]"
            >
              {{ msg.content }}
            </div>
            <div v-if="store.isTyping" class="typing">
              {{ store.currentNPC?.name }} 正在思考...
            </div>
          </div>
          <div class="dialogue-input">
            <input
              v-model="store.playerInput"
              @keyup.enter="store.sendMessage()"
              placeholder="输入消息..."
              :disabled="store.isTyping"
            />
            <button @click="store.sendMessage()" :disabled="store.isTyping">发送</button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 面板 -->
    <AIPanel
      v-if="store.showAIPanel"
      :characters="store.aiCharacters"
      @close="store.showAIPanel = false"
      @pause="store.pauseAI()"
      @resume="store.resumeAI()"
      @speed-change="store.setAISpeed($event)"
      ref="aiPanelRef"
    />

    <!-- 场景切换弹窗 -->
    <div v-if="showScenarioSelect" class="scenario-overlay" @click.self="showScenarioSelect = false">
      <div class="scenario-modal">
        <div class="modal-header">
          <h3>🗺️ 选择场景</h3>
          <button class="close-btn" @click="showScenarioSelect = false">×</button>
        </div>
        <div class="scenario-list">
          <div
            v-for="scenario in ALL_SCENARIOS"
            :key="scenario.id"
            class="scenario-item"
            :class="{
              active: store.currentScenario?.id === scenario.id,
              [scenario.difficulty]: true
            }"
            @click="switchScenario(scenario.id)"
          >
            <span class="item-icon">{{ scenario.icon }}</span>
            <div class="item-info">
              <span class="item-name">{{ scenario.name }}</span>
              <span class="item-desc">{{ scenario.description }}</span>
            </div>
            <span
              class="item-difficulty"
              :style="{ backgroundColor: getDifficultyColor(scenario.difficulty) }"
            >
              {{ scenario.difficulty }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAIGameStore } from '@/stupid-ai/stores/ai-game';
import AIPanel from '@/stupid-ai/components/AIPanel.vue';
import type { AIControlledNPC } from '@/ai';
import { ALL_SCENARIOS, getDifficultyColor } from '@/ai/scenarios';

const emit = defineEmits(['back']);

const store = useAIGameStore();
const aiPanelRef = ref<InstanceType<typeof AIPanel> | null>(null);
const showScenarioSelect = ref(false);

// 启动游戏（带场景选择）
function startGame(scenarioId?: string) {
  if (scenarioId) {
    store.loadScenario(scenarioId);
  } else {
    store.startGame();
  }
  showScenarioSelect.value = false;
}

// 切换场景
function switchScenario(scenarioId: string) {
  store.loadScenario(scenarioId);
  showScenarioSelect.value = false;
}

// 墙壁检测
function isWall(x: number, y: number): boolean {
  return (x + y) % 7 === 0;
}

// 是否在玩家旁边
function isNearPlayer(x: number, y: number): boolean {
  const dx = Math.abs(x - store.playerPosition.x);
  const dy = Math.abs(y - store.playerPosition.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

// 获取某位置的 NPC
function getNPCAt(x: number, y: number): typeof store.npcs[0] | null {
  return store.npcs.find(n => n.position.x === x && n.position.y === y) || null;
}

// 获取某位置的物品
function hasItem(x: number, y: number): boolean {
  return store.environment.items.some(i => i.position.x === x && i.position.y === y);
}

function getItemAt(x: number, y: number): string {
  const item = store.environment.items.find(i => i.position.x === x && i.position.y === y);
  if (!item) return '';
  if (item.name === '金币') return '🪙';
  if (item.name === '苹果') return '🍎';
  if (item.name === '宝箱') return '📦';
  return '💎';
}

// 检查 NPC 是否正在行动
function isActing(npc: typeof store.npcs[0]): boolean {
  const aiChar = store.aiCharacters.find(c => c.id === npc.id);
  return aiChar?.currentAction?.type !== 'wait' && !!aiChar?.currentAction;
}

// 获取 NPC 的 AI 动作
function getAIAction(npcId: string): AIControlledNPC['currentAction'] | null {
  const aiChar = store.aiCharacters.find(c => c.id === npcId);
  return aiChar?.currentAction || null;
}

function getActionEmoji(type?: string): string {
  const icons: Record<string, string> = {
    move: '👣',
    attack: '⚔️',
    pickup: '📦',
    talk: '💬',
    wait: '⏳',
    inspect: '🔍',
    help: '🤝',
    flee: '🏃',
    follow: '👣',
    idle: '😴'
  };
  return icons[type || 'idle'] || '❓';
}

// 切换 AI
function toggleAI() {
  if (store.aiEnabled) {
    store.pauseAI();
  } else {
    store.resumeAI();
  }
}

// 速度调整
function speedChange(delta: number) {
  const newSpeed = Math.max(0.5, Math.min(3, store.aiSpeed + delta));
  store.setAISpeed(newSpeed);
}

// 与 NPC 对话
function talkToNPC(npc: typeof store.npcs[0]) {
  if (store.isNearNPC(npc)) {
    store.startDialogue(npc);
  }
}

// 键盘控制
function handleKeydown(e: KeyboardEvent) {
  if (store.dialogueActive) return;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      store.movePlayer(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      store.movePlayer(0, 1);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      store.movePlayer(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      store.movePlayer(1, 0);
      break;
    case 'e':
    case 'E':
    case ' ':
      const nearby = store.getNearbyNPC();
      if (nearby) {
        store.startDialogue(nearby);
      }
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  store.stopAI();
});

// 监听 AI 动作并更新面板
watch(() => store.aiCharacters.length, () => {
  // 延迟更新，确保有数据
  setTimeout(() => {
    if (aiPanelRef.value) {
      store.aiCharacters.forEach(npc => {
        if (npc.currentAction) {
          aiPanelRef.value?.addLog(npc);
        }
      });
    }
  }, 500);
});
</script>

<style scoped>
.ai-game-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  overflow: hidden;
}

/* 开始界面 */
.start-screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-card {
  text-align: center;
  padding: 3rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  max-width: 500px;
}

.title-card h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-card p {
  color: #aaa;
  margin-bottom: 2rem;
}

.features {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  font-size: 0.9rem;
}

.start-btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  margin-bottom: 1rem;
}

.start-btn:hover {
  transform: scale(1.05);
}

.back-btn {
  display: block;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

/* 游戏界面 */
.game-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 状态栏 */
.status-bar {
  padding: 1rem 2rem;
  background: rgba(0,0,0,0.3);
  display: flex;
  gap: 2rem;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-item .icon.active {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.controls-hint {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.controls-hint span {
  font-size: 0.9rem;
  color: #888;
}

.ai-panel-btn {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.ai-panel-btn:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 游戏区域 */
.game-area {
  flex: 1;
  display: flex;
  padding: 2rem;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
}

/* 地图 */
.map-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.map {
  background: #0f0f1a;
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.map-row {
  display: flex;
}

.map-cell {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  position: relative;
}

.map-cell.wall {
  background: rgba(50, 50, 70, 0.5);
}

.map-cell.near-player {
  box-shadow: inset 0 0 10px rgba(102, 126, 234, 0.5);
}

.map-cell.has-item {
  background: rgba(255, 215, 0, 0.1);
}

.entity {
  z-index: 2;
}

.entity.player {
  font-size: 1.8rem;
}

.entity.npc {
  font-size: 1.8rem;
}

.entity.npc.acting {
  animation: bounce 0.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.ground {
  color: #333;
}

.legend {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #888;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.acting-dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

/* 信息面板 */
.info-panel {
  width: 300px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 1.5rem;
}

.info-panel h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.character-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.char-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.char-card:hover {
  background: rgba(255,255,255,0.1);
}

.char-card.nearby {
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.5);
}

.char-card .emoji {
  font-size: 1.5rem;
}

.char-card .char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.char-card .name {
  font-weight: 600;
}

.char-card .pos {
  font-size: 0.8rem;
  color: #888;
}

.char-card .char-action {
  font-size: 0.85rem;
  color: #667eea;
}

.ai-controls {
  margin-bottom: 1.5rem;
}

.ai-controls h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #888;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-buttons button {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.control-buttons button.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
}

.speed-display {
  min-width: 50px;
  text-align: center;
}

.tips {
  font-size: 0.85rem;
  color: #666;
}

.tips p {
  margin: 0.5rem 0;
}

/* 对话框 */
.dialogue-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem 2rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
}

.dialogue-box {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  overflow: hidden;
}

.dialogue-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.2);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.dialogue-header .npc-emoji {
  font-size: 1.5rem;
}

.dialogue-header .npc-name {
  flex: 1;
  font-weight: 600;
}

.dialogue-header .close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

.dialogue-messages {
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.message {
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.message.player {
  background: rgba(102, 126, 234, 0.3);
  margin-left: 2rem;
}

.message.npc {
  background: rgba(255,255,255,0.1);
  margin-right: 2rem;
}

.typing {
  color: #888;
  font-style: italic;
}

.dialogue-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.dialogue-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: white;
}

.dialogue-input input::placeholder {
  color: #666;
}

.dialogue-input button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.dialogue-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 场景选择 */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 2rem 0;
  max-height: 400px;
  overflow-y: auto;
}

.scenario-card {
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.scenario-card:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

.scenario-card.easy { border-color: #51cf66; }
.scenario-card.medium { border-color: #fcc419; }
.scenario-card.hard { border-color: #ff6b6b; }
.scenario-card.chaos { border-color: #f06595; }

.scenario-icon {
  font-size: 2rem;
}

.scenario-name {
  font-weight: 600;
  font-size: 1rem;
}

.scenario-desc {
  font-size: 0.8rem;
  color: #888;
}

.scenario-difficulty {
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

/* 场景切换弹窗 */
.scenario-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.scenario-modal {
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.modal-header h3 {
  margin: 0;
}

.modal-header .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
}

.scenario-list {
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  border: 2px solid transparent;
}

.scenario-item:hover {
  background: rgba(255,255,255,0.08);
}

.scenario-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
}

.scenario-item.easy { border-left: 3px solid #51cf66; }
.scenario-item.medium { border-left: 3px solid #fcc419; }
.scenario-item.hard { border-left: 3px solid #ff6b6b; }
.scenario-item.chaos { border-left: 3px solid #f06595; }

.item-icon {
  font-size: 2rem;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600;
}

.item-desc {
  font-size: 0.85rem;
  color: #888;
}

.item-difficulty {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.scenario-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 8px;
  color: #fcc419;
  cursor: pointer;
  font-size: 0.9rem;
}

.scenario-btn:hover {
  background: rgba(255, 193, 7, 0.3);
}
</style>
