<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppShell from '../../components/AppShell.vue';
import CardStat from '../../components/CardStat.vue';
import { useKasStore } from '../../stores/kas';
import { useMembersStore } from '../../stores/members';
import { useFinanceStore } from '../../stores/finance';
import { Save } from 'lucide-vue-next';

const kasStore = useKasStore();
const membersStore = useMembersStore();
const financeStore = useFinanceStore();

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
    await Promise.all([
      kasStore.loadPayments(),
      financeStore.loadTransactions()
    ]);
    kasStore.subscribeToChanges();
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

    alert('Data kas berhasil disimpan dan transaksi keuangan telah dibuat!');
  } catch (error) {
    console.error(error);
    alert('Gagal menyimpan data kas. Pastikan koneksi aman dan database terhubung.');
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
          title="Saldo Kas"
          :value="formatCurrency(kasBalance)"
          variant="primary"
        />
        <CardStat
          title="Belum Bayar Bulan Ini"
          :value="kasStore.currentMonthUnpaid"
          variant="warning"
        />
        <CardStat
          v-if="selectedMonthKey"
          title="Terkumpul Bulan Ini"
          :value="formatCurrency(currentMonthSummary.totalCollected)"
          variant="success"
        />
      </div>

      <!-- Year Tabs -->
      <BaseCard class="mb-6">
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

      <!-- Month List -->
      <div v-if="!selectedMonth" class="months-grid">
        <BaseCard
          v-for="monthSummary in monthSummaries"
          :key="monthSummary.num"
          @click="selectMonth(monthSummary.num)"
          class="month-card"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <h3>{{ monthSummary.name }}</h3>
              <span class="badge badge-secondary">{{ monthSummary.monthKey }}</span>
            </div>
          </template>
          
          <div class="month-stat-container">
            <div class="month-stat">
              <span class="month-stat-label">Terbayar</span>
              <span class="month-stat-value">{{ monthSummary.paidCount }} / {{ monthSummary.total }}</span>
            </div>
            <div class="month-stat">
              <span class="month-stat-label">Total Terkumpul</span>
              <span class="month-stat-value text-success">{{ formatCurrency(monthSummary.totalCollected) }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Month Detail -->
      <div v-else>
        <BaseCard class="mb-6">
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

        <BaseCard>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>RT</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Tanggal Bayar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredMonthData" :key="item.memberId">
                  <td class="font-medium">{{ item.memberName }}</td>
                  <td><span class="badge badge-secondary">RT {{ item.rt }}</span></td>
                  <td>
                    <input
                      v-model.number="item.amount"
                      type="number"
                      class="form-input"
                      style="max-width: 120px;"
                      min="0"
                    />
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
.kas-page {
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}

.year-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.year-tab {
  padding: var(--space-3) var(--space-6);
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
}

.month-card {
  cursor: pointer;
}

.month-stat-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.month-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.month-stat-value {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
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
