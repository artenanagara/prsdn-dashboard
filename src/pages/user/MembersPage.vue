<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import BaseCard from '../../components/BaseCard.vue';
import BaseSelect from '../../components/BaseSelect.vue';
import EmptyState from '../../components/EmptyState.vue';
import { useMembersStore } from '../../stores/members';
import type { Member } from '../../types';
import { Eye, GraduationCap, Instagram, Search, Users } from 'lucide-vue-next';

const membersStore = useMembersStore();

const searchQuery = ref('');
const selectedRT = ref('all');
const showDetailModal = ref(false);
const selectedMember = ref<Member | null>(null);

const rtOptions = [
  { label: 'Semua RT', value: 'all' },
  { label: 'RT 01', value: '01' },
  { label: 'RT 02', value: '02' },
  { label: 'RT 03', value: '03' },
  { label: 'RT 04', value: '04' }
];

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  let result = [...membersStore.members];

  if (query) {
    result = result.filter(member => {
      const searchableValues = [
        member.fullName,
        member.job,
        member.instagram,
        member.educationLevel,
        member.grade,
        member.university
      ];

      return searchableValues.some(value => value?.toLowerCase().includes(query));
    });
  }

  if (selectedRT.value !== 'all') {
    result = result.filter(member => member.rt === selectedRT.value);
  }

  return result.sort((a, b) => {
    if (a.rt !== b.rt) return a.rt.localeCompare(b.rt);
    return a.fullName.localeCompare(b.fullName);
  });
});

const memberSummary = computed(() => {
  const total = membersStore.members.length;
  const schoolCount = membersStore.members.filter(member => member.educationStatus === 'school').length;
  const joinedWaCount = membersStore.members.filter(member => member.joinedWhatsApp).length;

  return { total, schoolCount, joinedWaCount };
});

const rtSummary = computed(() => {
  return ['01', '02', '03', '04'].map(rt => ({
    rt,
    total: membersStore.members.filter(member => member.rt === rt).length
  }));
});

const openDetail = (member: Member) => {
  selectedMember.value = member;
  showDetailModal.value = true;
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const educationLabel = (member: Member) => {
  if (member.educationStatus !== 'school') return 'Tidak sekolah';
  if (member.educationLevel === 'College') return 'Perguruan Tinggi';
  return member.educationLevel || 'Masih sekolah';
};

onMounted(async () => {
  document.title = 'Anggota - PRSDN Dashboard';
  await membersStore.loadMembers(false);
  membersStore.subscribeToChanges();
});
</script>

<template>
  <AppShell pageTitle="Anggota" pageSubtitle="Lihat data anggota PRSDN">
    <div class="user-members-page">
      <section class="members-hero">
        <div>
          <p class="section-kicker">Direktori anggota</p>
          <h2>Data anggota PRSDN</h2>
          <p>Lihat daftar anggota dan detail profil secara read-only.</p>
        </div>
        <div class="hero-stat">
          <strong>{{ memberSummary.total }}</strong>
          <span>Total anggota</span>
        </div>
      </section>

      <div class="summary-grid">
        <BaseCard class="summary-card" no-padding>
          <div class="summary-content">
            <Users :size="22" />
            <span>Anggota</span>
            <strong>{{ memberSummary.total }}</strong>
          </div>
        </BaseCard>
        <BaseCard class="summary-card" no-padding>
          <div class="summary-content">
            <GraduationCap :size="22" />
            <span>Masih Sekolah</span>
            <strong>{{ memberSummary.schoolCount }}</strong>
          </div>
        </BaseCard>
        <BaseCard class="summary-card" no-padding>
          <div class="summary-content">
            <Users :size="22" />
            <span>Gabung WA</span>
            <strong>{{ memberSummary.joinedWaCount }}</strong>
          </div>
        </BaseCard>
      </div>

      <BaseCard class="rt-card" no-padding>
        <div class="rt-overview">
          <div v-for="item in rtSummary" :key="item.rt" class="rt-item">
            <span>RT {{ item.rt }}</span>
            <strong>{{ item.total }}</strong>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="members-list-card" no-padding>
        <div class="list-toolbar">
          <div class="search-field">
            <Search :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="Cari nama, pekerjaan, atau pendidikan..."
            />
          </div>
          <BaseSelect
            v-model="selectedRT"
            :options="rtOptions"
            class="rt-filter"
          />
        </div>

        <div class="table-container">
          <div class="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>RT</th>
                  <th>Pekerjaan</th>
                  <th>Pendidikan</th>
                  <th>Instagram</th>
                  <th class="text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="membersStore.isLoading">
                  <td colspan="6" class="text-center py-8 text-secondary">Memuat data anggota...</td>
                </tr>
                <tr v-else-if="filteredMembers.length === 0">
                  <td colspan="6" class="empty-cell">
                    <EmptyState
                      icon="users"
                      title="Tidak ada data"
                      message="Tidak ada anggota yang sesuai dengan pencarian atau filter."
                    />
                  </td>
                </tr>
                <tr v-for="member in filteredMembers" :key="member.id">
                  <td>
                    <div class="member-name">
                      <span>{{ member.fullName }}</span>
                      <small>Bergabung {{ formatDate(member.createdAt) }}</small>
                    </div>
                  </td>
                  <td><span class="badge badge-secondary">RT {{ member.rt }}</span></td>
                  <td>{{ member.job || '-' }}</td>
                  <td>{{ educationLabel(member) }}</td>
                  <td>
                    <span v-if="member.instagram" class="instagram-value">
                      <Instagram :size="14" />
                      {{ member.instagram }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-secondary btn-sm" @click="openDetail(member)">
                      <Eye :size="16" />
                      <span>Lihat</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </BaseCard>

      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <BaseCard class="detail-modal" no-padding>
          <template #header>
            <div>
              <h2>Detail Anggota</h2>
              <p v-if="selectedMember" class="modal-subtitle">{{ selectedMember.fullName }}</p>
            </div>
          </template>

          <div v-if="selectedMember" class="detail-content">
            <div class="profile-strip">
              <div class="profile-avatar">{{ selectedMember.fullName.slice(0, 1).toUpperCase() }}</div>
              <div>
                <h3>{{ selectedMember.fullName }}</h3>
                <p>RT {{ selectedMember.rt }} · {{ selectedMember.job || 'Pekerjaan belum diisi' }}</p>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span>Tempat, tanggal lahir</span>
                <strong>{{ selectedMember.birthPlace || '-' }}, {{ formatDate(selectedMember.birthDate) }}</strong>
              </div>
              <div class="detail-item">
                <span>RT</span>
                <strong>RT {{ selectedMember.rt }}</strong>
              </div>
              <div class="detail-item">
                <span>Pekerjaan</span>
                <strong>{{ selectedMember.job || '-' }}</strong>
              </div>
              <div class="detail-item">
                <span>Instagram</span>
                <strong>{{ selectedMember.instagram || '-' }}</strong>
              </div>
              <div class="detail-item">
                <span>Status pendidikan</span>
                <strong>{{ selectedMember.educationStatus === 'school' ? 'Masih Sekolah' : 'Tidak Sekolah' }}</strong>
              </div>
              <div class="detail-item">
                <span>Jenjang</span>
                <strong>{{ educationLabel(selectedMember) }}</strong>
              </div>
              <div v-if="selectedMember.grade" class="detail-item">
                <span>Kelas</span>
                <strong>{{ selectedMember.grade }}</strong>
              </div>
              <div v-if="selectedMember.university" class="detail-item">
                <span>Universitas</span>
                <strong>{{ selectedMember.university }}</strong>
              </div>
              <div class="detail-item">
                <span>Grup WhatsApp</span>
                <strong>{{ selectedMember.joinedWhatsApp ? 'Sudah bergabung' : 'Belum bergabung' }}</strong>
              </div>
              <div class="detail-item">
                <span>Bergabung</span>
                <strong>{{ formatDate(selectedMember.createdAt) }}</strong>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="modal-actions">
              <button type="button" class="btn btn-primary" @click="showDetailModal = false">Tutup</button>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.user-members-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1400px;
}

.members-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-6);
  border: 1px solid rgba(15, 111, 143, 0.18);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.11), rgba(255, 255, 255, 0.98));
  box-shadow: var(--shadow-sm);
}

