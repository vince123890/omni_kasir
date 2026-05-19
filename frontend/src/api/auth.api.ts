import { apiClient, saveTokens, clearTokens } from './client'
import type { ApiResponse, LoginResponse, AuthUser } from './types'

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
    const { accessToken, refreshToken } = res.data.data
    saveTokens(accessToken, refreshToken)
    return res.data.data
  },

  me: async (): Promise<AuthUser> => {
    const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me')
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout').catch(() => {})
    clearTokens()
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    await apiClient.patch('/auth/change-password', { oldPassword, newPassword, confirmPassword })
  },
}
