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
import { useUIStore } from '../../stores/ui';
import { useFinanceStore } from '../../stores/finance';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();
const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const uiStore = useUIStore();
const financeStore = useFinanceStore();

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
  
  // Subscribe to realtime changes
  checkinStore.subscribeToChanges();
  eventStore.subscribeToChanges();
  
  // Load finance data
  await financeStore.loadTransactions();
  financeStore.subscribeToChanges();
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
        uiStore.showToast('Berhasil melakukan check-in!', 'success');
        tokenInput.value = '';
        await checkinStore.loadCheckins();
    } else {
        uiStore.showToast(result.error || 'Gagal check-in', 'error');
    }
    isSubmitting.value = false;
};

// Finance Chart Data - All Transactions
const financeChartData = computed(() => {
  const months = [];
  const today = new Date();
  
  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    
    // Get start and end of month
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Filter transactions for this month
    const monthTransactions = financeStore.transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= monthStart && transDate <= monthEnd;
    });
    
    // Calculate income and expense for the month
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    months.push({
      month: monthKey,
      monthLabel,
      income,
      expense,
      balance: income - expense
    });
  }
  
  return months;
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Dual-Line Chart SVG Logic
const financeChartPoints = computed(() => {
  if (financeChartData.value.length === 0) return { income: [], expense: [] };
  
  const width = 600;
  const height = 160;
  const padding = 30;
  
  // Find max value for scaling
  const maxValue = Math.max(
    ...financeChartData.value.map(d => Math.max(d.income, d.expense)),
    1 // Prevent division by zero
  );
  
  const incomePoints = financeChartData.value.map((d, i) => {
    const x = (i / (financeChartData.value.length - 1)) * width;
    const y = height - padding - ((d.income / maxValue) * (height - padding * 2));
    return { x, y, value: d.income };
  });
  
  const expensePoints = financeChartData.value.map((d, i) => {
    const x = (i / (financeChartData.value.length - 1)) * width;
    const y = height - padding - ((d.expense / maxValue) * (height - padding * 2));
    return { x, y, value: d.expense };
  });
  
  return { income: incomePoints, expense: expensePoints };
});

// Bezier curve helper for smooth rounded lines
const createSmoothPath = (points: Array<{x: number, y: number}>) => {
  if (points.length < 2) return '';
  
  const firstPoint = points[0];
  if (!firstPoint) return '';
  
  if (points.length === 2) {
    const secondPoint = points[1];
    if (!secondPoint) return '';
    return `M ${firstPoint.x} ${firstPoint.y} L ${secondPoint.x} ${secondPoint.y}`;
  }
  
  let path = `M ${firstPoint.x} ${firstPoint.y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    if (!current || !next) continue;
    
    const controlPointX = (current.x + next.x) / 2;
    
    path += ` Q ${controlPointX} ${current.y}, ${controlPointX} ${(current.y + next.y) / 2}`;
    path += ` Q ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
  }
  
  return path;
};

const incomePathLine = computed(() => {
  const points = financeChartPoints.value.income;
  if (points.length === 0) return '';
  return createSmoothPath(points);
});

const expensePathLine = computed(() => {
  const points = financeChartPoints.value.expense;
  if (points.length === 0) return '';
  return createSmoothPath(points);
});

const incomePathArea = computed(() => {
  const points = financeChartPoints.value.income;
  if (points.length < 2) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const line = incomePathLine.value;
  return `${line} L ${last.x} 160 L ${first.x} 160 Z`;
});

const expensePathArea = computed(() => {
  const points = financeChartPoints.value.expense;
  if (points.length < 2) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const line = expensePathLine.value;
  return `${line} L ${last.x} 160 L ${first.x} 160 Z`;
});
</script>

