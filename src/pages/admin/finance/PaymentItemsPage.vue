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
import { Plus, Edit, Trash2, Search } from 'lucide-vue-next';

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

          <div class="actions-group">
            <button @click="openAddModal" class="btn btn-primary">
              <Plus :size="18" />
              <span>Tambah Pembayaran</span>
            </button>
          </div>
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
                      <button @click="openEditModal(item)" class="btn btn-secondary btn-sm">
                        <Edit :size="16" />
                      </button>
                      <button @click="handleDelete(item.id, item.title)" class="btn btn-danger btn-sm">
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
