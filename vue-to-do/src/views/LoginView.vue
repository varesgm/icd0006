<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect ?? { name: 'Main' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Welcome back</h2>
      <p class="auth-subtitle">Sign in to your account to continue.</p>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-control" placeholder="you@example.com" required autofocus />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" required />
        </div>
        <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
        <p class="text-center mt-3 mb-0" style="color: #888; font-size: 0.875rem;">
          Don't have an account?
          <RouterLink to="/register" class="auth-link">Register</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
