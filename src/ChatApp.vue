<template>
  <div class="chat-app">
    <header class="chat-header">
      <div class="header-content">
        <h1>💬 Real-Time Chat</h1>
        <div class="header-right">
          <button
            v-if="isConnected"
            @click="disconnectTest"
            class="test-btn disconnect"
          >
            연결 끊기
          </button>
          <button v-else @click="connectTest" class="test-btn connect">
            재연결
          </button>
          <div class="status-badge" :class="{ connected: isConnected }">
            {{ isConnected ? "● Connected" : "○ Disconnected" }}
          </div>
        </div>
      </div>
    </header>

    <main class="chat-main">
      <div class="chat-container">
        <ChatPanel :isConnected="isConnected" @send="handleChatMessage" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { SocketManager } from "./SocketManager";
import ChatPanel from "./components/ChatPanel.vue";

const isConnected = ref(false);
let socketManager: SocketManager;

onMounted(() => {
  // 소켓 매니저 초기화
  socketManager = new SocketManager("http://localhost:3005", (msg, type) => {
    console.log(`[${type}]`, msg);
  });

  // 연결 상태 감지
  socketManager.onStatusChange = (status) => {
    isConnected.value = status;
  };
});

// 채팅 메시지 전송 (다음 단계에서 구현)
const handleChatMessage = (message: string) => {
  console.log("채팅 메시지:", message);
  // 2단계에서 소켓으로 전송할 예정
};

// 테스트용: 연결 끊기
const disconnectTest = () => {
  socketManager.disconnect();
};

// 테스트용: 다시 연결
const connectTest = () => {
  socketManager.connect();
};
</script>

<style scoped lang="scss">
.chat-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
  }

  .header-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .test-btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: white;

    &.disconnect {
      background: rgba(244, 67, 54, 0.9);

      &:hover {
        background: rgba(244, 67, 54, 1);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    }

    &.connect {
      background: rgba(76, 175, 80, 0.9);

      &:hover {
        background: rgba(76, 175, 80, 1);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .status-badge {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;

    &.connected {
      background: rgba(76, 175, 80, 0.9);
    }
  }
}

.chat-main {
  flex: 1;
  padding: 2rem;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.chat-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  height: 100%;
}
</style>
