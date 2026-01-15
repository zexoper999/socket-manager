<template>
  <div class="app-container">
    <header>
      <h1>Real Time Order System</h1>
      <div class="status-badge" :class="{ connected: isConnected }">
        {{ isConnected ? "● Connected" : "○ Disconnected" }}
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

const isConnected = ref(false);
const logs = ref<string[]>([]);
const orders = ref<any[]>([]);

let socketManager: SocketManager;

onMounted(() => {
  // 소켓 매니저 초기화
  socketManager = new SocketManager("http://localhost:3005", (msg) => {
    const time = new Date().toLocaleTimeString();
    logs.value.unshift(`[${time}] ${msg}`);
  });

  // 연결 상태 감지
  socketManager.onStatusChange = (status) => {
    isConnected.value = status;
  };
});

const handleOrder = (orderData: any) => {
  socketManager.sendOrder(orderData);

  // 대시보드에 주문 추가
  orders.value.unshift({
    id: Math.random().toString().slice(2, 8),
    time: new Date().toLocaleTimeString(),
    ...orderData,
    status: "pending",
  });
};

const clearLogs = () => {
  logs.value = [];
};
</script>
