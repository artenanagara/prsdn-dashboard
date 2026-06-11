<script setup lang="ts">
import { ref, computed } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import BaseCard from '../../components/BaseCard.vue';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart.vue';
import UsernameUpdateModal from '../../components/UsernameUpdateModal.vue';
import { useFinanceStore } from '../../stores/finance';
import { useMembersStore } from '../../stores/members';
import { useKasStore } from '../../stores/kas';
import { useCheckinStore } from '../../stores/checkin';
import { useEventsStore } from '../../stores/events';
import { useAuthStore } from '../../stores/auth';
import { isValidUsername } from '../../utils/validation';
import {
  Calendar,
  Gift,
  Briefcase,
  Flag,
  Wallet,
  Users,
  ClipboardCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock
} from 'lucide-vue-next';

const financeStore = useFinanceStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();
const checkinStore = useCheckinStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const searchQuery = ref('');

const balance = computed(() => financeStore.balance);
const totalMembers = computed(() => membersStore.totalMembers);
const unpaidKasCount = computed(() => kasStore.currentMonthUnpaid);

const currentMonthKey = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
});

const NATIONAL_HOLIDAYS_2026 = [
  { date: '2026-01-01', title: 'Tahun Baru 2026 Masehi' },
  { date: '2026-01-27', title: 'Isra Mikraj Nabi Muhammad SAW' },
  { date: '2026-02-12', title: 'Tahun Baru Imlek 2577 Kongzili' },
  { date: '2026-03-11', title: 'Hari Suci Nyepi Tahun Baru Saka 1948' },
  { date: '2026-03-20', title: 'Hari Raya Idul Fitri 1447 Hijriah' },
  { date: '2026-03-21', title: 'Hari Raya Idul Fitri 1447 Hijriah' },
  { date: '2026-04-03', title: 'Wafat Isa Al Masih' },
  { date: '2026-05-01', title: 'Hari Buruh Internasional' },
  { date: '2026-05-14', title: 'Kenaikan Isa Al Masih' },
  { date: '2026-05-27', title: 'Hari Raya Idul Adha 1447 Hijriah' },
  { date: '2026-06-01', title: 'Hari Lahir Pancasila' },
  { date: '2026-06-16', title: 'Tahun Baru Islam 1448 Hijriah' },
  { date: '2026-08-17', title: 'Hari Kemerdekaan Republik Indonesia' },
  { date: '2026-08-25', title: 'Maulid Nabi Muhammad SAW' },
  { date: '2026-12-25', title: 'Hari Raya Natal' },
];

const upcomingEvents = computed(() => {
  const days = 60;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  // 1. Store Events
  const storeEvents = eventsStore.events.filter(event => {
    const date = new Date(event.date);
    return date >= now && date <= futureDate;
  });

  // 2. Member Birthdays
  const birthdayEvents = membersStore.members.flatMap(member => {
    if (!member.birthDate) return [];
    
    const birthDate = new Date(member.birthDate);
    const currentYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    const nextYearBirthday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    
    const birthdays = [];
    
    // Check current year birthday
    if (currentYearBirthday >= now && currentYearBirthday <= futureDate) {
      birthdays.push({
        id: `dob-${member.id}-${now.getFullYear()}`,
        title: `Ulang Tahun ${member.fullName}`,
        date: currentYearBirthday.toISOString().split('T')[0],
        type: 'birthday' as const,
        description: `Ulang tahun ke-${now.getFullYear() - birthDate.getFullYear()}`
      });
    }
    
    // Check next year birthday (if spanning across year end)
    if (nextYearBirthday >= now && nextYearBirthday <= futureDate) {
      birthdays.push({
        id: `dob-${member.id}-${now.getFullYear() + 1}`,
        title: `Ulang Tahun ${member.fullName}`,
        date: nextYearBirthday.toISOString().split('T')[0],
        type: 'birthday' as const,
        description: `Ulang tahun ke-${(now.getFullYear() + 1) - birthDate.getFullYear()}`
      });
    }
    
    return birthdays;
  });

  // 3. National Holidays
  const holidayEvents = NATIONAL_HOLIDAYS_2026
    .filter(h => {
      const date = new Date(h.date);
      return date >= now && date <= futureDate;
    })
    .map((h, index) => ({
      id: `holiday-${h.date}-${index}`,
      title: h.title,
      date: h.date,
      type: 'holiday' as const
    }));

  // Merge and Sort
  return [...storeEvents, ...birthdayEvents, ...holidayEvents].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });
});

