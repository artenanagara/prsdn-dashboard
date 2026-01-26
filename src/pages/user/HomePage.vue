<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import BaseCard from '../../components/BaseCard.vue';
import CountdownTimer from '../../components/CountdownTimer.vue';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
import { useKasStore } from '../../stores/kas';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();
const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();

const tokenInput = ref('');
const isSubmitting = ref(false);
const checkinError = ref('');
const checkinSuccess = ref('');
const holidays = ref<Array<{ tanggal: string; keterangan: string; is_cuti: boolean }>>([]);

const FALLBACK_HOLIDAYS = [
  // Libur Nasional 2026
  { tanggal: '2026-01-01', keterangan: 'Tahun Baru 2026 Masehi', is_cuti: false },
  { tanggal: '2026-01-16', keterangan: 'Isra Mikraj Nabi Muhammad SAW', is_cuti: false },
  { tanggal: '2026-02-17', keterangan: 'Tahun Baru Imlek 2577 Kongzili', is_cuti: false },
  { tanggal: '2026-03-19', keterangan: 'Hari Suci Nyepi', is_cuti: false },
  { tanggal: '2026-03-21', keterangan: 'Hari Raya Idul Fitri 1447 H', is_cuti: false },
  { tanggal: '2026-03-22', keterangan: 'Hari Raya Idul Fitri 1447 H', is_cuti: false },
  { tanggal: '2026-04-03', keterangan: 'Wafat Yesus Kristus', is_cuti: false },
  { tanggal: '2026-04-05', keterangan: 'Kebangkitan Yesus Kristus (Paskah)', is_cuti: false },
  { tanggal: '2026-05-01', keterangan: 'Hari Buruh Internasional', is_cuti: false },
  { tanggal: '2026-05-14', keterangan: 'Kenaikan Yesus Kristus', is_cuti: false },
  { tanggal: '2026-05-27', keterangan: 'Hari Raya Idul Adha 1447 H', is_cuti: false },
  { tanggal: '2026-05-31', keterangan: 'Hari Raya Waisak 2570 BE', is_cuti: false },
  { tanggal: '2026-06-01', keterangan: 'Hari Lahir Pancasila', is_cuti: false },
  { tanggal: '2026-06-16', keterangan: 'Tahun Baru Islam 1448 H', is_cuti: false },
  { tanggal: '2026-08-17', keterangan: 'Hari Kemerdekaan RI', is_cuti: false },
  { tanggal: '2026-08-25', keterangan: 'Maulid Nabi Muhammad SAW', is_cuti: false },
  { tanggal: '2026-12-25', keterangan: 'Hari Raya Natal', is_cuti: false },

  // Cuti Bersama 2026
  { tanggal: '2026-02-16', keterangan: 'Cuti Bersama Tahun Baru Imlek', is_cuti: true },
  { tanggal: '2026-03-18', keterangan: 'Cuti Bersama Hari Suci Nyepi', is_cuti: true },
  { tanggal: '2026-03-20', keterangan: 'Cuti Bersama Idul Fitri 1447 H', is_cuti: true },
  { tanggal: '2026-03-23', keterangan: 'Cuti Bersama Idul Fitri 1447 H', is_cuti: true },
  { tanggal: '2026-03-24', keterangan: 'Cuti Bersama Idul Fitri 1447 H', is_cuti: true },
  { tanggal: '2026-05-15', keterangan: 'Cuti Bersama Kenaikan Yesus Kristus', is_cuti: true },
  { tanggal: '2026-05-28', keterangan: 'Cuti Bersama Idul Adha 1447 H', is_cuti: true },
  { tanggal: '2026-12-24', keterangan: 'Cuti Bersama Hari Raya Natal', is_cuti: true }
];

onMounted(async () => {
  document.title = 'Beranda - PRSDN Dashboard';
  
  await Promise.all([
    checkinStore.loadCheckins(),
    eventStore.loadEvents(),
    membersStore.loadMembers(false), // false = exclude admins for user view
    fetchHolidays()
  ]);
});

