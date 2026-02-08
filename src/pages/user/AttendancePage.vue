<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import CardStat from '../../components/CardStat.vue';
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

const attendanceRate = computed(() => {
  const totalEvents = eventStore.events.length;
  if (totalEvents === 0) return '0%';
  const rate = (attendanceHistory.value.length / totalEvents) * 100;
  return `${Math.round(rate)}%`;
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
      <div class="stats-grid mb-6">
        <CardStat
          title="Total Kehadiran"
          :value="`${attendanceHistory.length} Kali`"
          variant="success"
          icon="📅"
        />
        <CardStat
          title="Tingkat Kehadiran"
          :value="attendanceRate"
          variant="info"
          icon="📈"
        />
      </div>

      <BaseCard class="table-card" no-padding>
        <div class="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th>Event / Pertemuan</th>
                <th>Tanggal</th>
                <th>Waktu Absen</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="attendanceHistory.length === 0">
                <td colspan="4" class="empty-cell">
                  <EmptyState
                    icon="calendar"
                    title="Belum Ada Kehadiran"
                    message="Daftar kehadiran Anda akan muncul di sini setelah Anda melakukan absensi pada event aktif."
                  />
                </td>
              </tr>
              <tr v-for="record in attendanceHistory" :key="record.id" class="hover-row">
                <td class="font-bold text-primary">{{ record.title }}</td>
                <td>{{ formatDate(record.date) }}</td>
                <td class="text-secondary">{{ record.time }} WIB</td>
                <td class="text-center">
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
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
  flex-shrink: 0;
}

.table-card {
  flex: 1;
  min-height: 0;
}

.table-scroll-container {
  height: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}

th {
  text-align: left;
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border-light);
}

td {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.hover-row:hover {
  background-color: var(--color-bg-secondary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  th, td {
    padding: var(--space-3) var(--space-4);
  }
}
</style>
