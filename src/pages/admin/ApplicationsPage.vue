<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import EmptyState from '../../components/EmptyState.vue';
import BaseSelect from '../../components/BaseSelect.vue';
import { useApplicationsStore } from '../../stores/applications';
import { useAuthStore } from '../../stores/auth';
import { useUIStore } from '../../stores/ui';
import { CheckCircle, XCircle } from 'lucide-vue-next';

const applicationsStore = useApplicationsStore();
const authStore = useAuthStore();
const uiStore = useUIStore();

const searchQuery = ref('');
const filterStatus = ref('all');

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' }
];

const filteredApplications = computed(() => {
  return applicationsStore.applications.filter(app => {
    const matchesSearch = app.step1Data.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         app.username.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = filterStatus.value === 'all' || app.status === filterStatus.value;
    return matchesSearch && matchesStatus;
  });
});

// Load applications on mount
onMounted(() => {
  document.title = 'Permohonan Akun - PRSDN Admin';
  applicationsStore.loadApplications();
  applicationsStore.subscribeToChanges();
});

const handleApprove = async (id: string, name: string) => {
  const confirmed = await uiStore.confirm({
    message: `Setujui pendaftaran ${name}?`,
    variant: 'primary'
  });
  
  if (confirmed) {
    await applicationsStore.approveApplication(id, authStore.currentUser!.userId);
    uiStore.showToast(`Pendaftaran ${name} disetujui`, 'success');
  }
};

const handleReject = async (id: string, name: string) => {
  const confirmed = await uiStore.confirm({
    message: `Tolak pendaftaran ${name}?`,
    variant: 'danger'
  });
  
  if (confirmed) {
    await applicationsStore.rejectApplication(id, authStore.currentUser!.userId);
    uiStore.showToast(`Pendaftaran ${name} ditolak`, 'error');
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return 'badge-warning';
    case 'approved':
      return 'badge-success';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Menunggu';
    case 'approved':
      return 'Disetujui';
    case 'rejected':
      return 'Ditolak';
    default:
      return status;
  }
};
</script>

<template>
  <AppShell pageTitle="Permohonan Akun" pageSubtitle="Tinjau dan kelola permohonan akun baru">
    <div class="applications-page">
      
      <!-- Filter & Actions Bar -->
      <div class="controls-bar">
        <div class="controls-wrapper">
          <div class="filters-group">
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="Cari nama atau username..."
            >
            <BaseSelect 
              v-model="filterStatus" 
              :options="statusOptions"
              placeholder="Filter Status"
              class="filter-select-md"
            />
          </div>
        </div>
      </div>

      <BaseCard class="table-card">
        <div class="table-container">
        <div class="table-scroll-container">
        <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>RT</th>
                <th>No. HP</th>
                <th>Username</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="applicationsStore.isLoading">
                <td colspan="7" class="text-center py-8">
                  <div class="flex items-center justify-center gap-2 text-secondary">
                    <span class="loading-spinner"></span>
                    <span>Memuat data permohonan...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredApplications.length === 0">
                <td colspan="7" class="empty-cell">
                  <EmptyState
                    :icon="searchQuery || filterStatus !== 'all' ? 'search' : 'inbox'"
                    title="Tidak ada data"
                    :message="searchQuery || filterStatus !== 'all' ? 'Tidak ada permohonan yang sesuai dengan filter.' : 'Belum ada permohonan pendaftaran anggota baru saat ini.'"
                  />
                </td>
              </tr>
              <tr v-for="app in filteredApplications" :key="app.id">
                <td class="font-medium capitalize">{{ app.step1Data.fullName }}</td>
                <td><span class="badge badge-secondary">RT {{ app.step1Data.rt }}</span></td>
                <td>{{ app.step1Data.phone }}</td>
                <td>{{ app.username }}</td>
                <td class="text-secondary text-sm">{{ formatDate(app.submittedAt) }}</td>
                <td>
                  <span :class="['badge', getStatusBadge(app.status)]">
                    {{ getStatusText(app.status) }}
                  </span>
                </td>
                <td>
                  <div v-if="app.status === 'pending'" class="action-buttons">
                    <button
                      @click="handleApprove(app.id, app.step1Data.fullName)"
                      class="btn btn-sm"
                      style="background-color: var(--color-success); color: white;"
                    >
                      <CheckCircle :size="16" />
                      <span>Setujui</span>
                    </button>
                    <button
                      @click="handleReject(app.id, app.step1Data.fullName)"
                      class="btn btn-danger btn-sm"
                    >
                      <XCircle :size="16" />
                      <span>Tolak</span>
                    </button>
                  </div>
                  <span v-else class="text-secondary text-sm">
                    {{ app.reviewedAt ? formatDate(app.reviewedAt) : '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<style scoped>
.applications-page {
  max-width: 1400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-header-card {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
}

.page-header {
  margin-bottom: 0;
}

.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.table-scroll-container {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}
</style>