const attendanceStats = computed(() => {
  return checkinStore.getLast6MonthsStats();
});

const currentMonthKasSummary = computed(() => kasStore.getMonthSummary(currentMonthKey.value));

const kasCollectionRate = computed(() => {
  const summary = currentMonthKasSummary.value;
  return summary.total > 0 ? Math.round((summary.paidCount / summary.total) * 100) : 0;
});

const monthlyFinanceSummary = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthTransactions = financeStore.transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date >= monthStart && date <= monthEnd;
  });

  const income = monthTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expense = monthTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expense,
    net: income - expense,
    count: monthTransactions.length
  };
});

const memberRtSummary = computed(() => {
  return ['01', '02', '03', '04'].map(rt => {
    const total = membersStore.membersByRT[rt]?.length ?? 0;
    const percentage = totalMembers.value > 0 ? Math.round((total / totalMembers.value) * 100) : 0;

    return { rt, total, percentage };
  });
});

const latestCheckins = computed(() => {
  return checkinStore.checkins.slice(0, 5).map(checkin => {
    const member = membersStore.getMemberById(checkin.memberId);
    const event = eventsStore.events.find(item => item.id === checkin.eventId);

    return {
      id: checkin.id,
      memberName: member?.fullName || 'Anggota',
      rt: member?.rt || '-',
      eventTitle: event?.title || 'Event',
      checkedInAt: checkin.checkedInAt
    };
  });
});

const recentTransactions = computed(() => financeStore.transactions.slice(0, 4));

const filteredMembers = computed(() => {
  if (!searchQuery.value) {
    return membersStore.members.slice(0, 10);
  }
  return membersStore.searchMembers(searchQuery.value).slice(0, 10);
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'birthday':
      return Gift;
    case 'program':
      return Briefcase;
    case 'holiday':
      return Flag;
    default:
      return Calendar;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'birthday':
      return 'badge-warning';
    case 'program':
      return 'badge-info';
    case 'holiday':
      return 'badge-danger';
    default:
      return 'badge-success';
  }
};

import { onMounted } from 'vue';

onMounted(async () => {
  document.title = 'Dashboard - PRSDN Admin';
  
  // Load Members
  await membersStore.loadMembers();
  membersStore.subscribeToChanges();
  
  // Load Finance
  await financeStore.loadTransactions();
  financeStore.subscribeToChanges();

  // Load Kas
  await kasStore.loadPayments();
  kasStore.subscribeToChanges();

  // Load Events
  await eventsStore.loadEvents();
  eventsStore.subscribeToChanges();

  // Load Checkins
  await checkinStore.loadCheckins();
  checkinStore.subscribeToChanges();
});

const showUsernameModal = computed(() => {
  const username = authStore.currentUser?.username;
  return username && !isValidUsername(username);
});

</script>

