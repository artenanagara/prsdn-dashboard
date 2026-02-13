<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { usePollsStore } from '../../../stores/polls';
import { useUIStore } from '../../../stores/ui';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import { ArrowLeft, CheckCircle, Lock, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Bar, Pie } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const route = useRoute();
const pollsStore = usePollsStore();
const uiStore = useUIStore();
const pollId = route.params.id as string;

// State
const selectedOptions = ref<string[]>([]);
const isSubmitting = ref(false);
const isDescriptionExpanded = ref(false);

const descTextRef = ref<HTMLElement | null>(null);
const isTextTruncated = ref(false);

const checkTruncation = async () => {
  await nextTick();
  if (descTextRef.value) {
    // Check if scrollHeight is significantly larger than clientHeight
    isTextTruncated.value = descTextRef.value.scrollHeight > descTextRef.value.clientHeight + 1;
  }
};

const poll = computed(() => pollsStore.currentPoll);
const options = computed(() => pollsStore.currentOptions);
const allVotes = computed(() => pollsStore.allVotes);
const voterDetails = computed(() => pollsStore.voterDetails);

onMounted(async () => {
  await pollsStore.fetchPollDetail(pollId);
  await pollsStore.fetchAllVotes(pollId);
  if (poll.value && !poll.value.isAnonymous) {
      await pollsStore.fetchVoterDetails(pollId);
  }
  
  // Check truncation after data loads
  checkTruncation();
  window.addEventListener('resize', checkTruncation);
  
  pollsStore.subscribeToRealtime();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkTruncation);
  pollsStore.unsubscribeFromRealtime();
});

// Watch for poll description changes to re-check
watch(() => poll.value?.description, checkTruncation);

const hasVoted = computed(() => poll.value ? pollsStore.hasUserVoted(poll.value.id) : false);

// Chart Logic
const usesPieChart = computed(() => options.value.length <= 2);
const chartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const chartData = computed(() => {
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

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } }
};

// Result Visibility Logic
const canSeeResults = computed(() => {
  if (!poll.value) return false;
  if (poll.value.resultVisibility === 'always') return true;
  if (poll.value.resultVisibility === 'after_vote' && hasVoted.value) return true;
  if (poll.value.resultVisibility === 'after_close' && (poll.value.status === 'closed' || poll.value.status === 'archived')) return true;
  return false;
});

const hiddenResultsMessage = computed(() => {
  if (!poll.value) return '';
  if (poll.value.resultVisibility === 'after_vote') {
    return 'Hasil voting disembunyikan. Silakan berpartisipasi (vote) terlebih dahulu untuk melihat hasil sementara.';
  }
  if (poll.value.resultVisibility === 'after_close') {
    return 'Hasil voting bersifat rahasia dan baru akan ditampilkan secara publik setelah periode voting berakhir.';
  }
  return 'Hasil voting tidak ditampilkan.';
});

const toggleDescription = () => {
  isDescriptionExpanded.value = !isDescriptionExpanded.value;
};

// Voting Logic
const handleOptionSelect = (optionId: string, isMultiple: boolean) => {
  if (isMultiple) {
    if (selectedOptions.value.includes(optionId)) {
      selectedOptions.value = selectedOptions.value.filter(id => id !== optionId);
    } else {
      selectedOptions.value.push(optionId);
    }
  } else {
    selectedOptions.value = [optionId];
  }
};

const submitVote = async () => {
  if (selectedOptions.value.length === 0) return;
  
  const confirmed = await uiStore.confirm({
    title: 'Konfirmasi Pilihan',
    message: 'Apakah Anda yakin dengan pilihan ini? Pilihan tidak dapat diubah.',
    confirmText: 'Ya, Kirim',
    variant: 'primary'
  });

  if (!confirmed) return;

  isSubmitting.value = true;
  await pollsStore.submitVote(pollId, selectedOptions.value);
  await pollsStore.fetchAllVotes(pollId); // Refresh results immediately
  isSubmitting.value = false;
  isEditingVote.value = false;
};

// Edit Vote Logic
const isEditingVote = ref(false);

const startEditing = () => {
  if (!poll.value) return;
  const currentVotes = pollsStore.getUserVoteForPoll(poll.value.id);
  selectedOptions.value = [...currentVotes];
  isEditingVote.value = true;
};

const cancelEdit = () => {
  isEditingVote.value = false;
  selectedOptions.value = [];
};

