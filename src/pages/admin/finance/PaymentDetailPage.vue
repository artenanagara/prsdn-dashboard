<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import { usePaymentStore } from '../../../stores/payment';
import { useMembersStore } from '../../../stores/members';
import { useUIStore } from '../../../stores/ui';
import { ArrowLeft, CheckCircle, Search, DollarSign } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const paymentStore = usePaymentStore();
const membersStore = useMembersStore();
const uiStore = useUIStore();

const paymentItemId = route.params.id as string;
const searchQuery = ref('');

onMounted(async () => {
    // Ensure data is loaded
    if (paymentStore.paymentItems.length === 0) {
        await paymentStore.loadPaymentItems();
    }
    
    // Load members if not already loaded
    if (membersStore.members.length === 0) {
        await membersStore.loadMembers();
    }
    
    // Load records for this payment
    await paymentStore.loadPaymentRecords(paymentItemId);
    
    if (currentItem.value) {
        document.title = `Detail: ${currentItem.value.title} - PRSDN Admin`;
    }
});

const currentItem = computed(() => paymentStore.getPaymentItemById(paymentItemId));

const combinedData = computed(() => {
    if (!currentItem.value) return [];
    
    // Filter members: If it's a poll-generated payment, only show those with records (voters)
    let membersToMap = membersStore.members;
    const isPollPayment = currentItem.value.description?.includes('Poll') || false;

    if (isPollPayment) {
        membersToMap = membersToMap.filter(m => 
            paymentStore.currentPaymentRecords.some(r => r.memberId === m.id)
        );
    }

    return membersToMap.map(member => {
        const record = paymentStore.currentPaymentRecords.find(r => r.memberId === member.id);
        const targetAmount = record?.billAmount ?? currentItem.value?.amount ?? 0;
        
        return {
            member,
            record,
            amountPaid: record?.amountPaid || 0,
            status: record?.status || 'unpaid',
            remaining: targetAmount - (record?.amountPaid || 0),
            billAmount: targetAmount
        };
    });
});

const filterRT = ref('');
const filterStatus = ref('');
const sortBy = ref('name_asc');

const filteredData = computed(() => {
    let result = combinedData.value;

    // Filter by Search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.member.fullName.toLowerCase().includes(query) ||
            item.member.rt.includes(query)
        );
    }

    // Filter by RT
    if (filterRT.value) {
        result = result.filter(item => item.member.rt === filterRT.value);
    }

    // Filter by Status
    if (filterStatus.value) {
        result = result.filter(item => item.status === filterStatus.value);
    }

    // Sort
    result.sort((a, b) => {
        switch (sortBy.value) {
            case 'name_asc':
                return a.member.fullName.localeCompare(b.member.fullName);
            case 'name_desc':
                return b.member.fullName.localeCompare(a.member.fullName);
            case 'status_paid': 
                // Paid (2) > Partial (1) > Unpaid (0)
                // If we want "Paid First", we want Descending order of these values
                const orderPaid = { 'paid': 2, 'partial': 1, 'unpaid': 0 };
                return orderPaid[b.status] - orderPaid[a.status];
            case 'status_unpaid':
                // Unpaid (0) > Partial (1) > Paid (2) -- logic here: Unpaid first means Unpaid is "top"
                // So assign Unpaid highest value if sorting DESC, or just use normal ASC: 0, 1, 2
                const orderUnpaid = { 'unpaid': 0, 'partial': 1, 'paid': 2 };
                return orderUnpaid[a.status] - orderUnpaid[b.status];
             case 'amount_desc':
                return b.remaining - a.remaining;
            case 'amount_asc':
                return a.remaining - b.remaining;
            default:
                return 0;
        }
    });

    return result;
});

// Stats
const totalCollected = computed(() => {
    return paymentStore.currentPaymentRecords.reduce((sum, r) => sum + r.amountPaid, 0);
});

// Payment Action
const showPayModal = ref(false);
const selectedMember = ref<any>(null);
const payAmount = ref<number>(0);
const displayPayAmount = ref('');

const openPayModal = (memberItem: any) => {
    selectedMember.value = memberItem;
    
    if (currentItem.value?.type === 'full') {
        payAmount.value = memberItem.remaining;
    } else {
         payAmount.value = 0;
    }
    
    displayPayAmount.value = formatDisplayAmount(payAmount.value);
    showPayModal.value = true;
};

