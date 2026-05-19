import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  Product,
  Transaction, TransactionResult,
  OpnameSummary, OpnameDetail, OpnameItemInput, OpnameCreateResult,
  ConversionRecord, ConversionResult,
} from './types'

// ── Produk (untuk POS kasir) ──────────────────────────────────────────────────

export const kasirProductApi = {
  list: async (params?: { search?: string; category?: string; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/kasir/products', { params })
    return res.data.data
  },
}

// ── Transaksi POS ─────────────────────────────────────────────────────────────

export const kasirTransactionApi = {
  create: async (data: {
    items: Array<{ productId: number; qty: number }>
    paidAmount: number
    paymentMethod?: 'CASH'
    note?: string | null
  }): Promise<TransactionResult> => {
    const res = await apiClient.post<ApiResponse<TransactionResult>>('/kasir/transactions', data)
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/kasir/transactions', { params })
    return res.data.data
  },
}

// ── Opname (Kasir) ────────────────────────────────────────────────────────────

export const kasirOpnameApi = {
  create: async (items: OpnameItemInput[]): Promise<OpnameCreateResult> => {
    const res = await apiClient.post<ApiResponse<OpnameCreateResult>>('/kasir/stocks/opname', { items })
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<OpnameSummary>>>('/kasir/stocks/opname', { params })
    return res.data.data
  },

  detail: async (id: number): Promise<OpnameDetail> => {
    const res = await apiClient.get<ApiResponse<OpnameDetail>>(`/kasir/stocks/opname/${id}/items`)
    return res.data.data
  },
}

// ── Convert Stok (Kasir) ──────────────────────────────────────────────────────

export const kasirConvertApi = {
  create: async (productId: number, qty: number): Promise<ConversionResult> => {
    const res = await apiClient.post<ApiResponse<ConversionResult>>('/kasir/stocks/convert', { productId, qty })
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ConversionRecord>>>('/kasir/stocks/convert', { params })
    return res.data.data
  },
}
