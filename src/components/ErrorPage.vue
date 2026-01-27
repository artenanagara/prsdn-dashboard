<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { AlertCircle, Home } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  errorCode?: string | number;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}>(), {
  errorCode: '500',
  title: 'Terjadi Kesalahan',
  message: 'Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti.',
  showHomeButton: true
});

const router = useRouter();

const displayTitle = computed(() => {
  if (props.errorCode === '404' || props.errorCode === 404) {
    return 'Halaman Tidak Ditemukan';
  }
  return props.title;
});

const displayMessage = computed(() => {
  if (props.errorCode === '404' || props.errorCode === 404) {
    return 'Halaman yang Anda cari tidak ditemukan. Mungkin halaman tersebut telah dipindahkan atau dihapus.';
  }
  return props.message;
});

const goHome = () => {
  router.push('/admin/dashboard');
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <AlertCircle :size="64" />
      </div>
      
      <div class="error-code" v-if="errorCode">
        {{ errorCode }}
      </div>
      
      <h1 class="error-title">{{ displayTitle }}</h1>
      <p class="error-message">{{ displayMessage }}</p>
      
      <div class="error-actions">
        <button @click="goBack" class="btn btn-secondary">
          Kembali
        </button>
        <button v-if="showHomeButton" @click="goHome" class="btn btn-primary">
          <Home :size="20" />
          <span>Ke Beranda</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);
  padding: var(--space-6);
}

.error-content {
  max-width: 600px;
  text-align: center;
  background: var(--color-bg-elevated);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.error-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto var(--space-4);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
}

.error-code {
  font-size: 4rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  opacity: 0.3;
  margin-bottom: var(--space-2);
  line-height: 1;
}

.error-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.error-message {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .error-content {
    padding: var(--space-6);
  }

  .error-icon {
    width: 96px;
    height: 96px;
  }

  .error-code {
    font-size: 3rem;
  }

  .error-title {
    font-size: var(--text-2xl);
  }

  .error-message {
    font-size: var(--text-base);
  }

  .error-actions {
    flex-direction: column;
  }

  .error-actions .btn {
    width: 100%;
  }
}
</style>
