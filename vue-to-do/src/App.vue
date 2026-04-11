<script setup lang="ts">
  import { RouterView } from 'vue-router';
  import AppHeader from './components/AppHeader.vue';
</script>

<template>

  <AppHeader />
  
  <div class="container" style="padding-top: 80px;">
    <main role="main" class="pb-3">
      <RouterView />
    </main>
  </div>

</template>

<style scoped></style>
