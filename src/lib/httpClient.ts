import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import type { UserSummary } from '../types/user'

const baseURL = import.meta.env.VITE_API_BASE_URL as string

export const httpClient = axios.create({ baseURL, withCredentials: true })

// Separate instance for the refresh call itself — it must never pass through the 401
// interceptor below, or a failed refresh would try to refresh itself forever.
const refreshClient = axios.create({ baseURL, withCredentials: true })

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<string | null> | null = null

/** De-duplicates concurrent refresh attempts — every 401 that lands at once shares one call. */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string; user: UserSummary }>('/api/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.accessToken, data.user)
        return data.accessToken
      })
      .catch(() => {
        useAuthStore.getState().clearSession()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined
    const isRefreshCall = original?.url?.includes('/api/auth/refresh')

    if (error.response?.status === 401 && original && !original._retried && !isRefreshCall) {
      original._retried = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        return httpClient(original)
      }
    }
    return Promise.reject(error)
  },
)
