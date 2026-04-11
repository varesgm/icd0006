import { useAuthStore } from '@/stores/auth-store'
import router from '@/router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Prevents multiple concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()

  const makeRequest = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.getToken()}`,
        ...(options.headers as Record<string, string>),
      },
    })

  let res = await makeRequest()

  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = authStore.refresh().finally(() => {
        refreshPromise = null
      })
    }
    const refreshed = await refreshPromise
    if (!refreshed) {
      authStore.logout()
      await router.push({ name: 'Login' })
      throw new Error('Session expired')
    }
    res = await makeRequest()
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Request failed: ${res.status} — ${body}`)
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}
