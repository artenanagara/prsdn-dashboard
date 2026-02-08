<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  noPadding?: boolean;
  scrollableBody?: boolean;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  noPadding: false,
  scrollableBody: false,
  title: undefined
});
</script>

<template>
  <div :class="['card', `card-${variant}`, { 'no-padding': noPadding }]">
    <div v-if="title || $slots.header" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header"></slot>
    </div>
    
    <div :class="['card-body', { 'p-0': noPadding, 'scrollable': scrollableBody }]">
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
  /* Removed height: 100% to allow "hug content" behavior by default */
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden; /* Back to hidden by default for visual integrity */
}

/* New class to allow overflow when needed (e.g. for simple selects that don't use teleport) */
.card.overflow-visible {
  overflow: visible;
}

.card.h-full {
  height: 100%;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-body {
  padding: var(--space-6);
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Ensure body respects card radii if it's top or bottom */
.card-body:first-child {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}
.card-body:last-child {
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

.card-body.scrollable {
  overflow-y: auto; /* Opt-in internal scrolling */
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
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
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
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

/* Variants */
.card-primary { border-top: 4px solid var(--color-primary); }
.card-success { border-top: 4px solid var(--color-success); }
.card-warning { border-top: 4px solid var(--color-warning); }
.card-danger { border-top: 4px solid var(--color-danger); }

</style>
