<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import { useMembersStore } from '../../stores/members';
import { useUIStore } from '../../stores/ui';
import {
  Trash2,
  Eye,
  Edit,
} from 'lucide-vue-next';
import { supabase } from '../../lib/supabase';
import BaseCard from '../../components/BaseCard.vue';
import BaseDatePicker from '../../components/BaseDatePicker.vue';
import BaseSelect from '../../components/BaseSelect.vue';

const membersStore = useMembersStore();
const uiStore = useUIStore();

const searchQuery = ref('');
const selectedRT = ref('all');
const showModal = ref(false);
const showViewModal = ref(false);
const editingMember = ref<any>(null);
const viewingMember = ref<any>(null);
const memberAccount = ref<any>(null);

const formData = ref({
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

const rtOptions = [
  { label: 'Semua RT', value: 'all' },
  { label: 'RT 01', value: '01' },
  { label: 'RT 02', value: '02' },
  { label: 'RT 03', value: '03' },
  { label: 'RT 04', value: '04' }
];

const rtOptionsOnly = rtOptions.filter(o => o.value !== 'all');

const eduStatusOptions = [
  { label: 'Tidak Sekolah', value: 'not_school' },
  { label: 'Masih Sekolah', value: 'school' }
];

const eduLevelOptions = [
  { label: 'SD', value: 'SD' },
  { label: 'SMP', value: 'SMP' },
  { label: 'SMA/SMK', value: 'SMA/SMK' },
  { label: 'Perguruan Tinggi', value: 'College' }
];

const filteredMembers = computed(() => {
  let result = [...membersStore.members];

  if (searchQuery.value) {
    result = membersStore.searchMembers(searchQuery.value);
  }

  if (selectedRT.value !== 'all') {
    result = result.filter(m => m.rt === selectedRT.value);
  }

  // Sort by RT first, then by fullName
  return result.sort((a, b) => {
    const rtA = a.rt || '';
    const rtB = b.rt || '';
    if (rtA !== rtB) {
      return rtA.localeCompare(rtB);
    }
    return (a.fullName || '').localeCompare(b.fullName || '');
  });
});

const openEditModal = (member: any) => {
  editingMember.value = member;
  formData.value = { ...member };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    fullName: '',
    birthPlace: '',
    birthDate: '',
    rt: '01',
    phone: '',
    instagram: '',
    job: '',
    educationStatus: 'not_school',
    educationLevel: undefined
  };
};

onMounted(() => {
  document.title = 'Daftar Anggota - PRSDN Admin';
  membersStore.loadMembers();
  membersStore.subscribeToChanges();
});

const handleSubmit = async () => {
  const { educationLevel, ...rest } = formData.value;
  const data = {
    ...rest,
    ...(formData.value.educationStatus === 'school' ? { educationLevel } : {})
  };

  if (editingMember.value) {
    await membersStore.updateMember(editingMember.value.id, data);
  } else {
    await membersStore.createMember(data);
  }

  showModal.value = false;
  resetForm();
};

const handleDelete = async (id: string, name: string) => {
  const confirmed = await uiStore.confirm({
    message: `Hapus anggota ${name}? Akun user terkait juga akan dihapus.`,
    title: 'Hapus Anggota',
    confirmText: 'Hapus',
    variant: 'danger'
  });

  if (confirmed) {
    const success = await membersStore.deleteMember(id);
    if (!success) {
      uiStore.showToast('Gagal menghapus anggota. Pastikan tidak ada data terkait yang masih bergantung pada anggota ini.', 'error');
    } else {
      uiStore.showToast(`Anggota ${name} berhasil dihapus`, 'success');
    }
  }
};

const openViewModal = async (member: any) => {
  viewingMember.value = member;
  memberAccount.value = null;
  
  // Fetch user account data
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('username, password, role, status')
      .eq('member_id', member.id)
      .single();
    
    if (!error && data) {
      memberAccount.value = data;
    }
  } catch (err) {
    console.error('Error fetching account:', err);
  }
  
  showViewModal.value = true;
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<template>
  <AppShell pageTitle="Daftar Anggota" pageSubtitle="Kelola data anggota PRSDN">
    <div class="members-page">

      <!-- Filter & Actions Bar -->
      <div class="controls-bar">
        <div class="controls-wrapper">
          <div class="filters-group">
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="Cari nama, telepon, atau pekerjaan..."
            >
            <BaseSelect 
              v-model="selectedRT" 
              :options="rtOptions"
              placeholder="Filter RT"
              class="filter-select-sm"
            />
          </div>

          <div class="actions-group">
            <button @click="showModal = true; editingMember = null; resetForm()" class="btn btn-primary">
              <Plus :size="18" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Members Table -->
      <BaseCard class="members-card">
        <div class="table-container">
        <div class="table-scroll-container">
        <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>RT</th>
                <th>No. HP</th>
                <th>Pekerjaan</th>
                <th>Pendidikan</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="membersStore.isLoading">
                <td colspan="7" class="text-center py-8">
                  <div class="flex items-center justify-center gap-2 text-secondary">
                    <span class="loading-spinner"></span>
                    <span>Memuat data anggota...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredMembers.length === 0">
                <td colspan="7" class="empty-cell">
                  <EmptyState
                    :icon="searchQuery || selectedRT !== 'all' ? 'search' : 'users'"
                    title="Tidak ada data"
                    :message="searchQuery || selectedRT !== 'all' ? 'Tidak ada anggota yang sesuai dengan filter yang dipilih.' : 'Belum ada anggota terdaftar.'"
                  />
                </td>
              </tr>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td class="font-medium capitalize">{{ member.fullName }}</td>
                <td><span class="badge badge-secondary">RT {{ member.rt }}</span></td>
                <td>{{ member.phone }}</td>
                <td>{{ member.job }}</td>
                <td>
                  <span v-if="member.educationStatus === 'school'" class="badge badge-info">
                    {{ member.educationLevel || 'Sekolah' }}
                  </span>
                  <span v-else class="badge badge-secondary">-</span>
                </td>
                <td class="text-secondary text-sm">{{ formatDate(member.createdAt) }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openViewModal(member)" class="btn btn-info btn-sm" title="Lihat Detail">
                      <Eye :size="16" />
                    </button>
                    <button @click="openEditModal(member)" class="btn btn-secondary btn-sm" title="Edit">
                      <Edit :size="16" />
                    </button>
                    <button @click="handleDelete(member.id, member.fullName)" class="btn btn-danger btn-sm" title="Hapus">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </BaseCard>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <BaseCard class="modal-content" no-padding scrollable-body>
          <template #header>
            <h2>{{ editingMember ? 'Edit Anggota' : 'Tambah Anggota' }}</h2>
          </template>

          <div class="modal-body-content">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Nama Lengkap *</label>
                <input v-model="formData.fullName" type="text" class="form-input" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tempat Lahir *</label>
                  <input v-model="formData.birthPlace" type="text" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Tanggal Lahir *</label>
                  <BaseDatePicker v-model="formData.birthDate" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">RT *</label>
                  <BaseSelect 
                    v-model="formData.rt" 
                    :options="rtOptionsOnly" 
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">No. HP *</label>
                  <input v-model="formData.phone" type="tel" class="form-input" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Instagram</label>
                <input v-model="formData.instagram" type="text" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Pekerjaan *</label>
                <input v-model="formData.job" type="text" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="form-label">Status Pendidikan *</label>
                <BaseSelect 
                  v-model="formData.educationStatus" 
                  :options="eduStatusOptions" 
                />
              </div>

              <div v-if="formData.educationStatus === 'school'" class="form-group">
                <label class="form-label">Jenjang Pendidikan *</label>
                <BaseSelect 
                  v-model="formData.educationLevel" 
                  :options="eduLevelOptions" 
                />
              </div>
            </form>
          </div>

          <template #footer>
            <div class="modal-actions">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Batal
              </button>
              <button type="button" @click="handleSubmit" class="btn btn-primary">
                {{ editingMember ? 'Simpan' : 'Tambah' }}
              </button>
            </div>
          </template>
        </BaseCard>
      </div>

      <!-- View Member Modal -->
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <BaseCard class="modal-content" no-padding scrollable-body>
          <template #header>
            <h2>Detail Anggota</h2>
          </template>

          <div class="modal-body-content">
            <div v-if="viewingMember" class="view-details">
              <div class="detail-section">
                <h3>Informasi Pribadi</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nama Lengkap:</span>
                    <span class="detail-value">{{ viewingMember.fullName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Tempat, Tanggal Lahir:</span>
                    <span class="detail-value">{{ viewingMember.birthPlace }}, {{ formatDate(viewingMember.birthDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">RT:</span>
                    <span class="detail-value">RT {{ viewingMember.rt }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">No. HP:</span>
                    <span class="detail-value">{{ viewingMember.phone }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Instagram:</span>
                    <span class="detail-value">{{ viewingMember.instagram || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Pekerjaan:</span>
                    <span class="detail-value">{{ viewingMember.job }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingMember.educationStatus">
                    <span class="detail-label">Status Pendidikan:</span>
                    <span class="detail-value">
                      <span :class="{ 'badge': true, 'badge-info': viewingMember.educationStatus === 'school', 'badge-secondary': viewingMember.educationStatus !== 'school' }">
                        {{ viewingMember.educationStatus === 'school' ? 'Masih Sekolah' : 'Tidak Sekolah' }}
                      </span>
                    </span>
                  </div>
                  <div class="detail-item" v-if="viewingMember.educationStatus === 'school'">
                    <span class="detail-label">Jenjang Pendidikan:</span>
                    <span class="detail-value">{{ viewingMember.educationLevel || '-' }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingMember.educationLevel === 'SD' || viewingMember.educationLevel === 'SMP' || viewingMember.educationLevel === 'SMA/SMK'">
                    <span class="detail-label">Kelas:</span>
                    <span class="detail-value">{{ viewingMember.grade || '-' }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingMember.educationLevel === 'College'">
                    <span class="detail-label">Universitas:</span>
                    <span class="detail-value">{{ viewingMember.university || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Grup WhatsApp:</span>
                    <span class="detail-value text-sm">
                      <span :class="['badge', viewingMember.joinedWhatsApp ? 'badge-success' : 'badge-secondary']">
                        {{ viewingMember.joinedWhatsApp ? 'Sudah bergabung' : 'Belum bergabung' }}
                      </span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Bergabung:</span>
                    <span class="detail-value">{{ formatDate(viewingMember.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section" v-if="memberAccount">
                <h3>Informasi Akun</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Username:</span>
                    <span class="detail-value credential">{{ memberAccount.username }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Password:</span>
                    <span class="detail-value credential">{{ memberAccount.password }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Role:</span>
                    <span :class="['badge', memberAccount.role === 'admin' ? 'badge-danger' : 'badge-info']">{{ memberAccount.role }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span :class="['badge', memberAccount.status === 'active' ? 'badge-success' : 'badge-secondary']">{{ memberAccount.status }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section" v-else>
                <p class="text-secondary text-center">Tidak ada akun terkait</p>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="modal-actions">
              <button type="button" @click="showViewModal = false" class="btn btn-primary">
                Tutup
              </button>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.members-page {
  max-width: 1400px;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  flex-shrink: 0;
}

.page-header-card {
  margin-bottom: var(--space-4);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.filters {
  display: flex;
  gap: var(--space-4);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}



.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: visible;
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: flex-end;
  width: 100%;
}

.modal-body-content {
  padding: var(--space-6);
  flex: 1;
  overflow-y: visible;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .filters {
    flex-direction: column;
  }


}

/* View Details Styling */
.view-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.detail-section {
  padding: var(--space-4);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.detail-section h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-border);
}

.detail-grid {
  display: grid;
  gap: var(--space-3);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
}

.detail-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.detail-value {
  color: var(--color-text-primary);
  font-size: var(--text-base);
  text-align: right;
}

.detail-value.credential {
  font-family: monospace;
  background-color: var(--color-bg);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.members-card {
  margin-bottom: var(--space-6);
}

.members-card :deep(.card-body) {
  padding: 0;
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filters-card {
  margin-bottom: var(--space-4);
}

/* Ensure empty state is centered */
.text-center {
  text-align: center;
}

/* Page-level sticky header */
thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: var(--space-4);
  }
}
</style>
