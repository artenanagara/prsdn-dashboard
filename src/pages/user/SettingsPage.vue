<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import BaseDatePicker from '../../components/BaseDatePicker.vue';
import BaseSelect from '../../components/BaseSelect.vue';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
import { useUIStore } from '../../stores/ui';
import { validateUsername } from '../../utils/validation';
import type { Member } from '../../types';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const uiStore = useUIStore();

const activeTab = ref<'profile' | 'account'>('profile');

// Profile form state
const profileForm = ref<Partial<Member>>({});
const isProfileLoading = ref(false);
const hasUnsavedChanges = ref(false);

// Password form state
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const isPasswordLoading = ref(false);

// Username form state
const usernameForm = ref({
  newUsername: ''
});
const usernameError = ref('');
const isUsernameLoading = ref(false);

const canUpdateUsername = computed(() => {
  return usernameForm.value.newUsername !== '' && 
         usernameForm.value.newUsername !== authStore.currentUser?.username &&
         !usernameError.value;
});

const currentMember = computed(() => {
  if (authStore.currentUser?.memberId) {
    return membersStore.getMemberById(authStore.currentUser.memberId);
  }
  return null;
});

onMounted(async () => {
  document.title = 'Pengaturan - PRSDN Dashboard';
  
  await membersStore.loadMembers();
  
  if (currentMember.value) {
    profileForm.value = { ...currentMember.value };
  }
  
  // Initialize username form
  usernameForm.value.newUsername = authStore.currentUser?.username || '';
});

const handleProfileSubmit = async () => {
  if (!currentMember.value?.id) return;

  isProfileLoading.value = true;
  
  try {
    const success = await membersStore.updateMember(currentMember.value.id, profileForm.value);
    
    if (success) {
      uiStore.showToast('Profil berhasil diperbarui', 'success');
      hasUnsavedChanges.value = false;
    } else {
      uiStore.showToast('Gagal memperbarui profil', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    uiStore.showToast('Terjadi kesalahan', 'error');
  } finally {
    isProfileLoading.value = false;
  }
};

const handlePasswordSubmit = async () => {
  // Validation
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    uiStore.showToast('Semua field harus diisi', 'error');
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    uiStore.showToast('Password baru tidak cocok', 'error');
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    uiStore.showToast('Password minimal 6 karakter', 'error');
    return;
  }

  isPasswordLoading.value = true;

  try {
    const result = await authStore.updatePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    );

    if (result.success) {
      uiStore.showToast('Password berhasil diubah', 'success');
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    } else {
      uiStore.showToast(result.error || 'Gagal mengubah password', 'error');
    }
  } catch (error) {
    console.error('Password update error:', error);
    uiStore.showToast('Terjadi kesalahan', 'error');
  } finally {
    isPasswordLoading.value = false;
  }
};

const validateUsernameInput = () => {
  const username = usernameForm.value.newUsername;
  const validation = validateUsername(username);
  
  if (!validation.valid) {
    usernameError.value = validation.error || '';
  } else {
    usernameError.value = '';
  }
};

const handleUsernameUpdate = async () => {
  if (!canUpdateUsername.value) return;
  
  isUsernameLoading.value = true;
  
  try {
    const result = await authStore.updateUsername(usernameForm.value.newUsername);
    
    if (result.success) {
      uiStore.showToast('Username berhasil diubah', 'success');
    } else {
      uiStore.showToast(result.error || 'Gagal mengubah username', 'error');
    }
  } catch (error) {
    console.error('Username update error:', error);
    uiStore.showToast('Terjadi kesalahan', 'error');
  } finally {
    isUsernameLoading.value = false;
  }
};

const markAsChanged = () => {
  hasUnsavedChanges.value = true;
};

const switchTab = (tab: 'profile' | 'account') => {
  if (hasUnsavedChanges.value) {
    if (!confirm('Anda memiliki perubahan yang belum disimpan. Lanjutkan?')) {
      return;
    }
    hasUnsavedChanges.value = false;
  }
  activeTab.value = tab;
};
</script>

