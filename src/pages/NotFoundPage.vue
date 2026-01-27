<script setup lang="ts">
import ErrorPage from '../components/ErrorPage.vue';
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Halaman Tidak Ditemukan - PRSDN';
});
</script>

<template>
  <ErrorPage
    errorCode="404"
    title="Halaman Tidak Ditemukan"
    message="Halaman yang Anda cari tidak ditemukan. Mungkin halaman tersebut telah dipindahkan atau dihapus."
    :showHomeButton="true"
  />
</template>
