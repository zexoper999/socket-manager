<template>
  <div class="connection-status">
    <h2>📡 연결 상태</h2>

    <div class="status-main">
      <div class="status-indicator" :class="{ connected: isConnected }">
        <div class="pulse-ring"></div>
        <div class="pulse-dot"></div>
      </div>
      <div class="status-text">
        <div class="status-label">
          {{ isConnected ? "연결됨" : "연결 끊김" }}
        </div>
        <div class="status-sub">
          {{
            isConnected
              ? "실시간 통신 활성화"
              : "오프라인 모드 (큐 저장 중)"
          }}
        </div>
      </div>
    </div>

    <div class="connection-details">
      <div class="detail-row">
        <span class="detail-icon">⚡</span>
        <span class="detail-label">지연시간</span>
        <span class="detail-value" :class="latencyClass">{{ latency }}ms</span>
      </div>

      <div class="detail-row">
        <span class="detail-icon">🔄</span>
        <span class="detail-label">재연결 횟수</span>
        <span class="detail-value">{{ reconnectCount }}회</span>
      </div>

      <div class="detail-row">
        <span class="detail-icon">📦</span>
        <span class="detail-label">큐 상태</span>
        <span class="detail-value" :class="queueClass">
          {{ queueSize > 0 ? `${queueSize}건 대기` : "비어있음" }}
        </span>
      </div>

      <div class="detail-row">
        <span class="detail-icon">🕐</span>
        <span class="detail-label">마지막 연결</span>
        <span class="detail-value">{{ lastConnected }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  isConnected: boolean;
  latency: number;
  reconnectCount: number;
  queueSize: number;
  lastConnected: string;
}>();

const latencyClass = computed(() => {
  if (props.latency < 100) return "good";
  if (props.latency < 300) return "ok";
  return "bad";
});

const queueClass = computed(() => {
  return props.queueSize > 0 ? "warning" : "good";
});
</script>

