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
  // Extended profile (from /auth/me)
  tenantName?: string | null
  tenantEntityType?: string | null
  storeName?: string | null
  planName?: string | null
  expiredAt?: string | null
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
  maxCashiersPerStore?: number
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

export interface OpnameCreateResult {
  opnameCode: string
  filledCount: number
  adjustedCount: number
  items: Array<{
    productId: number
    productName: string
    qtySystem: number
    qtyActual: number
    difference: number
    reason: string | null
  }>
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

export interface ConversionResult {
  movementCode: string
  productName: string
  fromQty: number
  fromUnit: string
  toQty: number
  toUnit: string
  stockBefore: number
  stockAfter: number
}

// ── Stock In ────────────────────────────────────────────────────────────────

export interface StockInResult {
  movementCode: string
  productName: string
  qty: number
  stockBefore: number
  stockAfter: number
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
  storeName?: string
  totalAmount: number
  paidAmount: number
  changeAmount: number
  paymentMethod: 'CASH'
  itemCount: number
  createdAt: string
  items: TransactionItem[]
}

export interface TransactionResult {
  transactionCode: string
  totalAmount: number
  paidAmount: number
  changeAmount: number
  paymentMethod: string
  items: TransactionItem[]
}

export interface TransactionSummary {
  storeId: number
  storeName: string
  totalTransactions: number
  totalRevenue: number
  date: string
}