<template>
  <AppShell pageTitle="Beranda" pageSubtitle="Selamat datang di PRSDN Dashboard">
    <div class="user-home-page">

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
          <div class="card mb-6 active-event-card">
            <div class="card-body">
              <div class="active-event-header">
                <h3>Event Aktif</h3>
              </div>
              
              <!-- No Active Event State -->
              <div v-if="!activeEvent" class="empty-event-state">
                <span class="empty-icon">📅</span>
                <h3>Tidak Ada Event Aktif</h3>
                <p class="text-secondary">Belum ada kegiatan yang sedang berlangsung saat ini.</p>
              </div>
              
              <!-- Event Card Content -->
              <div v-else class="event-card-layout">
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
                  <div v-else-if="activeEvent.token" class="input-button-stack">
                    <input 
                      v-model="tokenInput"
                      type="text" 
                      class="form-input token-input-field"
                      placeholder="Masukkan kode token"
                      maxlength="6"
                      :disabled="isSubmitting || isTokenExpired"
                    >
                    <button 
                      @click="handleCheckin" 
                      class="btn btn-primary btn-countdown"
                      :disabled="isSubmitting || isTokenExpired"
                    >
                      <span v-if="isTokenExpired">Waktu Habis</span>
                      <span v-else-if="isSubmitting">Memproses...</span>
                      <span v-else-if="tokenInput">Submit Absen</span>
                      <CountdownTimer v-else :expiresAt="activeEvent.tokenExpiresAt" :compact="true" />
                    </button>
                  </div>
                  <div v-else class="waiting-state-text">
                    <p class="text-secondary">Menunggu token dari admin/petugas...</p>
                  </div>
                  <p v-if="checkinError" class="text-error mt-2 text-sm">{{ checkinError }}</p>
                  <p v-if="checkinSuccess" class="text-success mt-2 text-sm">{{ checkinSuccess }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Finance Chart Section (Moved here) -->
          <BaseCard title="Grafik Keuangan" class="mb-6 h-fit">
          <div class="finance-chart-container">
            <!-- Legend (Top Right) -->
            <div class="chart-legend-compact">
              <div class="legend-item-compact">
                <div class="legend-indicator-compact bg-success"></div>
                <span class="legend-text">Pemasukan</span>
              </div>
              <div class="legend-item-compact">
                <div class="legend-indicator-compact bg-danger"></div>
                <span class="legend-text">Pengeluaran</span>
              </div>
            </div>
            
            <div class="chart-content">
              <div v-if="financeChartData.length === 0" class="text-center text-secondary py-8">
                Belum ada data transaksi keuangan.
              </div>
              <div v-else class="line-chart-wrapper">
                <!-- SVG Dual-Line Chart -->
                <svg class="line-chart" viewBox="0 0 600 160" preserveAspectRatio="none">
                  <!-- Gradient Definitions -->
                  <defs>
                    <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="var(--color-success)" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="var(--color-success)" stop-opacity="0.05" />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="var(--color-danger)" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="var(--color-danger)" stop-opacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Grid Lines -->
                  <g class="grid-lines">
                    <line x1="0" y1="40" x2="600" y2="40" stroke="var(--color-border-light)" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" y1="80" x2="600" y2="80" stroke="var(--color-border-light)" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" y1="120" x2="600" y2="120" stroke="var(--color-border-light)" stroke-width="1" stroke-dasharray="4 4" />
                  </g>
                  
                  <!-- Expense Area (behind) -->
                  <path 
                    :d="expensePathArea" 
                    fill="url(#expenseGradient)"
                    class="chart-area"
                  />
                  
                  <!-- Income Area -->
                  <path 
                    :d="incomePathArea" 
                    fill="url(#incomeGradient)"
                    class="chart-area"
                  />
                  
                  <!-- Expense Line -->
                  <path 
                    :d="expensePathLine" 
                    fill="none" 
                    stroke="var(--color-danger)" 
                    stroke-width="3" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    class="chart-line"
                  />
                  
                  <!-- Income Line -->
                  <path 
                    :d="incomePathLine" 
                    fill="none" 
                    stroke="var(--color-success)" 
                    stroke-width="3" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    class="chart-line"
                  />
                  
                  <!-- Income Points -->
                  <g v-for="(point, index) in financeChartPoints.income" :key="'income-' + index">
                    <circle 
                      :cx="point.x" 
                      :cy="point.y" 
                      r="5" 
                      fill="var(--color-success)"
                      stroke="white"
                      stroke-width="2"
                      class="chart-point"
                    >
                      <title>Pemasukan: {{ formatCurrency(point.value) }}</title>
                    </circle>
                  </g>
                  
                  <!-- Expense Points -->
                  <g v-for="(point, index) in financeChartPoints.expense" :key="'expense-' + index">
                    <circle 
                      :cx="point.x" 
                      :cy="point.y" 
                      r="5" 
                      fill="var(--color-danger)"
                      stroke="white"
                      stroke-width="2"
                      class="chart-point"
                    >
                      <title>Pengeluaran: {{ formatCurrency(point.value) }}</title>
                    </circle>
                  </g>
                </svg>
                
                <!-- X Axis Labels -->
                <div class="chart-x-axis">
                  <div v-for="item in financeChartData" :key="item.month" class="axis-label">
                    <span class="month">{{ item.monthLabel }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

        <!-- RIGHT COLUMN: Upcoming Events -->
        <div class="sidebar-content">
          <BaseCard title="Event Akan Datang" class="h-full max-h-screen overflow-hidden">
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
    /* Allow natural scrolling */
    overflow-y: auto;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    align-self: start;
    max-height: calc(90vh - var(--topbar-height));
  }

  .upcoming-scroll-area {
    overflow-y: auto;
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



/* Active Event Card - Two Column Layout */

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

.token-expired-text {
  color: var(--color-text-secondary);
}

.token-expired-text p {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
}

.line-chart-wrapper {
  position: relative;
  padding-bottom: var(--space-4);
}

.line-chart {
  width: 100%;
  height: 180px;
  display: block;
  overflow: visible;
}

.chart-area {
  transition: all 0.3s ease;
}

.chart-line {
  transition: all 0.3s ease;
}

.chart-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-point:hover {
  r: 7;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.grid-lines {
  opacity: 0.5;
}

/* Chart Legend - Compact Top Right */
.chart-legend-compact {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.legend-item-compact {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.legend-indicator-compact {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-text {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.finance-chart-container {
  position: relative;
  padding: var(--space-3);
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-4);
  padding: 0 4px;
}

.axis-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.axis-label .month {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.bg-success { background-color: var(--color-success); }
.bg-danger { background-color: var(--color-danger); }
.bg-primary { background-color: var(--color-primary); }

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

.waiting-state {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

@media (max-width: 768px) {
  .event-top-section {
    flex-direction: column;
  }

  .countdown-right {
    align-items: flex-start;
    width: 100%;
  }

  .checkin-input-row {
    flex-direction: column;
  }

  .notes-section {
    flex: 1;
    width: 100%;
  }

  .input-button-group {
    flex-direction: column;
    width: 100%;
  }

  .input-button-group .btn {
    width: 100%;
  }
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

/* Finance Chart Styles */
.finance-chart-container {
  padding: var(--space-4);
}

.chart-content {
  width: 100%;
}

</style>
