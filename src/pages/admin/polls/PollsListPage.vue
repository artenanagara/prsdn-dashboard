<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '../../../components/AppShell.vue';
import { usePollsStore } from '../../../stores/polls';
import { Plus, Eye } from 'lucide-vue-next';

const router = useRouter();
const pollsStore = usePollsStore();
const activeTab = ref('active');

onMounted(async () => {
  await pollsStore.fetchPolls(true);
  pollsStore.subscribeToRealtime();
});

onUnmounted(() => {
  pollsStore.unsubscribeFromRealtime();
});

const filteredPolls = computed(() => {
  return pollsStore.polls.filter((poll: any) => {
    if (activeTab.value === 'all') return true;
    if (activeTab.value === 'active') return poll.status === 'active';
    if (activeTab.value === 'draft') return poll.status === 'draft';
    if (activeTab.value === 'closed') return poll.status === 'closed';
    return true;
  });
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Aktif',
    draft: 'Draf',
    closed: 'Ditutup',
    archived: 'Diarsipkan'
  };
  return map[status] || status;
};

const getTypeLabel = (type: string) => {
  return type === 'voting' ? '🗳️ Voting' : '📊 Polling';
};

const navigateToDetail = (id: string) => {
  router.push(`/admin/polls/${id}`);
};
</script>

<template>
  <AppShell pageTitle="Voting & Polling" pageSubtitle="Kelola aktivitas pemungutan suara">
    <div class="polls-list-page">
      <!-- Header Actions -->
      <div class="page-actions">
        <div class="tabs">
          <button 
            v-for="tab in [{key:'active',label:'Aktif'},{key:'closed',label:'Ditutup'},{key:'draft',label:'Draf'},{key:'all',label:'Semua'}]" 
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <router-link to="/admin/polls/create" class="btn btn-primary">
          <Plus :size="16" />
          Buat Baru
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="pollsStore.isLoading && !pollsStore.polls.length" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPolls.length === 0" class="empty-state">
        <h3>Belum ada data</h3>
        <p>Belum ada voting atau polling dengan status ini.</p>
        <router-link to="/admin/polls/create" class="btn btn-primary mt-3">
          Buat Sekarang
        </router-link>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Visibilitas</th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="poll in filteredPolls" 
              :key="poll.id" 
              @click="navigateToDetail(poll.id)"
              class="clickable-row"
            >
              <td class="title-cell">
                <span class="poll-title">{{ poll.title }}</span>
                <span v-if="poll.description" class="poll-desc">{{ poll.description }}</span>
              </td>
              <td>
                <span class="type-label">{{ getTypeLabel(poll.type) }}</span>
              </td>
              <td>
                <span class="status-badge" :class="poll.status">
                  {{ getStatusLabel(poll.status) }}
                </span>
              </td>
              <td>{{ formatDate(poll.startDate) }}</td>
              <td>{{ formatDate(poll.endDate) }}</td>
              <td>
                <span class="visibility-label">
                  {{ poll.resultVisibility === 'always' ? 'Selalu' : poll.resultVisibility === 'after_vote' ? 'Setelah Vote' : 'Setelah Tutup' }}
                </span>
              </td>
              <td class="text-center">
                <button class="btn-icon" @click.stop="navigateToDetail(poll.id)">
                  <Eye :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.polls-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.tabs {
  display: flex;
  gap: var(--space-1);
  background: var(--color-bg-secondary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.tab-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: var(--text-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.table-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table td {
  padding: 12px 16px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}

.clickable-row:hover {
  background: var(--color-bg-secondary);
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 200px;
}

.poll-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.poll-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.type-label {
  font-size: var(--text-sm);
  white-space: nowrap;
}

.status-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.draft { background: #fef9c3; color: #854d0e; }
.status-badge.closed { background: #fee2e2; color: #991b1b; }
.status-badge.archived { background: #f3f4f6; color: #374151; }

.visibility-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.text-center { text-align: center; }

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-bg-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-3);
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
