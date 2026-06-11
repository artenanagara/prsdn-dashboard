<script setup lang="ts">
import { computed } from 'vue';
import CountdownTimer from '../CountdownTimer.vue';
import { CalendarDays, CheckCircle2, Clock3, KeyRound, ShieldCheck, Sparkles } from 'lucide-vue-next';

interface AttendanceEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  notes?: string;
  token: string;
  tokenExpiresAt: number;
  isActive: boolean;
}

interface Props {
  event: AttendanceEvent | null;
  alreadyCheckedIn: boolean;
  tokenInput: string;
  isSubmitting: boolean;
  isTokenExpired: boolean;
}

interface Emits {
  (e: 'update:tokenInput', value: string): void;
  (e: 'checkin'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const localTokenInput = computed({
  get: () => props.tokenInput,
  set: (value: string) => emit('update:tokenInput', value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
});

const canSubmit = computed(() => {
  return props.tokenInput.length === 6 && !props.isSubmitting && !props.alreadyCheckedIn && !props.isTokenExpired;
});
</script>

<template>
  <div class="card active-event-card">
    <div class="card-body">
      <!-- No Active Event State -->
      <div v-if="!event" class="empty-event-state">
        <div class="empty-main">
          <span class="empty-icon"><CalendarDays :size="24" /></span>
          <div>
            <p class="section-kicker">Absensi</p>
            <h3>Belum ada absensi aktif</h3>
            <p>Token akan muncul di sini saat petugas membuka event absensi.</p>
          </div>
        </div>
        <div class="empty-side">
          <span class="status-chip">
            <Sparkles :size="14" />
            Siap dipakai
          </span>
          <span class="status-note">Cek kembali saat kegiatan dimulai.</span>
        </div>
      </div>
      
      <!-- Event Card Content -->
      <div v-else>
        <div class="checkin-hero">
          <div>
            <p class="section-kicker">Absensi aktif</p>
            <h2>{{ event.title }}</h2>
            <p>Masukkan token dari petugas untuk mencatat kehadiran.</p>
          </div>
          <span class="badge badge-success">Token wajib</span>
        </div>

        <div class="event-card-layout">
          <div class="event-details-col">
            <div class="info-tile">
              <CalendarDays :size="20" />
              <div>
                <span>Tanggal</span>
                <strong>{{ formatDate(event.date) }}</strong>
              </div>
            </div>
            <div class="info-tile">
              <Clock3 :size="20" />
              <div>
                <span>Waktu</span>
                <strong>{{ event.startTime ? `${event.startTime.substring(0, 5)} - ${event.endTime ? event.endTime.substring(0, 5) : 'Selesai'} WIB` : 'Waktu fleksibel' }}</strong>
              </div>
            </div>
            <p v-if="event.description || event.notes" class="event-description">{{ event.description || event.notes }}</p>
          </div>

          <div class="event-form-col token-panel">
            <div v-if="alreadyCheckedIn" class="checkin-success">
              <div class="success-icon"><CheckCircle2 :size="30" /></div>
              <h3>Kamu sudah absen!</h3>
              <p class="text-secondary">Terima kasih sudah hadir.</p>
            </div>
            <div v-else-if="event.token" class="token-form">
              <div class="token-panel-header">
                <div class="token-panel-icon"><KeyRound :size="20" /></div>
                <div>
                  <h3>Masukkan Token</h3>
                  <p>Token berlaku sementara.</p>
                </div>
                <span class="countdown-pill"><CountdownTimer :expiresAt="event.tokenExpiresAt" /></span>
              </div>
              <input 
                v-model="localTokenInput"
                type="text" 
                inputmode="text"
                autocomplete="one-time-code"
                class="form-input token-input-field"
                placeholder="ABC123"
                maxlength="6"
                :disabled="isSubmitting || isTokenExpired"
                @keyup.enter="canSubmit && emit('checkin')"
              >
              <div class="token-progress" aria-hidden="true">
                <span v-for="index in 6" :key="index" :class="{ filled: tokenInput.length >= index }"></span>
              </div>
              <p v-if="isTokenExpired" class="helper-text danger">Token habis. Minta petugas generate ulang.</p>
              <p v-else class="helper-text">{{ 6 - tokenInput.length > 0 ? `Masukkan ${6 - tokenInput.length} karakter lagi.` : 'Token lengkap, siap absen.' }}</p>
              <button 
                @click="emit('checkin')" 
                class="btn btn-primary btn-countdown"
                :disabled="!canSubmit"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-event-card {
  margin-bottom: 0;
  border-color: rgba(15, 111, 143, 0.18);
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
  font-size: 1.35rem;
  color: var(--color-ink);
  margin: 0;
}

.checkin-hero p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.empty-event-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 0;
  padding: var(--space-2) 0;
}

.empty-main {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
}

.empty-event-state .empty-icon {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-lg);
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.16));
}

.empty-event-state h3 {
  font-size: 1.05rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.empty-event-state p {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
}

.empty-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  text-align: right;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  color: var(--color-primary);
  background: rgba(15, 111, 143, 0.08);
  border: 1px solid rgba(15, 111, 143, 0.16);
  font-size: var(--text-xs);
  font-weight: 800;
  white-space: nowrap;
}

.status-note {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 600;
}

.event-card-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--space-6);
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
  height: 60px;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 1.45rem;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
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

.checkin-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-align: center;
  min-height: 150px;
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
  min-height: 250px;
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

@media (max-width: 768px) {
  .empty-event-state {
    align-items: flex-start;
    flex-direction: column;
  }

  .empty-side {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }

  .checkin-hero {
    flex-direction: column;
  }

  .event-card-layout {
    grid-template-columns: 1fr;
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
</style>
