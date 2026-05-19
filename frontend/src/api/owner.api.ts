import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, Store, StoresMeta, StoreUser, Transaction, TransactionSummary } from './types'

// ── Stores ──────────────────────────────────────────────────────────────────

export const ownerStoreApi = {
  list: async (): Promise<{ stores: Store[]; meta: StoresMeta }> => {
    const res = await apiClient.get<ApiResponse<{ data: Store[]; meta: StoresMeta }>>('/owner/stores')
    const inner = res.data.data
    return { stores: inner.data, meta: inner.meta }
  },

  create: async (data: { name: string; address: string; phone?: string }) => {
    const res = await apiClient.post<ApiResponse<Pick<Store, 'id' | 'storeCode' | 'name'>>>(
      '/owner/stores', data,
    )
    return res.data.data
  },

  update: async (id: number, data: Partial<{ name: string; address: string; phone: string }>): Promise<Store> => {
    const res = await apiClient.patch<ApiResponse<Store>>(`/owner/stores/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/owner/stores/${id}`)
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/owner/stores/${id}/status`, { isActive })
  },
}

// ── Users ───────────────────────────────────────────────────────────────────

export interface UserListParams {
  storeId?: number
  role?: 'kasir' | 'admin_store'
  search?: string
  page?: number
  limit?: number
}

export const ownerUserApi = {
  list: async (params?: UserListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StoreUser>>>('/owner/users', { params })
    return res.data.data
  },

  listByStore: async (storeId: number, params?: Omit<UserListParams, 'storeId'>) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StoreUser>>>(
      `/owner/stores/${storeId}/users`, { params },
    )
    return res.data.data
  },

  create: async (storeId: number, data: { name: string; email: string; password: string; role: 'kasir' | 'admin_store' }): Promise<StoreUser> => {
    const res = await apiClient.post<ApiResponse<StoreUser>>(`/owner/stores/${storeId}/users`, data)
    return res.data.data
  },

  update: async (id: number, data: Partial<{ name: string; email: string }>): Promise<void> => {
    await apiClient.patch(`/owner/users/${id}`, data)
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/owner/users/${id}/status`, { isActive })
  },
}

// ── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionListParams {
  page?: number
  limit?: number
  search?: string
  date?: string
  storeId?: number
  cashierId?: number
}

export const ownerTransactionApi = {
  list: async (params?: TransactionListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/owner/transactions', { params })
    return res.data.data
  },

  summary: async (dateFrom?: string, dateTo?: string): Promise<TransactionSummary[]> => {
    const res = await apiClient.get<ApiResponse<TransactionSummary[]>>(
      '/owner/transactions/summary', { params: { dateFrom, dateTo } },
    )
    return res.data.data
  },
}
