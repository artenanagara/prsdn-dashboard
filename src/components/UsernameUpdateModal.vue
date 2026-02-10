<script setup lang="ts">
import { useRouter } from 'vue-router';
import { AlertCircle } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const navigateToSettings = () => {
  const settingsPath = authStore.isAdmin ? '/admin/settings' : '/user/settings';
  router.push(settingsPath);
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-content">
        <div class="modal-icon">
          <AlertCircle :size="48" />
        </div>
        
        <h2 class="modal-title">Format Username Baru</h2>
        
        <p class="modal-description">
          Kami telah memperbarui format username untuk meningkatkan keamanan dan konsistensi sistem.
        </p>
        
        <div class="requirements-box">
          <p class="requirements-title">Format username yang baru:</p>
          <ul class="requirements-list">
            <li>Hanya huruf kecil (a-z)</li>
            <li>Angka (0-9)</li>
            <li>Tanpa spasi</li>
            <li>Tanpa karakter khusus</li>
            <li>Minimal 3 karakter</li>
          </ul>
        </div>
        
        <p class="modal-instruction">
          Silakan perbarui username Anda sekarang untuk melanjutkan.
        </p>
        
        <button @click="navigateToSettings" class="btn-settings">
          Perbarui Username
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 480px;
  width: 100%;
  animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e40af;
  margin-bottom: var(--space-6);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.modal-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.modal-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: 1.6;
  max-width: 400px;
}

.requirements-box {
  width: 100%;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  text-align: left;
}

.requirements-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.requirements-list {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-secondary);
  list-style-type: disc;
}

.requirements-list li {
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
  line-height: 1.5;
}

.requirements-list li:last-child {
  margin-bottom: 0;
}

.modal-instruction {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-6);
}

.btn-settings {
  width: 100%;
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-settings:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-settings:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .modal-content {
    padding: var(--space-6);
  }
  
  .modal-title {
    font-size: var(--text-xl);
  }
  
  .modal-icon {
    width: 64px;
    height: 64px;
  }
  
  .modal-description {
    font-size: var(--text-sm);
  }
}
</style>
