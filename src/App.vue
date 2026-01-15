<template>
  <div class="app-container">
    <header>
      <h1>Real Time Order System</h1>
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
    </header>

    <main class="main-content">
      <!-- 주문 화면 -->
      <section class="order-section">
        <OrderPanel @order="handleOrder" />
      </section>

      <!-- 주문 대시보드 -->
      <section class="dashboard-section">
        <OrderDashboard :orders="orders" />
      </section>

      <!-- 로그 화면 -->
      <section class="log-section">
        <LogPanel :logs="logs" @clear="clearLogs" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { SocketManager } from "./SocketManager";
import OrderPanel from "./components/OrderPanel.vue";
import OrderDashboard from "./components/OrderDashboard.vue";
import LogPanel from "./components/LogPanel.vue";

interface LogItem {
  time: string;
  message: string;
  type?: string;
}

const isConnected = ref(false);
const logs = ref<LogItem[]>([]);
const orders = ref<any[]>([]);

let socketManager: SocketManager;

onMounted(() => {
  // 소켓 매니저 초기화
  socketManager = new SocketManager("http://localhost:3005", (msg, type) => {
    const time = new Date().toLocaleTimeString();
    logs.value.unshift({
      time,
      message: msg,
      type: type || "info",
    });
  });

  // 연결 상태 감지
  socketManager.onStatusChange = (status) => {
    isConnected.value = status;
  };

  // 주문 상태 변경 감지
  socketManager.onOrderStatusChange = (orderId, status) => {
    const order = orders.value.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
    }
  };
});

const handleOrder = (orderData: any) => {
  const orderId = socketManager.sendOrder(orderData);

  // 대시보드에 주문 추가
  orders.value.unshift({
    id: orderId,
    time: new Date().toLocaleTimeString(),
    ...orderData,
    status: "processing",
  });
};

const clearLogs = () => {
  logs.value = [];
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
