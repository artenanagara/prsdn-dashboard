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
      <div class="card-stat-icon" v-if="icon">{{ icon }}</div>
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
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 252, 0.98) 100%);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.card-stat::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0.85;
}

.card-stat:hover {
  transform: translateY(-2px);
}

.card-stat-header {
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.card-stat-icon {
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.14));
  font-size: 1rem;
}

.card-stat-title {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.card-stat-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.card-stat-value {
  font-size: 1.75rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  letter-spacing: 0;
}

.card-stat-trend {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #f7fafc;
  border: 1px solid var(--color-border-light);
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
