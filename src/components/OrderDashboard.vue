<template>
  <div class="order-dashboard">
    <h2>📋 주문 현황</h2>

    <div class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        :class="order.status"
      >
        <div class="order-header">
          <span class="order-time">⏰ {{ order.time }}</span>
          <span class="order-id">#{{ order.id }}</span>
        </div>
        <div class="order-menu">{{ order.menu }}</div>
        <div class="order-footer">
          <span class="order-price">{{ order.price?.toLocaleString() }}원</span>
          <span class="order-status">{{ getStatusText(order.status) }}</span>
        </div>
      </div>

      <div v-if="orders.length === 0" class="empty-state">
        주문 내역이 없습니다
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  orders: any[];
}>();

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "대기중",
    processing: "전송중",
    completed: "완료",
    failed: "실패",
    queued: "큐 대기",
    retrying: "재시도중",
  };
  return statusMap[status] || status;
};
</script>
