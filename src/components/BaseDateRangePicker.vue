<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';

const props = defineProps<{
  start: string | null;
  end: string | null;
  placeholder?: string;
}>();

const emit = defineEmits(['update:start', 'update:end']);

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

// Date logic
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Initialize from start or current date
watch(() => props.start, (newVal) => {
  if (newVal) {
    const d = new Date(newVal);
    if (!isNaN(d.getTime())) {
      currentMonth.value = d.getMonth();
      currentYear.value = d.getFullYear();
    }
  }
}, { immediate: true });

const formattedRange = computed(() => {
  if (!props.start && !props.end) return '';
  
  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '...';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (props.start && props.end) {
    return `${formatDateStr(props.start)} - ${formatDateStr(props.end)}`;
  }
  return props.start ? `${formatDateStr(props.start)} - ...` : `... - ${formatDateStr(props.end)}`;
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const days = [];
  
  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      month: month - 1,
      year: year,
      isCurrentMonth: false
    });
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }
  
  // Next month padding
  const totalDays = 42; 
  const nextMonthDays = totalDays - days.length;
  for (let i = 1; i <= nextMonthDays; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: year,
      isCurrentMonth: false
    });
  }
  
  return days;
});

const isSelected = (day: number, month: number, year: number) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return dateStr === props.start || dateStr === props.end;
};

const isInRange = (day: number, month: number, year: number) => {
  if (!props.start || !props.end) return false;
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return dateStr > props.start && dateStr < props.end;
};

const isToday = (day: number, month: number, year: number) => {
  const today = new Date();
  return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
};

const selectDate = (day: number, month: number, year: number) => {
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  if (!props.start || (props.start && props.end)) {
    // Start fresh selection
    emit('update:start', dateStr);
    emit('update:end', null);
  } else {
    // Select end date
    if (dateStr < props.start) {
      // If clicked before start, make it the new start
      emit('update:start', dateStr);
    } else {
      emit('update:end', dateStr);
      // Close after selecting range? Usually yes for UX if it's just two clicks
      // isOpen.value = false;
    }
  }
};

const changeMonth = (delta: number) => {
  currentMonth.value += delta;
  if (currentMonth.value > 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11;
    currentYear.value--;
  }
};

const years = computed(() => {
  const current = new Date().getFullYear();
  const list = [];
  for (let i = current + 5; i >= current - 10; i--) {
    list.push(i);
  }
  return list;
});

const handleOutsideClick = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true);
});

const clearRange = (e: Event) => {
  e.stopPropagation();
  emit('update:start', null);
  emit('update:end', null);
};
</script>

<template>
  <div class="base-date-range-picker" ref="containerRef">
    <div class="input-wrapper" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen">
      <CalendarIcon class="input-icon" :size="18" />
      <div v-if="start || end" class="selected-value">{{ formattedRange }}</div>
      <div v-else class="placeholder">{{ placeholder || 'Pilih rentang tanggal' }}</div>
      <button v-if="start || end" class="clear-btn" @click="clearRange" type="button">
        <X :size="14" />
      </button>
    </div>

    <transition name="popover">
      <div v-if="isOpen" class="calendar-popover">
        <div class="calendar-header">
          <div class="nav-controls">
            <button class="nav-btn" @click="changeMonth(-1)" type="button">
              <ChevronLeft :size="18" />
            </button>
            <div class="month-year-display">
              <span class="month-name">{{ months[currentMonth] }}</span>
              <select v-model="currentYear" class="year-select">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <button class="nav-btn" @click="changeMonth(1)" type="button">
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>

        <div class="calendar-grid">
          <div v-for="day in daysOfWeek" :key="day" class="weekday-label">
            {{ day }}
          </div>
          <div
            v-for="(date, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'is-current-month': date.isCurrentMonth,
              'is-selected': isSelected(date.day, date.month, date.year),
              'is-in-range': isInRange(date.day, date.month, date.year),
              'is-today': isToday(date.day, date.month, date.year)
            }"
            @click="selectDate(date.day, date.month, date.year)"
          >
            {{ date.day }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.base-date-range-picker {
  position: relative;
  width: fit-content;
  min-width: 200px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 42px;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.input-wrapper:hover {
  border-color: var(--color-border);
  background-color: #fafbfc;
  box-shadow: var(--shadow-md);
}

.input-wrapper.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1), var(--shadow-md);
}

.input-icon {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.selected-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.placeholder {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.clear-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-left: var(--space-2);
}

.clear-btn:hover {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

.calendar-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 300px;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  padding: var(--space-4);
}

.calendar-header {
  margin-bottom: var(--space-4);
}

.nav-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.month-year-display {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.month-name {
  min-width: 90px;
  text-align: center;
  font-size: var(--text-sm);
}

.year-select {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-md);
  outline: none;
  font-size: var(--text-sm);
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.nav-btn:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border-color: var(--color-primary-light);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.weekday-label {
  text-align: center;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  padding: var(--space-2) 0;
}

.calendar-day {
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

.calendar-day.is-current-month {
  color: var(--color-text-primary);
}

.calendar-day:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.calendar-day.is-selected {
  background-color: var(--color-primary) !important;
  color: white !important;
  font-weight: var(--font-weight-bold);
}

.calendar-day.is-in-range {
  background-color: rgba(30, 58, 138, 0.08);
  border-radius: 0;
}

.calendar-day.is-today {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  text-decoration: underline;
}

.popover-enter-active,
.popover-leave-active {
  transition: all 0.2s;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
