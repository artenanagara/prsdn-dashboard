<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CountdownTimer from '../../components/CountdownTimer.vue';
import BaseCard from '../../components/BaseCard.vue';
import BaseDatePicker from '../../components/BaseDatePicker.vue';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';
import { useMembersStore } from '../../stores/members';
import { useAuthStore } from '../../stores/auth';
import { useUIStore } from '../../stores/ui';
import { Plus, Play, Square, RefreshCw, Trash2, Users, CalendarDays, Clock3, ShieldCheck, ListChecks } from 'lucide-vue-next';
import TimePicker from '../../components/TimePicker.vue';
import BaseSelect from '../../components/BaseSelect.vue';

const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const membersStore = useMembersStore();
const authStore = useAuthStore();
const uiStore = useUIStore();

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

const rtOptions = [
  { label: 'Semua RT', value: 'all' },
  { label: 'RT 01', value: '01' },
  { label: 'RT 02', value: '02' },
  { label: 'RT 03', value: '03' },
  { label: 'RT 04', value: '04' }
];

onMounted(async () => {
  document.title = 'Absensi - PRSDN Admin';
  await eventStore.loadEvents();
  eventStore.subscribeToChanges();
  await checkinStore.loadCheckins();
  checkinStore.subscribeToChanges();
  membersStore.loadMembers(false);
});

const activeEvent = computed(() => eventStore.activeEvent);

const activeCheckinCount = computed(() => {
  if (!activeEvent.value) return 0;
  return checkinStore.getCheckinsByEvent(activeEvent.value.id).length;
});

const activeEventCheckins = computed(() => {
  if (!activeEvent.value) return [];
  return checkinStore.getCheckinsByEvent(activeEvent.value.id)
    .map(c => {
      const member = membersStore.getMemberById(c.memberId);
      return {
        ...c,
        memberName: member?.fullName || 'Anggota tidak ditemukan',
        rt: member?.rt || '-'
      };
    })
    .sort((a, b) => Number(b.checkedInAt) - Number(a.checkedInAt));
});

const attendanceOverview = computed(() => {
  const total = membersStore.totalMembers;
  const attended = activeCheckinCount.value;
  const absent = Math.max(total - attended, 0);
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

  return { total, attended, absent, percentage };
});

const recentActiveCheckins = computed(() => activeEventCheckins.value.slice(0, 5));

const rtAttendanceSummary = computed(() => {
  const attendedMemberIds = new Set(activeEventCheckins.value.map(c => c.memberId));
  return ['01', '02', '03', '04'].map(rt => {
    const members = membersStore.members.filter(member => member.rt === rt);
    const attended = members.filter(member => attendedMemberIds.has(member.id)).length;
    const total = members.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { rt, attended, total, percentage };
  });
});

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
    uiStore.showToast('Judul event harus diisi!', 'warning');
    return;
  }
  
  if (!formData.value.date) {
    uiStore.showToast('Tanggal event harus diisi!', 'warning');
    return;
  }
  
  if (!authStore.currentUser) {
    uiStore.showToast('Error: User tidak terautentikasi', 'error');
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
      uiStore.showToast(`Event "${newEvent.title}" berhasil dibuat!`, 'success');
    } else {
      uiStore.showToast('Gagal membuat event.', 'error');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    uiStore.showToast('Gagal membuat event.', 'error');
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
    uiStore.showToast(`Token baru berhasil dibuat: ${result.token}`, 'success');
  } else {
    uiStore.showToast('Token hanya bisa dibuat ulang untuk event aktif.', 'warning');
  }
};

const getEventCheckinCount = (eventId: string) => {
  return checkinStore.getCheckinsByEvent(eventId).length;
};

