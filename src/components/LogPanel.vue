<template>
  <div class="log-panel">
    <div class="log-header">
      <h2>📊 시스템 로그</h2>
      <button @click="emit('clear')" class="clear-btn">로그 지우기</button>
    </div>
    
    <div class="log-content">
      <div 
        v-for="(log, i) in logs" 
        :key="i" 
        class="log-item"
        :class="`log-${log.type}`"
      >
        <span class="log-time">[{{ log.time }}]</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="empty-state">
        로그가 없습니다
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LogItem {
  time: string;
  message: string;
  type?: string;
}

defineProps<{
  logs: LogItem[]
}>();

const emit = defineEmits<{
  clear: []
}>();
</script>

