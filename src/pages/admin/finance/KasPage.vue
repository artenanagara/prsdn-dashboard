<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import AppShell from '../../../components/AppShell.vue';
import { useKasStore } from '../../../stores/kas';
import { useMembersStore } from '../../../stores/members';
import { useFinanceStore } from '../../../stores/finance';
import { useUIStore } from '../../../stores/ui';
import { Save, ChevronRight, CalendarDays, CheckCircle2, AlertCircle, Wallet, ArrowLeft } from 'lucide-vue-next';
import BaseSelect from '../../../components/BaseSelect.vue';

const kasStore = useKasStore();
const membersStore = useMembersStore();
const financeStore = useFinanceStore();
const uiStore = useUIStore();

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear >= 2026 ? currentYear : 2026);
const selectedMonth = ref<number | null>(null);
const filterRT = ref('all');
const searchQuery = ref('');

const years = computed(() => {
  const startYear = 2026;
  const endYear = Math.max(currentYear, 2026) + 1;
  const yearList = [];
  for (let y = startYear; y <= endYear; y++) {
    yearList.push(y);
  }
  return yearList;
});

const yearOptions = computed(() => years.value.map(y => ({ label: String(y), value: y })));

const rtOptions = [
  { label: 'Semua RT', value: 'all' },
  { label: 'RT 01', value: '01' },
  { label: 'RT 02', value: '02' },
  { label: 'RT 03', value: '03' },
  { label: 'RT 04', value: '04' }
];

const months = [
  { num: 1, name: 'Januari' },
  { num: 2, name: 'Februari' },
  { num: 3, name: 'Maret' },
  { num: 4, name: 'April' },
  { num: 5, name: 'Mei' },
  { num: 6, name: 'Juni' },
  { num: 7, name: 'Juli' },
  { num: 8, name: 'Agustus' },
  { num: 9, name: 'September' },
  { num: 10, name: 'Oktober' },
  { num: 11, name: 'November' },
  { num: 12, name: 'Desember' }
];

const monthSummaries = computed(() => {
  return months.map(month => {
    const monthKey = `${selectedYear.value}-${String(month.num).padStart(2, '0')}`;
    const summary = kasStore.getMonthSummary(monthKey);
    return {
      ...month,
      monthKey,
      ...summary
    };
  });
});

const yearSummary = computed(() => {
  const totalCollected = monthSummaries.value.reduce((sum, month) => sum + month.totalCollected, 0);
  const paidCount = monthSummaries.value.reduce((sum, month) => sum + month.paidCount, 0);
  const totalCount = monthSummaries.value.reduce((sum, month) => sum + month.total, 0);
  const unpaidCount = Math.max(totalCount - paidCount, 0);
  const percentage = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return { totalCollected, paidCount, unpaidCount, totalCount, percentage };
});

const selectedMonthKey = computed(() => {
  if (selectedMonth.value === null) return null;
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
});

const currentMonthData = ref<Array<{
  memberId: string;
  memberName: string;
  rt: string;
  amount: number;
  status: 'paid' | 'unpaid';
  paidAt?: string;
}>>([]);

const updateMonthData = () => {
    const monthKey = selectedMonthKey.value;
    if (!monthKey) {
        currentMonthData.value = [];
        return;
    }

    // Ensure we have the latest members list
    const allMembers = membersStore.members;
    const payments = kasStore.getPaymentsByMonth(monthKey);

    // Map ALL members to the list
    currentMonthData.value = allMembers.map(member => {
        const payment = payments.find(p => p.memberId === member.id);
        
        if (payment) {
            return {
                memberId: member.id,
                memberName: member.fullName,
                rt: member.rt,
                amount: payment.amount,
                status: payment.status,
                paidAt: payment.paidAt
            };
        } else {
            // Default for member with no payment record yet
            return {
                memberId: member.id,
                memberName: member.fullName,
                rt: member.rt,
                amount: 5000, // Default fee
                status: 'unpaid',
                paidAt: undefined
            };
        }
    });

    // Sort by RT first, then by name
    currentMonthData.value.sort((a, b) => {
        // First compare RT
        const rtCompare = a.rt.localeCompare(b.rt);
        if (rtCompare !== 0) return rtCompare;
        // If RT is same, compare name
        return a.memberName.localeCompare(b.memberName);
    });
};

watch([selectedMonthKey, () => membersStore.members, () => kasStore.payments], () => {
    updateMonthData();
}, { immediate: true });

