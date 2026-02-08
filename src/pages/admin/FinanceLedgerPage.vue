<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import BaseDatePicker from '../../components/BaseDatePicker.vue';
import CardStat from '../../components/CardStat.vue';
import EmptyState from '../../components/EmptyState.vue';
import { useFinanceStore } from '../../stores/finance';
import { useUIStore } from '../../stores/ui';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import BaseSelect from '../../components/BaseSelect.vue';
import BaseDateRangePicker from '../../components/BaseDateRangePicker.vue';

const financeStore = useFinanceStore();
const uiStore = useUIStore();

onMounted(() => {
  document.title = 'Buku Kas - PRSDN Admin';
  financeStore.loadTransactions();
  financeStore.subscribeToChanges();
});

const showModal = ref(false);
const editingTransaction = ref<any>(null);
const filterType = ref<'all' | 'income' | 'expense'>('all');
const filterCategory = ref('all');
const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);

const categoryOptions = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Kas', value: 'kas' },
  { label: 'Donasi', value: 'donasi' },
  { label: 'Operasional', value: 'operasional' },
  { label: 'Konsumsi', value: 'konsumsi' },
  { label: 'Acara', value: 'acara' },
  { label: 'Lainnya', value: 'lainnya' }
];

const formData = ref<{
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: number;
  date: string | null;
  note: string;
}>({
  type: 'income',
  category: '',
  title: '',
  amount: 0,
  date: new Date().toLocaleDateString('sv-SE') || null,
  note: ''
});

