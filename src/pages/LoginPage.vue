<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Eye, EyeOff, LogIn } from 'lucide-vue-next';

onMounted(() => {
  document.title = 'Login - PRSDN Dashboard';
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const successMessage = ref(route.query.registered === '1' ? 'Akun berhasil dibuat. Silakan login dengan username dan password Anda.' : '');
const isLoading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  error.value = '';
  successMessage.value = '';
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
          <img src="/logo.jpg" alt="PRSDN Logo" class="login-logo" />
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
            <div class="password-field">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Masukkan password"
                required
                :disabled="isLoading"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
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
  background:
    linear-gradient(90deg, #0f89af 0 18px, transparent 18px),
    radial-gradient(circle at top left, rgba(32, 183, 216, 0.28), transparent 25rem),
    radial-gradient(circle at bottom right, rgba(15, 111, 143, 0.18), transparent 22rem),
    linear-gradient(135deg, #08111f 0%, #0b2035 46%, #0f6f8f 100%);
  padding: var(--space-6);
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  padding: var(--space-8);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 26px 72px rgba(8, 17, 31, 0.34);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(18px);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-logo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin: 0 auto var(--space-4);
  display: block;
  border-radius: 18px;
  box-shadow: 0 16px 32px rgba(15, 111, 143, 0.24);
}

.login-header h1 {
  color: var(--color-ink);
  margin-bottom: var(--space-2);
}

.login-header p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.login-form {
  margin-bottom: var(--space-6);
}

.password-field {
  position: relative;
}

.password-field .form-input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color var(--transition-base), background-color var(--transition-base);
}

.password-toggle:hover {
  color: var(--color-primary);
  background: rgba(15, 111, 143, 0.08);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  border: 1px solid rgba(239, 68, 68, 0.18);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.success-message {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  border: 1px solid rgba(16, 185, 129, 0.22);
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
