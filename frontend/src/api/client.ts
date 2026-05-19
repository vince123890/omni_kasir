import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api'

export const ACCESS_TOKEN_KEY  = 'omnikasir_access_token'
export const REFRESH_TOKEN_KEY = 'omnikasir_refresh_token'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ── Request: attach Bearer token ────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: auto refresh token saat 401 ──────────────────────────────────
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      isRefreshing = true
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

      if (!refreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        saveTokens(accessToken, newRefresh)
        processQueue(null, accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('omni_user')
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