const fetchHolidays = async () => {
    try {
        // Try to fetch current year, but if it fails or returns empty/invalid for 2026 due to API limitations, use fallback
        // We will default to FALLBACK_HOLIDAYS first as the API might be unreliable for the current year
        holidays.value = FALLBACK_HOLIDAYS;

        /* 
        // Optional: Attempt API fetch if needed in future
        const currentYear = new Date().getFullYear();
        const res = await fetch(`https://dayoffapi.vercel.app/api?year=${currentYear}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
           // holidays.value = data; // Note: API format must match our structure
        }
        */
    } catch (error) {
        console.warn('Using fallback holiday data');
        holidays.value = FALLBACK_HOLIDAYS;
    }
};

const member = computed(() => {
  if (!authStore.currentUser?.memberId) return null;
  return membersStore.getMemberById(authStore.currentUser.memberId);
});

// KPI 1: Total Kehadiran
const totalAttendance = computed(() => {
    if (!member.value) return 0;
    return checkinStore.getCheckinsByMember(member.value.id).length;
});

// KPI 2: Kas Bulan Ini
const currentMonthKey = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const currentMonthKas = computed(() => {
  if (!member.value) return null;
  const payments = kasStore.getPaymentsByMonth(currentMonthKey.value);
  return payments.find(p => p.memberId === member.value!.id);
});

