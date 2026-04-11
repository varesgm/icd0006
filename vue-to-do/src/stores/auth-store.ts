import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { JWTResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('jwt_token') ?? '')
  const refreshToken = ref<string>(localStorage.getItem('jwt_refresh') ?? '')
  const firstName = ref<string>(localStorage.getItem('firstName') ?? '')
  const lastName = ref<string>(localStorage.getItem('lastName') ?? '')

  const isLoggedIn = computed(() => token.value !== '')

  const setSession = (data: JWTResponse) => {
    token.value = data.token
    refreshToken.value = data.refreshToken
    firstName.value = data.firstName
    lastName.value = data.lastName
    localStorage.setItem('jwt_token', data.token)
    localStorage.setItem('jwt_refresh', data.refreshToken)
    localStorage.setItem('firstName', data.firstName)
    localStorage.setItem('lastName', data.lastName)
  }

  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/v1/Account/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid email or password')
    setSession((await res.json()) as JWTResponse)
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/v1/Account/Register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(body || 'Registration failed')
    }
    setSession((await res.json()) as JWTResponse)
  }

  const refresh = async (): Promise<boolean> => {
    if (!refreshToken.value || !token.value) return false
    try {
      const res = await fetch(`${BASE_URL}/api/v1/Account/RefreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.value, refreshToken: refreshToken.value }),
      })
      if (!res.ok) return false
      setSession((await res.json()) as JWTResponse)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    token.value = ''
    refreshToken.value = ''
    firstName.value = ''
    lastName.value = ''
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_refresh')
    localStorage.removeItem('firstName')
    localStorage.removeItem('lastName')
  }

  const getToken = () => token.value

  return { isLoggedIn, firstName, lastName, login, register, logout, refresh, getToken }
})