const filteredMonthData = computed(() => {
  let result = currentMonthData.value;
  
  // Filter by RT
  if (filterRT.value !== 'all') {
    result = result.filter(d => d.rt === filterRT.value);
  }
  
  // Filter by search query (nama)
  const trimmedQuery = searchQuery.value.trim();
  if (trimmedQuery) {
    const query = trimmedQuery.toLowerCase();
    result = result.filter(d => d.memberName.toLowerCase().includes(query));
  }
  
  return result;
});

// Force Vue to re-render table when filtered data changes
const listKey = computed(() => {
  return `${selectedMonthKey.value}-${filterRT.value}-${searchQuery.value}-${filteredMonthData.value.length}`;
});

const currentMonthSummary = computed(() => {
  const paidCount = currentMonthData.value.filter(d => d.status === 'paid').length;
  const unpaidCount = currentMonthData.value.filter(d => d.status === 'unpaid').length;
  const totalCollected = currentMonthData.value
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    total: currentMonthData.value.length,
    paidCount,
    unpaidCount,
    totalCollected,
    percentage: currentMonthData.value.length > 0 ? Math.round((paidCount / currentMonthData.value.length) * 100) : 0
  };
});

const currentRtSummary = computed(() => {
  return ['01', '02', '03', '04'].map(rt => {
    const items = currentMonthData.value.filter(item => item.rt === rt);
    const paid = items.filter(item => item.status === 'paid').length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

    return { rt, paid, total, percentage };
  });
});


const selectMonth = (monthNum: number) => {
  selectedMonth.value = monthNum;
  // Reset filters when selecting new month
  searchQuery.value = '';
  filterRT.value = 'all';
};

const togglePaymentStatus = (index: number) => {
  const item = filteredMonthData.value[index];
  if (!item) return;
  
  const originalIndex = currentMonthData.value.findIndex(d => d.memberId === item.memberId);
  if (originalIndex === -1) return;
  
  const payment = currentMonthData.value[originalIndex]!;
  if (payment.status === 'paid') {
    payment.status = 'unpaid';
    payment.paidAt = undefined;
  } else {
    payment.status = 'paid';
    payment.paidAt = new Date().toISOString().split('T')[0]!;
  }
};

onMounted(async () => {
    document.title = 'Kas Online - PRSDN Admin';
    await Promise.all([
      kasStore.loadPayments(),
      membersStore.loadMembers(false), // Exclude admin accounts from kas payments
      financeStore.loadTransactions()
    ]);
    kasStore.subscribeToChanges();
    membersStore.subscribeToChanges();
    financeStore.subscribeToChanges();
});

import BaseCard from '../../../components/BaseCard.vue';
import EmptyState from '../../../components/EmptyState.vue';

const saveMonthPayments = async () => {
  if (!selectedMonthKey.value) return;

  try {
    await kasStore.saveMonthPayments(
      selectedMonthKey.value,
      currentMonthData.value.map(d => ({
        memberId: d.memberId,
        amount: d.amount,
        status: d.status,
        paidAt: d.paidAt
      }))
    );

    uiStore.showToast('Data kas berhasil disimpan!', 'success');
  } catch (error) {
    console.error(error);
    uiStore.showToast('Gagal menyimpan data kas. Silakan coba lagi atau periksa koneksi internet Anda.', 'error');
  }
};

