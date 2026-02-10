<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import BaseCard from '../../components/BaseCard.vue';
import FinanceLineChart from '../../components/charts/FinanceLineChart.vue';
import ActiveEventCard from '../../components/events/ActiveEventCard.vue';
import UpcomingEventsList from '../../components/events/UpcomingEventsList.vue';
import UsernameUpdateModal from '../../components/UsernameUpdateModal.vue';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
import { useKasStore } from '../../stores/kas';
import { useAttendanceEventStore } from '../../stores/attendanceEvent';
import { useCheckinStore } from '../../stores/checkin';
import { useUIStore } from '../../stores/ui';
import { useFinanceStore } from '../../stores/finance';
import { isValidUsername } from '../../utils/validation';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();
const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();
const uiStore = useUIStore();
const financeStore = useFinanceStore();

const tokenInput = ref('');
const isSubmitting = ref(false);
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
    membersStore.loadMembers(false),
    fetchHolidays()
  ]);
  
  checkinStore.subscribeToChanges();
  eventStore.subscribeToChanges();
  
  await financeStore.loadTransactions();
  financeStore.subscribeToChanges();
});

const fetchHolidays = async () => {
  try {
    holidays.value = FALLBACK_HOLIDAYS;
  } catch (error) {
    console.warn('Using fallback holiday data');
    holidays.value = FALLBACK_HOLIDAYS;
  }
};

const member = computed(() => {
  if (!authStore.currentUser?.memberId) return null;
  return membersStore.getMemberById(authStore.currentUser.memberId);
});

const totalAttendance = computed(() => {
  if (!member.value) return 0;
  return checkinStore.getCheckinsByMember(member.value.id).length;
});

const currentMonthKey = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const currentMonthKas = computed(() => {
  if (!member.value) return null;
  const payments = kasStore.getPaymentsByMonth(currentMonthKey.value);
  return payments.find(p => p.memberId === member.value!.id);
});

const upcomingEventsList = computed(() => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
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

  const publicHolidays = holidays.value
    .map((h, index) => ({
      id: `holiday-${index}`,
      title: h.keterangan,
      date: new Date(h.tanggal).getTime(),
      type: 'holiday',
      originalDate: h.tanggal,
      is_cuti: h.is_cuti
    }))
    .filter(h => h.date >= todayStart);

  const combined = [...officialEvents, ...birthdays, ...publicHolidays];
  combined.sort((a, b) => a.date - b.date);

  return combined.slice(0, 50);
});

const activeEvent = computed(() => eventStore.activeEvent);

const isTokenExpired = computed(() => {
  if (!activeEvent.value || !activeEvent.value.token) return false;
  return Date.now() > activeEvent.value.tokenExpiresAt;
});

const alreadyCheckedIn = computed(() => {
  if (!activeEvent.value || !authStore.currentUser?.memberId) return false;
  return checkinStore.hasCheckedIn(activeEvent.value.id, authStore.currentUser.memberId);
});

const handleCheckin = async () => {
  if (!activeEvent.value || !member.value) return;
  
  isSubmitting.value = true;

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

// Finance Chart Data
const financeChartData = computed(() => {
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthTransactions = financeStore.transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= monthStart && transDate <= monthEnd;
    });
    
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

const showUsernameModal = computed(() => {
  const username = authStore.currentUser?.username;
  return username && !isValidUsername(username);
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
            <CardStat
              title="Total Kehadiran"
              :value="`${totalAttendance} Event`"
              variant="info"
              icon="📅"
            />
            <CardStat
              title="Kas Bulan Ini"
              :value="currentMonthKas?.status === 'paid' ? 'Lunas' : 'Belum Bayar'"
              :variant="currentMonthKas?.status === 'paid' ? 'success' : 'warning'"
              icon="💰"
            />
          </div>

          <!-- Section 2: Active Event -->
          <ActiveEventCard
            :event="activeEvent"
            :already-checked-in="alreadyCheckedIn"
            v-model:token-input="tokenInput"
            :is-submitting="isSubmitting"
            :is-token-expired="isTokenExpired"
            @checkin="handleCheckin"
          />

          <!-- Finance Chart Section -->
          <BaseCard title="Grafik Keuangan" class="mb-6">
            <FinanceLineChart :data="financeChartData" :height="200" />
          </BaseCard>
        </div>

        <!-- RIGHT COLUMN: Upcoming Events -->
        <div class="sidebar-content">
          <BaseCard title="Event Akan Datang" class="h-full max-h-screen overflow-hidden">
            <UpcomingEventsList :events="upcomingEventsList" />
          </BaseCard>
        </div>
      </div>
    </div>
    
    <!-- Username Update Modal -->
    <UsernameUpdateModal v-if="showUsernameModal" />
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
    grid-template-columns: 1fr;
  }
}


</style>