<template>
  <AppShell pageTitle="Dashboard Admin" pageSubtitle="Ringkasan data dan statistik">
    <div class="dashboard-page">
      <BaseCard class="dashboard-hero" no-padding>
        <div class="hero-content">
          <div>
            <p class="section-kicker">Overview operasional</p>
            <h2>Ringkasan PRSDN bulan {{ currentMonthLabel }}</h2>
            <p>Pantau saldo, kas, anggota, kehadiran, dan agenda dari satu halaman kerja.</p>
          </div>
          <div class="hero-actions">
            <router-link to="/admin/finance/kas" class="btn btn-primary">
              <Wallet :size="18" />
              <span>Kelola Kas</span>
            </router-link>
            <router-link to="/admin/attendance-events" class="btn btn-secondary">
              <ClipboardCheck :size="18" />
              <span>Buka Absensi</span>
            </router-link>
          </div>
        </div>
      </BaseCard>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-large">
          <CardStat
            title="Saldo Keuangan"
            :value="formatCurrency(balance)"
            variant="primary"
          />
        </div>
        <CardStat
          title="Total Anggota"
          :value="totalMembers"
          variant="default"
        />
        <CardStat
          title="Anggota Belum Bayar"
          :value="unpaidKasCount"
          variant="warning"
        />
      </div>

      <div class="detail-grid">
        <BaseCard class="insight-card" no-padding>
          <div class="insight-panel">
            <div class="insight-header">
              <div class="insight-icon primary">
                <Wallet :size="20" />
              </div>
              <div>
                <h3>Keuangan Bulan Ini</h3>
                <p>{{ monthlyFinanceSummary.count }} transaksi tercatat</p>
              </div>
            </div>
            <div class="finance-split">
              <div>
                <span>Pemasukan</span>
                <strong class="text-success">{{ formatCurrency(monthlyFinanceSummary.income) }}</strong>
              </div>
              <div>
                <span>Pengeluaran</span>
                <strong class="text-danger">{{ formatCurrency(monthlyFinanceSummary.expense) }}</strong>
              </div>
              <div>
                <span>Net bulan ini</span>
                <strong>{{ formatCurrency(monthlyFinanceSummary.net) }}</strong>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="insight-card" no-padding>
          <div class="insight-panel">
            <div class="insight-header">
              <div class="insight-icon warning">
                <AlertCircle :size="20" />
              </div>
              <div>
                <h3>Status Kas</h3>
                <p>{{ currentMonthKasSummary.paidCount }}/{{ currentMonthKasSummary.total }} anggota lunas</p>
              </div>
            </div>
            <div class="progress-block">
              <div class="progress-row">
                <span>Progress pembayaran</span>
                <strong>{{ kasCollectionRate }}%</strong>
              </div>
              <div class="progress-track">
                <span :style="{ width: `${kasCollectionRate}%` }"></span>
              </div>
              <div class="mini-grid">
                <div>
                  <small>Terkumpul</small>
                  <strong>{{ formatCurrency(currentMonthKasSummary.totalCollected) }}</strong>
                </div>
                <div>
                  <small>Belum bayar</small>
                  <strong>{{ currentMonthKasSummary.unpaidCount }}</strong>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="insight-card" no-padding>
          <div class="insight-panel">
            <div class="insight-header">
              <div class="insight-icon info">
                <Users :size="20" />
              </div>
              <div>
                <h3>Komposisi RT</h3>
                <p>{{ totalMembers }} anggota aktif</p>
              </div>
            </div>
            <div class="rt-list">
              <div v-for="item in memberRtSummary" :key="item.rt" class="rt-row">
                <div class="rt-meta">
                  <strong>RT {{ item.rt }}</strong>
                  <span>{{ item.total }} anggota</span>
                </div>
                <div class="rt-progress">
                  <span :style="{ width: `${item.percentage}%` }"></span>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Middle Section: Chart & Events -->
      <div class="content-grid">
        <!-- Attendance Chart -->
        <BaseCard class="chart-card" title="Kehadiran 6 Bulan Terakhir">
          <div class="chart-container">
            <AttendanceLineChart :stats="attendanceStats" />
          </div>
        </BaseCard>

        <!-- Upcoming Events -->
        <BaseCard class="events-card" title="Acara Mendatang">
          <div class="events-list">
            <div v-if="upcomingEvents.length === 0" class="empty-state">
              <p class="text-secondary text-sm">Tidak ada acara mendatang</p>
            </div>
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="event-item"
            >
              <div class="event-icon">
                <component :is="getEventIcon(event.type)" :size="20" />
              </div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-date text-xs text-secondary">
                  {{ event.date ? formatDate(event.date) : '-' }}
                </div>
              </div>
              <span :class="['badge', getEventColor(event.type)]">
                {{ 
                  event.type === 'birthday' ? 'Ulang Tahun' : 
                  event.type === 'program' ? 'Program' : 
                  event.type === 'holiday' ? 'Libur Nasional' :
                  'Acara' 
                }}
              </span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="activity-grid">
        <BaseCard class="activity-card" title="Check-in Terbaru">
          <div class="activity-list">
            <div v-if="latestCheckins.length === 0" class="empty-state compact">
              <p class="text-secondary text-sm">Belum ada check-in terbaru</p>
            </div>
            <div v-for="item in latestCheckins" :key="item.id" class="activity-item">
              <div class="activity-icon">
                <CheckCircle2 :size="18" />
              </div>
              <div class="activity-content">
                <strong>{{ item.memberName }}</strong>
                <span>RT {{ item.rt }} · {{ item.eventTitle }}</span>
              </div>
              <div class="activity-time">
                <Clock :size="14" />
                <span>{{ formatTime(item.checkedInAt) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="activity-card" title="Transaksi Terbaru">
          <div class="activity-list">
            <div v-if="recentTransactions.length === 0" class="empty-state compact">
              <p class="text-secondary text-sm">Belum ada transaksi</p>
            </div>
            <div v-for="transaction in recentTransactions" :key="transaction.id" class="activity-item">
              <div :class="['activity-icon', transaction.type === 'income' ? 'income' : 'expense']">
                <ArrowUpRight v-if="transaction.type === 'income'" :size="18" />
                <ArrowDownRight v-else :size="18" />
              </div>
              <div class="activity-content">
                <strong>{{ transaction.title }}</strong>
                <span>{{ transaction.category }} · {{ formatDate(transaction.date) }}</span>
              </div>
              <div :class="['activity-amount', transaction.type === 'income' ? 'text-success' : 'text-danger']">
                {{ formatCurrency(transaction.amount) }}
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Members Table Preview -->
      <BaseCard title="Anggota Terbaru">
        <template #header>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Cari anggota..."
            style="max-width: 300px;"
          />
        </template>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>RT</th>
                <th>No. HP</th>
                <th>Pekerjaan</th>
                <th>Bergabung</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredMembers.length === 0">
                <td colspan="5" class="text-center text-secondary">
                  Tidak ada data
                </td>
              </tr>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td class="font-medium capitalize">{{ member.fullName }}</td>
                <td><span class="badge badge-secondary">RT {{ member.rt }}</span></td>
                <td>{{ member.phone }}</td>
                <td>{{ member.job }}</td>
                <td class="text-secondary text-sm">{{ formatDate(member.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <template #footer>
          <div class="flex justify-center w-full">
            <router-link to="/admin/members/list" class="btn btn-secondary">
              Lihat Semua Anggota
            </router-link>
          </div>
        </template>
      </BaseCard>
    </div>
    
    <!-- Username Update Modal -->
    <UsernameUpdateModal v-if="showUsernameModal" />
  </AppShell>
</template>

<style scoped>
.dashboard-page {
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-8);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.dashboard-hero {
  overflow: hidden;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.10), rgba(255, 255, 255, 0.96));
}

.section-kicker {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-content h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1.35rem;
}

.hero-content p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
}

.stat-large {
  grid-column: span 2;
}

.detail-grid,
.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-6);
}

