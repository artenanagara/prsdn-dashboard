<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import { usePollsStore } from '../../../stores/polls';
import { Calendar, ChevronRight, Clock } from 'lucide-vue-next';

const router = useRouter();
const pollsStore = usePollsStore();
const activeTab = ref('active');

onMounted(async () => {
  await pollsStore.fetchPolls(false);
  // Fetch detailed info for vote counts etc - could optimize later
  // For now fetchPolls gets basic info, but we might want vote counts in list
  // The current fetchPolls doesn't return vote count per poll in the list query
  // We can either update the view or query to include count, or fetch individually
  // Let's assume basic info is enough or we fetch counts
  pollsStore.subscribeToRealtime();
});

onUnmounted(() => {
  pollsStore.unsubscribeFromRealtime();
});

const filteredPolls = computed(() => {
  const polls = activeTab.value === 'active' 
    ? pollsStore.activePolls 
    : pollsStore.historyPolls;
    
  return polls.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const hasVoted = (pollId: string) => pollsStore.hasUserVoted(pollId);

const getStatusBadge = (poll: any) => {
  if (hasVoted(poll.id)) return { label: 'Sudah Memilih', class: 'badge-success' };
  return { label: 'Belum Memilih', class: 'badge-warning' };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const navigateToDetail = (id: string) => {
  router.push(`/user/polls/${id}`);
};
</script>

<template>
  <AppShell pageTitle="Voting & Polling" pageSubtitle="Suarakan pendapatmu di sini">
    <div class="user-polls-page">
      <!-- Tabs -->
      <div class="tabs-container">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          Sedang Berlangsung
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          Riwayat
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pollsStore.isLoading && !pollsStore.polls.length" class="loading-state">
        <div class="spinner"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPolls.length === 0" class="empty-state">
        <h3>Tidak ada aktivitas {{ activeTab === 'active' ? 'berlangsung' : 'riwayat' }}</h3>
        <p>Cek kembali nanti untuk update terbaru.</p>
      </div>

      <!-- Polls List -->
      <div v-else class="polls-list">
        <BaseCard 
          v-for="poll in filteredPolls" 
          :key="poll.id" 
          class="poll-list-item"
          @click="navigateToDetail(poll.id)"
        >
          <div class="item-content">
            <!-- Left Info -->
            <div class="item-main">
              <div class="item-header-row">
                <span class="type-badge" :class="poll.type">
                  {{ poll.type === 'voting' ? '🗳️ Voting' : '📊 Polling' }}
                </span>
                <span class="status-badge-inline" :class="getStatusBadge(poll).class">
                  {{ getStatusBadge(poll).label }}
                </span>
              </div>
              
              <h3 class="poll-title">{{ poll.title }}</h3>
              
              <div class="item-meta-row">
                <div class="meta-item">
                  <Calendar :size="14" />
                  <span>{{ formatDate(poll.startDate) }}</span>
                </div>
                <div class="meta-item">
                   <span class="arrow-sep">→</span>
                </div>
                <div class="meta-item">
                  <Clock :size="14" />
                  <span>{{ formatDate(poll.endDate) }}</span>
                </div>
              </div>

               <div class="item-stats text-xs text-gray-500 mt-1">
                 Total Suara: <strong>{{ pollsStore.allVotes.filter((v: any) => v.pollId === poll.id).length || '-' }}</strong>
               </div>
            </div>

            <!-- Right Action -->
            <div class="item-action">
              <div class="detail-link">
                Lihat Detail <ChevronRight :size="16" />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.user-polls-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Tabs */
.tabs-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-bg-secondary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.tab-btn {
  padding: var(--space-3);
  text-align: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.polls-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* List Item */
.poll-list-item {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: var(--space-4);
  border: 1px solid transparent;
}

.poll-list-item:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Vertically center */
  gap: var(--space-4);
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-width: 0; /* Important for truncation if needed */
}

.item-header-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}
.type-badge.voting { color: var(--color-primary); }
.type-badge.polling { color: #8b5cf6; }

.status-badge-inline {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}
.status-badge-inline.badge-success { background: #dcfce7; color: #166534; }
.status-badge-inline.badge-warning { background: #fef9c3; color: #854d0e; }

.poll-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
  margin-bottom: 4px;
}

.item-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.arrow-sep {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* Right Side */
.item-action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.detail-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: var(--space-12);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-12);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-bg-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .item-content {
    flex-wrap: wrap;
  }
  .item-action {
    width: 100%;
    justify-content: flex-end;
    margin-top: var(--space-2);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-2);
  }
}
</style>
