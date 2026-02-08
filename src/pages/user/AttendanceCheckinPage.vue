<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import CountdownTimer from '../../components/CountdownTimer.vue';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
// Stores

const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const authStore = useAuthStore();
const membersStore = useMembersStore();

const tokenValue = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  document.title = 'Absensi - PRSDN Dashboard';
  await Promise.all([
    eventStore.loadEvents(),
    checkinStore.loadCheckins(),
    membersStore.loadMembers()
  ]);
  
  // Subscribe to realtime changes
  checkinStore.subscribeToChanges();
  eventStore.subscribeToChanges();
});

const member = computed(() => {
  if (!authStore.currentUser?.memberId) return null;
  return membersStore.getMemberById(authStore.currentUser.memberId);
});

const activeEvent = computed(() => eventStore.activeEvent);

const hasToken = computed(() => {
  if (!activeEvent.value) return false;
  return activeEvent.value.token.length > 0;
});

const isTokenExpired = computed(() => {
  if (!activeEvent.value || !hasToken.value) return false;
  return Date.now() > activeEvent.value.tokenExpiresAt;
});

const alreadyCheckedIn = computed(() => {
  if (!activeEvent.value || !authStore.currentUser?.memberId) return false;
  return checkinStore.hasCheckedIn(activeEvent.value.id, authStore.currentUser.memberId);
});

const canSubmit = computed(() => {
  return tokenValue.value.length === 6 && !isSubmitting.value && !alreadyCheckedIn.value;
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
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort newest first
});