// Helper
const formatDateDetail = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getOptionLabel = (optionId: string) => {
  const opt = options.value.find((o: any) => o.id === optionId);
  return opt ? opt.label : optionId;
};
</script>

<template>
  <AppShell pageTitle="Detail Voting" pageSubtitle="Suarakan pendapatmu">
    <div v-if="poll" class="poll-detail-page">
      <div class="mb-4">
        <router-link to="/user/polls" class="back-link">
          <ArrowLeft :size="18" /> Kembali ke Daftar
        </router-link>
      </div>

      <div class="content-grid">
        <!-- Left Column: Info & Results -->
        <div class="left-column">
          <BaseCard class="mb-6 info-card-wrapper">
            <div class="info-split">
              <!-- Left: Type, Status, Title, Desc -->
              <div class="info-main">
                <div class="header-badges mb-2 flex items-center gap-2">
                  <span class="type-badge" :class="poll.type">
                    {{ poll.type === 'voting' ? '🗳️ Voting' : '📊 Polling' }}
                  </span>
                  <span class="status-chip" :class="poll.status">
                    {{ poll.status }}
                  </span>
                </div>

                <h1 class="poll-title">{{ poll.title }}</h1>
                
                <div v-if="poll.description">
                  <p 
                    ref="descTextRef"
                    class="poll-desc" 
                    :class="{ 'expanded': isDescriptionExpanded }"
                  >
                    {{ poll.description }}
                  </p>
                  <button 
                    v-show="isTextTruncated || isDescriptionExpanded" 
                    @click="toggleDescription" 
                    class="btn-read-more"
                  >
                    {{ isDescriptionExpanded ? 'Sembunyikan' : 'Selengkapnya' }}
                    <component :is="isDescriptionExpanded ? ChevronUp : ChevronDown" :size="14" />
                  </button>
                </div>
              </div>

              <!-- Right: Time Info -->
              <div class="info-time">
                <div class="time-block">
                  <span class="time-label">Mulai</span>
                  <span class="time-value large">{{ formatDateDetail(poll.startDate) }}</span>
                </div>
                <div class="time-block">
                  <span class="time-label">Selesai</span>
                  <span class="time-value large">{{ formatDateDetail(poll.endDate) }}</span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Mobile Only: Voting Form / Status -->
          <BaseCard class="voting-card mobile-only mb-6">
              <template #header>
                <div class="voting-header">
                   <h3>{{ hasVoted ? 'Status Partisipasi' : 'Formulir Voting' }}</h3>
                </div>
              </template>

              <!-- IF VOTED -->
              <div v-if="hasVoted && !isEditingVote" class="voted-state">
                <div class="success-icon">
                  <CheckCircle :size="48" />
                </div>
                <h3>Terima Kasih!</h3>
                <p>Anda sudah memberikan suara pada voting ini.</p>
                <div class="my-vote-info">
                  <span class="label">Pilihan Anda:</span>
                  <div class="selected-tags">
                     <span v-for="optId in pollsStore.getUserVoteForPoll(poll.id)" :key="optId" class="vote-tag">
                       {{ getOptionLabel(optId) }}
                     </span>
                  </div>
                </div>

                <div v-if="poll.allowEditVote && poll.status === 'active'" class="mt-4">
                  <button @click="startEditing" class="btn btn-outline btn-sm">
                    Ubah Pilihan
                  </button>
                </div>
              </div>

              <!-- IF NOT VOTED & ACTIVE OR EDITING -->
              <div v-else-if="(poll.status === 'active' && !hasVoted) || isEditingVote" class="voting-form">
                <div v-if="isEditingVote" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                  Anda sedang mengubah pilihan. Pilihan sebelumnya akan dihapus setelah Anda mengirim pilihan baru.
                </div>

                <p class="instruction">
                   Pilih <strong>{{ poll.questionType === 'multiple_choice' ? 'satu atau lebih' : 'satu' }}</strong> opsi berikut:
                </p>

                <div class="options-group">
                  <label 
                    v-for="opt in options" 
                    :key="opt.id"
                    class="option-item"
                    :class="{ selected: selectedOptions.includes(opt.id) }"
                  >
                    <input 
                      :type="poll.questionType === 'multiple_choice' ? 'checkbox' : 'radio'"
                      :name="`poll-input-mobile-${poll.id}`"
                      :value="opt.id"
                      @change="handleOptionSelect(opt.id, poll.questionType === 'multiple_choice')"
                      class="option-input"
                    />
                    <span class="option-text">{{ opt.label }}</span>
                  </label>
                </div>

                <div class="form-actions">
                  <button 
                    @click="submitVote"
                    class="btn btn-primary w-full mb-2"
                    :disabled="selectedOptions.length === 0 || isSubmitting"
                  >
                    {{ isSubmitting ? 'Mengirim...' : (isEditingVote ? 'Simpan Perubahan' : 'Kirim Jawaban') }}
                  </button>
                  <button 
                    v-if="isEditingVote" 
                    @click="cancelEdit" 
                    class="btn btn-secondary w-full"
                  >
                    Batal
                  </button>
                  <p v-if="poll.isAnonymous" class="anon-text">🔒 Voting ini bersifat anonim</p>
                </div>
              </div>

               <!-- IF CLOSED -->
              <div v-else class="closed-state">
                <h3>Voting Ditutup</h3>
                <p>Masa berlaku voting ini telah berakhir.</p>
              </div>
          </BaseCard>

          <!-- Results Section (Charts) -->
          <BaseCard title="Hasil Sementara" class="mb-6 results-card-wrapper">
            <div v-if="canSeeResults">
              <div class="chart-container">
                <Pie v-if="usesPieChart" :data="chartData" :options="pieOptions" />
                <Bar v-else :data="chartData" :options="barOptions" />
              </div>
              <p class="total-votes">Total Suara: {{ allVotes.length }}</p>
            </div>
            
            <div v-else class="empty-results-state">
              <div class="lock-icon-bg">
                <Lock :size="24" />
              </div>
              <p class="empty-title">Hasil Belum Tersedia</p>
              <p class="empty-desc">{{ hiddenResultsMessage }}</p>
            </div>
          </BaseCard>

          <!-- Voter List Table (if not anonymous) -->
          <BaseCard v-if="canSeeResults && !poll.isAnonymous && voterDetails.length > 0" title="Daftar Pemilih" class="voter-card-wrapper">
            <div class="voter-table-wrapper">
              <table class="voter-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Pilihan</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(voter, idx) in voterDetails" :key="voter.id">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ voter.fullName || voter.username }}</td>
                    <td><span class="option-tag">{{ getOptionLabel(voter.optionId) }}</span></td>
                    <td class="text-xs text-gray-500">{{ new Date(voter.createdAt).toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>
        </div>

        <!-- Right Column: Voting Form (Sticky) -->
        <div class="right-column">
          <div class="sticky-wrapper voting-card-wrapper desktop-only">
            <BaseCard class="voting-card">
              <template #header>
                <div class="voting-header">
                   <h3>{{ hasVoted ? 'Status Partisipasi' : 'Formulir Voting' }}</h3>
                </div>
              </template>

              <!-- IF VOTED -->
              <div v-if="hasVoted && !isEditingVote" class="voted-state">
                <div class="success-icon">
                  <CheckCircle :size="48" />
                </div>
                <h3>Terima Kasih!</h3>
                <p>Anda sudah memberikan suara pada voting ini.</p>
                <div class="my-vote-info">
                  <span class="label">Pilihan Anda:</span>
                  <div class="selected-tags">
                     <span v-for="optId in pollsStore.getUserVoteForPoll(poll.id)" :key="optId" class="vote-tag">
                       {{ getOptionLabel(optId) }}
                     </span>
                  </div>
                </div>

                <div v-if="poll.allowEditVote && poll.status === 'active'" class="mt-4">
                  <button @click="startEditing" class="btn btn-outline btn-sm">
                    Ubah Pilihan
                  </button>
                </div>
              </div>

              <!-- IF NOT VOTED & ACTIVE OR EDITING -->
              <div v-else-if="(poll.status === 'active' && !hasVoted) || isEditingVote" class="voting-form">
                <div v-if="isEditingVote" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                  Anda sedang mengubah pilihan.
                </div>

                <p class="instruction">
                   Pilih <strong>{{ poll.questionType === 'multiple_choice' ? 'satu atau lebih' : 'satu' }}</strong> opsi berikut:
                </p>

                <div class="options-group">
                  <label 
                    v-for="opt in options" 
                    :key="opt.id"
                    class="option-item"
                    :class="{ selected: selectedOptions.includes(opt.id) }"
                  >
                    <input 
                      :type="poll.questionType === 'multiple_choice' ? 'checkbox' : 'radio'"
                      :name="`poll-input-${poll.id}`"
                      :value="opt.id"
                      @change="handleOptionSelect(opt.id, poll.questionType === 'multiple_choice')"
                      class="option-input"
                    />
                    <span class="option-text">{{ opt.label }}</span>
                  </label>
                </div>

                <div class="form-actions">
                  <button 
                    @click="submitVote"
                    class="btn btn-primary w-full mb-2"
                    :disabled="selectedOptions.length === 0 || isSubmitting"
                  >
                    {{ isSubmitting ? 'Mengirim...' : (isEditingVote ? 'Simpan Perubahan' : 'Kirim Jawaban') }}
                  </button>
                  <button 
                    v-if="isEditingVote" 
                    @click="cancelEdit" 
                    class="btn btn-secondary w-full"
                  >
                    Batal
                  </button>
                  <p v-if="poll.isAnonymous" class="anon-text">🔒 Voting ini bersifat anonim</p>
                </div>
              </div>

               <!-- IF CLOSED -->
              <div v-else class="closed-state">
                <h3>Voting Ditutup</h3>
                <p>Masa berlaku voting ini telah berakhir.</p>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data voting...</p>
    </div>
  </AppShell>
</template>

<style scoped>
.poll-detail-page {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  overflow-x: hidden;
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

/* Desktop Layout (Default) */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-6);
  align-items: start;
}

/* Mobile Layout (Responsive) */
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

@media (min-width: 901px) {
  .mobile-only { display: none !important; }
}

/* Info Card Split Layout */
.info-split {
  display: flex;
  gap: var(--space-6);
  width: 100%;
}

.info-main {
  flex: 1;
  min-width: 0;
}

.info-time {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 180px;
  border-left: 1px solid var(--color-border);
  padding-left: var(--space-6);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .info-split {
    flex-direction: column;
    gap: var(--space-4);
  }
  .info-time {
    min-width: 0;
    width: 100%;
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
    flex-direction: row;
    justify-content: space-between;
  }
  .time-block {
    flex: 1;
    min-width: unset;
  }
  .time-value.large {
    font-size: 14px;
  }
}

.time-block {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}
.time-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}
.time-value.large {
  font-size: 16px;
  font-weight: 600;
}

