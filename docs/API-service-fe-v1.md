# API Service FE — Omni Kasir
**Versi**: 1.2  
**Tanggal**: 2026-05-19  
**Berdasarkan**: API-contract-v1.md v1.2  
**Target file**: `frontend/src/api/`

Dokumen ini adalah panduan implementasi API calls di sisi **Frontend React**.  
Semua file `dummies.ts` sudah diganti dengan real API calls — integrasi BE selesai.

> **Penting**: Semua paginated response dari BE berbentuk `{ statusCode, message, data: { data: [], meta: {} } }`.  
> Akses array dengan `res.data.data.data` dan meta dengan `res.data.data.meta`.  
> Semua API function sudah meng-handle ini — caller cukup akses `.data` dan `.meta` dari return value.

---

## Setup Struktur Folder

```
frontend/src/api/
├── client.ts          ← axios instance + interceptor
├── types.ts           ← semua TypeScript interface/type
├── auth.api.ts        ← POST /auth/login, logout, refresh, change-password
├── admin.api.ts       ← subscription plans + tenants
├── owner.api.ts       ← stores + users + transactions (owner)
├── store.api.ts       ← products + stocks + opname + convert + transactions (admin_store)
└── kasir.api.ts       ← transactions POS + opname + convert
```

---

## 1. client.ts — Axios Instance

```typescript
// frontend/src/api/client.ts
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const ACCESS_TOKEN_KEY = 'omnikasir_access_token'
const REFRESH_TOKEN_KEY = 'omnikasir_refresh_token'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Request interceptor: attach token ──────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: handle 401 → refresh token ──────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 + bukan request refresh-token sendiri
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
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
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
```

---

## 2. types.ts — TypeScript Interfaces

