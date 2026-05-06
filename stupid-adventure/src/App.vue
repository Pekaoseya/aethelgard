<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'
import DialogueBox from './components/DialogueBox.vue'

const store = useGameStore()

// 键盘控制
function handleKeydown(e: KeyboardEvent) {
  // 如果对话框打开，不处理移动
  if (store.dialogueActive) return
  
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      store.movePlayer(0, -1)
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      store.movePlayer(0, 1)
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      store.movePlayer(-1, 0)
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      store.movePlayer(1, 0)
      break
    case 'e':
    case 'E':
    case ' ':
      tryInteract()
      break
  }
}

function tryInteract() {
  // 检查是否与 NPC 相邻
  const { x, y } = store.playerPosition
  
  for (const npc of store.npcs) {
    const dx = Math.abs(npc.position.x - x)
    const dy = Math.abs(npc.position.y - y)
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      store.startDialogue(npc)
      return
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 检查是否与 NPC 相邻
function isNearNPC(npc: typeof store.npcs[0]) {
  const dx = Math.abs(npc.position.x - store.playerPosition.x)
  const dy = Math.abs(npc.position.y - store.playerPosition.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}
</script>

<template>
  <div class="game-container">
    <!-- 开始界面 -->
    <div v-if="!store.gameStarted" class="start-screen">
      <div class="title-card">
        <h1>⚔️ 智障探险队</h1>
        <p>在奇幻世界中与智障角色对话冒险</p>
        <button @click="store.startGame">开始冒险</button>
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
        <div class="controls-hint">
          <span>移动: WASD/方向键</span>
          <span>交互: E/空格</span>
        </div>
      </div>
      
      <!-- 游戏区域 -->
      <div class="game-area">
        <!-- 地图 (简化版) -->
        <div class="map">
          <div 
            v-for="y in 11" 
            :key="`row-${y-1}`"
            class="map-row"
          >
            <div 
              v-for="x in 11" 
              :key="`cell-${x-1}-${y-1}`"
              class="map-cell"
              :class="{
                wall: (x + y) % 7 === 0,
                player: store.playerPosition.x === x-1 && store.playerPosition.y === y-1,
                'near-player': store.npcs.some(n => n.position.x === x-1 && n.position.y === y-1 && 
                  ((Math.abs(n.position.x - store.playerPosition.x) === 1 && Math.abs(n.position.y - store.playerPosition.y) === 0) ||
                   (Math.abs(n.position.x - store.playerPosition.x) === 0 && Math.abs(n.position.y - store.playerPosition.y) === 1)))
              }"
            >
              <!-- 玩家 -->
              <span v-if="store.playerPosition.x === x-1 && store.playerPosition.y === y-1" class="entity player">
                🧙
              </span>
              
              <!-- NPC -->
              <span 
                v-else-if="store.npcs.find(n => n.position.x === x-1 && n.position.y === y-1)" 
                class="entity npc"
              >
                {{ store.npcs.find(n => n.position.x === x-1 && n.position.y === y-1)?.emoji }}
              </span>
              
              <!-- 墙壁 -->
              <span v-else-if="(x + y) % 7 === 0" class="wall-block">🧱</span>
              
              <!-- 空地 -->
              <span v-else class="ground">.</span>
            </div>
          </div>
        </div>
        
        <!-- 角色列表 -->
        <div class="character-list">
          <h3>🧙 遇到的智障角色</h3>
          <div class="character-grid">
            <div 
              v-for="npc in store.npcs" 
              :key="npc.id"
              class="character-card"
              :class="{ nearby: isNearNPC(npc) }"
            >
              <span class="emoji">{{ npc.emoji }}</span>
              <span class="name">{{ npc.name }}</span>
              <span v-if="isNearNPC(npc)" class="interact-hint">按 E 交谈</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部提示 -->
      <div class="bottom-bar">
        <p>与 NPC 相邻时按 E 或 空格键 开始对话</p>
      </div>
    </div>
    
    <!-- 对话框 -->
    <DialogueBox v-if="store.dialogueActive" />
  </div>
</template>

<style scoped>
.game-container {
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
}

.title-card h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-card p {
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 2rem;
}

.title-card button {
  padding: 1rem 3rem;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.title-card button:hover {
  transform: scale(1.05);
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

.controls-hint {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #888;
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
  border: 1px solid rgba(255,255,255,0.05);
}

.map-cell.wall {
  background: #1a1a2e;
}

.map-cell.ground {
  color: #333;
}

.map-cell.near-player {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: inset 0 0 0 2px transparent; }
  50% { box-shadow: inset 0 0 0 2px #667eea; }
}

.entity {
  font-size: 1.8rem;
  z-index: 1;
}

.entity.player {
  animation: bounce 0.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 角色列表 */
.character-list {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 1rem;
  min-width: 200px;
}

.character-list h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.character-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.character-card {
  padding: 0.75rem;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.character-card.nearby {
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid #667eea;
}

.character-card .emoji {
  font-size: 1.5rem;
}

.character-card .name {
  flex: 1;
}

.character-card .interact-hint {
  font-size: 0.75rem;
  color: #667eea;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 底部提示 */
.bottom-bar {
  padding: 1rem;
  text-align: center;
  background: rgba(0,0,0,0.3);
  color: #888;
}
</style>
