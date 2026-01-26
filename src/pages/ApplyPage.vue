<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useApplicationsStore } from '../stores/applications';
import { ChevronRight, ChevronLeft, Check } from 'lucide-vue-next';

const router = useRouter();
const applicationsStore = useApplicationsStore();

const currentStep = ref(1);
const totalSteps = 2;

// Step 1 data
const step1Data = ref({
  fullName: '',
  birthPlace: '',
  birthDate: '',
  rt: '01' as '01' | '02' | '03' | '04',
  phone: '',
  instagram: '',
  job: '',
  educationStatus: 'not_school' as 'school' | 'not_school',
  educationLevel: undefined as 'SD' | 'SMP' | 'SMA/SMK' | 'College' | undefined
});

// Step 2 data
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

// Validation errors
const errors = ref<Record<string, string>>({});

const canProceedStep1 = computed(() => {
  return (
    step1Data.value.fullName &&
    step1Data.value.birthPlace &&
    step1Data.value.birthDate &&
    step1Data.value.phone &&
    step1Data.value.job &&
    (step1Data.value.educationStatus === 'not_school' || step1Data.value.educationLevel)
  );
});

const canSubmit = computed(() => {
  return username.value && password.value && password.value === confirmPassword.value && password.value.length >= 6;
});

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleSubmit = async () => {
  errors.value = {};

  if (password.value !== confirmPassword.value) {
    errors.value.password = 'Password tidak cocok';
    return;
  }

  if (password.value.length < 6) {
    errors.value.password = 'Password minimal 6 karakter';
    return;
  }

  const { educationLevel, ...rest } = step1Data.value;
  const applicationData = {
    step1Data: {
      ...rest,
      ...(step1Data.value.educationStatus === 'school' ? { educationLevel } : {})
    },
    username: username.value,
    password: password.value
  };

  const result = await applicationsStore.submitApplication(applicationData);
  if (result) {
    router.push('/pending');
  } else {
    errors.value.submit = 'Gagal mengirim pendaftaran. Silakan coba lagi.';
  }
};
</script>

<template>
  <div class="apply-page">
    <div class="apply-container">
      <div class="apply-card card">
        <div class="apply-header">
          <h1>Pendaftaran Akun</h1>
          <p>Lengkapi data diri Anda untuk membuat akun</p>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          <div v-for="step in totalSteps" :key="step" :class="['stepper-item', { active: currentStep >= step, current: currentStep === step }]">
            <div class="stepper-circle">
              <Check v-if="currentStep > step" :size="16" />
              <span v-else>{{ step }}</span>
            </div>
            <span class="stepper-label">{{ step === 1 ? 'Data Diri' : 'Kredensial' }}</span>
          </div>
        </div>

        <!-- Step 1: General Data -->
        <form v-if="currentStep === 1" class="apply-form">
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <input v-model="step1Data.fullName" type="text" class="form-input" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tempat Lahir *</label>
              <input v-model="step1Data.birthPlace" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Lahir *</label>
              <input v-model="step1Data.birthDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">RT *</label>
              <select v-model="step1Data.rt" class="form-select" required>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
                <option value="04">RT 04</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">No. HP *</label>
              <input v-model="step1Data.phone" type="tel" class="form-input" placeholder="08xxxxxxxxxx" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Instagram</label>
            <input v-model="step1Data.instagram" type="text" class="form-input" placeholder="@username" />
          </div>

          <div class="form-group">
            <label class="form-label">Pekerjaan *</label>
            <input v-model="step1Data.job" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Status Pendidikan *</label>
            <select v-model="step1Data.educationStatus" class="form-select" required>
              <option value="not_school">Tidak Sekolah</option>
              <option value="school">Masih Sekolah</option>
            </select>
          </div>

          <div v-if="step1Data.educationStatus === 'school'" class="form-group">
            <label class="form-label">Jenjang Pendidikan *</label>
            <select v-model="step1Data.educationLevel" class="form-select" required>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA/SMK">SMA/SMK</option>
              <option value="College">Perguruan Tinggi</option>
            </select>
          </div>
        </form>

        <!-- Step 2: Credentials -->
        <form v-if="currentStep === 2" class="apply-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Username *</label>
            <input v-model="username" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Password *</label>
            <input v-model="password" type="password" class="form-input" minlength="6" required />
            <small class="text-xs text-secondary">Minimal 6 karakter</small>
          </div>

          <div class="form-group">
            <label class="form-label">Konfirmasi Password *</label>
            <input v-model="confirmPassword" type="password" class="form-input" required />
          </div>

          <div v-if="errors.password" class="form-error">
            {{ errors.password }}
          </div>
        </form>

        <!-- Navigation Buttons -->
        <div class="apply-actions">
          <button v-if="currentStep > 1" @click="prevStep" type="button" class="btn btn-secondary">
            <ChevronLeft :size="20" />
            <span>Kembali</span>
          </button>

          <button v-if="currentStep < totalSteps" @click="nextStep" type="button" class="btn btn-primary" :disabled="!canProceedStep1">
            <span>Selanjutnya</span>
            <ChevronRight :size="20" />
          </button>

          <button v-if="currentStep === totalSteps" @click="handleSubmit" type="button" class="btn btn-primary" :disabled="!canSubmit">
            <Check :size="20" />
            <span>Kirim Pendaftaran</span>
          </button>
        </div>

        <div class="apply-footer">
          <router-link to="/login" class="text-sm text-secondary">
            Sudah punya akun? <span class="text-primary font-medium">Masuk di sini</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apply-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  padding: var(--space-6);
}

.apply-container {
  width: 100%;
  max-width: 600px;
}

.apply-card {
  padding: var(--space-8);
}

.apply-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.apply-header h1 {
  color: var(--color-primary);
  margin-bottom: var(--space-2);
}

.apply-header p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.stepper {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.stepper-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
}

.stepper-item.active .stepper-circle {
  background-color: var(--color-primary);
  color: white;
}

.stepper-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.stepper-item.active .stepper-label {
  color: var(--color-primary);
}

.apply-form {
  margin-bottom: var(--space-6);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.apply-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: space-between;
}

.apply-actions .btn {
  flex: 1;
}

.apply-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}
</style>