```typescript
// frontend/src/api/types.ts

// ── Base ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'owner' | 'admin_store' | 'kasir'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  tenantId: number | null
  storeId: number | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// ── Subscription Plan ───────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: number
  name: string
  price: number
  durationDays: number
  maxStores: number
  maxCashiersPerStore: number
  isActive: boolean
  isPopular: boolean
  tenantCount: number
  createdAt: string
}

// ── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: number
  tenantCode: string
  entityType: 'PT' | 'CV' | 'UD'
  name: string
  fullName: string
  owner: string
  email: string
  phone: string | null
  plan: string
  status: 'aktif' | 'expired' | 'nonaktif'
  expired: string
  joinDate: string
  storeCount?: number
}

export interface TenantDetail extends Tenant {
  stores: StoreInTenant[]
  users: UserInTenant[]
  subscriptionHistory: SubscriptionHistory[]
  stats: {
    totalStores: number
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
  }
}

export interface StoreInTenant {
  id: number
  storeCode: string
  name: string
  address: string
  kasirCount: number
  maxKasir: number
  txMonth: number
  status: boolean
}

export interface UserInTenant {
  id: number
  name: string
  email: string
  role: UserRole
  store: string
  lastLogin: string | null
  isActive: boolean
}

export interface SubscriptionHistory {
  plan: string
  startAt: string
  expiredAt: string
  status: 'active' | 'expired'
}

// ── Store ───────────────────────────────────────────────────────────────────

export interface Store {
  id: number
  storeCode: string
  name: string
  address: string
  phone: string
  kasirCount: number
  maxKasir: number
  txMonth: number
  revenue: string
  isActive: boolean
  createdAt: string
}

export interface StoresMeta {
  totalStores: number
  maxStores: number
  planName: string
}

// ── User (Owner management) ─────────────────────────────────────────────────

export interface StoreUser {
  id: number
  name: string
  email: string
  role: 'kasir' | 'admin_store'
  storeId: number
  storeName: string
  isActive: boolean
  lastLogin: string | null
}

// ── Product ─────────────────────────────────────────────────────────────────

export type StockStatus = 'aman' | 'menipis' | 'kritis' | 'habis'

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  unit: string
  conversionUnit: string | null
  conversionRate: number | null
  buyPrice: number
  sellPrice: number
  stock: number
  minStock: number
  stockStatus: StockStatus
  isActive: boolean
}

// ── Stock Opname ────────────────────────────────────────────────────────────

export interface OpnameSummary {
  id: number
  opnameCode: string
  opnameDate: string
  createdByName: string
  status: 'DRAFT' | 'COMPLETED'
  filledCount: number
  totalCount: number
  selisihCount: number
}

export interface OpnameItemDetail {
  productId: number
  productName: string
  unit: string
  qtySystem: number
  qtyActual: number
  difference: number
  reason: string | null
}

export interface OpnameDetail {
  opnameCode: string
  opnameDate: string
  createdByName: string
  status: 'DRAFT' | 'COMPLETED'
  items: OpnameItemDetail[]
  summary: { totalFilled: number; sesuai: number; selisih: number }
}

export interface OpnameItemInput {
  productId: number
  qtyActual: number
  reason?: string
}

// ── Stock Convert ───────────────────────────────────────────────────────────

export interface ConversionRecord {
  id: number
  movementCode: string
  productId: number
  productName: string
  fromQty: number
  fromUnit: string
  toQty: number
  toUnit: string
  stockBefore: number
  stockAfter: number
  createdByName: string
  createdAt: string
}

// ── Stock Movement ──────────────────────────────────────────────────────────

export type MovementType = 'IN' | 'OUT' | 'CONVERT' | 'OPNAME'

export interface StockMovement {
  id: number
  movementCode: string
  type: MovementType
  productId: number
  productName: string
  qty: number
  qtyBefore: number
  qtyAfter: number
  note: string | null
  createdByName: string
  createdAt: string
}

// ── Transaction ─────────────────────────────────────────────────────────────

export interface TransactionItem {
  productId: number
  productName: string
  qty: number
  price: number
  subtotal: number
}

export interface Transaction {
  id: number
  transactionCode: string
  cashierName: string
  storeName?: string   // hanya di owner
  totalAmount: number
  paidAmount: number
  changeAmount: number
  paymentMethod: 'CASH'
  itemCount: number
  createdAt: string
  items: TransactionItem[]
}

export interface TransactionSummary {
  storeId: number
  storeName: string
  totalTransactions: number
  totalRevenue: number
  date: string
}
```

---

## 3. auth.api.ts

```typescript
// frontend/src/api/auth.api.ts
import { apiClient, saveTokens, clearTokens } from './client'
import type { ApiResponse, LoginResponse, AuthUser } from './types'

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
    const { accessToken, refreshToken } = res.data.data
    saveTokens(accessToken, refreshToken)
    return res.data.data
  },

  // Ambil profil lengkap (nama, tenantName, storeName, planName, expiredAt)
  me: async (): Promise<AuthUser> => {
    const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me')
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout').catch(() => {})
    clearTokens()
  },

  changePassword: async (oldPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    await apiClient.patch('/auth/change-password', { oldPassword, newPassword, confirmPassword })
  },
}
```

---

## 3.5 AuthContext — Simpan User dari JWT + /auth/me

```typescript
// frontend/src/context/AuthContext.tsx
// AuthProvider menyimpan user di localStorage + fetch /auth/me saat pertama login
// untuk enrich dengan tenantName, storeName, planName, expiredAt
// Gunakan useAuth() hook di semua layout untuk akses user.tenantName, user.storeName, dll.
```

**AuthUser type** (sudah diupdate di types.ts):
```typescript
export interface AuthUser {
  id: number; name: string; email: string
  role: UserRole; tenantId: number | null; storeId: number | null
  // Extended dari /auth/me:
  tenantName?: string | null; tenantEntityType?: string | null
  storeName?: string | null; planName?: string | null; expiredAt?: string | null
}
```

---

## 4. admin.api.ts

