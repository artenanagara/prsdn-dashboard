<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CountdownTimer from '../../components/CountdownTimer.vue';
import TokenInput from '../../components/TokenInput.vue';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members'; // Added
import { CheckCircle } from 'lucide-vue-next';

const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const authStore = useAuthStore();
const membersStore = useMembersStore(); // Added

const tokenValue = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  document.title = 'Absensi - PRSDN Dashboard';
  await Promise.all([
    eventStore.loadEvents(),
    checkinStore.loadCheckins(),
    membersStore.loadMembers() // Added
  ]);
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

const formatTime = (timeString?: string) => {
  if (!timeString) return '';
  return timeString;
};
</script>

<template>
  <AppShell>
    <div class="checkin-page">
      <div class="page-header">
        <h1>Absensi</h1>
        <p class="text-secondary">Check-in event dan riwayat kehadiran</p>
      </div>

      <!-- Active Event Card -->
      <div v-if="activeEvent" class="card mb-6">
        <div class="card-body active-event-layout">
          <!-- Left Column: Details -->
          <div class="event-details-col">
            <div class="event-header">
              <div>
                <h2>{{ activeEvent.title }}</h2>
                <span class="badge badge-success mt-2 md:mt-0 md:ml-0 inline-block md:hidden">Active</span>
              </div>
              <span class="badge badge-success hidden md:inline-block">Active</span>
            </div>

            <p v-if="activeEvent.description" class="text-secondary mb-4">{{ activeEvent.description }}</p>

            <div class="event-meta">
              <span>📅 {{ formatDate(activeEvent.date) }}</span>
              <span v-if="activeEvent.startTime">🕐 {{ formatTime(activeEvent.startTime) }} - {{ formatTime(activeEvent.endTime) }} WIB</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Right Column: Action -->
          <div class="checkin-action-col">
            <!-- Already Checked In -->
            <div v-if="alreadyCheckedIn" class="checkin-success">
              <CheckCircle :size="48" />
              <h3>Anda sudah check-in</h3>
              <p class="text-secondary">Terima kasih atas kehadiran Anda!</p>
            </div>

            <!-- Check-in Form -->
            <div v-else class="checkin-form">
              <div v-if="hasToken && !isTokenExpired" class="token-status">
                <label>Token berlaku hingga:</label>
                <CountdownTimer :expiresAt="activeEvent.tokenExpiresAt" />
              </div>

              <div v-else-if="isTokenExpired" class="token-expired">
                <p class="text-danger">Token sudah kadaluarsa. Silakan tunggu token baru dari admin.</p>
              </div>

              <div v-else class="token-waiting">
                <p class="text-secondary">Menunggu token dari admin...</p>
              </div>

              <div v-if="hasToken && !isTokenExpired" class="token-input-section">
                <label class="form-label">Masukkan Token:</label>
                <TokenInput
                  v-model="tokenValue"
                  :disabled="isSubmitting"
                  @submit="handleSubmit"
                />

                <button
                  @click="handleSubmit"
                  :disabled="!canSubmit"
                  class="btn btn-primary btn-lg"
                >
                  {{ isSubmitting ? 'Memproses...' : 'Check In' }}
                </button>
              </div>

              <!-- Success Message -->
              <div v-if="successMessage" class="alert alert-success">
                {{ successMessage }}
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Active Event -->
      <div v-else class="card mb-6">
        <div class="card-body text-center empty-state py-12">
          <div class="text-6xl mb-4">📅</div>
          <h3>Tidak Ada Event Aktif</h3>
          <p class="text-secondary">Saat ini tidak ada event yang sedang berlangsung.</p>
        </div>
      </div>

      <!-- Attendance History -->
      <div class="page-header mt-8 mb-4">
        <h2>Riwayat Kehadiran</h2>
      </div>

       <div class="card">
        <div class="table-container">
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
                <td colspan="4" class="p-8 text-center text-secondary">
                  Belum ada riwayat kehadiran
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
      </div>

    </div>
  </AppShell>
</template>

<style scoped>
.checkin-page {
  max-width: 1000px; /* Increased from 800px to accommodate side-by-side */
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-6); /* Reduced from space-8 */
}

.page-header h1 {
  margin-bottom: var(--space-1);
}

/* Active Event Layout */
.active-event-layout {
  display: flex;
  gap: var(--space-8);
  align-items: stretch;
}

.event-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.checkin-action-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.event-header h2 {
  margin-bottom: 0;
  line-height: 1.2;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

/* Vertical Divider for Desktop, Horizontal for Mobile */
.divider {
  width: 1px;
  background-color: var(--color-border-light);
  margin: 0;
  display: block;
}

.checkin-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  text-align: center;
  color: var(--color-success);
}

.checkin-success h3 {
  color: var(--color-text-primary);
  margin: 0;
}

.checkin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.token-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
}

.token-status label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.token-expired,
.token-waiting {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.token-input-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
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

/* Table Styling */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .active-event-layout {
    flex-direction: column;
    gap: var(--space-6);
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 0;
  }
  
  .event-header {
    flex-direction: column;
    gap: var(--space-2);
  }

  .event-meta {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
