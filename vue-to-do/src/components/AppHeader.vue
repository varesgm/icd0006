<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  authStore.logout()
  await router.push({ name: 'Login' })
}
</script>

<template>
  <nav class="navbar navbar-expand-md fixed-top app-navbar">
    <div class="container-fluid px-4">
      <RouterLink class="navbar-brand" to="/">To-Do</RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarMain"
        aria-controls="navbarMain"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarMain">
        <ul class="navbar-nav me-auto mb-2 mb-md-0" v-if="authStore.isLoggedIn">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Tasks</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/about">About</RouterLink>
          </li>
        </ul>
        <div v-if="authStore.isLoggedIn" class="d-flex align-items-center gap-3 ms-auto">
          <span class="navbar-user">{{ authStore.firstName }} {{ authStore.lastName }}</span>
          <button class="btn btn-outline-primary btn-sm" @click="logout">Logout</button>
        </div>
        <div v-else class="d-flex gap-2 ms-auto">
          <RouterLink class="btn btn-outline-primary btn-sm" to="/login">Login</RouterLink>
          <RouterLink class="btn btn-primary btn-sm" to="/register">Register</RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>
