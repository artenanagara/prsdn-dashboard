<script setup lang="ts">
import { useUIStore } from '../stores/ui';

const uiStore = useUIStore();

const remove = (id: number) => {
  uiStore.removeToast(id);
};
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="remove(toast.id)"
      >
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
}

.toast {
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 500px;
  pointer-events: all;
  cursor: pointer;
  transition: all var(--transition-base);
}

.toast:hover {
  transform: translateX(-4px);
}

.toast-message {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.toast-success {
  background-color: var(--color-success);
  color: white;
}

.toast-error {
  background-color: var(--color-danger);
  color: white;
}

.toast-warning {
  background-color: var(--color-warning);
  color: white;
}

.toast-info {
  background-color: var(--color-info);
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