const handleDelete = async (eventId: string, title: string) => {
  const confirmed = await uiStore.confirm({
    message: `Hapus event "${title}"?`,
    title: 'Hapus Event',
    confirmText: 'Hapus',
    variant: 'danger'
  });
  
  if (confirmed) {
    eventStore.deleteEvent(eventId);
    uiStore.showToast(`Event "${title}" berhasil dihapus`, 'success');
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

const formatShortTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <AppShell pageTitle="Kelola Absensi" pageSubtitle="Buat dan kelola event absensi">
    <div class="attendance-events-page">
      <div class="attendance-toolbar">
        <div>
          <p class="section-kicker">Absensi berbasis token</p>
          <h3>Kelola sesi kehadiran</h3>
          <p>Aktifkan satu event, bagikan token, lalu generate ulang jika waktu token habis.</p>
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <Plus :size="18" />
          <span>Buat Event</span>
        </button>
      </div>

      <div class="flow-grid">
        <div class="flow-step is-active">
          <span class="step-number">1</span>
          <div>
            <strong>Pilih event</strong>
            <p>Aktifkan event yang sedang berlangsung.</p>
          </div>
        </div>
        <div class="flow-step">
          <span class="step-number">2</span>
          <div>
            <strong>Bagikan token</strong>
            <p>Token berlaku singkat dan bisa dibuat ulang.</p>
          </div>
        </div>
        <div class="flow-step">
          <span class="step-number">3</span>
          <div>
            <strong>Pantau peserta</strong>
            <p>Lihat siapa saja yang sudah hadir.</p>
          </div>
        </div>
      </div>

      <!-- Active Event Section -->
      <div v-if="activeEvent" class="card mb-6 active-event-card">
        <div class="card-body">
          <div class="active-event-header">
            <div>
              <p class="section-kicker">Event aktif</p>
              <h3>{{ activeEvent.title }}</h3>
            </div>
            <span class="badge badge-success">Sedang Berjalan</span>
          </div>
          <div class="active-event-content">
            <div class="event-info">
              <p v-if="activeEvent.description" class="text-secondary">{{ activeEvent.description }}</p>
              <div class="event-meta-grid">
                <div class="meta-item">
                  <CalendarDays :size="18" />
                  <span>{{ formatDate(activeEvent.date) }}</span>
                </div>
                <div class="meta-item">
                  <Clock3 :size="18" />
                  <span>{{ activeEvent.startTime ? `${formatTime(activeEvent.startTime)} - ${formatTime(activeEvent.endTime)}` : 'Waktu fleksibel' }}</span>
                </div>
                <div class="meta-item">
                  <ListChecks :size="18" />
                  <span>{{ activeCheckinCount }} peserta hadir</span>
                </div>
              </div>

              <div class="attendance-overview-grid">
                <div class="overview-card primary">
                  <span>Hadir</span>
                  <strong>{{ attendanceOverview.attended }}</strong>
                </div>
                <div class="overview-card">
                  <span>Belum Hadir</span>
                  <strong>{{ attendanceOverview.absent }}</strong>
                </div>
                <div class="overview-card">
                  <span>Kehadiran</span>
                  <strong>{{ attendanceOverview.percentage }}%</strong>
                </div>
                <div class="overview-card">
                  <span>Total Anggota</span>
                  <strong>{{ attendanceOverview.total }}</strong>
                </div>
              </div>

              <div class="attendance-monitor-grid">
                <div class="monitor-panel">
                  <div class="panel-heading">
                    <h4>Peserta Terbaru</h4>
                    <span>{{ recentActiveCheckins.length }} terakhir</span>
                  </div>
                  <div v-if="recentActiveCheckins.length > 0" class="recent-list">
                    <div v-for="checkin in recentActiveCheckins" :key="checkin.id" class="recent-item">
                      <div class="recent-avatar">{{ checkin.memberName.charAt(0).toUpperCase() }}</div>
                      <div class="recent-info">
                        <strong>{{ checkin.memberName }}</strong>
                        <span>RT {{ checkin.rt }} · {{ formatShortTime(checkin.checkedInAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="compact-empty">
                    Belum ada peserta yang absen.
                  </div>
                </div>

                <div class="monitor-panel">
                  <div class="panel-heading">
                    <h4>Rekap per RT</h4>
                    <span>{{ attendanceOverview.attended }}/{{ attendanceOverview.total }}</span>
                  </div>
                  <div class="rt-list">
                    <div v-for="item in rtAttendanceSummary" :key="item.rt" class="rt-item">
                      <div class="rt-row">
                        <strong>RT {{ item.rt }}</strong>
                        <span>{{ item.attended }}/{{ item.total }}</span>
                      </div>
                      <div class="rt-progress">
                        <span :style="{ width: `${item.percentage}%` }"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="token-section">
              <div v-if="activeEvent.token" class="token-display">
                <div class="token-label-row">
                  <span>Token absensi</span>
                  <span class="token-timer">
                    <CountdownTimer :expiresAt="activeEvent.tokenExpiresAt" />
                  </span>
                </div>
                <div class="token-value" aria-label="Token absensi">{{ activeEvent.token }}</div>
                <p>Bagikan token ini ke peserta. Jika habis, klik generate ulang.</p>
              </div>
              <div v-else class="token-empty">
                <ShieldCheck :size="28" />
                <p class="text-secondary">Belum ada token aktif untuk event ini.</p>
              </div>
              <div class="token-actions">
                <button @click="handleGenerateToken(activeEvent.id)" class="btn btn-primary">
                  <RefreshCw :size="18" />
                  <span>{{ activeEvent.token ? 'Generate Ulang Token' : 'Generate Token' }}</span>
                </button>
                <button @click="handleDeactivate(activeEvent.id)" class="btn btn-secondary">
                  <Square :size="18" />
                  <span>Nonaktifkan</span>
                </button>
                <button @click="openDetail(activeEvent.id)" class="btn btn-secondary">
                  <Users :size="18" />
                  <span>Lihat Peserta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="card mb-6 inactive-event-card">
        <div class="card-body">
          <div class="inactive-icon">
            <ShieldCheck :size="28" />
          </div>
          <h3>Tidak ada event aktif</h3>
          <p class="text-secondary">Aktifkan salah satu event di daftar bawah agar peserta bisa absen menggunakan token.</p>
        </div>
      </div>

      <!-- Events List -->
      <BaseCard class="events-card" no-padding>
        <div class="table-container">
          <div class="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Hadir</th>
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
                      {{ event.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                  </td>
                  <td>
                    <button @click="openDetail(event.id)" class="btn btn-sm btn-secondary">
                      <Users :size="16" />
                      <span>{{ getEventCheckinCount(event.id) }}</span>
                    </button>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        v-if="!event.isActive"
                        @click="handleActivate(event.id)"
                        class="btn btn-sm btn-success"
                        title="Aktifkan event"
                      >
                        <Play :size="16" />
                        <span>Aktifkan</span>
                      </button>
                      <button
                        v-if="event.isActive"
                        @click="handleGenerateToken(event.id)"
                        class="btn btn-primary btn-sm"
                        title="Generate ulang token"
                      >
                        <RefreshCw :size="16" />
                        <span>Token</span>
                      </button>
                      <button @click="handleDelete(event.id, event.title)" class="btn btn-danger btn-sm" title="Hapus event">
                        <Trash2 :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </BaseCard>

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
                <BaseDatePicker v-model="formData.date" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Waktu Mulai</label>
                <TimePicker v-model="formData.startTime" placeholder="Mulai" />
              </div>
              <div class="form-group">
                <label class="form-label">Waktu Selesai</label>
                <TimePicker v-model="formData.endTime" placeholder="Selesai" />
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
              <div class="event-detail-meta">
                <div class="meta-item">
                  <CalendarDays :size="18" />
                  <span>{{ formatDate(selectedEvent.date) }}</span>
                </div>
                <div class="meta-item">
                  <Clock3 :size="18" />
                  <span>{{ selectedEvent.startTime ? `${formatTime(selectedEvent.startTime)} - ${formatTime(selectedEvent.endTime)}` : 'Waktu fleksibel' }}</span>
                </div>
              </div>
            </div>

            <div class="controls-bar mb-4">
              <div class="controls-wrapper">
                <div class="filters-group">
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-input"
                    placeholder="Cari nama anggota..."
                  />
                  <BaseSelect 
                    v-model="filterRT" 
                    :options="rtOptions"
                    placeholder="Filter RT"
                    class="filter-select-sm"
                  />
                </div>
              </div>
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
                    <td class="text-sm token-used">{{ checkin.tokenUsed }}</td>
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
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.attendance-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.attendance-toolbar h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-ink);
}

.attendance-toolbar p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.section-kicker {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xs);
}

.flow-step.is-active {
  border-color: rgba(15, 111, 143, 0.22);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.08), #ffffff);
}

.step-number {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-md);
  color: #ffffff;
  background: var(--gradient-primary);
  font-weight: 800;
  font-size: var(--text-xs);
}

.flow-step strong {
  display: block;
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.flow-step p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.active-event-card {
  margin-bottom: 0;
  border-color: rgba(15, 111, 143, 0.22);
}

.events-list-card {
  margin-bottom: var(--space-6);
}

.events-list-card .table-container {
  overflow-x: auto;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}

.active-event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.active-event-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-ink);
}

.active-event-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--space-6);
  align-items: stretch;
}

