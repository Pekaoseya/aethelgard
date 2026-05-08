<template>
  <div class="ai-overlay">
    <div class="ai-panel">
      <div class="panel-header">
        <h3>🤪 AI 角色状态</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="panel-content">
        <!-- AI 角色列表 -->
        <div class="character-list">
          <div
            v-for="npc in characters"
            :key="npc.id"
            class="character-item"
            :class="{ selected: selectedId === npc.id }"
            @click="selectCharacter(npc.id)"
          >
            <span class="emoji">{{ npc.emoji }}</span>
            <span class="name">{{ npc.name }}</span>
            <span class="position">({{ npc.position.x }}, {{ npc.position.y }})</span>
          </div>
        </div>

        <!-- 选中角色详情 -->
        <div v-if="selected" class="character-detail">
          <div class="detail-header">
            <span class="emoji large">{{ selected.emoji }}</span>
            <div class="info">
              <h4>{{ selected.name }}</h4>
              <p class="position">位置: ({{ selected.position.x }}, {{ selected.position.y }})</p>
            </div>
          </div>

          <!-- 当前心情 -->
          <div class="mood-section">
            <h5>💭 当前心情</h5>
            <p class="mood-text">{{ selected.emotionalState || '普通' }}</p>
          </div>

          <!-- 当前动作 -->
          <div class="action-section">
            <h5>🎯 最后决策</h5>
            <div class="action-card" :class="{ chaotic: selected.currentAction?.chaosType }">
              <div class="action-type">
                {{ getActionIcon(selected.currentAction?.type || 'wait') }}
                {{ selected.currentAction?.type || 'wait' }}
                {{ selected.currentAction?.target || '' }}
              </div>
              <div class="action-reason">
                {{ selected.currentAction?.reasoning || selected.currentAction?.reason || '...' }}
              </div>
              <div v-if="selected.currentAction?.chaosType" class="chaos-tag">
                {{ getChaosTag(selected.currentAction.chaosType) }}
              </div>
            </div>
          </div>

          <!-- 执念 -->
          <div v-if="selected.obsessions?.length" class="obsessions-section">
            <h5>🎭 执念</h5>
            <div class="obsession-tags">
              <span v-for="obs in selected.obsessions" :key="obs" class="tag">{{ obs }}</span>
            </div>
          </div>

          <!-- 移动历史 -->
          <div class="history-section">
            <h5>📍 最近移动</h5>
            <div class="move-trail">
              <span
                v-for="(pos, idx) in selected.moveHistory.slice(-5)"
                :key="idx"
                class="trail-dot"
              >
                ({{ pos.x }},{{ pos.y }})
              </span>
            </div>
          </div>
        </div>

        <!-- 全局控制 -->
        <div class="controls">
          <button class="btn" @click="togglePause">
            {{ isPaused ? '▶️ 继续' : '⏸️ 暂停' }}
          </button>
          <button class="btn" @click="speedUp">⚡ 加速</button>
          <button class="btn" @click="slowDown">🐢 减速</button>
        </div>

        <!-- 决策日志 -->
        <div class="log-section">
          <h5>📜 决策日志</h5>
          <div class="log-list">
            <div
              v-for="(log, idx) in logs"
              :key="idx"
              class="log-item"
              :class="{ chaotic: log.chaos }"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-char">{{ log.name }}</span>
              <span class="log-action">{{ log.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { AIControlledNPC } from '@/ai';

const props = defineProps<{
  characters: AIControlledNPC[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'speedChange', speed: number): void;
}>();

const selectedId = ref<string | null>(null);
const isPaused = ref(false);
const speed = ref(1);
const logs = ref<Array<{
  time: string;
  name: string;
  action: string;
  chaos: boolean;
}>>([]);

const selected = computed(() => {
  if (!selectedId.value) return null;
  return props.characters.find(c => c.id === selectedId.value) || null;
});

onMounted(() => {
  if (props.characters.length > 0) {
    selectCharacter(props.characters[0].id);
  }
});

function selectCharacter(id: string) {
  selectedId.value = id;
}

function getActionIcon(type?: string): string {
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

function getChaosTag(type?: string): string {
  const tags: Record<string, string> = {
    random: '🎲 随机',
    contradict: '🔄 矛盾',
    spam: '🔁 重复',
    ignore: '👀 忽略',
    delay: '⏰ 拖延',
    overthink: '🤯 想太多',
    underthink: '🧠 欠思考',
    superstition: '🍀 迷信'
  };
  return tags[type || ''] || '';
}

function togglePause() {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    emit('pause');
  } else {
    emit('resume');
  }
}

function speedUp() {
  speed.value = Math.min(3, speed.value + 0.5);
  emit('speedChange', speed.value);
}

function slowDown() {
  speed.value = Math.max(0.5, speed.value - 0.5);
  emit('speedChange', speed.value);
}

// 添加日志（由父组件调用）
function addLog(npc: AIControlledNPC) {
  const action = npc.currentAction;
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    name: npc.name,
    action: `${action?.type || 'wait'} ${action?.target || ''}${action?.chaosType ? ' [混沌]' : ''}`,
    chaos: !!action?.chaosType
  });

  // 限制日志数量
  if (logs.value.length > 20) {
    logs.value.pop();
  }
}

// 暴露方法给父组件
defineExpose({ addLog });
</script>

<style scoped>
.ai-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: rgba(10, 10, 20, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.ai-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.character-item.selected {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
}

.character-item .emoji {
  font-size: 1.2rem;
}

.character-item .name {
  color: white;
  font-weight: 500;
}

.character-item .position {
  color: #666;
  font-size: 0.8rem;
}

.character-detail {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-header .emoji.large {
  font-size: 2.5rem;
}

.detail-header .info h4 {
  margin: 0 0 4px 0;
  color: white;
  font-size: 1.2rem;
}

.detail-header .position {
  color: #888;
  font-size: 0.9rem;
}

.mood-section,
.action-section,
.obsessions-section,
.history-section {
  margin-bottom: 16px;
}

h5 {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.mood-text {
  color: #ffd93d;
  font-size: 1.1rem;
  margin: 0;
}

.action-card {
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.action-card.chaotic {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.action-type {
  color: white;
  font-weight: 600;
  margin-bottom: 6px;
}

.action-reason {
  color: #aaa;
  font-size: 0.9rem;
}

.chaos-tag {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  border-radius: 12px;
  font-size: 0.8rem;
}

.obsession-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 165, 0, 0.2);
  color: #ffa500;
  border-radius: 12px;
  font-size: 0.85rem;
}

.move-trail {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trail-dot {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #888;
  font-size: 0.85rem;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.log-section {
  margin-top: 16px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: grid;
  grid-template-columns: 60px 70px 1fr;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.85rem;
}

.log-item.chaotic {
  background: rgba(255, 107, 107, 0.1);
}

.log-time {
  color: #666;
}

.log-char {
  color: #667eea;
}

.log-action {
  color: #ddd;
}
</style>
