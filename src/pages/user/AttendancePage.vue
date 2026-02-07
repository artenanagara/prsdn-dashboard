<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
import { useCheckinStore } from '../../stores/checkin';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const checkinStore = useCheckinStore();
const eventStore = useAttendanceEventStore();

onMounted(async () => {
  document.title = 'Riwayat Kehadiran - PRSDN Dashboard';
  await checkinStore.loadCheckins();
  await eventStore.loadEvents();
  
  // Subscribe to realtime changes
  checkinStore.subscribeToChanges();
  eventStore.subscribeToChanges();
});

const member = computed(() => {
  if (!authStore.currentUser?.memberId) return null;
  return membersStore.getMemberById(authStore.currentUser.memberId);
});

const attendanceHistory = computed(() => {
  if (!member.value) return [];
  const myCheckins = checkinStore.getCheckinsByMember(member.value.id);
  
  // Transform to display format
  return myCheckins.map(c => {
    const event = eventStore.getEventById(c.eventId);
    const date = new Date(c.checkedInAt);
    return {
      id: c.id,
      date: c.checkedInAt,
      title: event?.title || 'Event Unknown',
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  });
});

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>

<template>
  <AppShell>
    <div class="user-attendance-page">
      <BaseCard class="page-header-card">
        <div class="page-header">
          <h1>Riwayat Kehadiran</h1>
          <p class="text-secondary">Lihat riwayat kehadiran Anda di pertemuan bulanan</p>
        </div>
      </BaseCard>

      <BaseCard class="mb-6 summary-card">
        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">Total Kehadiran</span>
            <span class="summary-value text-success">{{ attendanceHistory.length }} kali</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="table-card">
        <div class="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="attendanceHistory.length === 0">
                <td colspan="4" class="empty-cell">
                  <EmptyState
                    icon="calendar"
                    title="Belum ada kehadiran"
                    message="Belum ada riwayat kehadiran yang tercatat."
                  />
                </td>
              </tr>
              <tr v-for="record in attendanceHistory" :key="record.id">
                <td class="font-medium">{{ record.title }}</td>
                <td>{{ formatDate(record.date) }}</td>
                <td>{{ record.time }}</td>
                <td>
                  <span class="badge badge-success">Hadir</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<style scoped>
.user-attendance-page {
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-header-card, .summary-card {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-8);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.summary-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.card-body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
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
</style>
