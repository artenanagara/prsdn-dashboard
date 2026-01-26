<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  noPadding?: boolean;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  noPadding: false,
  title: undefined
});
</script>

<template>
  <div :class="['card', `card-${variant}`, { 'no-padding': noPadding }]">
    <div v-if="title || $slots.header" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header"></slot>
    </div>
    
    <div :class="['card-body', { 'p-0': noPadding }]">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
/* Base Styles from global CSS are strictly enforced here */
.card {
  background-color: #ffffff; /* Explicit white to be safe */
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  transition: all var(--transition-base);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Ensure children don't overflow rounded corners */
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-body {
  padding: var(--space-6);
  flex: 1;
}

.card-body.p-0 {
  padding: 0;
}

.card-header {
  padding: var(--space-6) var(--space-6) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-bg-secondary);
  border-bottom-left-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-xl);
}

/* Variants */
.card-primary { border-top: 4px solid var(--color-primary); }
.card-success { border-top: 4px solid var(--color-success); }
.card-warning { border-top: 4px solid var(--color-warning); }
.card-danger { border-top: 4px solid var(--color-danger); }

</style>
