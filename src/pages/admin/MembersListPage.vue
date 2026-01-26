<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import { useMembersStore } from '../../stores/members';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';

const membersStore = useMembersStore();

const searchQuery = ref('');
const selectedRT = ref('all');
const showModal = ref(false);
const editingMember = ref<any>(null);

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

const filteredMembers = computed(() => {
  let result = membersStore.members;

  if (searchQuery.value) {
    result = membersStore.searchMembers(searchQuery.value);
  }

  if (selectedRT.value !== 'all') {
    result = result.filter(m => m.rt === selectedRT.value);
  }

  return result;
});

const openAddModal = () => {
  editingMember.value = null;
  resetForm();
  showModal.value = true;
};

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
  if (confirm(`Hapus anggota ${name}?\nAkun user terkait juga akan dihapus.`)) {
    const success = await membersStore.deleteMember(id);
    if (!success) {
      alert('Gagal menghapus anggota. Pastikan tidak ada data yang bergantung (misal: absensi).');
    }
  }
};

import BaseCard from '../../components/BaseCard.vue';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<template>
  <AppShell>
    <div class="members-page">
      <div class="page-header">
        <div>
          <h1>Manajemen Anggota</h1>
          <p class="text-secondary">Kelola data anggota</p>
        </div>
        <button @click="openAddModal" class="btn btn-primary">
          <Plus :size="20" />
          <span>Tambah Anggota</span>
        </button>
      </div>

      <!-- Filters -->
      <BaseCard class="mb-6">
        <div class="filters">
          <div class="form-group" style="flex: 1; margin: 0;">
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="Cari nama, telepon, atau pekerjaan..."
            >
          </div>
          <div class="form-group" style="margin: 0;">
            <select v-model="selectedRT" class="form-select">
              <option value="all">Semua RT</option>
              <option value="01">RT 01</option>
              <option value="02">RT 02</option>
              <option value="03">RT 03</option>
              <option value="04">RT 04</option>
            </select>
          </div>
        </div>
      </BaseCard>

      <!-- Members Table -->
      <BaseCard>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>RT</th>
                <th>No. HP</th>
                <th>Pekerjaan</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredMembers.length === 0">
                <td colspan="6" class="text-center text-secondary">
                  Tidak ada data
                </td>
              </tr>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td class="font-medium">{{ member.fullName }}</td>
                <td><span class="badge badge-secondary">RT {{ member.rt }}</span></td>
                <td>{{ member.phone }}</td>
                <td>{{ member.job }}</td>
                <td class="text-secondary text-sm">{{ formatDate(member.createdAt) }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openEditModal(member)" class="btn btn-secondary btn-sm">
                      <Edit :size="16" />
                    </button>
                    <button @click="handleDelete(member.id, member.fullName)" class="btn btn-danger btn-sm">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <BaseCard class="modal-content" no-padding>
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
                  <input v-model="formData.birthDate" type="date" class="form-input" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">RT *</label>
                  <select v-model="formData.rt" class="form-select" required>
                    <option value="01">RT 01</option>
                    <option value="02">RT 02</option>
                    <option value="03">RT 03</option>
                    <option value="04">RT 04</option>
                  </select>
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
                <select v-model="formData.educationStatus" class="form-select" required>
                  <option value="not_school">Tidak Sekolah</option>
                  <option value="school">Masih Sekolah</option>
                </select>
              </div>

              <div v-if="formData.educationStatus === 'school'" class="form-group">
                <label class="form-label">Jenjang Pendidikan *</label>
                <select v-model="formData.educationLevel" class="form-select" required>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="College">Perguruan Tinggi</option>
                </select>
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
    </div>
  </AppShell>
</template>

<style scoped>
.members-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
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
  display: flex;
  flex-direction: column;
}

.modal-body-content {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .filters {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
