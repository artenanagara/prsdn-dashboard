<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useMembersStore } from '../stores/members';
import { computed } from 'vue';
import { ChevronDown, Settings, LogOut } from 'lucide-vue-next';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const router = useRouter();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);

const currentUserFullName = computed(() => {
  if (authStore.currentUser?.memberId) {
    const member = membersStore.getMemberById(authStore.currentUser.memberId);
    return member?.fullName || authStore.currentUser.username;
  }
  return authStore.currentUser?.username || 'User';
});

const settingsPath = computed(() => {
  return authStore.isAdmin ? '/admin/settings' : '/user/settings';
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
  closeDropdown();
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="user-dropdown" ref="dropdownRef">
    <button @click="toggleDropdown" class="dropdown-trigger">
      <div class="user-info">
        <span class="user-fullname">{{ currentUserFullName }}</span>
        <span class="user-username">@{{ authStore.currentUser?.username }}</span>
      </div>
      <img src="/default-avatar.png" alt="Profile" class="user-avatar" />
      <ChevronDown :size="16" :class="['chevron-icon', { 'chevron-open': isOpen }]" />
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <RouterLink :to="settingsPath" class="dropdown-item" @click="closeDropdown">
          <Settings :size="18" />
          <span>Pengaturan</span>
        </RouterLink>
        <button @click="handleLogout" class="dropdown-item dropdown-item-danger">
          <LogOut :size="18" />
          <span>Keluar</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base);
}

.dropdown-trigger:hover {
  background-color: var(--color-bg);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.user-fullname {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.user-username {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.chevron-icon {
  color: var(--color-text-secondary);
  transition: transform var(--transition-base);
}

.chevron-open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 200px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: var(--space-2);
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-base);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--color-bg);
}

.dropdown-item-danger {
  color: var(--color-danger);
}

.dropdown-item-danger:hover {
  background-color: var(--color-danger-light);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .user-info {
    display: none;
  }
}
</style>
