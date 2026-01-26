<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<Emits>();

const inputValue = ref('');

const formattedValue = computed({
  get: () => inputValue.value,
  set: (value: string) => {
    // Auto-uppercase and limit to 6 chars
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    inputValue.value = cleaned;
    emit('update:modelValue', cleaned);
  }
});

const isComplete = computed(() => inputValue.value.length === 6);

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && isComplete.value && !props.disabled) {
    emit('submit');
  }
};
</script>

<template>
  <div class="token-input-container">
    <input
      v-model="formattedValue"
      type="text"
      class="token-input"
      placeholder="ABC123"
      maxlength="6"
      :disabled="disabled"
      @keypress="handleKeyPress"
    />
    <div class="token-input-hint">
      {{ inputValue.length }}/6 karakter
    </div>
  </div>
</template>

<style scoped>
.token-input-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.token-input {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5em;
  text-align: center;
  text-transform: uppercase;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
  font-family: 'Courier New', monospace;
}

.token-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.token-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.token-input::placeholder {
  letter-spacing: 0.3em;
  color: var(--color-text-tertiary);
}

.token-input-hint {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
</style>
