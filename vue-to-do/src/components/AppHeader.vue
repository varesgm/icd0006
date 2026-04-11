<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { useApiKeyStore } from '../stores/apikey-store.ts';

const router = useRouter();
const apiKeyStore = useApiKeyStore()
const { isLoggedIn, clearApiKey } = apiKeyStore

function logOut() {
  apiKeyStore.clearApiKey();
  router.push({name: 'Login'});
}
</script>

<template>

    <nav v-if="isLoggedIn()">
        <RouterLink to="/">Main</RouterLink>
        <RouterLink to="/about">About</RouterLink>
     </nav>

     <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
        <div class="container-fluid">
            <RouterLink class="navbar-brand" to="/">To-Do VUE</RouterLink>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse">
                <ul class="navbar-nav me-auto mb-2 mb-md-0">
                    <li v-if="isLoggedIn()" class="nav-item">
                        <RouterLink class="nav-link" to="/home">Home</RouterLink>
                    </li>
                    <li v-if="isLoggedIn()" class="nav-item">
                        <RouterLink class="nav-link" to="/about">About</RouterLink>
                    </li>
                </ul>
                <button v-if="isLoggedIn()" class="btn btn-outline-danger" type="button" @click="logOut">Logout</button>
            </div>
        </div>
    </nav>


</template>

  <style scoped></style>