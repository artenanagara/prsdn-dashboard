<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CountdownTimer from '../../components/CountdownTimer.vue';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';
import { useMembersStore } from '../../stores/members';
import { useAuthStore } from '../../stores/auth';
import { Plus, Play, Square, RefreshCw, Trash2, Users } from 'lucide-vue-next';

const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const membersStore = useMembersStore();
const authStore = useAuthStore();

const showCreateModal = ref(false);
const showDetailModal = ref(false);
const selectedEventId = ref<string | null>(null);
const searchQuery = ref('');
const filterRT = ref('all');

const formData = ref({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0]!,
  startTime: '',
  endTime: ''
});

onMounted(async () => {
  document.title = 'Absensi - PRSDN Admin';
  await eventStore.loadEvents();
  eventStore.subscribeToChanges();
  await checkinStore.loadCheckins();
  checkinStore.subscribeToChanges();
  membersStore.loadMembers();
});

const activeEvent = computed(() => eventStore.activeEvent);

const selectedEvent = computed(() => {
  if (!selectedEventId.value) return null;
  return eventStore.getEventById(selectedEventId.value);
});

const selectedEventCheckins = computed(() => {
  if (!selectedEventId.value) return [];
  const checkins = checkinStore.getCheckinsByEvent(selectedEventId.value);
  
  return checkins.map(c => {
    const member = membersStore.getMemberById(c.memberId);
    return {
      ...c,
      memberName: member?.fullName || 'Unknown',
      rt: member?.rt || '01'
    };
  }).filter(c => {
    const matchesSearch = c.memberName.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesRT = filterRT.value === 'all' || c.rt === filterRT.value;
    return matchesSearch && matchesRT;
  });
});

const handleCreateEvent = async () => {
  console.log('handleCreateEvent called');
  console.log('Form data:', formData.value);
  
  // Validate required fields
  if (!formData.value.title || !formData.value.title.trim()) {
    alert('Judul event harus diisi!');
    return;
  }
  
  if (!formData.value.date) {
    alert('Tanggal event harus diisi!');
    return;
  }
  
  if (!authStore.currentUser) {
    alert('Error: User tidak terautentikasi');
    return;
  }
  
  try {
    console.log('Creating event with data:', formData.value);
    
    const newEvent = await eventStore.createEvent({
      title: formData.value.title.trim(),
      description: formData.value.description?.trim() || '',
      date: formData.value.date,
      startTime: formData.value.startTime || undefined,
      endTime: formData.value.endTime || undefined,
      createdByAdminId: authStore.currentUser.userId
    });
    
    console.log('Event created:', newEvent);
    console.log('Total events now:', eventStore.events.length);
    
    if (newEvent) {
      showCreateModal.value = false;
      resetForm();
      alert(`✓ Event "${newEvent.title}" berhasil dibuat!`);
    } else {
      alert('Gagal membuat event. Silakan coba lagi.');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    alert('Gagal membuat event. Silakan coba lagi.');
  }
};

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]!,
    startTime: '',
    endTime: ''
  };
};

const handleActivate = (eventId: string) => {
  eventStore.setActiveEvent(eventId);
};

const handleDeactivate = (eventId: string) => {
  eventStore.deactivateEvent(eventId);
};

const handleGenerateToken = async (eventId: string) => {
  const result = await eventStore.generateEventToken(eventId);
  if (result) {
    alert(`Token generated: ${result.token}\nValid for 30 seconds`);
  }
};

const handleDelete = (eventId: string, title: string) => {
  if (confirm(`Hapus event "${title}"?`)) {
    eventStore.deleteEvent(eventId);
  }
};