const formatCurrencyInput = (val: number | string) => {
  if (!val && val !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(Number(val));
};

const handleTableAmountInput = (index: number, e: Event) => {
  const input = e.target as HTMLInputElement;
  const rawValue = input.value.replace(/[^0-9]/g, '');
  const numericValue = parseInt(rawValue) || 0;
  
  const item = filteredMonthData.value[index];
  if (item) {
    item.amount = numericValue;
    input.value = formatCurrencyInput(numericValue);
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};
</script>

<template>
  <AppShell pageTitle="Kas Online" pageSubtitle="Kelola pembayaran kas bulanan">
    <div class="kas-page">
      <div class="finance-flow-toolbar">
        <div>
          <p class="section-kicker">Kas bulanan</p>
          <h3>Monitoring pembayaran kas</h3>
          <p>Pilih tahun, buka bulan, tandai anggota yang sudah lunas, lalu simpan perubahan.</p>
        </div>
        <div class="toolbar-summary">
          <span>{{ yearSummary.percentage }}%</span>
          <small>Lunas tahun ini</small>
        </div>
      </div>

      <div class="flow-grid">
        <div class="flow-step" :class="{ 'is-active': !selectedMonth }">
          <span class="step-number">1</span>
          <div>
            <strong>Pilih periode</strong>
            <p>Pilih tahun dan bulan kas.</p>
          </div>
        </div>
        <div class="flow-step" :class="{ 'is-active': selectedMonth }">
          <span class="step-number">2</span>
          <div>
            <strong>Tandai pembayaran</strong>
            <p>Update nominal dan status anggota.</p>
          </div>
        </div>
        <div class="flow-step">
          <span class="step-number">3</span>
          <div>
            <strong>Simpan data</strong>
            <p>Simpan supaya rekap kas ikut berubah.</p>
          </div>
        </div>
      </div>

      <!-- Year Selector -->
      <BaseCard class="mb-4 year-selector-card card-compact">
        <div class="year-selector">
          <label class="form-label">Pilih Tahun:</label>
          <BaseSelect 
            v-model="selectedYear" 
            :options="yearOptions" 
            @update:modelValue="selectedMonth = null"
          />
        </div>
      </BaseCard>

      <div v-if="!selectedMonth" class="months-list">
        <div class="summary-grid">
          <div class="summary-card-item primary">
            <Wallet :size="20" />
            <span>Terkumpul</span>
            <strong>{{ formatCurrency(yearSummary.totalCollected) }}</strong>
          </div>
          <div class="summary-card-item">
            <CheckCircle2 :size="20" />
            <span>Terbayar</span>
            <strong>{{ yearSummary.paidCount }}</strong>
          </div>
          <div class="summary-card-item">
            <AlertCircle :size="20" />
            <span>Belum Bayar</span>
            <strong>{{ yearSummary.unpaidCount }}</strong>
          </div>
        </div>

        <BaseCard
          v-for="monthSummary in monthSummaries"
          :key="monthSummary.num"
          @click="selectMonth(monthSummary.num)"
          class="month-row-card"
          no-padding
        >
          <div class="month-card-stacked">
            <!-- Top Section: Title & Amount -->
            <div class="month-card-top">
              <div class="month-title-row">
                <div class="month-icon">
                  <CalendarDays :size="18" />
                </div>
                <div>
                  <h3 class="month-name">{{ monthSummary.name }}</h3>
                  <span class="month-year">{{ selectedYear }}</span>
                </div>
              </div>
              <div class="month-amount">
                <span class="label">Terkumpul</span>
                <span class="value text-success">{{ formatCurrency(monthSummary.totalCollected) }}</span>
              </div>
            </div>

            <div class="month-card-divider"></div>

            <!-- Bottom Section: Stats & Arrow -->
            <div class="month-card-bottom">
              <div class="month-progress-wrap">
                <div class="month-stats-simple">
                  {{ monthSummary.paidCount }} / {{ monthSummary.total }} anggota terbayar
                </div>
                <div class="month-progress">
                  <span :style="{ width: `${monthSummary.total > 0 ? Math.round((monthSummary.paidCount / monthSummary.total) * 100) : 0}%` }"></span>
                </div>
              </div>
              <div class="month-arrow">
                <ChevronRight :size="18" />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-else class="flex flex-col flex-1 min-h-0">
        <!-- Month Detail Header -->
        <div class="month-detail-header mb-6">
          <div class="header-info">
            <h2 class="text-2xl font-bold mb-1">{{ selectedMonth ? months[selectedMonth - 1]?.name : '' }} {{ selectedYear }}</h2>
            <p class="text-secondary">
              {{ currentMonthSummary.paidCount }} dari {{ currentMonthSummary.total }} anggota sudah membayar (Terkumpul: {{ formatCurrency(currentMonthSummary.totalCollected) }})
            </p>
          </div>
        </div>

        <div class="summary-grid month-summary-grid mb-6">
          <div class="summary-card-item primary">
            <Wallet :size="20" />
            <span>Terkumpul</span>
            <strong>{{ formatCurrency(currentMonthSummary.totalCollected) }}</strong>
          </div>
          <div class="summary-card-item">
            <CheckCircle2 :size="20" />
            <span>Lunas</span>
            <strong>{{ currentMonthSummary.paidCount }}</strong>
          </div>
          <div class="summary-card-item">
            <AlertCircle :size="20" />
            <span>Belum Bayar</span>
            <strong>{{ currentMonthSummary.unpaidCount }}</strong>
          </div>
          <div class="summary-card-item">
            <CalendarDays :size="20" />
            <span>Progress</span>
            <strong>{{ currentMonthSummary.percentage }}%</strong>
          </div>
        </div>

        <BaseCard class="rt-monitor-card mb-6" no-padding>
          <div class="rt-monitor">
            <div class="rt-monitor-heading">
              <h3>Rekap per RT</h3>
              <span>{{ currentMonthSummary.paidCount }}/{{ currentMonthSummary.total }} lunas</span>
            </div>
            <div class="rt-progress-grid">
              <div v-for="item in currentRtSummary" :key="item.rt" class="rt-progress-item">
                <div class="rt-progress-row">
                  <strong>RT {{ item.rt }}</strong>
                  <span>{{ item.paid }}/{{ item.total }}</span>
                </div>
                <div class="month-progress">
                  <span :style="{ width: `${item.percentage}%` }"></span>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Filter & Actions Bar -->
        <div class="controls-bar mb-6">
          <div class="controls-wrapper">
            <div class="filters-group">
              <input
                v-model="searchQuery"
                type="text"
                class="form-input"
                placeholder="Cari nama anggota..."
              >
              <BaseSelect 
                v-model="filterRT" 
                :options="rtOptions"
                placeholder="Pilih RT"
                class="filter-select-sm"
              />
            </div>
            <div class="actions-group">
              <button @click="selectedMonth = null" class="btn btn-secondary">
                <ArrowLeft :size="18" />
                <span>Kembali</span>
              </button>
              <button @click="saveMonthPayments" class="btn btn-primary">
                <Save :size="18" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
        
        <BaseCard class="table-card" no-padding>
          <div class="table-container">
          <div class="table-scroll-container">
          <table>
              <thead>
                <tr>
                  <th>Nama *</th>
                  <th>RT</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Tanggal Bayar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody :key="listKey">
                <tr v-if="membersStore.isLoading">
                  <td colspan="6" class="text-center py-8">
                    <div class="flex items-center justify-center gap-2 text-secondary">
                      <span class="loading-spinner"></span>
                      <span>Memuat data anggota...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredMonthData.length === 0">
                  <td colspan="6" class="empty-cell">
                    <EmptyState
                      icon="search"
                      title="Tidak ada data"
                      :message="searchQuery || filterRT !== 'all' ? 'Tidak ada anggota yang sesuai dengan filter yang dipilih. Coba ubah filter atau reset pencarian.' : 'Belum ada data pembayaran untuk bulan ini.'"
                    />
                  </td>
                </tr>
                <template v-for="(item, index) in filteredMonthData" :key="'row-' + index">
                  <tr class="kas-table-row">
                    <td class="font-medium capitalize">{{ item.memberName }}</td>
                    <td><span class="badge badge-secondary">RT {{ item.rt }}</span></td>
                    <td>
                      <div class="input-with-prefix">
                        <span class="input-prefix kas-input-prefix">Rp</span>
                        <input
                          :value="formatCurrencyInput(item.amount)"
                          @input="handleTableAmountInput(index, $event)"
                          type="text"
                          class="form-input kas-amount-input"
                        />
                      </div>
                    </td>
                    <td>
                      <span :class="['badge', item.status === 'paid' ? 'badge-success' : 'badge-warning']">
                        {{ item.status === 'paid' ? 'Lunas' : 'Belum Bayar' }}
                      </span>
                    </td>
                    <td class="text-sm text-secondary">
                      {{ item.paidAt ? new Date(item.paidAt).toLocaleDateString('id-ID') : '-' }}
                    </td>
                    <td>
                      <button
                        @click="togglePaymentStatus(index)"
                        :class="['btn', 'btn-sm', item.status === 'paid' ? 'btn-danger' : 'btn-primary']"
                      >
                        {{ item.status === 'paid' ? 'Batalkan' : 'Tandai Lunas' }}
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.kas-page {
  max-width: 100vw;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.finance-flow-toolbar {
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

.finance-flow-toolbar h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1.1rem;
}

.finance-flow-toolbar p {
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

.toolbar-summary {
  min-width: 120px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  color: #ffffff;
  background: var(--gradient-primary);
  text-align: center;
}

.toolbar-summary span {
  display: block;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1;
}

.toolbar-summary small {
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--text-xs);
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

.month-detail-card {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
  max-width: 100%;
  overflow-x: visible;
}

.month-detail-card :deep(.card-body) {
  padding: 0;
}

.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 100%;
}

.table-card :deep(.card-body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.table-scroll-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.page-header {
  margin-bottom: var(--space-4);
  flex-shrink: 0;
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  flex-shrink: 0;
  max-width: 100%;
  overflow-x: visible;
}

.year-selector-card {
  height: auto !important;
  flex-shrink: 0;
  max-width: 100%;
  overflow-x: visible;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.year-selector .form-label {
  margin: 0;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.year-selector .form-select {
  min-width: 150px;
}

.months-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  max-width: 100%;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.month-summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-card-item {
  min-height: 112px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: #ffffff;
  box-shadow: var(--shadow-xs);
}

.summary-card-item svg {
  color: var(--color-primary);
}

.summary-card-item.primary {
  color: #ffffff;
  background: var(--gradient-primary);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 14px 30px rgba(15, 111, 143, 0.16);
}

.summary-card-item.primary svg {
  color: #ffffff;
}

.summary-card-item span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.summary-card-item.primary span {
  color: rgba(255, 255, 255, 0.78);
}

.summary-card-item strong {
  color: var(--color-ink);
  font-size: 1.45rem;
  line-height: 1.15;
}

.summary-card-item.primary strong {
  color: #ffffff;
}

.month-row-card {
  cursor: pointer;
  transition: all var(--transition-base);
}

.month-row-card:hover {
  transform: translateX(4px);
  border-color: var(--color-primary-light);
  background-color: var(--color-bg-secondary);
}

.month-card-stacked {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.month-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
}

.month-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.month-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--color-primary);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.12), rgba(32, 183, 216, 0.16));
}

.month-card-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: 0 var(--space-6);
}

.month-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  background-color: rgba(0, 0, 0, 0.01);
}

