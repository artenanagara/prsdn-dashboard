<script setup lang="ts">
import { computed } from 'vue';

interface Event {
  id: string;
  title: string;
  date: number;
  type: string;
  originalDate: string;
  is_cuti: boolean;
}

interface Props {
  events: Event[];
  maxItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 50
});

const formatDate = (dateMs: number) => {
  return new Date(dateMs).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const displayedEvents = computed(() => {
  return props.events.slice(0, props.maxItems);
});
</script>

<template>
  <div class="upcoming-scroll-area">
    <div v-if="events.length === 0" class="text-secondary text-sm text-center py-4">
      Tidak ada event mendatang.
    </div>
    <div v-else class="upcoming-list">
      <div v-for="event in displayedEvents" :key="event.id" class="upcoming-item">
        <div class="upcoming-icon">
          <span v-if="event.type === 'birthday'">🎂</span>
          <span v-else-if="event.type === 'holiday' && event.is_cuti">🏖️</span>
          <span v-else-if="event.type === 'holiday'">🇮🇩</span>
          <span v-else>📅</span>
        </div>
        <div class="upcoming-details">
          <h4 class="upcoming-title">{{ event.title }}</h4>
          <span class="upcoming-date">{{ formatDate(event.date) }}</span>
        </div>
        <span :class="['badge', 
          event.type === 'birthday' ? 'badge-warning' : 
          event.type === 'holiday' ? (event.is_cuti ? 'badge-info' : 'badge-danger') : 'badge-outline']">
          {{ event.type === 'birthday' ? 'Ultah' : event.type === 'holiday' ? (event.is_cuti ? 'Cuti' : 'Libur') : 'Info' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upcoming-scroll-area {
  overflow-y: auto;
  padding: var(--space-6);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
}

.upcoming-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.upcoming-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-subtle);
  border-radius: var(--radius-md);
}

.upcoming-details {
  flex: 1;
}

.upcoming-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.upcoming-date {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

@media (max-width: 899px) {
  /* Show 5 items only on mobile */
  .upcoming-item:nth-child(n+6) {
    display: none;
  }
  
  .upcoming-scroll-area {
    height: auto;
  }
}
</style>
