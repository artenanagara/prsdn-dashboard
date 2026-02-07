<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string | null;
  placeholder?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
}>();

const emit = defineEmits(['update:modelValue']);

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

// Initialize from modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const d = new Date(newVal);
    if (!isNaN(d.getTime())) {
      currentMonth.value = d.getMonth();
      currentYear.value = d.getFullYear();
    }
  }
}, { immediate: true });

const formattedDate = computed(() => {
  if (!props.modelValue) return '';
  const d = new Date(props.modelValue);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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
  const totalDays = 42; // 6 rows
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
  if (!props.modelValue) return false;
  const d = new Date(props.modelValue);
  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
};

const isToday = (day: number, month: number, year: number) => {
  const today = new Date();
  return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
};

const selectDate = (day: number, month: number, year: number) => {
  // Use manual formatting to avoid UTC timezone shift
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const formatted = `${y}-${m}-${d}`;
  emit('update:modelValue', formatted);
  isOpen.value = false;
};

const selectToday = () => {
  const today = new Date();
  selectDate(today.getDate(), today.getMonth(), today.getFullYear());
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
  const end = props.maxYear || new Date().getFullYear() + 10;
  const start = props.minYear || 1950;
  const list = [];
  for (let i = end; i >= start; i--) {
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

const clearDate = (e: Event) => {
  e.stopPropagation();
  emit('update:modelValue', null);
};
</script>

<template>
  <div class="base-date-picker" ref="containerRef">
    <div class="input-wrapper" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen">
      <CalendarIcon class="input-icon" :size="18" />
      <div v-if="modelValue" class="selected-value">{{ formattedDate }}</div>
      <div v-else class="placeholder">{{ placeholder || 'Pilih tanggal' }}</div>
      <button v-if="modelValue" class="clear-btn" @click="clearDate" type="button">
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
              'is-today': isToday(date.day, date.month, date.year)
            }"
            @click="selectDate(date.day, date.month, date.year)"
          >
            {{ date.day }}
          </div>
        </div>

        <div class="calendar-footer">
          <button class="today-btn" @click="selectToday" type="button">
            Hari ini
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.base-date-picker {
  position: relative;
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 48px;
  position: relative;
}

.input-wrapper:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg-secondary);
}

.input-wrapper.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 59, 130, 246), 0.1);
  background-color: var(--color-surface);
}

.input-icon {
  color: var(--color-text-secondary);
}

.selected-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.placeholder {
  color: var(--color-text-secondary);
}

.clear-btn {
  position: absolute;
  right: var(--space-3);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.clear-btn:hover {
  background-color: var(--color-danger);
  color: white;
}

.calendar-header {
  margin-bottom: var(--space-4);
  padding: 0 var(--space-1);
}

.nav-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-bg-secondary);
  padding: 4px;
  border-radius: var(--radius-lg);
}

.month-year-display {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.month-name {
  min-width: 100px;
  text-align: center;
  font-size: var(--text-base);
  letter-spacing: -0.01em;
}

.year-select {
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: var(--radius-md);
  outline: none;
  font-size: var(--text-base);
  transition: all var(--transition-base);
}

.year-select:hover {
  background-color: var(--color-surface);
  border-color: var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.nav-btn:hover {
  background-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

.nav-btn:active {
  transform: scale(0.95);
}

.calendar-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 320px;
  max-width: calc(100vw - 40px);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  padding: var(--space-4);
  backdrop-filter: blur(8px);
}

/* Ensure popover stays on screen if near right edge */
@media (max-width: 480px) {
  .calendar-popover {
    left: auto;
    right: 0;
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1/1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

.calendar-day.is-current-month {
  color: var(--color-text-primary);
}

.calendar-day:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

.calendar-day.is-selected {
  background-color: var(--color-primary) !important;
  color: white !important;
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-md);
}

.calendar-day.is-today {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  border: 1px solid var(--color-primary);
}

.calendar-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.today-btn {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  cursor: pointer;
}

.today-btn:hover {
  text-decoration: underline;
}

/* Transitions */
.popover-enter-active,
.popover-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
