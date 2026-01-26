<script setup lang="ts">
import { Clock } from 'lucide-vue-next';
</script>

<template>
  <div class="pending-page">
    <div class="pending-container">
      <div class="pending-card card">
        <div class="pending-icon">
          <Clock :size="64" />
        </div>
        
        <h1>Pendaftaran Terkirim</h1>
        <p class="pending-message">
          Terima kasih telah mendaftar! Akun Anda sedang menunggu persetujuan dari admin.
          Anda akan dapat login setelah akun Anda disetujui.
        </p>

        <div class="pending-info">
          <p class="text-sm text-secondary">
            Proses persetujuan biasanya memakan waktu 1-2 hari kerja.
            Anda akan dihubungi melalui nomor telepon yang telah didaftarkan.
          </p>
        </div>

        <router-link to="/login" class="btn btn-primary">
          Kembali ke Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  padding: var(--space-6);
}

.pending-container {
  width: 100%;
  max-width: 500px;
}

.pending-card {
  padding: var(--space-10);
  text-align: center;
}

.pending-icon {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
  color: var(--color-warning);
}

.pending-card h1 {
  color: var(--color-primary);
  margin-bottom: var(--space-4);
}

.pending-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: 1.6;
}

.pending-info {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
}
</style>