.section-kicker {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.members-hero h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1.5rem;
}

.members-hero p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.hero-stat {
  min-width: 132px;
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  color: #ffffff;
  background: var(--gradient-primary);
  text-align: center;
}

.hero-stat strong {
  display: block;
  font-size: 1.6rem;
  line-height: 1;
}

.hero-stat span {
  display: block;
  margin-top: var(--space-1);
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--text-xs);
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.summary-content {
  min-height: 116px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-4);
}

.summary-content svg {
  color: var(--color-primary);
}

.summary-content span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.summary-content strong {
  color: var(--color-ink);
  font-size: 1.45rem;
}

.rt-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-4);
}

.rt-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: #fbfdfe;
}

.rt-item span {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 700;
}

.rt-item strong {
  color: var(--color-ink);
}

.members-list-card {
  overflow: hidden;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.search-field {
  position: relative;
  flex: 1;
  max-width: 520px;
}

.search-field svg {
  position: absolute;
  top: 50%;
  left: var(--space-3);
  color: var(--color-text-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-field .form-input {
  padding-left: 2.6rem;
}

.rt-filter {
  width: 180px;
}

.member-name {
  display: grid;
  gap: 0.15rem;
}

.member-name span {
  color: var(--color-ink);
  font-weight: 700;
  text-transform: capitalize;
}

.member-name small {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.instagram-value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(8, 17, 31, 0.52);
  backdrop-filter: blur(8px);
}

.detail-modal {
  width: min(680px, 100%);
  max-height: 90vh;
}

.modal-subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  overflow-y: auto;
}

.profile-strip {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid rgba(15, 111, 143, 0.16);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(15, 111, 143, 0.08), #ffffff);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-xl);
  color: #ffffff;
  background: var(--gradient-primary);
  font-size: 1.35rem;
  font-weight: 800;
}

.profile-strip h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1.1rem;
}

.profile-strip p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.detail-item {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: #fbfdfe;
}

.detail-item span {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
}

.detail-item strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 768px) {
  .members-hero,
  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid,
  .rt-overview,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .rt-filter,
  .search-field {
    width: 100%;
    max-width: none;
  }
}
</style>
