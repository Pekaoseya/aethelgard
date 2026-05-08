<script setup lang="ts">
import { ref } from 'vue'
import AIGame from './components/AIGame.vue'

const showAIGame = ref(false)
</script>

<template>
  <div class="game-container">
    <!-- 开始界面 -->
    <div v-if="!showAIGame" class="start-screen">
      <div class="title-card">
        <h1>⚔️ 智障探险队</h1>
        <p>在奇幻世界中与智障角色对话冒险</p>
        <button @click="showAIGame = true" class="ai-mode-btn">
          🤪 AI 观察模式
        </button>
        <p class="ai-mode-desc">观察 AI 角色的"符合人设的混沌决策"</p>
      </div>
    </div>
    
    <!-- AI 游戏界面 -->
    <AIGame v-else @back="showAIGame = false" />
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
  font-size: 2.8rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-card p {
  font-size: 1.1rem;
  color: #aaa;
  margin-bottom: 1.5rem;
}

.ai-mode-desc {
  font-size: 0.9rem !important;
  color: #666 !important;
  margin-top: 1rem !important;
  margin-bottom: 0 !important;
}

.ai-mode-btn {
  padding: 1.2rem 2.5rem !important;
  font-size: 1.3rem !important;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
}

.ai-mode-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(240, 147, 251, 0.5);
}
</style>