```typescript
// frontend/src/api/admin.api.ts
import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  SubscriptionPlan, Tenant, TenantDetail,
} from './types'

// ── Subscription Plans ──────────────────────────────────────────────────────

export const subscriptionPlanApi = {
  list: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/admin/subscription-plans')
    return res.data.data
  },

  create: async (data: {
    name: string; price: number; durationDays: number
    maxStores: number; maxCashiersPerStore: number
  }): Promise<SubscriptionPlan> => {
    const res = await apiClient.post<ApiResponse<SubscriptionPlan>>('/admin/subscription-plans', data)
    return res.data.data
  },

  update: async (id: number, data: Partial<{
    name: string; price: number; durationDays: number
    maxStores: number; maxCashiersPerStore: number
    isActive: boolean; isPopular: boolean
  }>): Promise<SubscriptionPlan> => {
    const res = await apiClient.patch<ApiResponse<SubscriptionPlan>>(`/admin/subscription-plans/${id}`, data)
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
    // Returns { data: Tenant[], meta: { total, page, limit, totalPages } }
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Tenant>>>('/admin/tenants', { params })
    return res.data.data
  },

  detail: async (id: number): Promise<TenantDetail> => {
    const res = await apiClient.get<ApiResponse<TenantDetail>>(`/admin/tenants/${id}`)
    return res.data.data
  },

  create: async (data: {
    entityType: string; name: string; ownerName: string
    email: string; password: string; planId: number; startDate: string
  }) => {
    const res = await apiClient.post<ApiResponse<{ tenantId: number; tenantCode: string }>>('/admin/tenants', data)
    return res.data.data
  },

  update: async (id: number, data: { entityType?: string; name?: string; ownerName?: string }) => {
    const res = await apiClient.patch<ApiResponse<Tenant>>(`/admin/tenants/${id}`, data)
    return res.data.data
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/tenants/${id}/status`, { isActive })
  },

  renewSubscription: async (id: number, data: {
    planId: number; startDate: string; durationDays: number
  }) => {
    const res = await apiClient.patch<ApiResponse<{ newExpiredAt: string; plan: string }>>(
      `/admin/tenants/${id}/subscription`, data
    )
    return res.data.data
  },
}
```

---

## 5. owner.api.ts

```typescript
// frontend/src/api/owner.api.ts
import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  Store, StoresMeta, StoreUser, Transaction, TransactionSummary,
} from './types'

// ── Stores ──────────────────────────────────────────────────────────────────

