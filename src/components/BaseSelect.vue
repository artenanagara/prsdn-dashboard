<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';

interface Option {
  label: string;
  value: any;
}

interface Props {
  modelValue: any;
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih opsi...',
  disabled: false
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuPosition = ref({ top: '0px', left: '0px', width: '0px' });

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue);
});

const updatePosition = () => {
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    menuPosition.value = {
      top: `${rect.bottom + scrollY + 4}px`, // 4px gap
      left: `${rect.left + scrollX}px`,
      width: `${rect.width}px`
    };
  }
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (value: any) => {
  emit('update:modelValue', value);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // Check if click is outside trigger and outside menu
  if (
    selectRef.value && !selectRef.value.contains(target) &&
    menuRef.value && !menuRef.value.contains(target)
  ) {
    isOpen.value = false;
  }
};

watch(isOpen, async (newVal) => {
  if (newVal) {
    updatePosition();
    // Add event listeners for scroll and resize to keep menu attached
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    // Check if menu overflows bottom of viewport
    await nextTick();
    if (menuRef.value && triggerRef.value) {
      const menuRect = menuRef.value.getBoundingClientRect();
      const triggerRect = triggerRef.value.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (menuRect.bottom > viewportHeight && triggerRect.top > menuRect.height) {
        // Show above trigger instead
        menuPosition.value.top = `${triggerRect.top + window.scrollY - menuRect.height - 4}px`;
      }
    }
  } else {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<template>
  <div class="base-select-container" ref="selectRef" :class="{ 'is-disabled': disabled, 'is-open': isOpen }">
    <label v-if="label" class="form-label">{{ label }}</label>
    
    <div class="select-wrapper">
      <button 
        ref="triggerRef"
        type="button" 
        class="select-trigger" 
        @click="toggleDropdown"
        :class="{ 'is-active': isOpen }"
      >
        <span class="selected-text" :class="{ 'is-placeholder': !selectedOption }">
          {{ selectedOption ? selectedOption.label : placeholder }}
        </span>
        <span class="select-arrow" :class="{ 'is-flipped': isOpen }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <Teleport to="body">
        <transition name="fade-slide">
          <div 
            v-if="isOpen" 
            ref="menuRef"
            class="select-menu"
            :style="{ 
              position: 'absolute',
              top: menuPosition.top, 
              left: menuPosition.left, 
              width: menuPosition.width,
              zIndex: 9999 
            }"
          >
            <div class="select-options-scroll">
              <div 
                v-for="option in options" 
                :key="option.value" 
                class="select-option" 
                :class="{ 'is-selected': option.value === modelValue }"
                @click="selectOption(option.value)"
              >
                <span class="option-label">{{ option.label }}</span>
                <span v-if="option.value === modelValue" class="selected-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.base-select-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  position: relative;
  transition: z-index var(--transition-fast);
}

.base-select-container.is-open {
  z-index: 50;
}

.select-wrapper {
  position: relative;
}

.select-trigger {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background: linear-gradient(to bottom, var(--color-surface), #fcfdfe);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 42px;
}

.select-trigger:hover:not(:disabled) {
  border-color: var(--color-border);
  background-color: #fafbfc;
  box-shadow: var(--shadow-md);
}

.select-trigger:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1), var(--shadow-md);
}

.select-trigger.is-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
}

.selected-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: var(--space-2);
}

.selected-text.is-placeholder {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-normal);
}

.select-arrow {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  transition: transform var(--transition-base);
}

.select-arrow.is-flipped {
  transform: rotate(180deg);
}

/* Menu Style */
.select-menu {
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  padding: var(--space-1);
}

.select-options-scroll {
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.select-options-scroll::-webkit-scrollbar {
  width: 6px;
}

.select-options-scroll::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 10px;
}

.select-option {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin: 1px;
}

.select-option:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.select-option.is-selected {
  background-color: rgba(30, 58, 138, 0.08);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.selected-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