// Merged Events (Official Events + Birthdays + Holidays)
const upcomingEventsList = computed(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // 1. Official Events
    const officialEvents = eventStore.upcomingEvents
        .filter(e => !e.isActive)
        .map(e => ({
            id: e.id,
            title: e.title,
            date: new Date(e.date).getTime(),
            type: 'event',
            originalDate: e.date,
            is_cuti: false
        }));

    // 2. Birthdays
    const birthdays = membersStore.members
        .filter(m => m.birthDate)
        .map(m => {
            const birthDate = new Date(m.birthDate);
            const currentYear = now.getFullYear();
            
            let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
            if (nextBday.getTime() < todayStart) {
                nextBday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
            }

            return {
                id: `bday-${m.id}`,
                title: `Ulang Tahun ${m.fullName}`,
                date: nextBday.getTime(),
                type: 'birthday',
                originalDate: nextBday.toISOString(),
                is_cuti: false
            };
        });

    // 3. Holidays
    const publicHolidays = holidays.value
        .map((h, index) => ({
            id: `holiday-${index}`,
            title: h.keterangan,
            date: new Date(h.tanggal).getTime(),
            type: 'holiday',
            originalDate: h.tanggal,
            is_cuti: h.is_cuti
        }))
        .filter(h => h.date >= todayStart); // Only future or today

    // 4. Merge and Sort
    const combined = [...officialEvents, ...birthdays, ...publicHolidays];
    combined.sort((a, b) => a.date - b.date);

    // Return more events for scrolling
    return combined.slice(0, 50);
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

const formatDate = (dateString: string | number) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const handleCheckin = async () => {
    if (!activeEvent.value || !member.value) return;
    
    isSubmitting.value = true;
    checkinError.value = '';
    checkinSuccess.value = '';

    const result = await checkinStore.checkin(activeEvent.value.id, member.value.id, tokenInput.value);

    if (result.success) {
        checkinSuccess.value = 'Berhasil melakukan check-in!';
        tokenInput.value = '';
        // Reload checkins to update UI
        await checkinStore.loadCheckins();
    } else {
        checkinError.value = result.error || 'Gagal check-in';
    }
    isSubmitting.value = false;
};
</script>

<template>
  <AppShell>
    <div class="user-home-page">
      <div class="page-header mb-6">
        <h1>Dashboard</h1>
        <p class="text-secondary">Selamat datang kembali, {{ member?.fullName }}</p>
      </div>

      <div class="dashboard-grid">
        <!-- LEFT COLUMN: Stats & Active Event -->
        <div class="main-content">
          <!-- Section 1: Stats -->
          <div class="stats-grid mb-6">
            <!-- Card 1: Total Attendance -->
            <CardStat
              title="Total Kehadiran"
              :value="`${totalAttendance} Event`"
              variant="info"
              icon="📅"
            />

            <!-- Card 2: Kas Status -->
            <CardStat
              title="Kas Bulan Ini"
              :value="currentMonthKas?.status === 'paid' ? 'Lunas' : 'Belum Bayar'"
              :variant="currentMonthKas?.status === 'paid' ? 'success' : 'warning'"
              icon="💰"
            />
          </div>

          <!-- Section 2: Active Event -->
          <BaseCard v-if="activeEvent" class="mb-6 active-event-card-wrapper" variant="success" title="Event Aktif">
            <div class="card-body">
              <div class="event-header">
                <h2 class="event-title">{{ activeEvent.title }}</h2>
                <p class="event-time">
                  {{ formatDate(activeEvent.date) }} • 
                  {{ activeEvent.startTime ? activeEvent.startTime.substring(0, 5) : '' }} - 
                  {{ activeEvent.endTime ? activeEvent.endTime.substring(0, 5) : 'Selesai' }} WIB
                </p>
                <p v-if="activeEvent.description" class="event-desc">{{ activeEvent.description }}</p>
              </div>

              <div class="checkin-area">
                <div v-if="alreadyCheckedIn" class="checkin-success-state">
                  <div class="success-icon">✓</div>
                  <h3>Kamu sudah absen!</h3>
                  <p class="text-secondary">Terima kasih sudah hadir.</p>
                </div>

                <div v-else-if="activeEvent.token && !isTokenExpired" class="checkin-form">
                  <div class="token-info mb-4">
                    <p class="text-secondary text-sm mb-1">Token Absen Berlaku:</p>
                    <CountdownTimer :expiresAt="activeEvent.tokenExpiresAt" />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Masukkan Token Absen</label>
                    <div class="input-group">
                      <input 
                        v-model="tokenInput"
                        type="text" 
                        class="form-input text-uppercase tracking-wider font-bold text-center"
                        placeholder="XXXXXX"
                        maxlength="6"
                        :disabled="isSubmitting"
                      >
                      <button 
                        @click="handleCheckin" 
                        class="btn btn-primary w-full mt-2"
                        :disabled="!tokenInput || isSubmitting"
                      >
                        {{ isSubmitting ? 'Memproses...' : 'Submit Absen' }}
                      </button>
                    </div>
                    <p v-if="checkinError" class="text-error mt-2 text-sm">{{ checkinError }}</p>
                    <p v-if="checkinSuccess" class="text-success mt-2 text-sm">{{ checkinSuccess }}</p>
                  </div>
                </div>

                <div v-else class="waiting-state text-center py-6">
                  <p class="text-secondary">Menunggu token dari admin/petugas...</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard v-else class="mb-6" title="Event Aktif">
            <div class="card-body text-center py-12">
              <span class="text-4xl mb-4 block">😴</span>
              <h3 class="text-lg font-medium text-primary">Tidak Ada Event Aktif</h3>
              <p class="text-secondary mt-2">Belum ada kegiatan yang sedang berlangsung saat ini.</p>
            </div>
          </BaseCard>
        </div>

        <!-- RIGHT COLUMN: Upcoming Events -->
        <div class="sidebar-content">
          <BaseCard title="Event Akan Datang" class="h-full">
            <div class="upcoming-scroll-area">
              <div v-if="upcomingEventsList.length === 0" class="text-secondary text-sm text-center py-4">
                Tidak ada event mendatang.
              </div>
              <div v-else class="upcoming-list">
                <div v-for="event in upcomingEventsList" :key="event.id" class="upcoming-item">
                  <div class="upcoming-icon">
                    <span v-if="event.type === 'birthday'">🎂</span>
                    <span v-else-if="event.type === 'holiday' && event.is_cuti">🏖️</span>
                    <span v-else-if="event.type === 'holiday'">🇮🇩</span>
                    <span v-else>📅</span>
                  </div>
                  <div class="upcoming-details">
                    <h4 class="upcoming-title">{{ event.title }}</h4>
                    <span class="upcoming-date">{{ formatDate(event.date) }}</span>
                  </div>
                  <span :class="['badge', 
                    event.type === 'birthday' ? 'badge-warning' : 
                    event.type === 'holiday' ? (event.is_cuti ? 'badge-info' : 'badge-danger') : 'badge-outline']">
                    {{ event.type === 'birthday' ? 'Ultah' : event.type === 'holiday' ? (event.is_cuti ? 'Cuti' : 'Libur') : 'Info' }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

    </div>
  </AppShell>
</template>

<style scoped>

.kpi-grid,
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
}

