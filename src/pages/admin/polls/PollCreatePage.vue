<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppShell from '../../../components/AppShell.vue';
import BaseCard from '../../../components/BaseCard.vue';
import { usePollsStore } from '../../../stores/polls';
import { Save, ArrowLeft, Trash2, Plus } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const pollsStore = usePollsStore();

const isEditMode = computed(() => !!route.params.id);
const pollId = route.params.id as string;

const form = ref({
  title: '',
  description: '',
  type: 'voting' as 'voting' | 'polling',
  questionType: 'single_choice' as 'single_choice' | 'multiple_choice',
  isAnonymous: false,
  requiresLogin: true,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  resultVisibility: 'after_vote' as 'always' | 'after_vote' | 'after_close',
  allowEditVote: false,
  status: 'draft' as 'draft' | 'active' | 'closed' | 'archived',
});

const options = ref([{ id: '', value: '' }, { id: '', value: '' }]);

onMounted(async () => {
  if (isEditMode.value) {
    await pollsStore.fetchPollDetail(pollId);
    const poll = pollsStore.currentPoll;
    const currentOptions = pollsStore.currentOptions;

    if (poll) {
      form.value = {
        title: poll.title,
        description: poll.description || '',
        type: poll.type,
        questionType: poll.questionType,
        isAnonymous: poll.isAnonymous,
        requiresLogin: poll.requiresLogin,
        startDate: new Date(poll.startDate).toISOString().slice(0, 16),
        endDate: new Date(poll.endDate).toISOString().slice(0, 16),
        resultVisibility: poll.resultVisibility,
        allowEditVote: poll.allowEditVote || false,
        status: poll.status,
      };
      
      if (currentOptions && currentOptions.length > 0) {
        // Map existing options to objects with ID
        options.value = currentOptions.map((o: any) => ({
          id: o.id,
          value: o.label
        }));
      }
    }
  }
});

const addOption = () => {
  options.value.push({ id: '', value: '' });
};

const removeOption = (index: number) => {
  if (options.value.length > 2) {
    options.value.splice(index, 1);
  }
};

const isSubmitting = ref(false);

const handleSubmit = async () => {
  // Simple validation
  const validOptions = options.value.filter(o => o.value.trim() !== '');
  if (validOptions.length < 2) {
    alert('Minimal 2 opsi harus diisi');
    return;
  }

  isSubmitting.value = true;
  let success = false;

  if (isEditMode.value) {
     // Update Poll
     success = await pollsStore.updatePoll(
       pollId, 
       {
         ...form.value,
         startDate: new Date(form.value.startDate).toISOString(),
         endDate: new Date(form.value.endDate).toISOString()
       }, 
       validOptions
    );
  } else {
    // Create Poll
    // Extract just labels for create (legacy/simple signature)
    const optionLabels = validOptions.map(o => o.value);
    
    success = await pollsStore.createPoll({
      ...form.value,
      startDate: new Date(form.value.startDate).toISOString(),
      endDate: new Date(form.value.endDate).toISOString(),
      status: 'active'
    }, optionLabels);
  }

  isSubmitting.value = false;

  if (success) {
    router.push('/admin/polls/list');
  }
};
</script>

<template>
  <AppShell pageTitle="Buat Voting Baru" pageSubtitle="Atur detail dan opsi pemilihan">
    <div class="create-poll-page">
      <div class="header-nav">
        <router-link to="/admin/polls/list" class="back-link">
          <ArrowLeft :size="18" /> Kembali
        </router-link>
      </div>

      <div class="form-grid">
        <!-- Main Details -->
        <div class="main-column">
          <BaseCard>
            <div class="form-group">
              <label>Judul Voting / Polling</label>
              <input v-model="form.title" type="text" placeholder="Contoh: Pemilihan Ketua Pelaksana" class="form-input" required />
            </div>

            <div class="form-group">
              <label>Deskripsi (Opsional)</label>
              <textarea v-model="form.description" rows="3" placeholder="Jelaskan tujuan voting ini..." class="form-input"></textarea>
            </div>

            <div class="options-section">
              <label class="section-label">Opsi Jawaban</label>
              <div v-for="(_opt, idx) in options" :key="idx" class="option-row">
                <input 
                  v-if="options[idx]"
                  v-model="options[idx].value" 
                  type="text" 
                  :placeholder="`Opsi ${idx + 1}`" 
                  class="form-input" 
                />
                <button v-if="options.length > 2" @click="removeOption(idx)" class="btn-icon danger" type="button">
                  <Trash2 :size="16" />
                </button>
              </div>
              <button @click="addOption" class="btn btn-secondary btn-sm mt-2" type="button">
                <Plus :size="16" /> Tambah Opsi
              </button>
            </div>
          </BaseCard>
        </div>

        <!-- Settings Sidebar -->
        <div class="settings-column">
          <BaseCard title="Pengaturan">
            <div class="form-group">
              <label>Tipe Aktivitas</label>
              <select v-model="form.type" class="form-select">
                <option value="voting">Voting</option>
                <option value="polling">Polling</option>
              </select>
            </div>

            <div class="form-group">
              <label>Jenis Pertanyaan</label>
              <select v-model="form.questionType" class="form-select">
                <option value="single_choice">Single Choice (1 Pilihan)</option>
                <option value="multiple_choice">Multiple Choice (Banyak Pilihan)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Waktu Mulai</label>
              <input v-model="form.startDate" type="datetime-local" class="form-input" />
            </div>

            <div class="form-group">
              <label>Waktu Selesai</label>
              <input v-model="form.endDate" type="datetime-local" class="form-input" />
            </div>

            <div class="form-group">
              <label>Visibilitas Hasil</label>
              <select v-model="form.resultVisibility" class="form-select">
                <option value="always">Selalu Terlihat</option>
                <option value="after_vote">Setelah Memilih</option>
                <option value="after_close">Setelah Ditutup</option>
              </select>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="form.isAnonymous" type="checkbox" />
                <span>Voting Anonim</span>
              </label>
              
              <label class="checkbox-label mt-2">
                <input v-model="form.allowEditVote" type="checkbox" />
                <span>Izinkan Ubah Pilihan</span>
              </label>
            </div>

            <div class="actions mt-6">
              <button @click="handleSubmit" :disabled="isSubmitting" class="btn btn-primary w-full">
                <span v-if="isSubmitting">Menyimpan...</span>
                <span v-else class="flex items-center justify-center gap-2">
                  <Save :size="18" /> Publikasikan
                </span>
              </button>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.create-poll-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-nav {
  display: flex;
  align-items: center;
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-weight: 500;
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-6);
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
}

.form-input, .form-select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.section-label {
  display: block;
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
}

.option-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.btn-icon.danger:hover {
  background: #fee2e2;
  color: #991b1b;
}

.checkbox-group {
  margin-top: var(--space-4);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
}
</style>
