<script setup lang="ts">
import ErrorPage from '../components/ErrorPage.vue';
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Terjadi Kesalahan - PRSDN';
});
</script>

<template>
  <ErrorPage
    errorCode="500"
    title="Terjadi Kesalahan"
    message="Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti atau hubungi administrator jika masalah terus berlanjut."
    :showHomeButton="true"
  />
</template>
