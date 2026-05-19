import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, SubscriptionPlan, Tenant, TenantDetail } from './types'

// ── Admin Platform Users ─────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  name: string
  email: string
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

export const adminUserApi = {
  list: async (): Promise<AdminUser[]> => {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users')
    return res.data.data
  },

  create: async (data: { name: string; email: string; password: string }): Promise<AdminUser> => {
    const res = await apiClient.post<ApiResponse<AdminUser>>('/admin/users', data)
    return res.data.data
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/status`, { isActive })
  },
}

// ── Subscription Plans ──────────────────────────────────────────────────────

export const subscriptionPlanApi = {
  list: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/admin/subscription-plans')
    return res.data.data
  },

  create: async (data: {
    name: string
    price: number
    durationDays: number
    maxStores: number
    maxCashiersPerStore: number
  }): Promise<SubscriptionPlan> => {
    const res = await apiClient.post<ApiResponse<SubscriptionPlan>>('/admin/subscription-plans', data)
    return res.data.data
  },

  update: async (
    id: number,
    data: Partial<{
      name: string
      price: number
      durationDays: number
      maxStores: number
      maxCashiersPerStore: number
      isActive: boolean
      isPopular: boolean
    }>,
  ): Promise<SubscriptionPlan> => {
    const res = await apiClient.patch<ApiResponse<SubscriptionPlan>>(
      `/admin/subscription-plans/${id}`,
      data,
    )
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/subscription-plans/${id}`)
  },
}

// ── Tenants ─────────────────────────────────────────────────────────────────

export interface TenantListParams {
  search?: string
  entityType?: 'PT' | 'CV' | 'UD'
  status?: 'aktif' | 'expired' | 'nonaktif'
  plan?: string
  page?: number
  limit?: number
}

export const tenantApi = {
  list: async (params?: TenantListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Tenant>>>('/admin/tenants', { params })
    return res.data.data
  },

  detail: async (id: number): Promise<TenantDetail> => {
    const res = await apiClient.get<ApiResponse<TenantDetail>>(`/admin/tenants/${id}`)
    return res.data.data
  },

  create: async (data: {
    entityType: string
    name: string
    ownerName: string
    email: string
    password: string
    planId: number
    startDate: string
  }) => {
    const res = await apiClient.post<ApiResponse<{ tenantId: number; tenantCode: string; ownerId: number; subscriptionId: number }>>(
      '/admin/tenants',
      data,
    )
    return res.data.data
  },

  update: async (
    id: number,
    data: { entityType?: string; name?: string; ownerName?: string },
  ): Promise<Tenant> => {
    const res = await apiClient.patch<ApiResponse<Tenant>>(`/admin/tenants/${id}`, data)
    return res.data.data
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/tenants/${id}/status`, { isActive })
  },

  renewSubscription: async (
    id: number,
    data: { planId: number; startDate: string; durationDays: number },
  ) => {
    const res = await apiClient.patch<ApiResponse<{ newExpiredAt: string; plan: string }>>(
      `/admin/tenants/${id}/subscription`,
      data,
    )
    return res.data.data
  },
}