.event-info {
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: #f8fbfc;
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.event-info > p {
  margin: 0;
}

.event-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: #ffffff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.attendance-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.overview-card {
  min-height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: #ffffff;
  box-shadow: var(--shadow-xs);
}

.overview-card.primary {
  color: #ffffff;
  background: var(--gradient-primary);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 14px 30px rgba(15, 111, 143, 0.16);
}

.overview-card span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.overview-card.primary span {
  color: rgba(255, 255, 255, 0.78);
}

.overview-card strong {
  color: var(--color-ink);
  font-size: 1.75rem;
  line-height: 1;
}

.overview-card.primary strong {
  color: #ffffff;
}

.attendance-monitor-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: var(--space-4);
}

.monitor-panel {
  min-height: 240px;
  padding: var(--space-4);
  background: #ffffff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xs);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.panel-heading h4 {
  margin: 0;
  color: var(--color-ink);
  font-size: 0.98rem;
}

.panel-heading span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.recent-list,
.rt-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.recent-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: #f8fbfc;
  border: 1px solid var(--color-border-light);
}

.recent-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-md);
  color: #ffffff;
  background: var(--gradient-primary);
  font-weight: 800;
}

.recent-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.recent-info strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-info span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.compact-empty {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px dashed #cad7e2;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: var(--text-sm);
}