export const ownerStoreApi = {
  list: async (): Promise<{ stores: Store[]; meta: StoresMeta }> => {
    // Response: { statusCode, message, data: { data: Store[], meta: StoresMeta } }
    const res = await apiClient.get<ApiResponse<{ data: Store[]; meta: StoresMeta }>>('/owner/stores')
    const inner = res.data.data
    return { stores: inner.data, meta: inner.meta }
  },

  create: async (data: { name: string; address: string; phone?: string }) => {
    const res = await apiClient.post<ApiResponse<Pick<Store, 'id' | 'storeCode' | 'name'>>>('/owner/stores', data)
    return res.data.data
  },

  update: async (id: number, data: Partial<{ name: string; address: string; phone: string }>) => {
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
    return res.data.data  // { data: StoreUser[], meta: {...} }
  },

  listByStore: async (storeId: number, params?: Omit<UserListParams, 'storeId'>) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StoreUser>>>(
      `/owner/stores/${storeId}/users`, { params }
    )
    return res.data.data
  },

  create: async (storeId: number, data: {
    name: string; email: string; password: string; role: 'kasir' | 'admin_store'
  }) => {
    const res = await apiClient.post<ApiResponse<StoreUser>>(
      `/owner/stores/${storeId}/users`, data
    )
    return res.data.data
  },

  update: async (id: number, data: Partial<{ name: string; email: string }>) => {
    await apiClient.patch(`/owner/users/${id}`, data)
  },

  setStatus: async (id: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/owner/users/${id}/status`, { isActive })
  },
}

// ── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionListParams {
  page?: number; limit?: number
  search?: string; date?: string
  storeId?: number; cashierId?: number
}

export const ownerTransactionApi = {
  list: async (params?: TransactionListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/owner/transactions', { params })
    return res.data.data  // { data: Transaction[], meta: {...} }
  },

  summary: async (dateFrom?: string, dateTo?: string): Promise<TransactionSummary[]> => {
    const res = await apiClient.get<ApiResponse<TransactionSummary[]>>(
      '/owner/transactions/summary', { params: { dateFrom, dateTo } }
    )
    return res.data.data
  },
}
```

---

## 6. store.api.ts

```typescript
// frontend/src/api/store.api.ts
// Diakses oleh role admin_store — semua endpoint /admin-store/* 
import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  Product, OpnameSummary, OpnameDetail, OpnameItemInput,
  ConversionRecord, StockMovement, Transaction,
} from './types'

// ── Products ─────────────────────────────────────────────────────────────────

export interface ProductListParams {
  search?: string; category?: string
  filter?: 'low-stock'; page?: number; limit?: number
}

export const productApi = {
  list: async (params?: ProductListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/admin-store/products', { params })
    return res.data.data  // { data: Product[], meta: {...} }
    // ⚠️ Kasir TIDAK bisa pakai ini — gunakan kasirProductApi dari kasir.api.ts
  },

  create: async (data: {
    name: string; category: string; unit: string
    conversionUnit?: string; conversionRate?: number
    buyPrice: number; sellPrice: number
    initialStock?: number; minStock: number
  }) => {
    const res = await apiClient.post<ApiResponse<Pick<Product, 'id' | 'sku' | 'name' | 'stock'>>>(
      '/admin-store/products', data
    )
    return res.data.data
  },

  update: async (id: number, data: Partial<{
    name: string; category: string; unit: string
    conversionUnit: string; conversionRate: number
    buyPrice: number; sellPrice: number; minStock: number
  }>) => {
    const res = await apiClient.patch<ApiResponse<Product>>(`/admin-store/products/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin-store/products/${id}`)
  },
}

// ── Stock In ──────────────────────────────────────────────────────────────────

export const stockInApi = {
  create: async (data: {
    productId: number; qty: number; buyPrice: number; date: string; note?: string
  }) => {
    const res = await apiClient.post<ApiResponse<{
      movementCode: string; productName: string; qty: number; stockBefore: number; stockAfter: number
    }>>('/admin-store/stocks/in', data)
    return res.data.data
  },
}

// ── Opname (Admin Store) ──────────────────────────────────────────────────────

export interface OpnameListParams { page?: number; limit?: number; dateFrom?: string; dateTo?: string }

export const storeOpnameApi = {
  create: async (items: OpnameItemInput[]) => {
    const res = await apiClient.post<ApiResponse<{
      opnameCode: string; filledCount: number; adjustedCount: number
      items: Array<{ productId: number; productName: string; qtySystem: number; qtyActual: number; difference: number; reason: string | null }>
    }>>('/admin-store/stocks/opname', { items })
    return res.data.data
  },

  list: async (params?: OpnameListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<OpnameSummary>>>(
      '/admin-store/stocks/opname', { params }
    )
    return res.data.data
  },

  detail: async (id: number): Promise<OpnameDetail> => {
    const res = await apiClient.get<ApiResponse<OpnameDetail>>(`/admin-store/stocks/opname/${id}/items`)
    return res.data.data
  },
}

// ── Convert Stok (Admin Store) ────────────────────────────────────────────────

export const storeConvertApi = {
  create: async (productId: number, qty: number) => {
    const res = await apiClient.post<ApiResponse<ConversionRecord>>('/admin-store/stocks/convert', { productId, qty })
    return res.data.data
  },

  list: async (params?: OpnameListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ConversionRecord>>>(
      '/admin-store/stocks/convert', { params }
    )
    return res.data.data
  },
}

// ── Stock Movements ───────────────────────────────────────────────────────────

export interface MovementListParams {
  page?: number; limit?: number; type?: string
  productId?: number; dateFrom?: string; dateTo?: string
}

export const stockMovementApi = {
  list: async (params?: MovementListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StockMovement>>>(
      '/admin-store/stocks/movements', { params }
    )
    return res.data.data
  },
}

// ── Transactions (Admin Store) ────────────────────────────────────────────────

export interface StoreTransactionListParams {
  page?: number; limit?: number; search?: string; date?: string; cashierId?: number
}

export const storeTransactionApi = {
  list: async (params?: StoreTransactionListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/admin-store/transactions', { params }
    )
    return res.data.data
  },
}
```

---

## 7. kasir.api.ts

```typescript
// frontend/src/api/kasir.api.ts
import { apiClient } from './client'
import type {
  ApiResponse, PaginatedResponse,
  Product, Transaction, OpnameSummary, OpnameDetail, OpnameItemInput, ConversionRecord,
} from './types'

// ── Produk untuk POS ──────────────────────────────────────────────────────────
// ⚠️ Kasir WAJIB pakai ini, bukan productApi (yang hanya untuk admin_store)

export const kasirProductApi = {
  list: async (params?: { search?: string; category?: string; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/kasir/products', { params })
    return res.data.data  // { data: Product[], meta: {...} }
  },
}

// ── Transaksi POS ─────────────────────────────────────────────────────────────

export const kasirTransactionApi = {
  create: async (data: {
    items: Array<{ productId: number; qty: number }>
    paidAmount: number
    paymentMethod?: 'CASH'
    note?: string | null
  }) => {
    const res = await apiClient.post<ApiResponse<{
      transactionCode: string; totalAmount: number
      paidAmount: number; changeAmount: number; paymentMethod: string
      items: Array<{ productId: number; productName: string; qty: number; price: number; subtotal: number }>
    }>>('/kasir/transactions', data)
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/kasir/transactions', { params })
    return res.data.data
  },
}

// ── Opname (Kasir) ────────────────────────────────────────────────────────────

export const kasirOpnameApi = {
  create: async (items: OpnameItemInput[]) => {
    const res = await apiClient.post<ApiResponse<{
      opnameCode: string; filledCount: number; adjustedCount: number
    }>>('/kasir/stocks/opname', { items })
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<OpnameSummary>>>(
      '/kasir/stocks/opname', { params }
    )
    return res.data.data
  },

  detail: async (id: number): Promise<OpnameDetail> => {
    const res = await apiClient.get<ApiResponse<OpnameDetail>>(`/kasir/stocks/opname/${id}/items`)
    return res.data.data
  },
}

// ── Convert Stok (Kasir) ──────────────────────────────────────────────────────

export const kasirConvertApi = {
  create: async (productId: number, qty: number) => {
    const res = await apiClient.post<ApiResponse<ConversionRecord>>(
      '/kasir/stocks/convert', { productId, qty }
    )
    return res.data.data
  },

  list: async (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ConversionRecord>>>(
      '/kasir/stocks/convert', { params }
    )
    return res.data.data
  },
}
```

---

## 8. Cara Pakai di Halaman React

### Status Integrasi (per 2026-05-19)

Semua 19 halaman FE sudah diintegrasikan ke real API — `dummies.ts` tidak lagi digunakan untuk data.  
`dummies.ts` masih ada di repo sebagai referensi format data saja.

### Pattern API call yang benar

```typescript
import { productApi } from '../../api'
import { useState, useEffect, useCallback } from 'react'

const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(true)

const load = useCallback(() => {
  setLoading(true)
  productApi.list({ limit: 100 })
    .then(res => setProducts(res.data))  // res sudah { data: [], meta: {} }
    .catch(err => console.error(err))
    .finally(() => setLoading(false))
}, [])

useEffect(() => { load() }, [load])
```

### Handle Error 403 / 404
```typescript
import axios from 'axios'

try {
  await ownerStoreApi.remove(storeId)
} catch (err) {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message ?? 'Terjadi kesalahan'
    notification.error({ message: msg })
  }
}
```

### Login → simpan user ke context
```typescript
// Setelah authApi.login() berhasil:
const user = await authApi.login(email, password)

// Redirect berdasarkan role:
const redirectMap: Record<string, string> = {
  admin:       '/admin/dashboard',
  owner:       '/owner/dashboard',
  admin_store: '/store/dashboard',
  kasir:       '/kasir/pos',
}
navigate(redirectMap[user.role])
```

---

## 9. Environment Variable & Proxy

```env
# frontend/.env (development — gunakan path relatif agar Vite proxy bekerja)
VITE_API_URL=/api

# frontend/.env.production
VITE_API_URL=http://your-vps-ip/api
```

**Vite proxy** (`vite.config.ts`) — wajib untuk dev agar tidak ada CORS issue:
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 10. Dependency yang Perlu Diinstall

```bash
cd frontend
npm install axios
```

> `axios` mungkin sudah ada, cek `package.json` dulu.

---

## Mapping dummies.ts → API endpoint (Status: ✅ Semua sudah diimplementasi)

| Dummy data | Diganti dengan | File API | Status |
|---|---|---|---|
| `tenants` | `GET /admin/tenants` | `admin.api.ts` | ✅ Done |
| `currentTenant` | `GET /auth/me` → `tenantName`, `planName` | `auth.api.ts` | ✅ Done |
| `stores` | `GET /owner/stores` | `owner.api.ts` | ✅ Done |
| `currentStore` | `GET /auth/me` → `storeName` | `auth.api.ts` | ✅ Done |
| `kasirUsers` + `storeAdminUsers` | `GET /owner/users` | `owner.api.ts` | ✅ Done |
| `currentKasir` / `currentStoreAdmin` | `GET /auth/me` → `name` dari localStorage | `auth.api.ts` | ✅ Done |
| `products` (admin store) | `GET /admin-store/products` | `store.api.ts` | ✅ Done |
| `products` (kasir/POS) | `GET /kasir/products` | `kasir.api.ts` | ✅ Done |
| `transactions` | role-specific endpoint | sesuai role | ✅ Done |
| `stockOpnames` | `GET /admin-store/stocks/opname` atau `/kasir/stocks/opname` | role-specific | ✅ Done |
| `stockOpnameItems` | `GET /admin-store/stocks/opname/:id/items` | `store.api.ts` | ✅ Done |
| `stockConversions` | `GET /admin-store/stocks/convert` atau `/kasir/stocks/convert` | role-specific | ✅ Done |
| `stockMovements` | `GET /admin-store/stocks/movements` | `store.api.ts` | ✅ Done |
| `adminUsers` | `GET /admin/users` | `admin.api.ts` | ✅ Done |

---

## Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0 | 2026-05-19 | Dokumen awal — axios setup, 7 API modules, TypeScript types lengkap, mapping dummies.ts |
| v1.1 | 2026-05-19 | Tambah `adminUserApi` (list, create, setStatus) dan interface `AdminUser` di `admin.api.ts`. Tambah mapping `adminUsers` dummy → `GET /admin/users`. |
| v1.2 | 2026-05-19 | **Integrasi BE selesai**: Tambah `kasirProductApi` (GET /kasir/products). Tambah `authApi.me()`. Fix semua return type: `res.data` → `res.data.data` untuk paginated response. Fix `ownerStoreApi.list()` nested structure. Tambah Vite proxy config. Update env: `VITE_API_URL=/api` (relatif). Update semua mapping dummies → done. Tambah catatan dual-column TypeORM. |
