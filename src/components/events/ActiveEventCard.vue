<script setup lang="ts">
import { computed } from 'vue';
import CountdownTimer from '../CountdownTimer.vue';

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
  set: (value: string) => emit('update:tokenInput', value.toUpperCase())
});
</script>

<template>
  <div class="card active-event-card">
    <div class="card-body">
      <div class="active-event-header">
        <h3>Event Aktif</h3>
      </div>
      
      <!-- No Active Event State -->
      <div v-if="!event" class="empty-event-state">
        <span class="empty-icon">📅</span>
        <h3>Tidak Ada Event Aktif</h3>
        <p class="text-secondary">Belum ada kegiatan yang sedang berlangsung saat ini.</p>
      </div>
      
      <!-- Event Card Content -->
      <div v-else class="event-card-layout">
        <!-- Left: Event Details -->
        <div class="event-details-col">
          <div class="event-detail-header">
            <h2>{{ event.title }}</h2>
            <div class="event-meta">
              <span>{{ formatDate(event.date) }}</span>
              <span v-if="event.startTime">{{ event.startTime.substring(0, 5) }} - {{ event.endTime ? event.endTime.substring(0, 5) : 'Selesai' }} WIB</span>
            </div>
          </div>
          <p v-if="event.description || event.notes" class="event-description">{{ event.description || event.notes }}</p>
        </div>

        <!-- Right: Input Form -->
        <div class="event-form-col">
          <div v-if="alreadyCheckedIn" class="checkin-success">
            <div class="success-icon">✓</div>
            <h3>Kamu sudah absen!</h3>
            <p class="text-secondary">Terima kasih sudah hadir.</p>
          </div>
          <div v-else-if="event.token" class="input-button-stack">
            <input 
              v-model="localTokenInput"
              type="text" 
              class="form-input token-input-field"
              placeholder="Masukkan kode token"
              maxlength="6"
              :disabled="isSubmitting || isTokenExpired"
            >
            <button 
              @click="emit('checkin')" 
              class="btn btn-primary btn-countdown"
              :disabled="isSubmitting || isTokenExpired"
            >
              <span v-if="isTokenExpired">Waktu Habis</span>
              <span v-else-if="isSubmitting">Memproses...</span>
              <span v-else-if="tokenInput">Submit Absen</span>
              <CountdownTimer v-else :expiresAt="event.tokenExpiresAt" :compact="true" />
            </button>
          </div>
          <div v-else class="waiting-state-text">
            <p class="text-secondary">Menunggu token dari admin/petugas...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-event-card {
  margin-bottom: var(--space-6);
}

.active-event-header h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-4);
}

.empty-event-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.empty-event-state .empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.empty-event-state h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.empty-event-state p {
  margin: 0;
  font-size: var(--text-sm);
}

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

.checkin-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  color: var(--color-success);
  padding: var(--space-4);
}

.checkin-success h3 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: var(--text-lg);
}

.success-icon {
  font-size: 3rem;
  margin-bottom: var(--space-2);
}

.waiting-state-text {
  padding: var(--space-4);
  text-align: center;
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
</style>
