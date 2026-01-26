<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { LogIn } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  const result = await authStore.login(username.value, password.value);

  if (result.success) {
    router.push(authStore.isAdmin ? '/admin/dashboard' : '/user/home');
  } else {
    error.value = result.error || 'Login gagal';
  }

  isLoading.value = false;
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <h1>PRSDN Dashboard</h1>
          <p>Persatuan Remaja Sub Desa Ngaran</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-input"
              placeholder="Masukkan username"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="Masukkan password"
              required
              :disabled="isLoading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="isLoading">
            <LogIn :size="20" />
            <span>{{ isLoading ? 'Memproses...' : 'Masuk' }}</span>
          </button>
        </form>

        <div class="login-footer">
          <p class="text-sm text-secondary">
            Belum punya akun?
            <router-link to="/apply" class="text-primary font-medium">Daftar di sini</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  padding: var(--space-6);
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  padding: var(--space-8);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-header h1 {
  color: var(--color-primary);
  margin-bottom: var(--space-2);
}

.login-header p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.login-form {
  margin-bottom: var(--space-6);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.login-footer {
  text-align: center;
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
}

.login-demo-info {
  margin-top: var(--space-6);
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.login-demo-info p {
  margin-bottom: var(--space-1);
}
</style>
