<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const messagesRef = ref<HTMLElement | null>(null)

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(() => store.messages.length, scrollToBottom)
</script>

<template>
  <div class="dialogue-overlay" @click.self="store.closeDialogue">
    <div class="dialogue-box">
      <!-- 对话框头部 -->
      <div class="dialogue-header">
        <span class="npc-emoji">{{ store.currentNPC?.emoji }}</span>
        <span class="npc-name">{{ store.currentNPC?.name }}</span>
        <button class="close-btn" @click="store.closeDialogue">✕</button>
      </div>
      
      <!-- 消息列表 -->
      <div class="messages" ref="messagesRef">
        <div 
          v-for="(msg, index) in store.messages" 
          :key="index"
          class="message"
          :class="msg.speaker"
        >
          <span class="avatar">{{ msg.speaker === 'player' ? '🧙' : store.currentNPC?.emoji }}</span>
          <div class="content">{{ msg.content }}</div>
        </div>
        
        <!-- 打字中 -->
        <div v-if="store.isTyping" class="message npc typing">
          <span class="avatar">{{ store.currentNPC?.emoji }}</span>
          <div class="content">
            <span class="typing-dots">...</span>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <input 
          v-model="store.playerInput"
          type="text"
          placeholder="输入你的话..."
          :disabled="store.isTyping"
          @keyup.enter="store.sendMessage"
        />
        <button 
          @click="store.sendMessage"
          :disabled="!store.playerInput.trim() || store.isTyping"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialogue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialogue-box {
  width: 90%;
  max-width: 600px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #667eea;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.dialogue-header {
  padding: 1rem;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.npc-emoji {
  font-size: 2rem;
}

.npc-name {
  flex: 1;
  font-size: 1.2rem;
  font-weight: bold;
}

.close-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.messages {
  height: 300px;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 80%;
}

.message.player {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.npc {
  align-self: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message.player .avatar {
  background: #667eea;
}

.message.npc .avatar {
  background: #764ba2;
}

.content {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.message.player .content {
  background: #667eea;
  border-bottom-right-radius: 4px;
}

.message.npc .content {
  background: rgba(255,255,255,0.1);
  border-bottom-left-radius: 4px;
}

.typing-dots {
  animation: typing 1.5s infinite;
}

@keyframes typing {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

.input-area {
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.input-area input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.input-area input:focus {
  outline: none;
  border-color: #667eea;
}

.input-area input::placeholder {
  color: #666;
}

.input-area button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.input-area button:hover:not(:disabled) {
  background: #5a6fd6;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
