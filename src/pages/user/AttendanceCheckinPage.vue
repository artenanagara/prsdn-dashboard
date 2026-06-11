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
import { CalendarDays, CheckCircle2, Clock3, KeyRound, ShieldCheck } from 'lucide-vue-next';
// Stores

const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const authStore = useAuthStore();
const membersStore = useMembersStore();

const tokenValue = ref('');
const formattedTokenValue = computed({
  get: () => tokenValue.value,
  set: (value: string) => {
    tokenValue.value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }
});
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
  return tokenValue.value.length === 6 && !isSubmitting.value && !alreadyCheckedIn.value && !isTokenExpired.value;
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
  <AppShell pageTitle="Absensi" pageSubtitle="Masukkan token dari petugas untuk mencatat kehadiran">
    <div class="checkin-page">

      <!-- Active Event Card -->
      <div v-if="activeEvent" class="card mb-6 active-event-card">
        <div class="card-body">
          <div class="checkin-hero">
            <div>
              <p class="section-kicker">Event aktif</p>
              <h2>{{ activeEvent.title }}</h2>
              <p class="hero-copy">Gunakan token 6 karakter dari petugas. Token bisa digenerate ulang jika waktunya habis.</p>
            </div>
            <span class="badge badge-success">Token wajib</span>
          </div>
          
          <!-- Event Card Content -->
          <div class="event-card-layout">
            <!-- Left: Event Details -->
            <div class="event-details-col">
              <div class="info-tile">
                <CalendarDays :size="20" />
                <div>
                  <span>Tanggal</span>
                  <strong>{{ formatDate(activeEvent.date) }}</strong>
                </div>
              </div>
              <div class="info-tile">
                <Clock3 :size="20" />
                <div>
                  <span>Waktu</span>
                  <strong>{{ activeEvent.startTime ? `${activeEvent.startTime.substring(0, 5)} - ${activeEvent.endTime ? activeEvent.endTime.substring(0, 5) : 'Selesai'} WIB` : 'Waktu fleksibel' }}</strong>
                </div>
              </div>
              <p v-if="activeEvent.description || activeEvent.notes" class="event-description">{{ activeEvent.description || activeEvent.notes }}</p>
            </div>

            <!-- Right: Input Form -->
            <div class="event-form-col token-panel">
              <div v-if="alreadyCheckedIn" class="checkin-success">
                <div class="success-icon">
                  <CheckCircle2 :size="30" />
                </div>
                <h3>Kamu sudah absen!</h3>
                <p class="text-secondary">Terima kasih sudah hadir.</p>
              </div>
              <div v-else-if="hasToken" class="token-form">
                <div class="token-panel-header">
                  <div class="token-panel-icon">
                    <KeyRound :size="20" />
                  </div>
                  <div>
                    <h3>Masukkan Token</h3>
                    <p>Token berlaku sementara.</p>
                  </div>
                  <span class="countdown-pill">
                    <CountdownTimer :expiresAt="activeEvent.tokenExpiresAt" />
                  </span>
                </div>

                <input
                  v-model="formattedTokenValue"
                  type="text"
                  inputmode="text"
                  autocomplete="one-time-code"
                  class="form-input token-input-field"
                  placeholder="ABC123"
                  maxlength="6"
                  :disabled="isSubmitting || isTokenExpired"
                  @keyup.enter="handleSubmit"
                >
                <div class="token-progress" aria-hidden="true">
                  <span v-for="index in 6" :key="index" :class="{ filled: tokenValue.length >= index }"></span>
                </div>
                <p v-if="isTokenExpired" class="helper-text danger">Token sudah habis. Minta petugas generate ulang token.</p>
                <p v-else class="helper-text">{{ 6 - tokenValue.length > 0 ? `Masukkan ${6 - tokenValue.length} karakter lagi.` : 'Token lengkap, siap absen.' }}</p>

                <button
                  @click="handleSubmit"
                  :disabled="!canSubmit"
                  class="btn btn-primary btn-countdown"
                >
                  <span v-if="isSubmitting">Memproses...</span>
                  <span v-else>Absen Sekarang</span>
                </button>
              </div>
              <div v-else class="waiting-state-text">
                <ShieldCheck :size="30" />
                <h3>Menunggu token</h3>
                <p class="text-secondary">Petugas perlu generate token terlebih dahulu.</p>
              </div>
              <p v-if="errorMessage" class="feedback-message error">{{ errorMessage }}</p>
              <p v-if="successMessage" class="feedback-message success">{{ successMessage }}</p>
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
  gap: var(--space-5);
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

.checkin-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.section-kicker {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.checkin-hero h2 {
  font-size: 1.55rem;
  color: var(--color-ink);
  margin: 0;
}

.hero-copy {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  max-width: 620px;
  font-size: var(--text-sm);
}

.active-event-card {
  border-color: rgba(15, 111, 143, 0.18);
}

.active-event-header h3 {
  margin: 0;
}

/* Active Event Card - Two Column Layout */

.event-card-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--space-8);
  align-items: stretch;
}

.event-details-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  align-content: start;
}

.info-tile {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: #f8fbfc;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
}

.info-tile svg {
  color: var(--color-primary);
  flex: 0 0 auto;
}

.info-tile span {
  display: block;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  margin-bottom: 0.15rem;
}

.info-tile strong {
  display: block;
  color: var(--color-ink);
  font-size: var(--text-sm);
  line-height: 1.4;
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
  grid-column: 1 / -1;
  margin: 0;
  padding: var(--space-4);
  background: #ffffff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
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
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  justify-content: stretch;
}

.token-panel {
  min-height: 100%;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.token-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.token-panel-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.token-panel-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.16));
}

.token-panel-header h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1rem;
}

.token-panel-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.countdown-pill {
  min-width: 58px;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: #ffffff;
}

.token-input-field {
  width: 100%;
  height: 64px;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 1.55rem;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}

.token-input-field::placeholder {
  letter-spacing: 0.08em;
  color: #b6c1cc;
}

.token-progress {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}

.token-progress span {
  height: 4px;
  border-radius: 999px;
  background: #dce3ea;
  transition: background-color var(--transition-base);
}

.token-progress span.filled {
  background: var(--gradient-primary);
}

.helper-text {
  min-height: 20px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-align: center;
}

.helper-text.danger {
  color: var(--color-danger);
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

.checkin-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-align: center;
  min-height: 260px;
}

.checkin-success h3 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: var(--text-lg);
}

.success-icon {
  width: 58px;
  height: 58px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border-radius: var(--radius-xl);
  display: grid;
  place-items: center;
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.22);
}

.waiting-state-text {
  min-height: 260px;
  display: grid;
  place-items: center;
  text-align: center;
  gap: var(--space-2);
  color: var(--color-primary);
}

.waiting-state-text h3,
.waiting-state-text p {
  margin: 0;
}

.feedback-message {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  text-align: center;
  border: 1px solid transparent;
}

.feedback-message.error {
  color: #b91c1c;
  background: var(--color-danger-light);
  border-color: rgba(239, 68, 68, 0.18);
}

.feedback-message.success {
  color: #047857;
  background: var(--color-success-light);
  border-color: rgba(16, 185, 129, 0.18);
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
  .checkin-hero {
    flex-direction: column;
  }

  .event-card-layout {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .event-details-col {
    grid-template-columns: 1fr;
  }

  .token-panel-header {
    grid-template-columns: auto 1fr;
  }

  .countdown-pill {
    grid-column: 1 / -1;
    justify-self: stretch;
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