.rt-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rt-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.rt-row strong {
  color: var(--color-ink);
}

.rt-progress {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e7eef3;
}

.rt-progress span {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: var(--gradient-primary);
  transition: width var(--transition-base);
}

.event-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.token-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.token-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: linear-gradient(135deg, #0a4f6d 0%, #0f6f8f 55%, #16a6d1 100%);
  border-radius: var(--radius-xl);
  color: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 111, 143, 0.22);
}

.token-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: rgba(255, 255, 255, 0.86);
}

.token-timer {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.token-value {
  font-size: 2.3rem;
  font-weight: 800;
  font-family: inherit;
  letter-spacing: 0.18em;
  color: #ffffff;
  text-align: center;
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: var(--radius-lg);
  font-variant-numeric: tabular-nums;
}

.token-display p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--text-xs);
  text-align: center;
}

.token-empty {
  padding: var(--space-6);
  background-color: #f8fbfc;
  border: 1px dashed #cad7e2;
  border-radius: var(--radius-xl);
  text-align: center;
  display: grid;
  place-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
}

.token-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.inactive-event-card .card-body {
  min-height: 190px;
  display: grid;
  place-items: center;
  text-align: center;
  gap: var(--space-3);
}

.inactive-event-card h3,
.inactive-event-card p {
  margin: 0;
}

.inactive-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-xl);
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.16));
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.btn-success {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.18);
}

.filters {
  display: flex;
  gap: var(--space-4);
}



.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(8, 17, 31, 0.52);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center; /* Center vertically */
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: visible; 
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.modal-body {
  padding: var(--space-6);
  overflow-y: visible;
  flex: 1;
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
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

.token-used {
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .attendance-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }

  .flow-grid {
    grid-template-columns: 1fr;
  }

  .active-event-content {
    grid-template-columns: 1fr;
  }

  .attendance-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-monitor-grid {
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

@media (max-width: 520px) {
  .attendance-overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
