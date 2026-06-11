<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router'; // Added import
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import BaseDatePicker from '../../../components/BaseDatePicker.vue';
import EmptyState from '../../../components/EmptyState.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import { usePaymentStore } from '../../../stores/payment';
import { useUIStore } from '../../../stores/ui';
import { Plus, Edit, Trash2, Search, Wallet, CalendarDays, ListChecks, ArrowRight } from 'lucide-vue-next';

const router = useRouter(); // Added router
const paymentStore = usePaymentStore();
const uiStore = useUIStore();

onMounted(() => {
  document.title = 'Pembayaran - PRSDN Admin';
  paymentStore.loadPaymentItems();
});

const showModal = ref(false);
const editingItem = ref<any>(null);
const searchQuery = ref('');
const filterType = ref('all');

const formData = ref<{
  title: string;
  deadlineDate: string | null;
  type: 'dp' | 'full';
  amount: number;
  description: string;
}>({
  title: '',
  deadlineDate: null,
  type: 'full',
  amount: 0,
  description: ''
});

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

const filteredItems = computed(() => {
  return paymentStore.paymentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = filterType.value === 'all' || item.type === filterType.value;
    return matchesSearch && matchesType;
  });
});

const paymentSummary = computed(() => {
  const totalItems = paymentStore.paymentItems.length;
  const fullCount = paymentStore.paymentItems.filter(item => item.type === 'full').length;
  const dpCount = paymentStore.paymentItems.filter(item => item.type === 'dp').length;
  const totalNominal = paymentStore.paymentItems.reduce((sum, item) => sum + item.amount, 0);

  return { totalItems, fullCount, dpCount, totalNominal };
});

const openAddModal = () => {
  editingItem.value = null;
  resetForm();
  showModal.value = true;
};

const openEditModal = (item: any) => {
  editingItem.value = item;
  formData.value = {
    title: item.title,
    deadlineDate: item.deadlineDate,
    type: item.type,
    amount: item.amount,
    description: item.description || ''
  };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    title: '',
    deadlineDate: null,
    type: 'full',
    amount: 0,
    description: ''
  };
};

