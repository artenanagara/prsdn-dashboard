<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import AppShell from '../../../components/AppShell.vue';
import { useKasStore } from '../../../stores/kas';
import { useMembersStore } from '../../../stores/members';
import { useFinanceStore } from '../../../stores/finance';
import { useUIStore } from '../../../stores/ui';
import { Save, ChevronRight } from 'lucide-vue-next';
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
    totalCollected
  };
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
                <h3 class="month-name">{{ monthSummary.name }} <span class="month-year">{{ selectedYear }}</span></h3>
              </div>
              <div class="month-amount">
                <span class="label">Terkumpul</span>
                <span class="value text-success">{{ formatCurrency(monthSummary.totalCollected) }}</span>
              </div>
            </div>

            <div class="month-card-divider"></div>

            <!-- Bottom Section: Stats & Arrow -->
            <div class="month-card-bottom">
              <div class="month-stats-simple">
                 {{ monthSummary.paidCount }} / {{ monthSummary.total }} Anggota Terbayar
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
                Kembali
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
