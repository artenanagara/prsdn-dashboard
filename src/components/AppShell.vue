<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X,
  ClipboardCheck
} from 'lucide-vue-next';
import { ref } from 'vue';

const authStore = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(true);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

import { ChevronDown, ChevronRight } from 'lucide-vue-next';

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    label: 'Anggota', 
    icon: Users,
    children: [
      { path: '/admin/members/list', label: 'Daftar Anggota' },
      { path: '/admin/members/applications', label: 'Permohonan Akun' }
    ]
  },
  { 
    label: 'Keuangan', 
    icon: DollarSign,
    children: [
      { path: '/admin/finance/ledger', label: 'Transaksi' },
      { path: '/admin/finance/kas', label: 'Kas Online' }
    ]
  },
  { path: '/admin/attendance-events', label: 'Absensi', icon: ClipboardCheck }
];

const userNavItems = [
  { path: '/user/home', label: 'Beranda', icon: LayoutDashboard },
  { path: '/user/kas', label: 'Kas Saya', icon: DollarSign },
  { path: '/user/attendance-checkin', label: 'Absensi', icon: ClipboardCheck }
];

// Expanded state for menus
const expandedMenus = ref<Record<string, boolean>>({
  'Anggota': true,
  'Keuangan': true
});

const toggleMenu = (label: string) => {
  if (expandedMenus.value[label]) {
    expandedMenus.value[label] = false;
  } else {
    expandedMenus.value[label] = true;
  }
};

const navItems = authStore.isAdmin ? adminNavItems : userNavItems;
</script>

<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-collapsed': !isSidebarOpen }]">
      <div class="sidebar-header">
        <div class="sidebar-logo-title">
          <img src="/logo.jpg" alt="PRSDN Logo" class="sidebar-logo" />
          <h2 class="sidebar-title">PRSDN</h2>
        </div>
        <button @click="toggleSidebar" class="btn-icon-only" title="Close Sidebar">
           <X :size="20" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <template v-for="item in navItems" :key="item.label">
          <!-- Item with Children (Group) -->
          <div v-if="'children' in item" class="nav-group">
            <button 
              @click="toggleMenu(item.label)" 
              class="nav-item nav-group-toggle"
              :class="{ 'active': expandedMenus[item.label] }"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" :size="20" />
                <span>{{ item.label }}</span>
              </div>
              <ChevronDown v-if="expandedMenus[item.label]" :size="16" />
              <ChevronRight v-else :size="16" />
            </button>
            
            <div v-if="expandedMenus[item.label]" class="nav-group-children">
              <RouterLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="nav-item nav-child"
                active-class="nav-item-active"
              >
                <span>{{ child.label }}</span>
              </RouterLink>
            </div>
          </div>

          <!-- Item without Children -->
          <RouterLink
            v-else
            :to="item.path"
            class="nav-item"
            active-class="nav-item-active"
          >
            <div class="flex items-center gap-3">
              <component :is="item.icon" :size="20" />
              <span>{{ item.label }}</span>
            </div>
          </RouterLink>
        </template>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="nav-item nav-item-logout">
          <div class="flex items-center gap-3">
            <LogOut :size="20" />
            <span>Keluar</span>
          </div>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Topbar -->
      <header class="topbar">
        <button @click="toggleSidebar" class="btn btn-secondary btn-sm" v-if="!isSidebarOpen">
          <Menu :size="20" />
        </button>
        <!-- Spacer if button is hidden to keep layout or just flex start -->
        <div v-else class="w-8"></div> 

        <div class="topbar-user">
          <span class="topbar-username">{{ authStore.currentUser?.username }}</span>
          <span class="badge" :class="authStore.isAdmin ? 'badge-info' : 'badge-success'">
            {{ authStore.isAdmin ? 'Admin' : 'User' }}
          </span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg);
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-logo-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sidebar-logo {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 50%;
}

.btn-icon-only {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-base);
}

.btn-icon-only:hover {
  color: var(--color-primary);
}

.sidebar-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Added for submenu arrows */
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.nav-item > div {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-item:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.nav-item-active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.nav-child {
  padding-left: 52px; /* 16px (padding) + 20px (icon) + 12px (gap) + 4px extra indent */
  font-size: 0.9em;
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.nav-item-logout {
  color: var(--color-danger);
  justify-content: flex-start;
}

.nav-item-logout:hover {
  background-color: var(--color-danger-light);
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-base);
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed + .main-content {
  margin-left: 0;
}

.topbar {
  height: var(--topbar-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 90;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.topbar-username {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.page-content {
  flex: 1;
  padding: var(--space-8);
}

@media (max-width: 768px) {
  .sidebar {
    width: var(--sidebar-width);
    transform: translateX(-100%);
  }

  .sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .page-content {
    padding: var(--space-4);
  }
}
</style>
