<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import { usePaymentStore } from '../../../stores/payment';
import { useUIStore } from '../../../stores/ui';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-vue-next';

interface Poll {
    id: string;
    title: string;
    description: string;
    type: string;
}

interface PollOption {
    id: string;
    label: string;
    poll_id: string;
}

const route = useRoute();
const router = useRouter();
const paymentStore = usePaymentStore();
const uiStore = useUIStore();

const pollId = route.params.id as string;
const poll = ref<Poll | null>(null);
const pollOptions = ref<PollOption[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Form Data
const paymentTitle = ref('');
const deadlineDate = ref('');
const paymentType = ref<'full' | 'dp'>('full');
const defaultPrice = ref<number>(0);
const optionPrices = ref<Record<string, number>>({});

// UI Helpers
const displayDefaultPrice = ref('');
const displayOptionPrices = ref<Record<string, string>>({});

onMounted(async () => {
    isLoading.value = true;
    try {
        await loadPollData();
    } catch (error) {
        console.error('Error loading poll:', error);
        uiStore.showToast('Gagal memuat data polling', 'error');
    } finally {
        isLoading.value = false;
    }
});

const loadPollData = async () => {
    // 1. Fetch Poll
    const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
    
    if (pollError) throw pollError;
    // Cast explicitly to Poll to ensure type safety
    const safePollData = pollData as Poll;
    poll.value = safePollData;
    paymentTitle.value = `Pembayaran: ${safePollData.title}`;
    
    // Set deadline to 7 days from now by default
    const date = new Date();
    date.setDate(date.getDate() + 7);
    deadlineDate.value = date.toISOString().split('T')[0] || '';

    // 2. Fetch Options
    const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('label'); 
        
    if (optionsError) throw optionsError;
    pollOptions.value = (optionsData as PollOption[]) || [];
    
    // Initialize prices
    pollOptions.value.forEach(opt => {
        optionPrices.value[opt.id] = 0;
        displayOptionPrices.value[opt.id] = '';
    });
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

const handlePriceInput = (val: string, type: 'default' | 'option', optionId?: string) => {
    // Remove non-numeric characters
    const numericStr = val.replace(/[^0-9]/g, '');
    const numericVal = parseInt(numericStr) || 0;
    
    if (type === 'default') {
        defaultPrice.value = numericVal;
        // Only format if there is input, otherwise keep empty string if user cleared it (visually)
        // But for price 0, we can show '0' or empty. Let's show formatted if not empty.
        displayDefaultPrice.value = numericStr === '' ? '' : formatNumber(numericVal);
    } else if (optionId) {
        optionPrices.value[optionId] = numericVal;
        displayOptionPrices.value[optionId] = numericStr === '' ? '' : formatNumber(numericVal);
    }
};

const submitConversion = async () => {
    if (!paymentTitle.value || !deadlineDate.value) {
        uiStore.showToast('Mohon lengkapi data pembayaran', 'error');
        return;
    }

    isSubmitting.value = true;
    try {
        const paymentId = await paymentStore.createPaymentFromPoll(
            pollId,
            paymentTitle.value,
            deadlineDate.value,
            paymentType.value,
            optionPrices.value,
            defaultPrice.value
        );

        if (paymentId) {
            uiStore.showToast('Berhasil mengubah polling menjadi pembayaran', 'success');
            router.push(`/admin/finance/payment/${paymentId}`);
        } else {
            throw new Error('Gagal membuat pembayaran');
        }
    } catch (error) {
        console.error(error);
        uiStore.showToast('Terjadi kesalahan saat memproses', 'error');
    } finally {
        isSubmitting.value = false;
    }
};

</script>

<template>
    <AppShell pageTitle="Konversi Polling ke Pembayaran">
        <div class="convert-page">
            <button @click="router.back()" class="btn-back mb-6">
                <ArrowLeft :size="18" />
                <span>Kembali ke Detail Voting</span>
            </button>
            
            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>Memuat data...</p>
            </div>
            
            <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left: Payment Details -->
                <div class="lg:col-span-2 space-y-6">
                    <BaseCard title="Detail Pembayaran">
                        <form @submit.prevent class="p-6 space-y-6">
                            <div class="form-group">
                                <label class="form-label">Judul Pembayaran <span class="text-red-500">*</span></label>
                                <input v-model="paymentTitle" type="text" class="form-input" required placeholder="Contoh: Iuran Makan Siang" />
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Batas Waktu Pembayaran <span class="text-red-500">*</span></label>
                                <input v-model="deadlineDate" type="date" class="form-input" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Jenis Pembayaran <span class="text-red-500">*</span></label>
                                <div class="flex gap-4">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" v-model="paymentType" value="full" class="form-radio" />
                                        <span>Lunas (Sekali Bayar)</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" v-model="paymentType" value="dp" class="form-radio" />
                                        <span>Cicilan / DP</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-divider"></div>

                            <div class="form-group">
                                <label class="form-label">Harga Default (Non-Pemilih)</label>
                                <p class="text-sm text-secondary mb-2">Harga ini berlaku untuk anggota yang tidak vote atau opsi vote-nya tidak memiliki harga khusus.</p>
                                <div class="input-with-prefix">
                                    <span class="input-prefix">Rp</span>
                                    <input 
                                        :value="displayDefaultPrice"
                                        @input="e => handlePriceInput((e.target as HTMLInputElement).value, 'default')"
                                        type="text" 
                                        class="form-input" 
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </form>
                    </BaseCard>

                     <!-- Option Prices -->
                    <BaseCard title="Harga per Opsi Polling">
                        <div class="p-6">
                            <div class="info-alert mb-6">
                                <AlertCircle :size="20" />
                                <div class="text-sm">
                                    <span class="font-semibold block mb-1">Pengaturan Harga Variabel</span>
                                    Tentukan harga khusus untuk setiap pilihan. Anggota yang memilih opsi ini akan dikenakan biaya sesuai nominal di bawah.
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div v-for="option in pollOptions" :key="option.id" class="option-price-row">
                                    <div class="option-label">
                                        <span class="font-medium text-primary">{{ option.label }}</span>
                                    </div>
                                    <div class="option-input">
                                         <div class="input-with-prefix">
                                            <span class="input-prefix">Rp</span>
                                            <input 
                                                :value="displayOptionPrices[option.id]"
                                                @input="e => handlePriceInput((e.target as HTMLInputElement).value, 'option', option.id)"
                                                type="text" 
                                                class="form-input" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BaseCard>
                </div>

                <!-- Right: Summary / Action -->
                <div class="lg:col-span-1">
                    <BaseCard class="sticky-card">
                        <div class="p-6">
                            <h3 class="font-semibold text-lg mb-4">Ringkasan</h3>
                            <div class="summary-list space-y-3 mb-6">
                                <div class="flex justify-between text-sm">
                                    <span class="text-secondary">Total Opsi</span>
                                    <span class="font-medium">{{ pollOptions.length }}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-secondary">Harga Default</span>
                                    <span class="font-medium">Rp {{ displayDefaultPrice || '0' }}</span>
                                </div>
                            </div>

                            <button 
                                @click="submitConversion" 
                                :disabled="isSubmitting"
                                class="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                <span v-if="isSubmitting" class="spinner-sm"></span>
                                <CheckCircle v-else :size="18" />
                                <span>{{ isSubmitting ? 'Memproses...' : 'Buat Pembayaran' }}</span>
                            </button>
                            <p class="text-xs text-secondary mt-3 text-center">
                                Data pembayaran akan dibuat dan tagihan akan ditambahkan ke anggota secara otomatis.
                            </p>
                        </div>
                    </BaseCard>
                </div>
            </div>
        </div>
    </AppShell>
</template>

<style scoped>
.convert-page {
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: var(--space-8);
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
    transition: color 0.2s;
}
.btn-back:hover {
    color: var(--color-primary);
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12);
    color: var(--color-text-secondary);
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-bg-secondary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--space-3);
}

.spinner-sm {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.form-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-primary);
}

.form-input {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    transition: border-color 0.2s;
}
.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-with-prefix {
    position: relative;
    display: flex;
    align-items: center;
}

.input-prefix {
    position: absolute;
    left: 12px;
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
    font-weight: 500;
    pointer-events: none;
}

.input-with-prefix .form-input {
    width: 100%;
    padding-left: 40px; /* Space for prefix */
}

.form-divider {
    height: 1px;
    background-color: var(--color-border-light);
    margin: var(--space-2) 0;
}

/* Option Price Rows */
.option-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3);
    background-color: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
}
.option-price-row:hover {
    border-color: var(--color-border);
}

.option-label {
    flex: 1;
    font-size: var(--text-sm);
}

.option-input {
    width: 180px;
    flex-shrink: 0;
}

.info-alert {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: var(--radius-md);
    color: #1e40af;
}

.sticky-card {
    position: sticky;
    top: 20px;
}

.summary-list {
    background-color: var(--color-bg-secondary);
    padding: var(--space-4);
    border-radius: var(--radius-md);
}
</style>
