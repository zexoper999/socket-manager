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

      <!-- 통계 패널 -->
      <!-- <section class="stats-section">
        <StatsPanel :stats="stats" />
      </section> -->

      <!-- 연결 상태 -->
      <!-- <section class="connection-section">
        <ConnectionStatus
          :isConnected="isConnected"
          :latency="connectionInfo.latency"
          :reconnectCount="connectionInfo.reconnectCount"
          :queueSize="connectionInfo.queueSize"
          :lastConnected="connectionInfo.lastConnected"
        />
      </section> -->

      <!-- 로그 화면 -->
      <section class="log-section">
        <LogPanel :logs="logs" @clear="clearLogs" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { SocketManager } from "./SocketManager";
import OrderPanel from "./components/OrderPanel.vue";
import OrderDashboard from "./components/OrderDashboard.vue";
import LogPanel from "./components/LogPanel.vue";
import StatsPanel from "./components/StatsPanel.vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";

interface LogItem {
  time: string;
  message: string;
  type?: string;
}

const isConnected = ref(false);
const logs = ref<LogItem[]>([]);
const orders = ref<any[]>([]);
const reconnectCount = ref(0);
const requestStartTimes = new Map<string, number>();

// 통계 데이터
const stats = computed(() => {
  const total = orders.value.length;
  const completed = orders.value.filter((o) => o.status === "completed").length;
  const failed = orders.value.filter((o) => o.status === "failed").length;
  const queued = orders.value.filter((o) => o.status === "queued").length;
  const retried = orders.value.filter((o) => o.retried).length;
  const retriedSuccess = orders.value.filter(
    (o) => o.retried && o.status === "completed"
  ).length;

  // 평균 응답 시간 계산
  const completedOrders = orders.value.filter(
    (o) => o.status === "completed" && o.responseTime
  );
  const avgResponseTime =
    completedOrders.length > 0
      ? Math.round(
          completedOrders.reduce((sum, o) => sum + o.responseTime, 0) /
            completedOrders.length
        )
      : 0;

  return {
    total,
    completed,
    failed,
    queued,
    retried,
    retriedSuccess,
    avgResponseTime,
    reconnections: reconnectCount.value,
  };
});

// 연결 정보
const connectionInfo = computed(() => ({
  latency: 45, // 실제로는 ping-pong으로 측정
  reconnectCount: reconnectCount.value,
  queueSize: orders.value.filter((o) => o.status === "queued").length,
  lastConnected: isConnected.value
    ? "방금 전"
    : reconnectCount.value > 0
    ? `${reconnectCount.value}회 전`
    : "연결 안됨",
}));

let socketManager: SocketManager;

// 재연결 감지
watch(isConnected, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    reconnectCount.value++;
  }
});

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
      const prevStatus = order.status;
      order.status = status;

      // 재시도 추적
      if (status === "retrying") {
        order.retried = true;
      }

      // 응답 시간 측정
      if (status === "completed" && requestStartTimes.has(orderId)) {
        const startTime = requestStartTimes.get(orderId)!;
        order.responseTime = Date.now() - startTime;
        requestStartTimes.delete(orderId);
      }
    }
  };
});

const handleOrder = (orderData: any) => {
  const orderId = socketManager.sendOrder(orderData);

  // 요청 시작 시간 기록
  requestStartTimes.set(orderId, Date.now());

  // 대시보드에 주문 추가
  orders.value.unshift({
    id: orderId,
    time: new Date().toLocaleTimeString(),
    ...orderData,
    status: "processing",
    retried: false,
    responseTime: 0,
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
