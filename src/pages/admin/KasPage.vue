<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import { useKasStore } from '../../stores/kas';
import { useMembersStore } from '../../stores/members';
import { useFinanceStore } from '../../stores/finance';
import { useUIStore } from '../../stores/ui';
import { Save } from 'lucide-vue-next';

const kasStore = useKasStore();
const membersStore = useMembersStore();
const financeStore = useFinanceStore();
const uiStore = useUIStore();

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear >= 2026 ? currentYear : 2026);
const selectedMonth = ref<number | null>(null);
const filterRT = ref('all');

const years = computed(() => {
  const startYear = 2026;
  const endYear = Math.max(currentYear, 2026) + 1;
  const yearList = [];
  for (let y = startYear; y <= endYear; y++) {
    yearList.push(y);
  }
  return yearList;
});

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

    // Sort by name for easier finding
    currentMonthData.value.sort((a, b) => a.memberName.localeCompare(b.memberName));
};

watch([selectedMonthKey, () => membersStore.members, () => kasStore.payments], () => {
    updateMonthData();
}, { immediate: true });

const filteredMonthData = computed(() => {
  if (filterRT.value === 'all') {
    return currentMonthData.value;
  }
  return currentMonthData.value.filter(d => d.rt === filterRT.value);
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

const kasBalance = computed(() => {
  const kasTransactions = financeStore.transactions.filter(t => t.category === 'kas');
  return kasTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
});

const selectMonth = (monthNum: number) => {
  selectedMonth.value = monthNum;
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
      membersStore.loadMembers(),
      financeStore.loadTransactions()
    ]);
    kasStore.subscribeToChanges();
    membersStore.subscribeToChanges();
    financeStore.subscribeToChanges();
});

import BaseCard from '../../components/BaseCard.vue';
import { onMounted } from 'vue';

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
    uiStore.showToast('Gagal menyimpan data kas. Silakan cek koneksi.', 'error');
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
  <AppShell>
    <div class="kas-page">
      <div class="page-header">
        <div>
          <h1>Kas Online</h1>
          <p class="text-secondary">Kelola iuran bulanan anggota</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid mb-6">
        <CardStat
          title="Saldo Kas (Total)"
          :value="formatCurrency(kasBalance)"
          variant="primary"
        />
        <CardStat
          title="Status Pembayaran (Bulan Ini)"
          :value="`${kasStore.getMonthSummary(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')).paidCount} / ${kasStore.getMonthSummary(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')).total}`"
          variant="info"
        />
        <CardStat
          title="Uang Masuk (Bulan Ini)"
          :value="formatCurrency(kasStore.getMonthSummary(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')).totalCollected)"
          variant="success"
        />
      </div>

      <!-- Year Tabs -->
      <BaseCard class="mb-4 year-tabs-card card-compact">
        <div class="year-tabs">
          <button
            v-for="year in years"
            :key="year"
            @click="selectedYear = year; selectedMonth = null"
            :class="['year-tab', { active: selectedYear === year }]"
          >
            {{ year }}
          </button>
        </div>
      </BaseCard>

      <div v-if="!selectedMonth" class="months-grid">
        <BaseCard
          v-for="monthSummary in monthSummaries"
          :key="monthSummary.num"
          @click="selectMonth(monthSummary.num)"
          class="month-card"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <h3 class="font-bold text-lg">{{ monthSummary.name }}</h3>
              <span class="badge badge-secondary">{{ selectedYear }}</span>
            </div>
          </template>
          
          <div class="month-card-content">
            <div class="payment-progress mb-4">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-secondary">Progress Pelunasan</span>
                <span class="font-semibold">{{ Math.round((monthSummary.paidCount / (monthSummary.total || 1)) * 100) }}%</span>
              </div>
              <div class="progress-bar-bg">
                <div 
                  class="progress-bar-fill" 
                  :style="{ width: `${(monthSummary.paidCount / (monthSummary.total || 1)) * 100}%` }"
                ></div>
              </div>
            </div>
            
            <div class="stats-mini-grid">
              <div class="stat-mini">
                <span class="label">Terbayar</span>
                <span class="value">{{ monthSummary.paidCount }} / {{ monthSummary.total }}</span>
              </div>
              <div class="stat-mini">
                <span class="label">Total</span>
                <span class="value text-success font-bold">{{ formatCurrency(monthSummary.totalCollected) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Month Detail -->
      <div v-else class="flex flex-col flex-1 min-h-0">
        <BaseCard class="mb-4 month-detail-header-card">
          <div class="month-detail-header">
            <div>
              <h2>{{ selectedMonth ? months[selectedMonth - 1]?.name : '' }} {{ selectedYear }}</h2>
              <p class="text-secondary text-sm">
                {{ currentMonthSummary.paidCount }} dari {{ currentMonthSummary.total }} anggota sudah membayar
              </p>
            </div>
            <div class="month-detail-actions">
              <select v-model="filterRT" class="form-select">
                <option value="all">Semua RT</option>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
                <option value="04">RT 04</option>
              </select>
              <button @click="selectedMonth = null" class="btn btn-secondary">
                Kembali
              </button>
              <button @click="saveMonthPayments" class="btn btn-primary">
                <Save :size="20" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="month-detail-card" no-padding>
          <div class="table-container">
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
              <tbody>
                <tr v-if="membersStore.isLoading">
                  <td colspan="6" class="text-center py-8">
                    <div class="flex items-center justify-center gap-2 text-secondary">
                      <span class="loading-spinner"></span>
                      <span>Memuat data anggota...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredMonthData.length === 0">
                  <td colspan="6" class="text-center text-secondary py-8">
                    Tidak ada data anggota untuk filter ini
                  </td>
                </tr>
                <tr v-for="(item, index) in filteredMonthData" :key="item.memberId">
                  <td class="font-medium">{{ item.memberName }}</td>
                  <td><span class="badge badge-secondary">RT {{ item.rt }}</span></td>
                  <td>
                    <div class="input-with-prefix">
                      <span class="input-prefix" style="left: 0.5rem; font-size: 0.75rem;">Rp</span>
                      <input
                        :value="formatCurrencyInput(item.amount)"
                        @input="handleTableAmountInput(index, $event)"
                        type="text"
                        class="form-input text-sm"
                        style="max-width: 120px; padding-left: 2rem;"
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
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.month-detail-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.month-detail-card :deep(.card-body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.month-detail-card .table-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
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
}

.year-tabs-card {
  height: auto !important;
  flex-shrink: 0;
}

.year-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.year-tab {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.year-tab:hover {
  background-color: var(--color-bg);
}

.year-tab.active {
  background-color: var(--color-primary);
  color: white;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
  padding-bottom: var(--space-4);
}

.month-card {
  cursor: pointer;
}

.month-card-content {
  display: flex;
  flex-direction: column;
}

.progress-bar-bg {
  height: 8px;
  background-color: var(--color-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info));
  border-radius: 4px;
  transition: width 1s ease-out;
}

.stats-mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.stat-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-mini .label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-mini .value {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.month-detail-header-card {
  flex-shrink: 0; /* Prevent header stretching */
}

.month-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.month-detail-actions {
  display: flex;
  gap: var(--space-3);
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
