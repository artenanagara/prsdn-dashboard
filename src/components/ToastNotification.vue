<script setup lang="ts">
import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
  const id = nextId++;
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    remove(id);
  }, duration);
};

const remove = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

defineExpose({
  show
});
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
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