const formatDisplayAmount = (val: number | string) => {
  if (!val && val !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(Number(val));
};

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const rawValue = input.value.replace(/[^0-9]/g, '');
  const numericValue = parseInt(rawValue) || 0;
  
  // Cap at remaining amount
  const max = selectedMember.value?.remaining || 0;
  
  if (numericValue > max) {
      payAmount.value = max;
  } else {
      payAmount.value = numericValue;
  }
  
  displayPayAmount.value = formatDisplayAmount(payAmount.value);
};

const handlePaymentSubmit = async () => {
    if (!selectedMember.value || !currentItem.value) return;
    
    if (payAmount.value <= 0) {
        uiStore.showToast('Jumlah pembayaran harus lebih dari 0', 'error');
        return;
    }
    
    const success = await paymentStore.recordPayment(
        paymentItemId,
        selectedMember.value.member.id,
        payAmount.value,
        selectedMember.value.billAmount // Use the specific bill amount
    );
    
    if (success) {
        uiStore.showToast(`Pembayaran untuk ${selectedMember.value.member.fullName} berhasil dicatat`, 'success');
        showPayModal.value = false;
    } else {
        uiStore.showToast('Gagal mencatat pembayaran', 'error');
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
    <AppShell pageTitle="Pembayaran" :pageSubtitle="currentItem?.title">
        <div class="payment-detail-page" v-if="currentItem">
            
            <!-- Back Button (Outside Card) -->
            <button @click="router.back()" class="btn-back mb-4">
                <ArrowLeft :size="18" />
                <span>Kembali</span>
            </button>

            <!-- Header Info Card -->
            <BaseCard class="mb-6 header-card">
                <div class="header-content">
                    <div class="header-left">
                        <h2 class="text-2xl font-bold mb-2">{{ currentItem.title }}</h2>
                        <div class="flex flex-wrap gap-4 text-sm text-secondary mb-3">
                            <div class="flex items-center gap-1">
                                <span>Batas Waktu:</span>
                                <span class="font-medium text-primary">{{ formatDate(currentItem.deadlineDate) }}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <span :class="['badge', currentItem.type === 'full' ? 'badge-success' : 'badge-warning']">
                                {{ currentItem.type === 'full' ? 'Full Payment' : 'DP / Cicilan' }}
                            </span>
                            <span class="badge badge-primary bg-primary-light text-primary border-0">
                                Jumlah Bayar: {{ formatCurrency(currentItem.amount) }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="header-right text-right">
                        <div class="text-sm text-secondary mb-1">Total Terkumpul</div>
                        <div class="text-3xl font-bold text-primary">{{ formatCurrency(totalCollected) }}</div>
                    </div>
                </div>
            </BaseCard>

            <!-- Members List -->
            <BaseCard class="table-card">
                 <div class="card-header">
                    <div class="filters-left">
                        <!-- Filters -->
                         <div class="filter-group">
                            <BaseSelect 
                                v-model="filterRT"
                                :options="[
                                    { label: 'Semua RT', value: '' },
                                    { label: 'RT 01', value: '01' },
                                    { label: 'RT 02', value: '02' },
                                    { label: 'RT 03', value: '03' },
                                    { label: 'RT 04', value: '04' }
                                ]"
                                placeholder="Filter RT"
                                class="w-32"
                            />
                         </div>
                        
                        <div class="filter-group">
                            <BaseSelect 
                                v-model="filterStatus"
                                :options="[
                                    { label: 'Semua Status', value: '' },
                                    { label: 'Lunas', value: 'paid' },
                                    { label: 'Sebagian', value: 'partial' },
                                    { label: 'Belum Bayar', value: 'unpaid' }
                                ]"
                                placeholder="Filter Status"
                                class="w-40"
                            />
                        </div>

                         <div class="filter-group">
                            <BaseSelect 
                                v-model="sortBy"
                                :options="[
                                    { label: 'Nama (A-Z)', value: 'name_asc' },
                                    { label: 'Nama (Z-A)', value: 'name_desc' },
                                    { label: 'Status (Lunas Dulu)', value: 'status_paid' },
                                    { label: 'Status (Belum Bayar Dulu)', value: 'status_unpaid' },
                                    { label: 'Tagihan Tertinggi', value: 'amount_desc' },
                                    { label: 'Tagihan Terendah', value: 'amount_asc' }
                                ]"
                                placeholder="Urutkan"
                                class="w-48"
                            />
                        </div>
                    </div>

                    <div class="search-box">
                        <Search :size="16" class="search-icon" />
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="Cari anggota..." 
                            class="search-input-sm"
                        />
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-scroll-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nama Anggota</th>
                                    <th>RT</th>
                                    <th>Status</th>
                                    <th>Sudah Bayar</th>
                                    <th>Sisa Tagihan</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in filteredData" :key="item.member.id">
                                    <td>
                                        <div class="font-medium">{{ item.member.fullName }}</div>
                                    </td>
                                    <td>{{ item.member.rt }}</td>
                                    <td>
                                        <span :class="['badge', 
                                            item.status === 'paid' ? 'badge-success' : 
                                            item.status === 'partial' ? 'badge-warning' : 'badge-secondary'
                                        ]">
                                            {{ item.status === 'paid' ? 'Lunas' : item.status === 'partial' ? 'Sebagian' : 'Belum Bayar' }}
                                        </span>
                                    </td>
                                    <td class="text-success font-medium">
                                        {{ formatCurrency(item.amountPaid) }}
                                    </td>
                                    <td class="text-danger">
                                        {{ item.remaining > 0 ? formatCurrency(item.remaining) : '-' }}
                                    </td>
                                    <td>
                                        <button 
                                            v-if="item.status !== 'paid'"
                                            @click="openPayModal(item)" 
                                            class="btn btn-primary btn-sm"
                                        >
                                            <DollarSign :size="14" class="mr-1" />
                                            Bayar
                                        </button>
                                        <span v-else class="text-success flex items-center text-sm">
                                            <CheckCircle :size="16" class="mr-1" />
                                            Selesai
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="filteredData.length === 0">
                                    <td colspan="6" class="text-center py-8 text-secondary">
                                        Tidak ada data anggota
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </BaseCard>

            <!-- Payment Modal -->
            <div v-if="showPayModal" class="modal-overlay" @click.self="showPayModal = false">
                <div class="modal-content card">
                    <div class="modal-header">
                        <h2>Catat Pembayaran</h2>
                        <p class="text-secondary text-sm">{{ selectedMember?.member.fullName }}</p>
                    </div>

                    <form @submit.prevent="handlePaymentSubmit" class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Nominal Pembayaran</label>
                            <div class="input-with-prefix">
                                <span class="input-prefix">Rp</span>
                                <input 
                                    :value="displayPayAmount" 
                                    @input="handleAmountInput"
                                    type="text" 
                                    class="form-input text-lg" 
                                    placeholder="0"
                                    required 
                                    :disabled="currentItem.type === 'full'"
                                />
                            </div>
                            <p v-if="currentItem.type === 'full'" class="text-xs text-secondary mt-1">
                                *Pembayaran tipe Full Payment harus melunasi sisa tagihan.
                            </p>
                             <p v-else class="text-xs text-secondary mt-1">
                                *Sisa tagihan: {{ formatCurrency(selectedMember?.remaining || 0) }}
                            </p>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="showPayModal = false" class="btn btn-secondary">
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Simpan Pembayaran
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
        <div v-else class="p-6">
            <div class="text-center">Memuat data...</div>
        </div>
    </AppShell>
</template>

<style scoped>
.payment-detail-page {
    max-width: 1400px;
}

.btn-back {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2) 0;
    transition: color 0.2s;
}

.btn-back:hover {
    color: var(--color-primary);
}

.header-card {
    padding: var(--space-4);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.header-left {
    flex: 1;
}

.card-header {
    padding: var(--space-4);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    /* Border removed */
}

.filters-left {
    display: flex;
    gap: var(--space-3);
    align-items: center;
}

.form-select-sm {
    padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    background-color: var(--color-surface);
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    appearance: none;
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

.search-input-sm {
    padding: var(--space-2) var(--space-3) var(--space-2) 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    width: 250px;
    transition: border-color 0.2s;
}

.search-input-sm:focus {
    outline: none;
    border-color: var(--color-primary);
}

.table-card {
  overflow: hidden;
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
  max-width: 450px;
  width: 100%;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-body {
  padding: var(--space-6);
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: flex-end;
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-6);
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
    }
    
    .header-right {
        text-align: left;
        width: 100%;
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border-light);
    }

    .card-header {
        flex-direction: column;
        align-items: stretch;
    }

    .filters-left {
        flex-wrap: wrap;
    }

    .search-input-sm {
        width: 100%;
    }
}
</style>