const handleSubmit = async () => {
  if (!formData.value.deadlineDate) {
    uiStore.showToast('Tanggal terakhir pembayaran wajib diisi', 'error');
    return;
  }

  let success = false;
  
  if (editingItem.value) {
    success = await paymentStore.updatePaymentItem(editingItem.value.id, {
      ...formData.value,
      deadlineDate: formData.value.deadlineDate
    });
  } else {
    success = !!await paymentStore.createPaymentItem({
      ...formData.value,
      deadlineDate: formData.value.deadlineDate
    });
  }
  
  if (success) {
    showModal.value = false;
    resetForm();
    uiStore.showToast(`Pembayaran ${editingItem.value ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 'success');
  } else {
    uiStore.showToast('Gagal menyimpan data. Silakan coba lagi.', 'error');
  }
};

const handleDelete = async (id: string, title: string) => {
  const confirmed = await uiStore.confirm({
    message: `Hapus pembayaran "${title}"?`,
    title: 'Hapus Pembayaran',
    confirmText: 'Hapus',
    variant: 'danger'
  });
  
  if (confirmed) {
    await paymentStore.deletePaymentItem(id);
    uiStore.showToast(`Pembayaran "${title}" berhasil dihapus`, 'success');
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
  <AppShell pageTitle="Pembayaran" pageSubtitle="Kelola daftar pembayaran anggota">
    <div class="payment-page">
      <div class="finance-flow-toolbar">
        <div>
          <p class="section-kicker">Pembayaran anggota</p>
          <h3>Kelola tagihan dan cicilan</h3>
          <p>Buat item pembayaran, buka detailnya, lalu catat pembayaran anggota.</p>
        </div>
        <button @click="openAddModal" class="btn btn-primary">
          <Plus :size="18" />
          <span>Tambah Pembayaran</span>
        </button>
      </div>

      <div class="flow-grid">
        <div class="flow-step is-active">
          <span class="step-number">1</span>
          <div>
            <strong>Buat tagihan</strong>
            <p>Tentukan nominal, tipe, dan batas waktu.</p>
          </div>
        </div>
        <div class="flow-step">
          <span class="step-number">2</span>
          <div>
            <strong>Catat pembayaran</strong>
            <p>Buka detail untuk input bayar per anggota.</p>
          </div>
        </div>
        <div class="flow-step">
          <span class="step-number">3</span>
          <div>
            <strong>Pantau status</strong>
            <p>Lihat lunas, sebagian, dan belum bayar.</p>
          </div>
        </div>
      </div>

      <div class="summary-grid mb-6">
        <div class="summary-card-item primary">
          <Wallet :size="20" />
          <span>Total Nominal</span>
          <strong>{{ formatCurrency(paymentSummary.totalNominal) }}</strong>
        </div>
        <div class="summary-card-item">
          <ListChecks :size="20" />
          <span>Item Pembayaran</span>
          <strong>{{ paymentSummary.totalItems }}</strong>
        </div>
        <div class="summary-card-item">
          <CalendarDays :size="20" />
          <span>Full Payment</span>
          <strong>{{ paymentSummary.fullCount }}</strong>
        </div>
        <div class="summary-card-item">
          <Wallet :size="20" />
          <span>DP / Cicilan</span>
          <strong>{{ paymentSummary.dpCount }}</strong>
        </div>
      </div>

      <div class="controls-bar mb-6">
        <div class="controls-wrapper">
          <div class="filters-group">
            <div class="search-box">
              <Search :size="20" class="search-icon" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cari pembayaran..." 
                class="search-input"
              />
            </div>
            
            <BaseSelect 
              v-model="filterType" 
              :options="[
                { label: 'Semua Tipe', value: 'all' },
                { label: 'Full Payment', value: 'full' },
                { label: 'DP / Cicilan', value: 'dp' }
              ]"
              class="filter-select-md"
            />
          </div>
          <div class="actions-group"></div>
        </div>
      </div>

      <BaseCard class="table-card">
        <div class="table-container">
          <div class="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Pembayaran</th>
                  <th>Batas Waktu</th>
                  <th>Tipe</th>
                  <th>Nominal</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paymentStore.isLoading">
                  <td colspan="6" class="text-center py-8">
                    <div class="flex items-center justify-center gap-2 text-secondary">
                      <span class="loading-spinner"></span>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredItems.length === 0">
                  <td colspan="6" class="empty-cell">
                    <EmptyState
                      icon="file"
                      title="Tidak ada data pembayaran"
                      message="Belum ada data pembayaran yang dibuat. Klik tombol di atas untuk menambahkan."
                    />
                  </td>
                </tr>
                <tr v-for="item in filteredItems" :key="item.id" class="clickable-row" @click="router.push(`/admin/finance/payments/${item.id}`)">
                  <td class="font-medium">
                    <span class="hover:text-primary hover:underline cursor-pointer">{{ item.title }}</span>
                  </td>
                  <td>{{ formatDate(item.deadlineDate) }}</td>
                  <td>
                    <span :class="['badge', item.type === 'full' ? 'badge-success' : 'badge-warning']">
                      {{ item.type === 'full' ? 'Full Payment' : 'DP / Cicilan' }}
                    </span>
                  </td>
                  <td class="font-semibold text-primary">
                    {{ formatCurrency(item.amount) }}
                  </td>
                  <td class="text-sm text-secondary">{{ item.description || '-' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button @click.stop="openEditModal(item)" class="btn btn-secondary btn-sm">
                        <Edit :size="16" />
                      </button>
                      <button @click.stop="handleDelete(item.id, item.title)" class="btn btn-danger btn-sm">
                        <Trash2 :size="16" />
                      </button>
                      <button @click.stop="router.push(`/admin/finance/payments/${item.id}`)" class="btn btn-primary btn-sm">
                        <ArrowRight :size="16" />
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
            <h2>{{ editingItem ? 'Edit Pembayaran' : 'Tambah Pembayaran' }}</h2>
          </div>

          <form @submit.prevent="handleSubmit" class="modal-body">
            <div class="form-group">
              <label class="form-label">Nama Pembayaran *</label>
              <input v-model="formData.title" type="text" class="form-input" placeholder="Contoh: Iuran Bulanan, Kaos Event" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipe Pembayaran *</label>
                <select v-model="formData.type" class="form-select" required>
                  <option value="full">Full Payment</option>
                  <option value="dp">DP / Cicilan</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Batas Waktu *</label>
                <BaseDatePicker v-model="formData.deadlineDate" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nominal *</label>
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
              <label class="form-label">Keterangan</label>
              <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="Tambahkan detail pembayaran..."></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingItem ? 'Simpan' : 'Tambah' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.payment-page {
  max-width: 1400px;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
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
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-6);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .finance-flow-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .flow-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: var(--color-bg);
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-secondary);
    pointer-events: none;
}

/* Ensure global search-input style or define specific here if needed */
.search-input {
    padding: var(--space-2) var(--space-3) var(--space-2) 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    width: 250px;
    font-size: var(--text-base);
}
</style>
