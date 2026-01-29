<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h2>💬 채팅</h2>
      <span class="room-name">전체 채팅</span>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :class="{ 'my-message': msg.isMine }"
      >
        <div class="message-author">{{ msg.author }}</div>
        <div class="message-content">{{ msg.content }}</div>
        <div class="message-time">{{ msg.time }}</div>
      </div>

      <!-- 메시지 없을 때 -->
      <div v-if="messages.length === 0" class="empty-state">
        <p>💬 첫 메시지를 보내보세요!</p>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        type="text"
        placeholder="메시지를 입력하세요..."
        :disabled="!isConnected"
      />
      <button @click="sendMessage" :disabled="!isConnected || !newMessage.trim()">
        전송
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";

interface Message {
  id: string;
  author: string;
  content: string;
  time: string;
  isMine: boolean;
}

const props = defineProps<{
  isConnected: boolean;
}>();

const emit = defineEmits<{
  send: [message: string];
}>();

const messages = ref<Message[]>([
  // 임시 더미 데이터 (나중에 제거)
  {
    id: "1",
    author: "시스템",
    content: "채팅방에 오신 것을 환영합니다!",
    time: new Date().toLocaleTimeString(),
    isMine: false,
  },
]);

const newMessage = ref("");
const messagesContainer = ref<HTMLElement>();

const sendMessage = () => {
  const content = newMessage.value.trim();
  if (!content || !props.isConnected) return;

  // 임시로 내 메시지 추가 (나중에 소켓 연동 시 실제 전송)
  messages.value.push({
    id: Date.now().toString(),
    author: "나",
    content,
    time: new Date().toLocaleTimeString(),
    isMine: true,
  });

  emit("send", content);
  newMessage.value = "";

  // 스크롤 맨 아래로
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .room-name {
    font-size: 14px;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7f8fa;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  animation: slideIn 0.2s ease-out;

  &.my-message {
    align-self: flex-end;

    .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message-author {
      align-self: flex-end;
    }

    .message-time {
      align-self: flex-end;
    }
  }
}

.message-author {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 4px;
}

.message-content {
  background: white;
  padding: 10px 14px;
  border-radius: 12px;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  line-height: 1.5;
}

.message-time {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 4px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 14px;
}

.chat-input {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &:disabled {
      background: #f7f8fa;
      cursor: not-allowed;
    }
  }

  button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
