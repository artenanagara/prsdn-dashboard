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
      <div class="card-heading">
        <span v-if="title" class="card-accent"></span>
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </div>
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
  background: #ffffff;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(16px);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
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
  transform: translateY(-1px);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.card-accent {
  width: 4px;
  height: 20px;
  border-radius: 999px;
  background: var(--gradient-primary);
  box-shadow: 0 0 0 4px rgba(15, 111, 143, 0.07);
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
  padding: var(--space-5) var(--space-6) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  background-color: #f8fafb;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

/* Variants */
.card-primary { border-top: 3px solid var(--color-primary); }
.card-success { border-top: 3px solid var(--color-success); }
.card-warning { border-top: 3px solid var(--color-warning); }
.card-danger { border-top: 3px solid var(--color-danger); }

</style>