const handleSubmit = async () => {
  if (!canSubmit.value || !activeEvent.value || !authStore.currentUser?.memberId) return;

  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await checkinStore.checkin(
    activeEvent.value.id,
    authStore.currentUser.memberId,
    tokenValue.value
  );

  isSubmitting.value = false;

  if (result.success) {
    successMessage.value = 'Check-in berhasil! ✓';
    tokenValue.value = '';
    // Refresh history
    await checkinStore.loadCheckins(); 
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
  } else {
    errorMessage.value = result.error || 'Terjadi kesalahan';
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
};

const formatDate = (dateString: string | number) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

</script>

<template>
  <AppShell pageTitle="Check-in Absensi" pageSubtitle="Lakukan absensi dengan token">
    <div class="checkin-page">

      <!-- Active Event Card -->
      <div v-if="activeEvent" class="card mb-6 active-event-card">
        <div class="card-body">
          <div class="active-event-header">
            <h3>Event Aktif</h3>
          </div>
          
          
          <!-- Event Card Content -->
          <div class="event-card-layout">
            <!-- Left: Event Details -->
            <div class="event-details-col">
              <div class="event-detail-header">
                <h2>{{ activeEvent.title }}</h2>
                <div class="event-meta">
                  <span>{{ formatDate(activeEvent.date) }}</span>
                  <span v-if="activeEvent.startTime">{{ activeEvent.startTime.substring(0, 5) }} - {{ activeEvent.endTime ? activeEvent.endTime.substring(0, 5) : 'Selesai' }} WIB</span>
                </div>
              </div>
              <p v-if="activeEvent.description || activeEvent.notes" class="event-description">{{ activeEvent.description || activeEvent.notes }}</p>
            </div>

            <!-- Right: Input Form -->
            <div class="event-form-col">
              <div v-if="alreadyCheckedIn" class="checkin-success">
                <div class="success-icon">✓</div>
                <h3>Kamu sudah absen!</h3>
                <p class="text-secondary">Terima kasih sudah hadir.</p>
              </div>
              <div v-else-if="hasToken" class="input-button-stack">
                <input 
                  v-model="tokenValue"
                  type="text" 
                  class="form-input token-input-field"
                  placeholder="Masukkan kode token"
                  maxlength="6"
                  :disabled="isSubmitting || isTokenExpired"
                >
                <button
                  @click="handleSubmit"
                  :disabled="isSubmitting || isTokenExpired"
                  class="btn btn-primary btn-countdown"
                >
                  <span v-if="isTokenExpired">Waktu Habis</span>
                  <span v-else-if="isSubmitting">Memproses...</span>
                  <span v-else-if="tokenValue">Check In</span>
                  <CountdownTimer v-else :expiresAt="activeEvent.tokenExpiresAt" :compact="true" />
                </button>
              </div>
              <div v-else class="waiting-state-text">
                <p class="text-secondary">Menunggu token dari admin/petugas...</p>
              </div>
              <p v-if="errorMessage" class="text-error mt-2 text-sm">{{ errorMessage }}</p>
              <p v-if="successMessage" class="text-success mt-2 text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Active Event -->
      <BaseCard v-else class="mb-4">
        <EmptyState
            icon="calendar"
            title="Tidak Ada Event Aktif"
            message="Saat ini tidak ada event yang sedang berlangsung untuk check-in."
        />
      </BaseCard>

      <!-- Attendance History -->
      <BaseCard class="history-card" title="Riwayat Kehadiran">
        <div class="table-scroll-container">
          <table class="w-full">
            <thead>
              <tr class="text-left border-b border-border">
                <th class="px-4 py-3">Event</th>
                <th class="px-4 py-3">Tanggal</th>
                <th class="px-4 py-3">Waktu</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="attendanceHistory.length === 0">
                <td colspan="4" class="empty-cell">
                   <EmptyState
                    icon="calendar"
                    title="Belum ada riwayat"
                    message="Belum ada riwayat kehadiran yang tercatat."
                  />
                </td>
              </tr>
              <tr v-for="record in attendanceHistory" :key="record.id" class="border-b border-border-light last:border-0 hover:bg-bg-subtle transition-colors">
                <td class="px-4 py-3 font-medium">{{ record.title }}</td>
                <td class="px-4 py-3">{{ formatDate(record.date) }}</td>
                <td class="px-4 py-3">{{ record.time }}</td>
                <td class="px-4 py-3">
                  <span class="badge badge-success text-xs">Hadir</span>
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
.checkin-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.page-header-card {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
}

.page-header {
  margin-bottom: 0;
}

.page-header h1 {
  margin-bottom: var(--space-1);
}

/* Active Event Card - Redesigned Layout */

.active-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.active-event-header h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

/* Active Event Card - Two Column Layout */

.event-card-layout {
  display: flex;
  gap: var(--space-8);
  align-items: stretch;
  min-height: 200px;
}

.event-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.event-detail-header h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.event-description {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-form-col {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  justify-content: flex-end;
}

.input-button-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
}

.token-input-field {
  width: 100%;
  text-align: left;
  font-weight: var(--font-weight-normal);
  letter-spacing: normal;
  text-transform: none;
  font-size: var(--text-base);
}

.btn-countdown {
  width: 100%;
  white-space: nowrap;
  padding: var(--space-3) var(--space-6);
}

.token-expired-text {
  color: var(--color-text-secondary);
}

.token-expired-text p {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
}

.waiting-state-text {
  color: var(--color-text-secondary);
}

.waiting-state-text p {
  margin: 0;
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .event-card-layout {
    flex-direction: column;
  }

  .event-form-col {
    flex: 1;
    width: 100%;
  }
}

.checkin-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.checkin-success h3 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: var(--text-lg);
}

.success-icon {
  width: 48px;
  height: 48px;
  background-color: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.waiting-state {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
}

.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.alert-danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

@media (max-width: 768px) {
  .event-top-section {
    flex-direction: column;
  }

  .countdown-right {
    align-items: flex-start;
    width: 100%;
  }

  .input-button-row {
    flex-direction: column;
  }

  .input-button-row .btn {
    width: 100%;
  }
}

/* TokenInput styling to match HomePage */
.input-button-row :deep(.token-input),
.input-button-group :deep(.token-input) {
  flex: 1;
  text-align: left;
  font-weight: var(--font-weight-normal);
  letter-spacing: normal;
  text-transform: none;
  font-size: var(--text-base);
}

.token-input-short :deep(.token-input) {
  width: 200px;
}

.history-card {
  margin-top: var(--space-6);
}

.history-card :deep(.card-body) {
  padding: 0;
}

.table-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}

th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-bg-secondary);
}

@media (max-width: 768px) {
  .active-event-content {
    gap: var(--space-4);
  }

  .event-meta {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
