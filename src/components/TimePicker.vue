<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Clock } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref<any>({});

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const selectedHour = ref('00');
const selectedMinute = ref('00');

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const [h, m] = newVal.split(':');
    if (h) selectedHour.value = h;
    if (m) selectedMinute.value = m;
  }
}, { immediate: true });

const updateDropdownPosition = () => {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const dropdownHeight = 220;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpwards = spaceBelow < dropdownHeight;

  dropdownStyles.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: '160px',
    top: openUpwards ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
    zIndex: 9999
  };
};

const toggleDropdown = () => {
  if (!isOpen.value) {
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
  } else {
    window.removeEventListener('scroll', updateDropdownPosition, true);
    window.removeEventListener('resize', updateDropdownPosition);
  }
  isOpen.value = !isOpen.value;
};

const selectHour = (h: string) => {
  selectedHour.value = h;
  updateValue();
};

const selectMinute = (m: string) => {
  selectedMinute.value = m;
  updateValue();
};

const updateValue = () => {
  emit('update:modelValue', `${selectedHour.value}:${selectedMinute.value}`);
};

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.time-picker-container') && !target.closest('.time-picker-dropdown')) {
    isOpen.value = false;
    window.removeEventListener('scroll', updateDropdownPosition, true);
    window.removeEventListener('resize', updateDropdownPosition);
  }
};

onMounted(() => {
  window.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown);
  window.removeEventListener('scroll', updateDropdownPosition, true);
  window.removeEventListener('resize', updateDropdownPosition);
});
</script>

<template>
  <div class="time-picker-container" ref="triggerRef">
    <div 
      class="time-picker-trigger form-input" 
      :class="{ 'is-open': isOpen }"
      @click.stop="toggleDropdown"
    >
      <div class="time-display">
        <span v-if="!modelValue" class="placeholder">{{ placeholder || '--:--' }}</span>
        <span v-else>{{ modelValue }}</span>
      </div>
      <Clock :size="18" class="clock-icon" />
    </div>

    <Teleport to="body">
      <Transition name="fade-slide">
        <div 
          v-if="isOpen" 
          class="time-picker-dropdown"
          :style="dropdownStyles"
          @click.stop
        >
          <div class="picker-columns">
            <div class="picker-column">
              <div class="column-header">Hr</div>
              <div class="column-items">
                <button 
                  v-for="h in hours" 
                  :key="h"
                  type="button"
                  :class="['item-btn', { active: selectedHour === h }]"
                  @click="selectHour(h)"
                >
                  {{ h }}
                </button>
              </div>
            </div>
            <div class="picker-column">
              <div class="column-header">Min</div>
              <div class="column-items">
                <button 
                  v-for="m in minutes" 
                  :key="m"
                  type="button"
                  :class="['item-btn', { active: selectedMinute === m }]"
                  @click="selectMinute(m)"
                >
                  {{ m }}
                </button>
              </div>
            </div>
          </div>
          <div class="picker-footer">
            <button 
              type="button" 
              class="btn btn-primary btn-sm w-full" 
              @click="isOpen = false"
            >
              Set Time
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.time-picker-container {
  position: relative;
  width: 100%;
}

.time-picker-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: var(--color-surface);
  transition: all var(--transition-base);
  user-select: none;
}

.time-picker-trigger:hover {
  border-color: var(--color-primary);
}

.time-picker-trigger.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.placeholder {
  color: var(--color-text-tertiary);
}

.clock-icon {
  color: var(--color-primary);
}

.time-picker-dropdown {
  z-index: 9999;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.picker-columns {
  display: flex;
  height: 160px;
}

.picker-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-light);
}

.picker-column:last-child {
  border-right: none;
}

.column-header {
  padding: var(--space-1) var(--space-2);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-align: center;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border-light);
}

.column-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.column-items::-webkit-scrollbar {
  width: 3px;
}
.column-items::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 2px;
}

.item-btn {
  padding: var(--space-2);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  transition: all var(--transition-fast);
  color: var(--color-text-primary);
}

.item-btn:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.item-btn.active {
  background-color: var(--color-primary);
  color: white;
}

.picker-footer {
  padding: var(--space-2);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-surface);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