const openDetail = (eventId: string) => {
  selectedEventId.value = eventId;
  showDetailModal.value = true;
  searchQuery.value = '';
  filterRT.value = 'all';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatTime = (timeString?: string) => {
  if (!timeString) return '-';
  return timeString;
};

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <AppShell>
    <div class="attendance-events-page">
      <div class="page-header">
        <div>
          <h1>Absensi</h1>
          <p class="text-secondary">Kelola event dan check-in anggota</p>
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <Plus :size="20" />
          <span>Buat Event</span>
        </button>
      </div>

      <!-- Active Event Section -->
      <div v-if="activeEvent" class="card mb-6">
        <div class="card-body">
          <div class="active-event-header">
            <h3>Event Aktif</h3>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="active-event-content">
            <div class="event-info">
              <h2>{{ activeEvent.title }}</h2>
              <p v-if="activeEvent.description" class="text-secondary">{{ activeEvent.description }}</p>
              <div class="event-meta">
                <span>📅 {{ formatDate(activeEvent.date) }}</span>
                <span v-if="activeEvent.startTime">🕐 {{ formatTime(activeEvent.startTime) }} - {{ formatTime(activeEvent.endTime) }}</span>
              </div>
            </div>
            <div class="token-section">
              <div v-if="activeEvent.token" class="token-display">
                <label>Token:</label>
                <div class="token-value">{{ activeEvent.token }}</div>
                <CountdownTimer :expiresAt="activeEvent.tokenExpiresAt" />
              </div>
              <div v-else class="token-empty">
                <p class="text-secondary">Belum ada token aktif</p>
              </div>
              <div class="token-actions">
                <button @click="handleGenerateToken(activeEvent.id)" class="btn btn-primary">
                  <RefreshCw :size="18" />
                  <span>{{ activeEvent.token ? 'Regenerate' : 'Generate' }} Token</span>
                </button>
                <button @click="handleDeactivate(activeEvent.id)" class="btn btn-secondary">
                  <Square :size="18" />
                  <span>Deactivate</span>
                </button>
                <button @click="openDetail(activeEvent.id)" class="btn btn-secondary">
                  <Users :size="18" />
                  <span>{{ checkinStore.getCheckinsByEvent(activeEvent.id).length }} Check-ins</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="card mb-6">
        <div class="card-body text-center">
          <p class="text-secondary">Tidak ada event aktif saat ini</p>
        </div>
      </div>

      <!-- Events List -->
      <div class="card">
        <div class="card-header">
          <h3>Semua Event</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Judul</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Check-ins</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="eventStore.events.length === 0">
                <td colspan="6" class="text-center text-secondary">Belum ada event</td>
              </tr>
              <tr v-for="event in eventStore.events" :key="event.id">
                <td class="font-medium">{{ event.title }}</td>
                <td>{{ formatDate(event.date) }}</td>
                <td class="text-sm">{{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</td>
                <td>
                  <span :class="['badge', event.isActive ? 'badge-success' : 'badge-secondary']">
                    {{ event.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button @click="openDetail(event.id)" class="btn btn-sm btn-secondary">
                    <Users :size="16" />
                    <span>{{ checkinStore.getCheckinsByEvent(event.id).length }}</span>
                  </button>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="!event.isActive"
                      @click="handleActivate(event.id)"
                      class="btn btn-sm"
                      style="background-color: var(--color-success); color: white;"
                    >
                      <Play :size="16" />
                    </button>
                    <button
                      v-if="event.isActive"
                      @click="handleGenerateToken(event.id)"
                      class="btn btn-primary btn-sm"
                    >
                      <RefreshCw :size="16" />
                    </button>
                    <button @click="handleDelete(event.id, event.title)" class="btn btn-danger btn-sm">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Event Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content card">
          <div class="modal-header">
            <h2>Buat Event Baru</h2>
          </div>
          <form @submit.prevent="handleCreateEvent" class="modal-body">
            <div class="form-group">
              <label class="form-label">Judul Event *</label>
              <input v-model="formData.title" type="text" class="form-input" placeholder="Contoh: Rapat Bulanan RT" />
            </div>

            <div class="form-group">
              <label class="form-label">Deskripsi</label>
              <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="Deskripsi event (opsional)"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tanggal *</label>
                <input v-model="formData.date" type="date" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Waktu Mulai</label>
                <input v-model="formData.startTime" type="time" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Waktu Selesai</label>
                <input v-model="formData.endTime" type="time" class="form-input" />
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                Buat Event
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Event Detail Modal -->
      <div v-if="showDetailModal && selectedEvent" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-content card modal-large">
          <div class="modal-header">
            <h2>{{ selectedEvent.title }}</h2>
          </div>
          <div class="modal-body">
            <div class="event-detail-info mb-6">
              <p v-if="selectedEvent.description" class="text-secondary mb-4">{{ selectedEvent.description }}</p>
              <div class="event-meta">
                <span>📅 {{ formatDate(selectedEvent.date) }}</span>
                <span v-if="selectedEvent.startTime">🕐 {{ formatTime(selectedEvent.startTime) }} - {{ formatTime(selectedEvent.endTime) }}</span>
              </div>
            </div>

            <div class="filters mb-4">
              <input
                v-model="searchQuery"
                type="text"
                class="form-input"
                placeholder="Cari nama anggota..."
                style="max-width: 300px;"
              />
              <select v-model="filterRT" class="form-select" style="max-width: 150px;">
                <option value="all">Semua RT</option>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
                <option value="04">RT 04</option>
              </select>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>RT</th>
                    <th>Waktu Check-in</th>
                    <th>Token</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedEventCheckins.length === 0">
                    <td colspan="4" class="text-center text-secondary">Belum ada check-in</td>
                  </tr>
                  <tr v-for="checkin in selectedEventCheckins" :key="checkin.id">
                    <td class="font-medium">{{ checkin.memberName }}</td>
                    <td><span class="badge badge-secondary">RT {{ checkin.rt }}</span></td>
                    <td class="text-sm">{{ formatDateTime(checkin.checkedInAt) }}</td>
                    <td class="text-sm font-mono">{{ checkin.tokenUsed }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showDetailModal = false" class="btn btn-secondary">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.attendance-events-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.active-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.active-event-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-8);
  align-items: start;
}

.event-info h2 {
  margin-bottom: var(--space-2);
}

.event-meta {
  display: flex;
  gap: var(--space-6);
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.token-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 300px;
}

.token-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background-color: var(--color-bg);
  border-radius: var(--radius-lg);
}

.token-display label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.token-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.3em;
  color: var(--color-primary);
  text-align: center;
  padding: var(--space-4);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
}

.token-empty {
  padding: var(--space-6);
  background-color: var(--color-bg);
  border-radius: var(--radius-lg);
  text-align: center;
}

.token-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}

.filters {
  display: flex;
  gap: var(--space-4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: flex-end;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.font-mono {
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .active-event-content {
    grid-template-columns: 1fr;
  }

  .token-section {
    min-width: auto;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .filters .form-input,
  .filters .form-select {
    max-width: 100% !important;
  }
}
</style>
