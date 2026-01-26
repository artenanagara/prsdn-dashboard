<script setup lang="ts">
import { computed } from 'vue';
import AppShell from '../../components/AppShell.vue';
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
</script>

<template>
  <AppShell>
    <div class="user-kas-page">
      <div class="page-header">
        <h1>Riwayat Kas</h1>
        <p class="text-secondary">Lihat riwayat pembayaran kas bulanan Anda</p>
      </div>

      <div class="card mb-6">
        <div class="card-body">
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
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Bulan</th>
                <th>Tahun</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="kasHistory.length === 0">
                <td colspan="5" class="text-center text-secondary">
                  Belum ada riwayat pembayaran
                </td>
              </tr>
              <tr v-for="kas in kasHistory" :key="kas.id">
                <td class="font-medium">{{ kas.monthKey }}</td>
                <td>{{ kas.year }}</td>
                <td>{{ formatCurrency(kas.amount) }}</td>
                <td>
                  <span :class="['badge', kas.status === 'paid' ? 'badge-success' : 'badge-warning']">
                    {{ kas.status === 'paid' ? 'Lunas' : 'Belum Bayar' }}
                  </span>
                </td>
                <td class="text-sm text-secondary">
                  {{ kas.paidAt ? new Date(kas.paidAt).toLocaleDateString('id-ID') : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.user-kas-page {
  max-width: 1200px;
}

.page-header {
  margin-bottom: var(--space-8);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
</style>
