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
  grade: '', // For Pelajar
  university: '', // For Mahasiswa
  joinedWhatsApp: false
});

// Step 2 data
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

// Validation errors
const errors = ref<Record<string, string>>({});

const canProceedStep1 = computed(() => {
  const baseValid = (
    step1Data.value.fullName &&
    step1Data.value.birthPlace &&
    step1Data.value.birthDate &&
    step1Data.value.phone &&
    step1Data.value.job
  );
  
  // Additional validation for Pelajar and Mahasiswa
  if (step1Data.value.job === 'Pelajar' && !step1Data.value.grade) return false;
  if (step1Data.value.job === 'Mahasiswa' && !step1Data.value.university) return false;
  
  return baseValid;
});

const canSubmit = computed(() => {
  return username.value && password.value && password.value === confirmPassword.value && password.value.length >= 6;
});

const isCheckingDuplicates = ref(false);

const nextStep = async () => {
  if (currentStep.value === 1) {
    errors.value = {};
    isCheckingDuplicates.value = true;
    try {
      const { phoneTaken } = await applicationsStore.checkDuplicates('', step1Data.value.phone);
      if (phoneTaken) {
        errors.value.phone = 'Data yang digunakan sudah pernah terdaftar, silahkan hubungi ketua untuk info username dan password';
        return;
      }
      currentStep.value++;
    } finally {
      isCheckingDuplicates.value = false;
    }
  } else if (currentStep.value < totalSteps) {
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

  // Determine education status and level based on job
  let educationStatus: 'school' | 'not_school' = 'not_school';
  let educationLevel: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | undefined = undefined;

  if (step1Data.value.job === 'Pelajar') {
    educationStatus = 'school';
    if (step1Data.value.grade.includes('SMP')) {
      educationLevel = 'SMP';
    } else if (step1Data.value.grade.includes('SMA')) {
      educationLevel = 'SMA/SMK';
    }
  } else if (step1Data.value.job === 'Mahasiswa') {
    educationStatus = 'school';
    educationLevel = 'College';
  }

  isCheckingDuplicates.value = true;
  try {
    const applicationData = {
      step1Data: {
        ...step1Data.value,
        educationStatus,
        educationLevel
      },
      username: username.value,
      password: password.value
    };

    const result = await applicationsStore.submitApplication(applicationData);
    if (result.success) {
      router.push('/pending');
    } else {
      errors.value.submit = result.error || 'Gagal mengirim pendaftaran. Silakan coba lagi.';
      if (result.error?.includes('Username')) {
        errors.value.username = result.error;
      }
      if (result.error?.includes('Nomor HP')) {
        errors.value.phone = result.error;
        currentStep.value = 1; // Back to step 1 if phone error
      }
    }
  } finally {
    isCheckingDuplicates.value = false;
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
              <input v-model="step1Data.phone" type="tel" class="form-input" :class="{ 'error': errors.phone }" placeholder="08xxxxxxxxxx" required />
              <small v-if="errors.phone" class="text-xs text-error mt-1 block">{{ errors.phone }}</small>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Instagram</label>
            <div class="input-with-prefix">
              <span class="input-prefix">@</span>
              <input 
                v-model="step1Data.instagram" 
                type="text" 
                class="form-input with-prefix" 
                placeholder="username" 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pekerjaan *</label>
            <select v-model="step1Data.job" class="form-select" required>
              <option value="" disabled>Pilih pekerjaan</option>
              <option value="Pelajar">Pelajar</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Karyawan Swasta">Karyawan Swasta</option>
              <option value="PNS/ASN">PNS/ASN</option>
              <option value="Wiraswasta">Wiraswasta</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
              <option value="Belum Bekerja">Belum Bekerja</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div v-if="step1Data.job === 'Pelajar'" class="form-group">
            <label class="form-label">Kelas Berapa? *</label>
            <select v-model="step1Data.grade" class="form-select" required>
              <option value="" disabled>Pilih kelas</option>
              <option value="SMP Kelas 7">SMP Kelas 7</option>
              <option value="SMP Kelas 8">SMP Kelas 8</option>
              <option value="SMP Kelas 9">SMP Kelas 9</option>
              <option value="SMA/SMK Kelas 10">SMA/SMK Kelas 10</option>
              <option value="SMA/SMK Kelas 11">SMA/SMK Kelas 11</option>
              <option value="SMA/SMK Kelas 12">SMA/SMK Kelas 12</option>
            </select>
          </div>

          <div v-if="step1Data.job === 'Mahasiswa'" class="form-group">
            <label class="form-label">Universitas *</label>
            <input 
              v-model="step1Data.university" 
              type="text" 
              class="form-input" 
              placeholder="Nama universitas" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Sudah Bergabung di Grup WhatsApp?</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="step1Data.joinedWhatsApp" type="checkbox" class="form-checkbox" />
                <span>Ya, sudah bergabung</span>
              </label>
            </div>
          </div>
        </form>

        <!-- Step 2: Credentials -->
        <form v-if="currentStep === 2" class="apply-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Username *</label>
            <input v-model="username" type="text" class="form-input" :class="{ 'error': errors.username }" required />
            <small v-if="errors.username" class="text-xs text-error mt-1 block">{{ errors.username }}</small>
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

          <div v-if="errors.submit" class="form-error">
            {{ errors.submit }}
          </div>
        </form>

        <!-- Navigation Buttons -->
        <div class="apply-actions">
          <button v-if="currentStep > 1" @click="prevStep" type="button" class="btn btn-secondary">
            <ChevronLeft :size="20" />
            <span>Kembali</span>
          </button>

          <button v-if="currentStep < totalSteps" @click="nextStep" type="button" class="btn btn-primary" :disabled="!canProceedStep1 || isCheckingDuplicates">
            <span>{{ isCheckingDuplicates ? 'Memeriksa...' : 'Selanjutnya' }}</span>
            <ChevronRight v-if="!isCheckingDuplicates" :size="20" />
          </button>

          <button v-if="currentStep === totalSteps" @click="handleSubmit" type="button" class="btn btn-primary" :disabled="!canSubmit || isCheckingDuplicates">
            <Check v-if="!isCheckingDuplicates" :size="20" />
            <span>{{ isCheckingDuplicates ? 'Mengirim...' : 'Kirim Pendaftaran' }}</span>
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

/* Input with prefix styling */
.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  pointer-events: none;
  z-index: 1;
}

.form-input.with-prefix {
  padding-left: calc(var(--space-3) + 1.2em);
}

/* Checkbox styling */
.checkbox-group {
  padding: var(--space-2) 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label:hover {
  color: var(--color-primary);
}
</style>
