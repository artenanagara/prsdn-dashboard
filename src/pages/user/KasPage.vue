<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import { useAuthStore } from '../../stores/auth';
import { useMembersStore } from '../../stores/members';
import { useKasStore } from '../../stores/kas';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const kasStore = useKasStore();

const member = computed(() => {
  if (!authStore.currentUser?.memberId) return null;
  return membersStore.getMemberById(authStore.currentUser.memberId);
});

const kasHistory = computed(() => {
  if (!member.value) return [];
  return kasStore.getPaymentsByMember(member.value.id);
});

const totalPaid = computed(() => {
  return kasHistory.value
    .filter(k => k.status === 'paid')
    .reduce((sum, k) => sum + k.amount, 0);
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const getMonthName = (monthKey: string | undefined) => {
  if (!monthKey) return '-';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return '-';
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

onMounted(async () => {
  document.title = 'Kas Saya - PRSDN Dashboard';
  
  await kasStore.loadPayments();
  
  // Subscribe to realtime changes
  kasStore.subscribeToChanges();
});
</script>

<template>
  <AppShell>
    <div class="user-kas-page">
      <BaseCard class="page-header-card">
        <div class="page-header">
          <h1>Riwayat Kas</h1>
          <p class="text-secondary">Lihat riwayat pembayaran kas bulanan Anda</p>
        </div>
      </BaseCard>

      <BaseCard class="mb-6 summary-card">
        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">Total Terbayar</span>
            <span class="summary-value text-success">{{ formatCurrency(totalPaid) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Pembayaran</span>
            <span class="summary-value">{{ kasHistory.filter(k => k.status === 'paid').length }} bulan</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="table-card">
        <div class="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th>Periode</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="kasHistory.length === 0">
                <td colspan="4" class="empty-cell">
                   <EmptyState
                    icon="inbox"
                    title="Belum ada riwayat"
                    message="Belum ada riwayat pembayaran kas yang tercatat."
                  />
                </td>
              </tr>
              <tr v-for="kas in kasHistory" :key="kas.id">
                <td class="font-medium">{{ getMonthName(kas.monthKey) }}</td>
                <td>{{ formatCurrency(kas.amount) }}</td>
                <td>
                  <span :class="['badge', kas.status === 'paid' ? 'badge-success' : 'badge-warning']">
                    {{ kas.status === 'paid' ? 'Lunas' : 'Belum Bayar' }}
                  </span>
                </td>
                <td class="text-sm text-secondary">
                  {{ kas.paidAt ? new Date(kas.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<style scoped>
.user-kas-page {
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-header-card, .summary-card {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-8);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.summary-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-bg-secondary);
}
</style>
