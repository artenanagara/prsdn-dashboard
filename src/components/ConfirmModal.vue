<script setup lang="ts">
import { useUIStore } from '../stores/ui';
import BaseCard from './BaseCard.vue';
import { AlertCircle, HelpCircle } from 'lucide-vue-next';

const uiStore = useUIStore();

const handleConfirm = () => {
  uiStore.handleConfirm(true);
};

const handleCancel = () => {
  uiStore.handleConfirm(false);
};
</script>

<template>
  <Transition name="fade">
    <div v-if="uiStore.isConfirmOpen" class="modal-overlay" @click.self="handleCancel">
      <BaseCard class="confirm-modal-content" no-padding>
        <div class="confirm-body">
          <div :class="['confirm-icon', `icon-${uiStore.confirmOptions.variant}`]">
            <AlertCircle v-if="uiStore.confirmOptions.variant === 'danger'" :size="32" />
            <HelpCircle v-else :size="32" />
          </div>
          <div class="confirm-text">
            <h3 class="confirm-title">{{ uiStore.confirmOptions.title }}</h3>
            <p class="confirm-message">{{ uiStore.confirmOptions.message }}</p>
          </div>
        </div>
        
        <template #footer>
          <div class="confirm-actions">
            <button @click="handleCancel" class="btn btn-secondary">
              {{ uiStore.confirmOptions.cancelText }}
            </button>
            <button 
              @click="handleConfirm" 
              :class="['btn', uiStore.confirmOptions.variant === 'danger' ? 'btn-danger' : 'btn-primary']"
            >
              {{ uiStore.confirmOptions.confirmText }}
            </button>
          </div>
        </template>
      </BaseCard>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--space-6);
}

.confirm-modal-content {
  max-width: 450px;
  width: 100%;
}

.confirm-body {
  padding: var(--space-8) var(--space-8) var(--space-6) var(--space-8);
  display: flex;
  gap: var(--space-6);
  align-items: flex-start;
}

.confirm-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-danger { color: var(--color-danger); }
.icon-primary { color: var(--color-primary); }

.confirm-text {
  flex: 1;
}

.confirm-title {
  margin-bottom: var(--space-2);
  font-size: var(--text-lg);
}

.confirm-message {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
