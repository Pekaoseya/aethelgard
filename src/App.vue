<script setup lang="ts">
import { ref } from 'vue'
import AIGame from '../packages/stupid-ai/components/AIGame.vue'

const currentView = ref<'menu' | 'ai-game' | 'rpg-game'>('menu')

// 游戏菜单选项
const menuItems = [
  { id: 'ai-game', icon: '🤪', title: 'AI 观察模式', desc: '观察智障角色的混沌决策', color: '#f5576c' },
  { id: 'rpg-game', icon: '⚔️', title: '冒险开始', desc: '进入奇幻世界冒险', color: '#667eea' },
]

function selectMode(mode: string) {
  if (mode === 'ai-game') {
    currentView.value = 'ai-game'
  } else if (mode === 'rpg-game') {
    // TODO: 集成 RPG-JS 游戏
    currentView.value = 'rpg-game'
  }
}

function goBack() {
  currentView.value = 'menu'
}
</script>

<template>
  <div class="game-container">
    <!-- 主菜单界面 -->
    <div v-if="currentView === 'menu'" class="menu-screen">
      <div class="menu-bg">
        <div class="stars"></div>
        <div class="mountains"></div>
      </div>
      
      <div class="menu-content">
        <div class="logo-section">
          <h1 class="game-title">⚔️ 智障探险队 ⚔️</h1>
          <p class="subtitle">在奇幻世界中与智障角色一起冒险</p>
        </div>
        
        <div class="menu-buttons">
          <button 
            v-for="item in menuItems" 
            :key="item.id"
            @click="selectMode(item.id)"
            class="menu-btn"
            :style="{ '--btn-color': item.color }"
          >
            <span class="btn-icon">{{ item.icon }}</span>
            <span class="btn-text">
              <strong>{{ item.title }}</strong>
              <small>{{ item.desc }}</small>
            </span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
        
        <div class="credits">
          <p>Powered by RPG-JS + Kimi AI</p>
          <p class="version">v1.0.0</p>
        </div>
      </div>
    </div>
    
    <!-- AI 游戏界面 -->
    <AIGame v-else-if="currentView === 'ai-game'" @back="goBack" />
    
    <!-- RPG 游戏占位 -->
    <div v-else-if="currentView === 'rpg-game'" class="rpg-placeholder">
      <div class="placeholder-content">
        <h2>🎮 RPG 游戏开发中...</h2>
        <p>正在整合 RPG-JS 引擎</p>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <button @click="goBack" class="back-btn">← 返回菜单</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  color: white;
  overflow: hidden;
  position: relative;
}

/* 背景动画 */
.menu-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, #fff, transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(2px 2px at 130px 80px, #eee, transparent),
    radial-gradient(1px 1px at 160px 120px, #fff, transparent);
  background-repeat: repeat;
  background-size: 200px 200px;
  animation: twinkle 4s ease-in-out infinite;
}

.mountains {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, #1a1a2e 0%, transparent 100%);
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 菜单内容 */
.menu-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.logo-section {
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

.game-title {
  font-size: 4rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(102, 126, 234, 0.5);
  letter-spacing: 0.05em;
}

.subtitle {
  font-size: 1.2rem;
  color: #888;
  margin-top: 0.5rem;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 菜单按钮 */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.menu-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--btn-color) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.menu-btn:hover {
  transform: translateX(10px);
  border-color: var(--btn-color);
  box-shadow: 0 0 30px rgba(var(--btn-color), 0.2);
}

.menu-btn:hover::before {
  opacity: 0.1;
}

.btn-icon {
  font-size: 2.5rem;
  position: relative;
  z-index: 1;
}

.btn-text {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
  z-index: 1;
}

.btn-text strong {
  font-size: 1.3rem;
}

.btn-text small {
  font-size: 0.9rem;
  color: #888;
}

.btn-arrow {
  font-size: 1.5rem;
  opacity: 0.5;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.menu-btn:hover .btn-arrow {
  opacity: 1;
  transform: translateX(5px);
}

/* 底部信息 */
.credits {
  margin-top: 4rem;
  text-align: center;
  animation: fadeIn 1s ease-out 0.5s both;
}

.credits p {
  color: #555;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.version {
  color: #444 !important;
  font-size: 0.8rem !important;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* RPG 占位页面 */
.rpg-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  padding: 3rem;
}

.placeholder-content h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.placeholder-content p {
  color: #888;
  margin-bottom: 2rem;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.progress-fill {
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 80%; }
  100% { width: 0%; }
}

.back-btn {
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
