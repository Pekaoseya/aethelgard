<script setup lang="ts">
import { ref } from 'vue'

const currentView = ref<'menu' | 'rpg-game'>('rpg-game')

function goBack() {
  currentView.value = 'menu'
}
</script>

<template>
  <div class="game-container">
    <!-- RPG 游戏界面 - 主入口 -->
    <div v-if="currentView === 'rpg-game'" class="rpg-screen">
      <iframe 
        src="/rpg-game/index.html" 
        class="rpg-iframe"
        frameborder="0"
      ></iframe>
    </div>
    
    <!-- 主菜单 -->
    <div v-else class="menu-screen">
      <div class="menu-bg">
        <div class="stars"></div>
        <div class="mountains"></div>
      </div>
      
      <div class="menu-content">
        <div class="logo-section">
          <h1 class="game-title">⚔️ Aethelgard ⚔️</h1>
          <p class="subtitle">MMO RPG 世界</p>
        </div>
        
        <div class="menu-buttons">
          <button 
            @click="currentView = 'rpg-game'"
            class="menu-btn primary"
          >
            <span class="btn-icon">🎮</span>
            <span class="btn-text">
              <strong>开始游戏</strong>
              <small>进入奇幻世界冒险</small>
            </span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
        
        <div class="credits">
          <p>Powered by RPG-JS</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  color: white;
  overflow: hidden;
  position: relative;
}

/* RPG 游戏全屏 */
.rpg-screen {
  width: 100%;
  height: 100%;
}

.rpg-iframe {
  width: 100%;
  height: 100%;
  border: none;
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
    radial-gradient(1px 1px at 90px 40px, #fff, transparent);
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
  background: linear-gradient(to top, #16213e, transparent);
}

.menu-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.logo-section {
  margin-bottom: 3rem;
}

.game-title {
  font-size: 4rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
}

.subtitle {
  font-size: 1.2rem;
  color: #a0a0a0;
  margin-top: 0.5rem;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 400px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(10px);
}

.menu-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

.menu-btn.primary:hover {
  transform: scale(1.05);
}

.btn-icon {
  font-size: 2rem;
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-text strong {
  font-size: 1.2rem;
}

.btn-text small {
  font-size: 0.8rem;
  opacity: 0.7;
}

.btn-arrow {
  margin-left: auto;
  font-size: 1.5rem;
}

.credits {
  position: absolute;
  bottom: 2rem;
  color: #666;
  font-size: 0.8rem;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
