<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

interface Props {
  expiresAt: number; // epoch ms
}

const props = defineProps<Props>();

const remainingSeconds = ref(0);
let intervalId: number | null = null;

const updateCountdown = () => {
  const now = Date.now();
  const diff = props.expiresAt - now;
  
  if (diff <= 0) {
    remainingSeconds.value = 0;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else {
    remainingSeconds.value = Math.ceil(diff / 1000);
  }
};

const isExpired = computed(() => remainingSeconds.value <= 0);
const displayText = computed(() => {
  if (isExpired.value) return 'Expired';
  return `${remainingSeconds.value}s`;
});

const colorClass = computed(() => {
  if (isExpired.value) return 'countdown-expired';
  if (remainingSeconds.value <= 10) return 'countdown-warning';
  return 'countdown-active';
});

const startCountdown = () => {
  // Clear existing interval if any
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Update immediately
  updateCountdown();
  
  // Start new interval
  intervalId = window.setInterval(updateCountdown, 250);
};

// Watch for changes in expiresAt prop (when token is regenerated)
watch(() => props.expiresAt, () => {
  startCountdown();
});

onMounted(() => {
  startCountdown();
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <span :class="['countdown-timer', colorClass]">
    {{ displayText }}
  </span>
</template>

<style scoped>
.countdown-timer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  transition: all var(--transition-base);
}

.countdown-active {
  color: #FFFFFF;
}

.countdown-warning {
  color: #FFFFFF;
  animation: pulse 1s ease-in-out infinite;
}

.countdown-expired {
  color: #FFFFFF;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
