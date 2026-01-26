<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useMembersStore } from './stores/members';
import { useFinanceStore } from './stores/finance';
import { useKasStore } from './stores/kas';
import { useApplicationsStore } from './stores/applications';
import { useEventsStore } from './stores/events';
import { useAttendanceEventStore } from './stores/attendanceEvent';
import { useCheckinStore } from './stores/checkin';
import ToastNotification from './components/ToastNotification.vue';

const authStore = useAuthStore();
const membersStore = useMembersStore();
const financeStore = useFinanceStore();
const kasStore = useKasStore();
const applicationsStore = useApplicationsStore();
const eventsStore = useEventsStore();
const eventStore = useAttendanceEventStore();
const checkinStore = useCheckinStore();

onMounted(() => {
  // Initialize session from localStorage
  authStore.initSession();
  
  // Load all data
  membersStore.loadMembers();
  financeStore.loadTransactions();
  kasStore.loadPayments();
  applicationsStore.loadApplications();
  eventsStore.loadEvents();
  eventStore.loadEvents();
  checkinStore.loadCheckins();
});
</script>

<template>
  <div id="app">
    <RouterView />
    <ToastNotification ref="toast" />
  </div>
</template>

<style>
/* Global styles are in assets/styles.css */
</style>
