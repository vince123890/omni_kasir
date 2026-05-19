import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  Product, StockInResult,
  OpnameSummary, OpnameDetail, OpnameItemInput, OpnameCreateResult,
  ConversionRecord, ConversionResult,
  StockMovement, MovementType,
  Transaction,
} from './types'

// ── Products ─────────────────────────────────────────────────────────────────

export interface ProductListParams {
  search?: string
  category?: string
  filter?: 'low-stock'
  page?: number
  limit?: number
}

export const productApi = {
  list: async (params?: ProductListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/admin-store/products', { params })
    return res.data.data
  },

  create: async (data: {
    name: string; category: string; unit: string
    conversionUnit?: string; conversionRate?: number
    buyPrice: number; sellPrice: number; initialStock?: number; minStock: number
  }) => {
    const res = await apiClient.post<ApiResponse<Pick<Product, 'id' | 'sku' | 'name' | 'stock'>>>('/admin-store/products', data)
    return res.data.data
  },

  update: async (id: number, data: Partial<{
    name: string; category: string; unit: string
    conversionUnit: string; conversionRate: number
    buyPrice: number; sellPrice: number; minStock: number
  }>): Promise<Product> => {
    const res = await apiClient.patch<ApiResponse<Product>>(`/admin-store/products/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin-store/products/${id}`)
  },
}

// ── Stock In ──────────────────────────────────────────────────────────────────

export const stockInApi = {
  create: async (data: { productId: number; qty: number; buyPrice: number; date: string; note?: string }): Promise<StockInResult> => {
    const res = await apiClient.post<ApiResponse<StockInResult>>('/admin-store/stocks/in', data)
    return res.data.data
  },
}

// ── Opname ────────────────────────────────────────────────────────────────────

export interface OpnameListParams {
  page?: number; limit?: number; dateFrom?: string; dateTo?: string
}

export const storeOpnameApi = {
  create: async (items: OpnameItemInput[]): Promise<OpnameCreateResult> => {
    const res = await apiClient.post<ApiResponse<OpnameCreateResult>>('/admin-store/stocks/opname', { items })
    return res.data.data
  },

  list: async (params?: OpnameListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<OpnameSummary>>>('/admin-store/stocks/opname', { params })
    return res.data.data
  },

  detail: async (id: number): Promise<OpnameDetail> => {
    const res = await apiClient.get<ApiResponse<OpnameDetail>>(`/admin-store/stocks/opname/${id}/items`)
    return res.data.data
  },
}

// ── Convert Stok ──────────────────────────────────────────────────────────────

export const storeConvertApi = {
  create: async (productId: number, qty: number): Promise<ConversionResult> => {
    const res = await apiClient.post<ApiResponse<ConversionResult>>('/admin-store/stocks/convert', { productId, qty })
    return res.data.data
  },

  list: async (params?: OpnameListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ConversionRecord>>>('/admin-store/stocks/convert', { params })
    return res.data.data
  },
}

// ── Stock Movements ───────────────────────────────────────────────────────────

export interface MovementListParams {
  page?: number; limit?: number; type?: MovementType; productId?: number
  dateFrom?: string; dateTo?: string
}

export const stockMovementApi = {
  list: async (params?: MovementListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StockMovement>>>('/admin-store/stocks/movements', { params })
    return res.data.data
  },
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface StoreTransactionListParams {
  page?: number; limit?: number; search?: string; date?: string; cashierId?: number
}

export const storeTransactionApi = {
  list: async (params?: StoreTransactionListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/admin-store/transactions', { params })
    return res.data.data
  },
}
