<script setup lang="ts">
import { computed } from 'vue';
import { Search, Users, Calendar, FileText, Inbox } from 'lucide-vue-next';

const props = defineProps<{
  icon?: 'search' | 'users' | 'calendar' | 'file' | 'inbox';
  title?: string;
  message?: string;
  actionText?: string;
  actionHandler?: () => void;
}>();

const iconComponent = computed(() => {
  switch (props.icon) {
    case 'search':
      return Search;
    case 'users':
      return Users;
    case 'calendar':
      return Calendar;
    case 'file':
      return FileText;
    case 'inbox':
    default:
      return Inbox;
  }
});

const defaultTitle = computed(() => {
  return props.title || 'Tidak ada data';
});

const defaultMessage = computed(() => {
  return props.message || 'Belum ada data yang tersedia saat ini.';
});
</script>

<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <component :is="iconComponent" :size="48" />
    </div>
    <h3 class="empty-state-title">{{ defaultTitle }}</h3>
    <p class="empty-state-message">{{ defaultMessage }}</p>
    <button
      v-if="actionText && actionHandler"
      @click="actionHandler"
      class="btn btn-primary"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  min-height: 300px;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-message {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 400px;
  margin-bottom: var(--space-6);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .empty-state {
    padding: var(--space-6) var(--space-3);
    min-height: 250px;
  }

  .empty-state-icon {
    width: 64px;
    height: 64px;
  }

  .empty-state-title {
    font-size: var(--text-lg);
  }

  .empty-state-message {
    font-size: var(--text-sm);
  }
}
</style>
