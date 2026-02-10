<script setup lang="ts">
import { ref, computed } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import BaseCard from '../../components/BaseCard.vue';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart.vue';
import { useFinanceStore } from '../../stores/finance';
import { useMembersStore } from '../../stores/members';
import { useKasStore } from '../../stores/kas';
import { useCheckinStore } from '../../stores/checkin';
import { useEventsStore } from '../../stores/events';
import { Calendar, Gift, Briefcase, Flag } from 'lucide-vue-next';

const financeStore = useFinanceStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();
const checkinStore = useCheckinStore();
const eventsStore = useEventsStore();

const searchQuery = ref('');

const balance = computed(() => financeStore.balance);
const totalMembers = computed(() => membersStore.totalMembers);
const unpaidKasCount = computed(() => kasStore.currentMonthUnpaid);

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
});
</script>

<template>
  <AppShell pageTitle="Dashboard Admin" pageSubtitle="Ringkasan data dan statistik">
    <div class="dashboard-page">

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
  </AppShell>
</template>

<style scoped>
.dashboard-page {
  max-width: 1400px;
}

.page-header {
  margin-bottom: var(--space-8);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.stat-large {
  grid-column: span 2;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
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
  background-color: var(--color-bg-secondary);
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
  background-color: var(--color-primary-light);
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

@media (max-width: 1024px) {
  .stat-large {
    grid-column: span 1;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
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
