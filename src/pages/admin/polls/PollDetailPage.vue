<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePollsStore } from '../../../stores/polls';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import { ArrowLeft, Trash2, StopCircle, PlayCircle, BarChart2, Users, Edit, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Bar, Pie } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const pollsStore = usePollsStore();
const pollId = route.params.id as string;

// State for truncation
const isDescriptionExpanded = ref(false);
const descTextRef = ref<HTMLElement | null>(null);
const isTextTruncated = ref(false);

const checkTruncation = async () => {
  await nextTick();
  if (descTextRef.value) {
    isTextTruncated.value = descTextRef.value.scrollHeight > descTextRef.value.clientHeight + 1;
  }
};

const toggleDescription = () => {
  isDescriptionExpanded.value = !isDescriptionExpanded.value;
};

onMounted(async () => {
  await pollsStore.fetchPollDetail(pollId);
  await pollsStore.fetchAllVotes(pollId);
  if (poll.value && !poll.value.isAnonymous) {
    await pollsStore.fetchVoterDetails(pollId);
  }
  
  checkTruncation();
  window.addEventListener('resize', checkTruncation);
  
  pollsStore.subscribeToRealtime();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkTruncation);
  pollsStore.unsubscribeFromRealtime();
});

// Watch desc changes
const poll = computed(() => pollsStore.currentPoll);
watch(() => poll.value?.description, checkTruncation);

const options = computed(() => pollsStore.currentOptions);
const allVotes = computed(() => pollsStore.allVotes);
const voterDetails = computed(() => pollsStore.voterDetails);

const usesPieChart = computed(() => options.value.length <= 2);

const chartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Chart Data
const barChartData = computed(() => {
  if (!options.value.length) return { labels: [], datasets: [] };
  
  const labels = options.value.map((opt: any) => opt.label);
  const data = options.value.map((opt: any) => {
    return allVotes.value.filter((v: any) => v.optionId === opt.id).length;
  });

  return {
    labels,
    datasets: [{
      label: 'Jumlah Suara',
      backgroundColor: chartColors.slice(0, labels.length),
      data
    }]
  };
});

const pieChartData = computed(() => {
  if (!options.value.length) return { labels: [], datasets: [] };
  
  const labels = options.value.map((opt: any) => opt.label);
  const data = options.value.map((opt: any) => {
    return allVotes.value.filter((v: any) => v.optionId === opt.id).length;
  });

  return {
    labels,
    datasets: [{
      backgroundColor: chartColors.slice(0, labels.length),
      data
    }]
  };
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } }
};

// Get option label by ID
const getOptionLabel = (optionId: string) => {
  const opt = options.value.find((o: any) => o.id === optionId);
  return opt ? opt.label : optionId;
};