@media (min-width: 900px) {
  .user-home-page {
    /* Desktop: Full height, internal scrolling */
    /* Subtract topbar, padding, and a small buffer for borders to prevent body scroll */
    height: calc(100vh - var(--topbar-height, 65px) - var(--space-8, 32px) * 2 - 2px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
    flex: 1;
    min-height: 0;
    overflow: hidden; 
  }
  
  .main-content {
    /* Disable scrolling on the container itself */
    overflow-y: hidden; 
    padding-right: var(--space-2);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Make the active event card fill the remaining space */
  :deep(.active-event-card-wrapper) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden; 
    margin-bottom: 0 !important; 
  }

  /* Ensure card body inside active event expands and handles overflow */
  :deep(.active-event-card-wrapper .card-body) {
    flex: 1;
    display: flex;
    flex-direction: row; /* Side-by-side on desktop */
    align-items: start;
    justify-content: space-between;
    gap: var(--space-6);
    overflow: hidden; /* No scroll needed usually */
  }

  /* Split width equally */
  :deep(.event-header),
  :deep(.checkin-area) {
    flex: 1;
    width: 50%;
  }

  .sidebar-content {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .upcoming-scroll-area {
    overflow-y: auto;
    height: 100%;
    padding: var(--space-6);
  }

  :deep(.sidebar-content .card-body) {
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

@media (max-width: 899px) {
  .user-home-page {
    height: auto;
    overflow-y: auto; 
    display: block;
  }

  .dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .stats-grid {
    grid-template-columns: 1fr; /* 1 card per row */
  }

  /* Show 5 items only on mobile */
  .upcoming-item:nth-child(n+6) {
    display: none;
  }

  .upcoming-scroll-area {
    padding: var(--space-6);
    height: auto;
  }
  
  :deep(.active-event-card-wrapper) {
    height: auto;
  }

  :deep(.checkin-area) {
    margin-top: var(--space-6);
  }

  :deep(.sidebar-content .card-body) {
    display: block;
    height: auto;
    overflow: visible;
  }
}



/* Active Event Styles */
.active-event-card {
    border-left: 4px solid var(--color-success);
}

.event-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-2);
}

.event-time {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    margin-bottom: var(--space-4);
}

.checkin-area {
    background-color: var(--color-bg-subtle);
    padding: var(--space-4);
    border-radius: var(--radius-md);
}

.checkin-success-state {
    text-align: center;
    color: var(--color-success);
}

.success-icon {
    font-size: 3rem;
    margin-bottom: var(--space-2);
}

.form-input.text-center {
    text-align: center;
}

.text-uppercase {
    text-transform: uppercase;
}

.tracking-wider {
    letter-spacing: 0.25em;
}

/* Upcoming Events Styles */
.upcoming-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.upcoming-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-light);
}

.upcoming-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
}

.upcoming-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-subtle);
    border-radius: var(--radius-md);
}

.upcoming-details {
    flex: 1;
}

.upcoming-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    margin-bottom: 2px;
}

.upcoming-date {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
}
</style>