const filteredTransactions = computed(() => {
  return financeStore.transactions.filter(t => {
    const matchesType = filterType.value === 'all' || t.type === filterType.value;
    const matchesCategory = filterCategory.value === 'all' || t.category === filterCategory.value;
    const matchesDate = (!startDate.value || t.date >= startDate.value) && 
                       (!endDate.value || t.date <= endDate.value);
    return matchesType && matchesCategory && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const openAddModal = (type: 'income' | 'expense') => {
  editingTransaction.value = null;
  resetForm();
  formData.value.type = type;
  showModal.value = true;
};

const openEditModal = (transaction: any) => {
  editingTransaction.value = transaction;
  formData.value = { ...transaction };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    type: 'income',
    category: '',
    title: '',
    amount: 0,
    date: new Date().toLocaleDateString('sv-SE'), // sv-SE is YYYY-MM-DD
    note: ''
  };
};

const displayAmount = ref('');

const formatDisplayAmount = (val: number | string) => {
  if (!val && val !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(Number(val));
};

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const rawValue = input.value.replace(/[^0-9]/g, '');
  const numericValue = parseInt(rawValue) || 0;
  
  formData.value.amount = numericValue;
  displayAmount.value = formatDisplayAmount(numericValue);
};

// Update display when opening modal
watch(showModal, (val) => {
  if (val) {
    displayAmount.value = formatDisplayAmount(formData.value.amount);
  }
});

const handleSubmit = async () => {
  let success = false;
  
  if (editingTransaction.value) {
    success = await financeStore.updateTransaction(editingTransaction.value.id, formData.value as any);
  } else {
    const result = await financeStore.createTransaction(formData.value as any);
    success = !!result;
  }
  
  if (success) {
    showModal.value = false;
    resetForm();
    uiStore.showToast(`Transaksi ${editingTransaction.value ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 'success');
  } else {
    uiStore.showToast('Gagal menyimpan transaksi. Silakan coba lagi atau periksa koneksi internet Anda.', 'error');
  }
};

const handleDelete = async (id: string, title: string) => {
  const confirmed = await uiStore.confirm({
    message: `Hapus transaksi "${title}"?`,
    title: 'Hapus Transaksi',
    confirmText: 'Hapus',
    variant: 'danger'
  });
  
  if (confirmed) {
    await financeStore.deleteTransaction(id);
    uiStore.showToast(`Transaksi "${title}" berhasil dihapus`, 'success');
  }
};

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
</script>

<template>
  <AppShell pageTitle="Transaksi Keuangan" pageSubtitle="Kelola pemasukan dan pengeluaran">
    <div class="finance-page">
      <!-- Summary Cards -->
      <div class="stats-grid mb-6">
         <CardStat
          title="Saldo"
          :value="formatCurrency(financeStore.balance)"
          variant="primary"
        />
        <CardStat
          title="Total Pemasukan"
          :value="formatCurrency(financeStore.totalIncome)"
          variant="success"
        />
        <CardStat
          title="Total Pengeluaran"
          :value="formatCurrency(financeStore.totalExpense)"
          variant="danger"
        />
      </div>

      <!-- Filter & Actions Bar -->
      <div class="controls-bar mb-6">
        <div class="controls-wrapper">
          <div class="filters-group">
            <BaseDateRangePicker 
              v-model:start="startDate" 
              v-model:end="endDate" 
              placeholder="Filter Tanggal"
            />
            
            <BaseSelect 
              v-model="filterCategory" 
              :options="categoryOptions"
              class="filter-select-md"
            />

            <BaseSelect 
              v-model="filterType" 
              :options="[
                { label: 'Semua Tipe', value: 'all' },
                { label: 'Pemasukan', value: 'income' },
                { label: 'Pengeluaran', value: 'expense' }
              ]"
              class="filter-select-md"
            />
          </div>

          <div class="actions-group">
            <button @click="openAddModal('income')" class="btn btn-income">
              <Plus :size="18" />
              <span>Pemasukan</span>
            </button>
            <button @click="openAddModal('expense')" class="btn btn-expense">
              <Plus :size="18" />
              <span>Pengeluaran</span>
            </button>
          </div>
        </div>
      </div>


      <!-- Transactions Table -->
      <BaseCard class="table-card">
        <div class="table-container">
        <div class="table-scroll-container">
        <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Judul</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="financeStore.isLoading">
                <td colspan="7" class="text-center py-8">
                  <div class="flex items-center justify-center gap-2 text-secondary">
                    <span class="loading-spinner"></span>
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredTransactions.length === 0">
                <td colspan="7" class="empty-cell">
                  <EmptyState
                    icon="inbox"
                    :title="filterType === 'all' ? 'Tidak ada transaksi' : filterType === 'income' ? 'Tidak ada pemasukan' : 'Tidak ada pengeluaran'"
                    :message="filterType === 'all' ? 'Belum ada transaksi keuangan. Klik tombol di atas untuk menambahkan transaksi baru.' : filterType === 'income' ? 'Belum ada catatan pemasukan.' : 'Belum ada catatan pengeluaran.'"
                  />
                </td>
              </tr>
              <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                <td class="text-sm">{{ formatDate(transaction.date) }}</td>
                <td class="font-medium">{{ transaction.title }}</td>
                <td>
                  <span :class="['badge', transaction.type === 'income' ? 'badge-success' : 'badge-danger']">
                    {{ transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran' }}
                  </span>
                </td>
                <td><span class="badge badge-secondary">{{ transaction.category }}</span></td>
                <td :class="transaction.type === 'income' ? 'text-success' : 'text-danger'" class="font-semibold">
                  {{ formatCurrency(transaction.amount) }}
                </td>
                <td class="text-sm text-secondary">{{ transaction.note || '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openEditModal(transaction)" class="btn btn-secondary btn-sm">
                      <Edit :size="16" />
                    </button>
                    <button @click="handleDelete(transaction.id, transaction.title)" class="btn btn-danger btn-sm">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </BaseCard>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-content card">
          <div class="modal-header">
            <h2>{{ editingTransaction ? 'Edit Transaksi' : `Tambah ${formData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}` }}</h2>
          </div>

          <form @submit.prevent="handleSubmit" class="modal-body">
            <div class="form-group">
              <label class="form-label">Judul *</label>
              <input v-model="formData.title" type="text" class="form-input" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Kategori *</label>
                <select v-model="formData.category" class="form-select" required>
                  <option value="" disabled>Pilih kategori</option>
                  <option value="kas">Kas</option>
                  <option value="donasi">Donasi</option>
                  <option value="operasional">Operasional</option>
                  <option value="konsumsi">Konsumsi</option>
                  <option value="acara">Acara</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal *</label>
                <BaseDatePicker v-model="formData.date" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Jumlah *</label>
              <div class="input-with-prefix">
                <span class="input-prefix">Rp</span>
                <input 
                  :value="displayAmount" 
                  @input="handleAmountInput"
                  type="text" 
                  class="form-input" 
                  placeholder="0"
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Catatan</label>
              <textarea v-model="formData.note" class="form-textarea" rows="3"></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingTransaction ? 'Simpan' : 'Tambah' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.finance-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.btn-expense:hover {
  background-color: #dc2626; /* Slightly darker red */
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}

.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.table-scroll-container {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: visible; 
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.modal-body {
  padding: var(--space-6);
  overflow-y: visible;
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: flex-end;
  margin-top: 0;
  padding: var(--space-6);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