// Actions
const handleStatusChange = async (newStatus: 'active' | 'closed') => {
  if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus === 'active' ? 'AKTIF' : 'DITUTUP'}?`)) return;
  await pollsStore.updatePollStatus(pollId, newStatus);
};

const handleDelete = async () => {
  if (!confirm('Apakah Anda yakin ingin menghapus voting ini? Data tidak dapat dikembalikan.')) return;
  const success = await pollsStore.deletePoll(pollId);
  if (success) {
    router.push('/admin/polls/list');
  }
};


const handleEdit = () => {
  router.push(`/admin/polls/edit/${pollId}`);
};

const totalVotes = computed(() => allVotes.value.length);

const uniqueVoters = computed(() => {
  const unique = new Set(allVotes.value.map((v: any) => v.userId));
  return unique.size;
});

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { active: 'Aktif', draft: 'Draf', closed: 'Ditutup', archived: 'Diarsipkan' };
  return map[status] || status;
};
</script>

<template>
  <AppShell pageTitle="Detail Voting" pageSubtitle="Lihat hasil dan kelola voting">
    <div v-if="poll" class="poll-detail-page">
      <div class="mb-4">
        <router-link to="/admin/polls/list" class="back-link">
          <ArrowLeft :size="18" /> Kembali
        </router-link>
      </div>

      <div class="content-grid">
        <!-- Left Column: Content, Stats, Charts -->
        <div class="left-column">
          <!-- Main Header & Stats -->
          <BaseCard class="info-card mb-6 section-info">
            <div class="info-header">
              <div>
                <h2 class="poll-main-title">{{ poll.title }}</h2>
                <div v-if="poll.description">
                  <p 
                    ref="descTextRef"
                    class="poll-description" 
                    :class="{ 'expanded': isDescriptionExpanded }"
                  >
                    {{ poll.description }}
                  </p>
                  <button 
                    v-if="isTextTruncated" 
                    @click="toggleDescription" 
                    class="btn-read-more"
                  >
                    {{ isDescriptionExpanded ? 'Sembunyikan' : 'Selengkapnya' }}
                    <component :is="isDescriptionExpanded ? ChevronUp : ChevronDown" :size="14" />
                  </button>
                </div>
              </div>
              <span class="status-badge" :class="poll.status">{{ getStatusLabel(poll.status) }}</span>
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <div class="stat-icon blue"><BarChart2 :size="18" /></div>
                <div>
                  <div class="stat-label">Total Suara</div>
                  <div class="stat-value">{{ totalVotes }}</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon purple"><Users :size="18" /></div>
                <div>
                  <div class="stat-label">Partisipan</div>
                  <div class="stat-value">{{ uniqueVoters }}</div>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Mobile Only: Settings Card -->
          <BaseCard title="Detail Pengaturan" class="settings-card mobile-only mb-6">
            <div class="settings-list">
              <div class="setting-item">
                <span class="setting-label">Tipe Aktivitas</span>
                <span class="setting-value">{{ poll.type === 'voting' ? 'Voting' : 'Polling' }}</span>
              </div>
              <div class="setting-item">
                <span class="setting-label">Jenis Pertanyaan</span>
                <span class="setting-value">{{ poll.questionType === 'multiple_choice' ? 'Pilihan Ganda' : 'Satu Pilihan' }}</span>
              </div>
              <div class="setting-item">
                <span class="setting-label">Waktu Mulai</span>
                <span class="setting-value">{{ new Date(poll.startDate).toLocaleString('id-ID') }}</span>
              </div>
              <div class="setting-item">
                <span class="setting-label">Waktu Selesai</span>
                <span class="setting-value">{{ new Date(poll.endDate).toLocaleString('id-ID') }}</span>
              </div>
               <div class="setting-item">
                <span class="setting-label">Visibilitas Hasil</span>
                <span class="setting-value">
                  {{ poll.resultVisibility === 'always' ? 'Selalu Terlihat' : 
                     poll.resultVisibility === 'after_vote' ? 'Setelah Memilih' : 'Setelah Ditutup' }}
                </span>
              </div>
              <div class="setting-item">
                <span class="setting-label">Privasi</span>
                <span class="setting-value">{{ poll.isAnonymous ? 'Anonim' : 'Publik' }}</span>
              </div>
            </div>

            <div class="actions-grid">
              <button @click="handleEdit" class="btn btn-outline w-full">
                <Edit :size="16" /> Edit
              </button>
              
              <div class="action-spacer"></div>

              <button 
                v-if="poll.status === 'active'"
                @click="handleStatusChange('closed')"
                class="btn btn-warning w-full"
              >
                <StopCircle :size="18" /> Tutup Voting
              </button>
              <button 
                v-if="poll.status === 'closed'"
                @click="handleStatusChange('active')"
                class="btn btn-success w-full"
              >
                <PlayCircle :size="18" /> Buka Kembali
              </button>
              
              <button @click="handleDelete" class="btn btn-danger w-full">
                <Trash2 :size="18" /> Hapus
              </button>
            </div>
          </BaseCard>

          <!-- Chart -->
          <BaseCard title="Grafik Hasil" class="mb-6 section-chart">
            <div class="chart-container">
              <Pie v-if="usesPieChart" :data="pieChartData" :options="pieOptions" />
              <Bar v-else :data="barChartData" :options="barOptions" />
            </div>
          </BaseCard>

          <!-- Voter Table -->
          <BaseCard v-if="!poll.isAnonymous && voterDetails.length > 0" title="Daftar Pemilih" class="section-voters">
            <div class="voter-table-container">
              <table class="voter-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Opsi Dipilih</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(voter, idx) in voterDetails" :key="voter.id">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ voter.fullName || voter.username }}</td>
                    <td>
                      <span class="option-tag">{{ getOptionLabel(voter.optionId) }}</span>
                    </td>
                    <td class="time-cell">{{ new Date(voter.createdAt).toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>

          <BaseCard v-else-if="poll.isAnonymous" title="Daftar Pemilih" class="section-voters">
            <p class="anon-notice">🔒 Voting ini bersifat anonim. Data pemilih tidak ditampilkan.</p>
          </BaseCard>
        </div>

        <!-- Right Column: Settings Detail & Actions -->
        <div class="right-column">
          <div class="sticky-wrapper section-settings desktop-only">
            <BaseCard title="Detail Pengaturan" class="settings-card">
              <div class="settings-list">
                <div class="setting-item">
                  <span class="setting-label">Tipe Aktivitas</span>
                  <span class="setting-value">{{ poll.type === 'voting' ? 'Voting' : 'Polling' }}</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">Jenis Pertanyaan</span>
                  <span class="setting-value">{{ poll.questionType === 'multiple_choice' ? 'Pilihan Ganda' : 'Satu Pilihan' }}</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">Waktu Mulai</span>
                  <span class="setting-value">{{ new Date(poll.startDate).toLocaleString('id-ID') }}</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">Waktu Selesai</span>
                  <span class="setting-value">{{ new Date(poll.endDate).toLocaleString('id-ID') }}</span>
                </div>
                 <div class="setting-item">
                  <span class="setting-label">Visibilitas Hasil</span>
                  <span class="setting-value">
                    {{ poll.resultVisibility === 'always' ? 'Selalu Terlihat' : 
                       poll.resultVisibility === 'after_vote' ? 'Setelah Memilih' : 'Setelah Ditutup' }}
                  </span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">Privasi</span>
                  <span class="setting-value">{{ poll.isAnonymous ? 'Anonim' : 'Publik' }}</span>
                </div>
              </div>

              <div class="actions-grid">
                <button @click="handleEdit" class="btn btn-outline w-full">
                  <Edit :size="16" /> Edit
                </button>
                
                <div class="action-spacer"></div>

                <button 
                  v-if="poll.status === 'active'"
                  @click="handleStatusChange('closed')"
                  class="btn btn-warning w-full"
                >
                  <StopCircle :size="18" /> Tutup Voting
                </button>
                <button 
                  v-if="poll.status === 'closed'"
                  @click="handleStatusChange('active')"
                  class="btn btn-success w-full"
                >
                  <PlayCircle :size="18" /> Buka Kembali
                </button>
                
                <button @click="handleDelete" class="btn btn-danger w-full">
                  <Trash2 :size="18" /> Hapus
                </button>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>
  </AppShell>
</template>

<style scoped>
.poll-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--text-sm);
}
.back-link:hover { color: var(--color-primary); }

/* Grid Layout */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-6);
  align-items: start;
  width: 100%;
}

.left-column {
  min-width: 0; /* Prevents grid blowout */
}

/* Mobile Layout (Responsive) */
@media (max-width: 900px) {
  .content-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  
  /* Reset standard block behavior */
  .left-column, .right-column {
    display: block;
    width: 100%;
    min-width: 0;
  }
  
  /* Visibility Utilities */
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
}

@media (min-width: 901px) {
  .mobile-only { display: none !important; }
}


.sticky-wrapper {
  position: sticky;
  top: 20px;
}

/* Actions */
.actions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-1) 0;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-large {
  padding: 10px 16px;
  font-size: var(--text-base);
  font-weight: 600;
}

.btn-outline {
  background: white;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
.btn-outline:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-text-secondary);
}

.btn-warning { background: #fef9c3; color: #854d0e; }
.btn-warning:hover { background: #fde047; }
.btn-success { background: #dcfce7; color: #166534; }
.btn-success:hover { background: #bbf7d0; }
.btn-danger { background: #fee2e2; color: #991b1b; }
.btn-danger:hover { background: #fca5a5; }

/* Existing Styles ... */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.stats-row {
  display: flex;
  gap: var(--space-8);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  padding: 8px;
  border-radius: var(--radius-md);
}
.stat-icon.blue { background: #dbeafe; color: #2563eb; }
.stat-icon.purple { background: #ede9fe; color: #7c3aed; }

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: 700;
}

.type-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.type-badge.voting { color: var(--color-primary); }
.type-badge.polling { color: #8b5cf6; }

.poll-main-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-top: var(--space-1);
  color: var(--color-text-primary);
}

.poll-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
  line-height: 1.6;
  font-weight: 400;
  
  /* Truncation */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poll-description.expanded {
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.btn-read-more {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn-read-more:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500; /* Regular/Medium */
  /* text-transform: uppercase; Removed for 'biasa saja' look */
}
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.closed { background: #fee2e2; color: #991b1b; }
.status-badge.draft { background: #fef9c3; color: #854d0e; }

.chart-container {
  height: 300px;
  position: relative;
}

/* Voter Table */
.voter-table-container {
  overflow-x: auto;
}

.voter-table {
  width: 100%;
  border-collapse: collapse;
}

.voter-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.voter-table td {
  padding: 10px 14px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.option-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1d4ed8;
}

.time-cell {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.anon-notice {
  text-align: center;
  padding: var(--space-6);
  color: var(--color-text-secondary);
  font-style: italic;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
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

/* New Settings Card Styles */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.setting-item {
  display: flex;
  flex-direction: row; /* Changed from column to row */
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-sm);
  padding-bottom: 8px; /* Add slight separation */
  border-bottom: 1px dashed var(--color-border); /* Optional: Separation line */
}
.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  color: var(--color-text-secondary);
  font-size: var(--text-sm); /* Slightly bigger */
  font-weight: 400;
}

.setting-value {
  color: var(--color-text-primary);
  font-weight: 500;
  text-align: right;
}

.action-spacer {
  height: var(--space-2);
}
</style>
