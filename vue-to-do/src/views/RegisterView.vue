<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const register = async () => {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await authStore.register(email.value, password.value, firstName.value, lastName.value)
    await router.push({ name: 'Main' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Create Account</h2>
      <p class="auth-subtitle">Start managing your tasks today.</p>
      <form @submit.prevent="register">
        <div class="row g-3 mb-3">
          <div class="col-6">
            <label class="form-label">First Name</label>
            <input v-model="firstName" type="text" class="form-control" placeholder="John" required />
          </div>
          <div class="col-6">
            <label class="form-label">Last Name</label>
            <input v-model="lastName" type="text" class="form-control" placeholder="Doe" required />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-control" placeholder="you@example.com" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" required minlength="6" />
        </div>
        <div class="mb-3">
          <label class="form-label">Confirm Password</label>
          <input v-model="confirmPassword" type="password" class="form-control" placeholder="••••••••" required />
        </div>
        <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Register' }}
        </button>
        <p class="text-center mt-3 mb-0" style="color: #888; font-size: 0.875rem;">
          Already have an account?
          <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