.month-name {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.month-year {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  margin-left: var(--space-2);
}

.month-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.month-amount .label {
  font-size: 10px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.month-amount .value {
  font-size: var(--text-base);
  font-weight: var(--font-weight-bold);
}

.month-stats-simple {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.month-progress-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.month-progress {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e7eef3;
}

.month-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-primary);
  transition: width var(--transition-base);
}

.rt-monitor-card {
  border-color: var(--color-border);
}

.rt-monitor {
  padding: var(--space-5);
}

.rt-monitor-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.rt-monitor-heading h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1rem;
}

.rt-monitor-heading span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.rt-progress-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.rt-progress-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rt-progress-row {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.rt-progress-row strong {
  color: var(--color-ink);
}

.month-arrow {
  color: var(--color-text-secondary);
  opacity: 0.5;
  transition: all var(--transition-base);
}

.month-row-card:hover .month-arrow {
  opacity: 1;
  color: var(--color-primary);
  transform: translateX(2px);
}

.month-row-card:hover .month-arrow {
  opacity: 1;
  color: var(--color-primary);
}

.month-detail-header-card {
  flex-shrink: 0;
}

/* Compact table header - vertical layout */
.table-header-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  max-width: 100%;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}

.table-header-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
}

.table-header-info h2 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
}

