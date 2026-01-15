<template>
  <div class="stats-panel">
    <h2>📊 시스템 통계</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">총 주문</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>

      <div class="stat-card success">
        <div class="stat-label">성공률</div>
        <div class="stat-value">{{ successRate }}%</div>
        <div class="stat-sub">{{ stats.completed }}건 완료</div>
      </div>

      <div class="stat-card warning">
        <div class="stat-label">재시도</div>
        <div class="stat-value">{{ stats.retried }}</div>
        <div class="stat-sub">{{ retrySuccessRate }}% 복구</div>
      </div>

      <div class="stat-card info">
        <div class="stat-label">큐 대기</div>
        <div class="stat-value">{{ stats.queued }}</div>
        <div class="stat-sub">{{ stats.queued > 0 ? "재연결 필요" : "정상" }}</div>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-label">성공</div>
      <div class="progress-track">
        <div
          class="progress-fill success"
          :style="{ width: successRate + '%' }"
        ></div>
      </div>
      <div class="progress-percent">{{ successRate }}%</div>
    </div>

    <div class="stats-details">
      <div class="detail-item">
        <span class="detail-label">⏱️ 평균 응답</span>
        <span class="detail-value">{{ stats.avgResponseTime }}ms</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">🔄 재연결</span>
        <span class="detail-value">{{ stats.reconnections }}회</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">❌ 실패</span>
        <span class="detail-value">{{ stats.failed }}건</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Stats {
  total: number;
  completed: number;
  failed: number;
  queued: number;
  retried: number;
  retriedSuccess: number;
  avgResponseTime: number;
  reconnections: number;
}

const props = defineProps<{
  stats: Stats;
}>();

const successRate = computed(() => {
  if (props.stats.total === 0) return 0;
  return Math.round((props.stats.completed / props.stats.total) * 100);
});

const retrySuccessRate = computed(() => {
  if (props.stats.retried === 0) return 0;
  return Math.round((props.stats.retriedSuccess / props.stats.retried) * 100);
});
</script>

