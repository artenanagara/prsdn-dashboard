<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
});

const cardClass = computed(() => {
  const base = 'card card-stat';
  const variants = {
    default: '',
    primary: 'card-stat-primary',
    success: 'card-stat-success',
    warning: 'card-stat-warning',
    danger: 'card-stat-danger',
    info: 'card-stat-info'
  };
  return `${base} ${variants[props.variant]}`;
});
</script>

<template>
  <div :class="cardClass">
    <div class="card-stat-header">
      <span class="card-stat-title">{{ title }}</span>
    </div>
    <div class="card-stat-body">
      <div class="card-stat-value">{{ value }}</div>
      <div v-if="trend" class="card-stat-trend" :class="trend.isPositive ? 'trend-up' : 'trend-down'">
        <span>{{ trend.isPositive ? '↑' : '↓' }} {{ Math.abs(trend.value) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-stat {
  padding: var(--space-6);
  transition: transform var(--transition-base);
}

.card-stat:hover {
  transform: translateY(-2px);
}

.card-stat-header {
  margin-bottom: var(--space-4);
}

.card-stat-title {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.card-stat-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.card-stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.card-stat-trend {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.trend-up {
  color: var(--color-success);
}

.trend-down {
  color: var(--color-danger);
}

.card-stat-primary .card-stat-value {
  color: var(--color-primary);
}

.card-stat-success .card-stat-value {
  color: var(--color-success);
}

.card-stat-warning .card-stat-value {
  color: var(--color-warning);
}

.card-stat-danger .card-stat-value {
  color: var(--color-danger);
}

.card-stat-info .card-stat-value {
  color: var(--color-info);
}
</style>