.table-header-info p {
  margin: 0;
  font-size: var(--text-sm);
}

.table-header-filters {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
  margin: 0;
}

.table-header-filters .form-input {
  flex: 1;
  min-width: 200px;
}

.table-header-filters .form-select {
  width: auto;
  min-width: 150px;
}

.table-header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
  margin: 0;
}

@media (max-width: 768px) {
  .finance-flow-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .flow-grid,
  .summary-grid,
  .month-summary-grid,
  .rt-progress-grid {
    grid-template-columns: 1fr;
  }

  .month-row-content {
    flex-direction: row; /* Keep horizontal but wrap if needed */
    align-items: center;
    padding: var(--space-4);
  }
  
  .month-amount-info {
    text-align: right;
  }
  
  .month-arrow {
    display: none;
  }

  .table-header-filters {
    flex-direction: row;
    align-items: stretch;
  }
  
  .table-header-filters .form-input,
  .table-header-filters .form-select {
    width: 100%;
    flex: 1 1 auto;
  }
  
  .table-header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-header-actions .btn {
    width: 100%;
  }
}

/* Ensure table rows are visible and not collapsed */
.kas-table-row {
  min-height: 60px !important;
  height: auto !important;
  display: table-row !important;
  visibility: visible !important;
}

.kas-table-row td {
  min-height: 60px !important;
  padding: var(--space-3) var(--space-4) !important;
  vertical-align: middle !important;
  display: table-cell !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Force proper table layout */
table {
  table-layout: auto;
  width: max-content;
  min-width: 100%;
  margin: 0;
  border-spacing: 0;
}

thead {
  margin: 0;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}

tbody {
  display: table-row-group !important;
}

/* Kas amount input styling */
.kas-amount-input {
  min-width: 140px;
  width: 160px;
  padding-left: 2.5rem !important;
  font-size: var(--text-base) !important;
  font-weight: var(--font-weight-medium);
  height: 42px;
}

.kas-input-prefix {
  left: 0.75rem !important;
  font-size: var(--text-sm) !important;
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .month-detail-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .month-detail-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .month-detail-actions .form-select,
  .month-detail-actions .btn {
    flex: 1;
  }
}
</style>