.status-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
}
.status-chip.active { background: #dcfce7; color: #166534; }
.status-chip.closed { background: #fee2e2; color: #991b1b; }

.type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}
.type-badge.voting { color: var(--color-primary); }

.poll-title {
  font-size: var(--text-2xl);
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  line-height: 1.2;
  word-break: break-word;
}

.poll-desc {
  color: var(--color-text-secondary);
  line-height: 1.6;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-2);
}

.poll-desc.expanded {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  display: block;
}

.btn-read-more {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn-read-more:hover {
  text-decoration: underline;
}

.chart-container {
  height: 250px; /* Reduced height to save space */
  position: relative;
  margin-bottom: var(--space-4);
}

.total-votes {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

/* Voter Table */
.voter-table-wrapper {
  overflow-x: auto;
}
.voter-table {
  width: 100%;
  border-collapse: collapse;
}
.voter-table th {
  text-align: left;
  padding: 8px;
  font-size: 12px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.voter-table td {
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}
.option-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* Right Column (Sticky Form) */
.sticky-wrapper {
  position: sticky;
  top: 20px;
}

.voting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.voting-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 12px;
}

/* Empty Results State */
.empty-results-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-6) var(--space-4);
}
.lock-icon-bg {
  width: 48px;
  height: 48px;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
  color: var(--color-text-tertiary);
}
.empty-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}
.empty-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  max-width: 300px;
  line-height: 1.5;
}

/* Voting Form */
.instruction {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  width: 100%; /* Ensure full width */
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  width: 100%; /* Ensure full width */
}

.option-item:hover { background: var(--color-bg-secondary); }
.option-item.selected {
  border-color: var(--color-primary);
  background: #eff6ff;
  box-shadow: 0 0 0 1px var(--color-primary);
}

.option-input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.option-text {
  font-weight: 500;
  color: var(--color-text-primary);
}

.anon-text {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}

/* Voted State */
.voted-state {
  text-align: center;
  padding: var(--space-4) 0; /* Reduced padding */
}
.success-icon {
  color: #166534;
  margin-bottom: var(--space-2);
}
.voted-state h3 {
  font-size: var(--text-lg); /* Slightly smaller heading */
  font-weight: 700;
  color: #166534;
  margin-bottom: var(--space-1);
}
.my-vote-info {
  margin-top: var(--space-4);
  background: var(--color-bg-secondary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 6px;
}
.vote-tag {
  background: var(--color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