.activity-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insight-card,
.activity-card {
  min-width: 0;
}

.insight-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  height: 100%;
  padding: var(--space-5);
}

.insight-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.insight-header h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1rem;
}

.insight-header p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.insight-icon,
.activity-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-lg);
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.14));
}

.insight-icon.warning {
  color: #b45309;
  background: #fff7ed;
}

.insight-icon.info {
  color: #2563eb;
  background: #eff6ff;
}

.finance-split {
  display: grid;
  gap: var(--space-3);
}

.finance-split div,
.mini-grid div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: #fbfdfe;
}

.finance-split span,
.mini-grid small,
.progress-row span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.finance-split strong,
.mini-grid strong,
.progress-row strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.progress-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-row,
.rt-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.progress-track,
.rt-progress {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e7eef3;
}

.progress-track span,
.rt-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-primary);
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.mini-grid div {
  flex-direction: column;
}

.rt-list {
  display: grid;
  gap: var(--space-3);
}

.rt-row {
  display: grid;
  gap: var(--space-2);
}

.rt-meta strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.rt-meta span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
}

.chart-card,
.events-card {
  height: 360px;
}

.chart-container {
  height: 100%;
}

.events-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  /* Add padding for scrollbar space if needed, or keeping default */
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-base);
}

.event-item:last-child {
  border-bottom: none;
}

.event-item:hover {
  background-color: #f7fbfd;
  border-radius: var(--radius-md);
  margin-left: calc(var(--space-2) * -1);
  margin-right: calc(var(--space-2) * -1);
  padding-left: var(--space-2);
  padding-right: var(--space-2);
  border-bottom-color: transparent;
}

.event-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.14));
  color: var(--color-primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.event-content {
  flex: 1;
  min-width: 0; /* Truncate text if needed */
}

.event-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-date {
  margin-top: var(--space-1);
}

.table-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: var(--space-8);
  text-align: center;
}

.empty-state.compact {
  padding: var(--space-4);
}

.activity-list {
  display: grid;
  gap: var(--space-2);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: #ffffff;
}

.activity-icon {
  width: 38px;
  height: 38px;
  color: var(--color-primary);
}

.activity-icon.income {
  color: #047857;
  background: #ecfdf5;
}

.activity-icon.expense {
  color: #b91c1c;
  background: #fef2f2;
}

.activity-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.activity-content strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-content span,
.activity-time {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.activity-time {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 700;
}

.activity-amount {
  font-size: var(--text-sm);
  font-weight: 800;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .stat-large {
    grid-column: span 1;
  }

  .detail-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .detail-grid {
    gap: var(--space-4);
  }

  .mini-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    align-items: flex-start;
  }

  .activity-time,
  .activity-amount {
    margin-left: auto;
  }

  .table-header-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }

  .table-header-content input {
    max-width: 100% !important;
  }
}
</style>