<template>
  <AppShell pageTitle="Pengaturan" pageSubtitle="Kelola profil dan kata sandi Anda">
    <div class="settings-page">
      <BaseCard class="settings-card">
        <!-- Tabs -->
        <div class="tabs">
          <button 
            @click="switchTab('profile')" 
            :class="['tab', { 'tab-active': activeTab === 'profile' }]"
          >
            Profil
          </button>
          <button 
            @click="switchTab('account')" 
            :class="['tab', { 'tab-active': activeTab === 'account' }]"
          >
            Akun
          </button>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="tab-content">
          <form @submit.prevent="handleProfileSubmit" class="settings-form">

            <!-- Full Name -->
            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="required">*</span></label>
              <input 
                v-model="profileForm.fullName" 
                type="text" 
                class="form-input" 
                required
                @input="markAsChanged"
              />
            </div>

            <!-- Birth Place & Date -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tempat Lahir <span class="required">*</span></label>
                <input 
                  v-model="profileForm.birthPlace" 
                  type="text" 
                  class="form-input" 
                  required
                  @input="markAsChanged"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal Lahir <span class="required">*</span></label>
                <BaseDatePicker 
                  :model-value="profileForm.birthDate ?? null" 
                  required
                  @update:modelValue="(val) => { profileForm.birthDate = val ?? undefined; markAsChanged(); }"
                />
              </div>
            </div>

            <!-- RT & Phone -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">RT <span class="required">*</span></label>
                <BaseSelect
                  v-model="profileForm.rt"
                  :options="[
                    { label: '01', value: '01' },
                    { label: '02', value: '02' },
                    { label: '03', value: '03' },
                    { label: '04', value: '04' }
                  ]"
                  placeholder="Pilih RT"
                  @update:modelValue="markAsChanged"
                />
              </div>
              <div class="form-group">
                <label class="form-label">No. HP <span class="required">*</span></label>
                <input 
                  v-model="profileForm.phone" 
                  type="tel" 
                  class="form-input" 
                  required
                  @input="markAsChanged"
                />
              </div>
            </div>

            <!-- Instagram & Job -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Instagram</label>
                <input 
                  v-model="profileForm.instagram" 
                  type="text" 
                  class="form-input"
                  placeholder="@username"
                  @input="markAsChanged"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Pekerjaan <span class="required">*</span></label>
                <input 
                  v-model="profileForm.job" 
                  type="text" 
                  class="form-input" 
                  required
                  @input="markAsChanged"
                />
              </div>
            </div>

            <!-- Education Status -->
            <div class="form-group">
              <label class="form-label">Status Pendidikan <span class="required">*</span></label>
              <BaseSelect
                v-model="profileForm.educationStatus"
                :options="[
                  { label: 'Masih Sekolah/Kuliah', value: 'school' },
                  { label: 'Tidak Sekolah/Kuliah', value: 'not_school' }
                ]"
                placeholder="Pilih Status Pendidikan"
                @update:modelValue="markAsChanged"
              />
            </div>

            <!-- Education Level -->
            <div class="form-group" v-if="profileForm.educationStatus === 'school'">
              <label class="form-label">Jenjang Pendidikan</label>
              <BaseSelect
                v-model="profileForm.educationLevel"
                :options="[
                  { label: 'Pilih Jenjang', value: '' },
                  { label: 'SD', value: 'SD' },
                  { label: 'SMP', value: 'SMP' },
                  { label: 'SMA/SMK', value: 'SMA/SMK' },
                  { label: 'Perguruan Tinggi', value: 'College' }
                ]"
                placeholder="Pilih Jenjang"
                @update:modelValue="markAsChanged"
              />
            </div>

            <!-- Grade (for students) -->
            <div class="form-group" v-if="profileForm.educationStatus === 'school' && profileForm.educationLevel && profileForm.educationLevel !== 'College'">
              <label class="form-label">Kelas</label>
              <input 
                v-model="profileForm.grade" 
                type="text" 
                class="form-input"
                placeholder="Contoh: 10, 12"
                @input="markAsChanged"
              />
            </div>

            <!-- University (for college students) -->
            <div class="form-group" v-if="profileForm.educationStatus === 'school' && profileForm.educationLevel === 'College'">
              <label class="form-label">Universitas</label>
              <input 
                v-model="profileForm.university" 
                type="text" 
                class="form-input"
                placeholder="Nama universitas"
                @input="markAsChanged"
              />
            </div>

            <!-- Submit Button -->
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isProfileLoading || !hasUnsavedChanges">
                {{ isProfileLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Account Tab -->
        <div v-if="activeTab === 'account'" class="tab-content">
          <form @submit.prevent="handlePasswordSubmit" class="settings-form">
            <!-- Username (editable) -->
            <div class="form-group">
              <label class="form-label">Username <span class="required">*</span></label>
              <input 
                v-model="usernameForm.newUsername" 
                type="text" 
                class="form-input"
                :class="{ 'is-error': usernameError }"
                @input="validateUsernameInput"
              />
              <p v-if="usernameError" class="form-error">{{ usernameError }}</p>
              <p class="form-help">Hanya huruf kecil dan angka, tanpa spasi (minimal 3 karakter)</p>
            </div>

            <div class="form-actions">
              <button 
                type="button"
                @click="handleUsernameUpdate" 
                class="btn btn-secondary"
                :disabled="!canUpdateUsername || isUsernameLoading"
              >
                {{ isUsernameLoading ? 'Menyimpan...' : 'Ubah Username' }}
              </button>
            </div>

            <div class="section-divider"></div>

            <h3 class="section-title">Ubah Password</h3>

            <div class="form-group">
              <label class="form-label">Password Lama <span class="required">*</span></label>
              <input 
                v-model="passwordForm.oldPassword" 
                type="password" 
                class="form-input" 
                required
                autocomplete="current-password"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password Baru <span class="required">*</span></label>
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                class="form-input" 
                required
                minlength="6"
                autocomplete="new-password"
              />
              <p class="form-help">Minimal 6 karakter</p>
            </div>

            <div class="form-group">
              <label class="form-label">Konfirmasi Password Baru <span class="required">*</span></label>
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                class="form-input" 
                required
                autocomplete="new-password"
              />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isPasswordLoading">
                {{ isPasswordLoading ? 'Mengubah...' : 'Ubah Password' }}
              </button>
            </div>
          </form>
        </div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<style scoped>
.settings-page {
  width: 100%;
}

.settings-card {
  overflow: visible;
}

.tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.tab {
  padding: var(--space-3) var(--space-6);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab:hover {
  color: var(--color-text-primary);
}

.tab-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
}

.form-help {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin: 0;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.form-input.is-error {
  border-color: var(--color-danger);
}

.section-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-8) 0;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-primary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .tabs {
    gap: 0;
  }

  .tab {
    flex: 1;
    text-align: center;
    padding: var(--space-3) var(--space-4);
  }
}
</style>
