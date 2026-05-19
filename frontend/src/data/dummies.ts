// ─── Helper: generate kode ───────────────────────────────────────────────────

export function genTenantCode(seq: number, joinDate: string): string {
  // TNT-{YYYYMM}-{NNN}
  const ym = joinDate.replace(/-/g, '').slice(0, 6)
  return `TNT-${ym}-${String(seq).padStart(3, '0')}`
}

export function genStoreCode(tenantSeq: number, storeSeq: number, createdYM: string): string {
  // STR-{YYMM}-{tenantNN}-{storeNN}
  const ym = createdYM.slice(2, 4) + createdYM.slice(5, 7)
  return `STR-${ym}-${String(tenantSeq).padStart(2, '0')}${String(storeSeq).padStart(2, '0')}`
}

export function genSku(storeSeq: number, productSeq: number): string {
  // PRD-{storeNN}-{productNNN}
  return `PRD-${String(storeSeq).padStart(2, '0')}-${String(productSeq).padStart(3, '0')}`
}

export function genOpnameCode(date: string, seq: number): string {
  // OPN-{YYYYMMDD}-{NN}
  return `OPN-${date.replace(/-/g, '')}-${String(seq).padStart(2, '0')}`
}

export function genMovementCode(type: 'IN' | 'CVT', date: string, seq: number): string {
  // STK-IN-{YYYYMMDD}-{NNN} | STK-CVT-{YYYYMMDD}-{NNN}
  return `STK-${type}-${date.replace(/-/g, '')}-${String(seq).padStart(3, '0')}`
}

// ─── Subscription Plan Config ─────────────────────────────────────────────────

export const planConfig: Record<string, { maxStores: number; maxCashiersPerStore: number }> = {
  Basic:      { maxStores: 1,   maxCashiersPerStore: 2   },
  Pro:        { maxStores: 5,   maxCashiersPerStore: 5   },
  Enterprise: { maxStores: 999, maxCashiersPerStore: 999 },
}

// ─── Tenants ──────────────────────────────────────────────────────────────────
// tenantCode: TNT-{YYYYMM joinDate}-{NNN}

export const tenants = [
  {
    id: 1, seq: 1,
    tenantCode: genTenantCode(1, '2025-08-15'),   // TNT-202508-001
    entityType: 'PT', name: 'Maju Jaya Sejahtera', fullName: 'PT Maju Jaya Sejahtera',
    owner: 'Budi Santoso', email: 'budi@majujaya.com',
    plan: 'Pro', status: 'aktif', expired: '2026-05-24', joinDate: '2025-08-15',
  },
  {
    id: 2, seq: 2,
    tenantCode: genTenantCode(2, '2025-06-01'),   // TNT-202506-002
    entityType: 'CV', name: 'Warung Bu Sari', fullName: 'CV Warung Bu Sari',
    owner: 'Sari Dewi', email: 'sari@warung.com',
    plan: 'Basic', status: 'aktif', expired: '2026-06-01', joinDate: '2025-06-01',
  },
  {
    id: 3, seq: 3,
    tenantCode: genTenantCode(3, '2025-01-01'),   // TNT-202501-003
    entityType: 'PT', name: 'Rezeki Abadi Mandiri', fullName: 'PT Rezeki Abadi Mandiri',
    owner: 'Hendra Kusuma', email: 'hendra@rezeki.com',
    plan: 'Enterprise', status: 'aktif', expired: '2026-12-31', joinDate: '2025-01-01',
  },
  {
    id: 4, seq: 4,
    tenantCode: genTenantCode(4, '2025-11-10'),   // TNT-202511-004
    entityType: 'UD', name: 'Toko Pak Agus', fullName: 'UD Toko Pak Agus',
    owner: 'Agus Setiawan', email: 'agus@toko.com',
    plan: 'Basic', status: 'expired', expired: '2026-05-10', joinDate: '2025-11-10',
  },
  {
    id: 5, seq: 5,
    tenantCode: genTenantCode(5, '2025-07-20'),   // TNT-202507-005
    entityType: 'CV', name: 'Barokah Jaya Abadi', fullName: 'CV Barokah Jaya Abadi',
    owner: 'Rina Marlina', email: 'rina@barokah.com',
    plan: 'Pro', status: 'aktif', expired: '2026-07-20', joinDate: '2025-07-20',
  },
  {
    id: 6, seq: 6,
    tenantCode: genTenantCode(6, '2025-09-05'),   // TNT-202509-006
    entityType: 'UD', name: 'Sumber Rejeki', fullName: 'UD Sumber Rejeki',
    owner: 'Dian Pertiwi', email: 'dian@sumber.com',
    plan: 'Basic', status: 'nonaktif', expired: '2026-09-05', joinDate: '2025-09-05',
  },
]

// Tenant yang sedang login sebagai Owner (tenant id=1)
export const currentTenant = tenants[0]

// ─── Stores ───────────────────────────────────────────────────────────────────
// storeCode: STR-{YYMM createdYM}-{tenantNN}{storeNN}

export const stores = [
  {
    id: 1, tenantId: 1,
    storeCode: genStoreCode(1, 1, '2025-08'),   // STR-2508-0101
    name: 'Toko Pusat Sudirman',
    address: 'Jl. Sudirman No. 10, Jakarta Pusat',
    phone: '021-12345678',
    kasir: 3, maxKasir: 5, txMonth: 1240, revenue: 'Rp 38,2 jt', status: true,
  },
  {
    id: 2, tenantId: 1,
    storeCode: genStoreCode(1, 2, '2025-09'),   // STR-2509-0102
    name: 'Cabang Margonda Depok',
    address: 'Jl. Margonda No. 45, Depok',
    phone: '021-87654321',
    kasir: 2, maxKasir: 5, txMonth: 870, revenue: 'Rp 24,5 jt', status: true,
  },
  {
    id: 3, tenantId: 1,
    storeCode: genStoreCode(1, 3, '2025-10'),   // STR-2510-0103
    name: 'Cabang Ahmad Yani Bekasi',
    address: 'Jl. Ahmad Yani No. 22, Bekasi',
    phone: '021-11223344',
    kasir: 2, maxKasir: 5, txMonth: 620, revenue: 'Rp 17,8 jt', status: true,
  },
]

// Store yang sedang aktif untuk kasir yang login
export const currentStore = stores[0]

// ─── Admin Platform Users ─────────────────────────────────────────────────────

export const adminUsers = [
  {
    id: 1, key: 1,
    name: 'Super Admin',
    email: 'admin@omnikasir.com',
    isActive: true,
    createdAt: '2025-01-01',
    lastLogin: '2026-05-19 07:00',
  },
]

// ─── Kasir Users ──────────────────────────────────────────────────────────────

export const kasirUsers = [
  { key: 1, tenantId: 1, storeId: 1, name: 'Ani Rahayu',    email: 'ani@majujaya.com',   store: 'Toko Pusat Sudirman',      status: true,  lastLogin: '2026-05-19 08:23' },
  { key: 2, tenantId: 1, storeId: 1, name: 'Bowo Santoso',  email: 'bowo@majujaya.com',  store: 'Toko Pusat Sudirman',      status: true,  lastLogin: '2026-05-19 07:55' },
  { key: 3, tenantId: 1, storeId: 1, name: 'Citra Dewi',    email: 'citra@majujaya.com', store: 'Toko Pusat Sudirman',      status: false, lastLogin: '2026-05-10 14:00' },
  { key: 4, tenantId: 1, storeId: 2, name: 'Dani Pratama',  email: 'dani@majujaya.com',  store: 'Cabang Margonda Depok',    status: true,  lastLogin: '2026-05-19 09:10' },
  { key: 5, tenantId: 1, storeId: 2, name: 'Eka Sari',      email: 'eka@majujaya.com',   store: 'Cabang Margonda Depok',    status: true,  lastLogin: '2026-05-18 16:45' },
  { key: 6, tenantId: 1, storeId: 3, name: 'Fajar Nugroho', email: 'fajar@majujaya.com', store: 'Cabang Ahmad Yani Bekasi', status: true,  lastLogin: '2026-05-19 08:00' },
  { key: 7, tenantId: 1, storeId: 3, name: 'Gita Permata',  email: 'gita@majujaya.com',  store: 'Cabang Ahmad Yani Bekasi', status: true,  lastLogin: '2026-05-19 08:30' },
]

// Kasir yang sedang login
export const currentKasir = kasirUsers[0]

// ─── Admin Store Users ────────────────────────────────────────────────────────

export const storeAdminUsers = [
  { key: 101, tenantId: 1, storeId: 1, name: 'Muhammad Rizal',  email: 'rizal@majujaya.com', role: 'admin_store', store: 'Toko Pusat Sudirman',      status: true,  lastLogin: '2026-05-19 07:30' },
  { key: 102, tenantId: 1, storeId: 2, name: 'Siti Nurhaliza',  email: 'siti@majujaya.com',  role: 'admin_store', store: 'Cabang Margonda Depok',    status: true,  lastLogin: '2026-05-19 08:00' },
  { key: 103, tenantId: 1, storeId: 3, name: 'Brama Wijaya',    email: 'brama@majujaya.com', role: 'admin_store', store: 'Cabang Ahmad Yani Bekasi', status: true,  lastLogin: '2026-05-18 17:00' },
]

// Admin Store yang sedang login (demo: store pertama)
export const currentStoreAdmin = storeAdminUsers[0]

// ─── Products ─────────────────────────────────────────────────────────────────
// sku: PRD-{storeNN}-{productNNN}

export const products = [
  { key: 1,  tenantId: 1, storeId: 1, sku: genSku(1,  1),  name: 'Aqua 600ml',          category: 'Minuman', unit: 'pcs', convUnit: 'dus',    convRate: 24, buyPrice:  2500, sellPrice:  3500, stock: 120, minStock: 48 },
  { key: 2,  tenantId: 1, storeId: 1, sku: genSku(1,  2),  name: 'Aqua 1500ml',         category: 'Minuman', unit: 'pcs', convUnit: 'dus',    convRate: 12, buyPrice:  4500, sellPrice:  6000, stock:  60, minStock: 24 },
  { key: 3,  tenantId: 1, storeId: 1, sku: genSku(1,  3),  name: 'Indomie Goreng',      category: 'Makanan', unit: 'pcs', convUnit: 'dus',    convRate: 40, buyPrice:  2800, sellPrice:  3500, stock: 200, minStock: 40 },
  { key: 4,  tenantId: 1, storeId: 1, sku: genSku(1,  4),  name: 'Indomie Soto',        category: 'Makanan', unit: 'pcs', convUnit: 'dus',    convRate: 40, buyPrice:  2800, sellPrice:  3500, stock:   8, minStock: 20 },
  { key: 5,  tenantId: 1, storeId: 1, sku: genSku(1,  5),  name: 'Teh Botol 350ml',     category: 'Minuman', unit: 'pcs', convUnit: 'dus',    convRate: 24, buyPrice:  4000, sellPrice:  5000, stock:   3, minStock: 24 },
  { key: 6,  tenantId: 1, storeId: 1, sku: genSku(1,  6),  name: 'Kopi Kapal Api 65g',  category: 'Minuman', unit: 'pcs', convUnit: 'karton', convRate: 36, buyPrice:  5500, sellPrice:  7000, stock:  72, minStock: 36 },
  { key: 7,  tenantId: 1, storeId: 1, sku: genSku(1,  7),  name: 'Beng-beng',           category: 'Snack',   unit: 'pcs', convUnit: 'dus',    convRate: 60, buyPrice:  1800, sellPrice:  2500, stock: 180, minStock: 60 },
  { key: 8,  tenantId: 1, storeId: 1, sku: genSku(1,  8),  name: 'Chitato Original',    category: 'Snack',   unit: 'pcs', convUnit: 'karton', convRate: 24, buyPrice:  8000, sellPrice: 10000, stock:  48, minStock: 24 },
  { key: 9,  tenantId: 1, storeId: 1, sku: genSku(1,  9),  name: 'Good Day Mocca',      category: 'Minuman', unit: 'pcs', convUnit: 'karton', convRate: 24, buyPrice:  4500, sellPrice:  5500, stock:  36, minStock: 24 },
  { key: 10, tenantId: 1, storeId: 1, sku: genSku(1, 10),  name: 'Oreo Original',       category: 'Snack',   unit: 'pcs', convUnit: 'karton', convRate: 24, buyPrice:  7000, sellPrice:  8500, stock:  60, minStock: 24 },
  { key: 11, tenantId: 1, storeId: 1, sku: genSku(1, 11),  name: 'Supermi Ayam Bawang', category: 'Makanan', unit: 'pcs', convUnit: 'dus',    convRate: 40, buyPrice:  2200, sellPrice:  3000, stock: 150, minStock: 40 },
  { key: 12, tenantId: 1, storeId: 1, sku: genSku(1, 12),  name: 'Pop Ice Coklat',      category: 'Minuman', unit: 'pcs', convUnit: 'karton', convRate: 48, buyPrice:  1500, sellPrice:  2000, stock:  90, minStock: 48 },
]

// ─── Transactions ─────────────────────────────────────────────────────────────
// transactionCode: TRX-{YYYYMMDD}-{NNN} — sesuai FSD

export const transactions = [
  {
    key: 1, tenantId: 1, storeId: 1,
    code: 'TRX-20260519-001', time: '08:45', cashier: 'Ani Rahayu',
    items: 3, total: 17000, paid: 20000, change: 3000, method: 'Cash',
    details: [
      { name: 'Aqua 600ml',    qty: 2, price: 3500 },
      { name: 'Indomie Goreng',qty: 2, price: 3500 },
      { name: 'Beng-beng',     qty: 2, price: 2500 },
    ],
  },
  {
    key: 2, tenantId: 1, storeId: 1,
    code: 'TRX-20260519-002', time: '09:12', cashier: 'Bowo Santoso',
    items: 4, total: 27500, paid: 30000, change: 2500, method: 'Cash',
    details: [
      { name: 'Chitato Original', qty: 1, price: 10000 },
      { name: 'Teh Botol 350ml',  qty: 2, price:  5000 },
      { name: 'Aqua 1500ml',      qty: 1, price:  6000 },
      { name: 'Beng-beng',        qty: 1, price:  2500 },
    ],
  },
  {
    key: 3, tenantId: 1, storeId: 1,
    code: 'TRX-20260519-003', time: '09:34', cashier: 'Ani Rahayu',
    items: 1, total: 10500, paid: 50000, change: 39500, method: 'Cash',
    details: [
      { name: 'Indomie Goreng', qty: 3, price: 3500 },
    ],
  },
  {
    key: 4, tenantId: 1, storeId: 1,
    code: 'TRX-20260519-004', time: '10:05', cashier: 'Ani Rahayu',
    items: 4, total: 38000, paid: 40000, change: 2000, method: 'Cash',
    details: [
      { name: 'Kopi Kapal Api 65g', qty: 2, price: 7000 },
      { name: 'Oreo Original',      qty: 1, price: 8500 },
      { name: 'Good Day Mocca',     qty: 1, price: 5500 },
      { name: 'Aqua 600ml',         qty: 3, price: 3500 },
    ],
  },
  {
    key: 5, tenantId: 1, storeId: 1,
    code: 'TRX-20260519-005', time: '10:22', cashier: 'Bowo Santoso',
    items: 2, total: 13000, paid: 15000, change: 2000, method: 'Cash',
    details: [
      { name: 'Pop Ice Coklat',      qty: 2, price: 2000 },
      { name: 'Supermi Ayam Bawang', qty: 3, price: 3000 },
    ],
  },
]

// ─── Stock Movements (dummy riwayat stok masuk) ───────────────────────────────
// movementCode: STK-IN-{YYYYMMDD}-{NNN}

export const stockMovements = [
  {
    key: 1, tenantId: 1, storeId: 1,
    movementCode: genMovementCode('IN', '2026-05-18', 1),
    type: 'IN', productKey: 1, productName: 'Aqua 600ml',
    qty: 48, unit: 'pcs', qtyBefore: 72, qtyAfter: 120,
    note: 'Restock mingguan', createdBy: 'Muhammad Rizal', date: '2026-05-18',
  },
  {
    key: 2, tenantId: 1, storeId: 1,
    movementCode: genMovementCode('IN', '2026-05-18', 2),
    type: 'IN', productKey: 3, productName: 'Indomie Goreng',
    qty: 80, unit: 'pcs', qtyBefore: 120, qtyAfter: 200,
    note: 'Restock mingguan', createdBy: 'Muhammad Rizal', date: '2026-05-18',
  },
  {
    key: 3, tenantId: 1, storeId: 2,
    movementCode: genMovementCode('IN', '2026-05-15', 1),
    type: 'IN', productKey: 7, productName: 'Beng-beng',
    qty: 120, unit: 'pcs', qtyBefore: 60, qtyAfter: 180,
    note: 'Stok hampir habis', createdBy: 'Siti Nurhaliza', date: '2026-05-15',
  },
]

// ─── Stock Conversions (dummy riwayat convert stok) ───────────────────────────
// movementCode: STK-CVT-{YYYYMMDD}-{NNN}

export const stockConversions = [
  {
    key: 1, tenantId: 1, storeId: 1,
    movementCode: genMovementCode('CVT', '2026-05-19', 1),
    productName: 'Aqua 600ml',
    fromQty: 2, fromUnit: 'dus', toQty: 48, toUnit: 'pcs',
    stockBefore: 72, stockAfter: 120,
    createdBy: 'Ani Rahayu', time: '08:30', date: '2026-05-19',
  },
  {
    key: 2, tenantId: 1, storeId: 1,
    movementCode: genMovementCode('CVT', '2026-05-19', 2),
    productName: 'Indomie Goreng',
    fromQty: 1, fromUnit: 'dus', toQty: 40, toUnit: 'pcs',
    stockBefore: 160, stockAfter: 200,
    createdBy: 'Bowo Santoso', time: '09:15', date: '2026-05-19',
  },
]

// ─── Stock Opname Items (detail per produk per opname) ────────────────────────

export const stockOpnameItems: Record<number, {
  productKey: number; productName: string; unit: string
  qtySystem: number; qtyActual: number; difference: number; reason?: string
}[]> = {
  // Opname key=1 (2026-05-19, semua 12 produk diisi)
  1: [
    { productKey: 1,  productName: 'Aqua 600ml',          unit: 'pcs', qtySystem: 120, qtyActual: 118, difference: -2,  reason: 'Barang rusak / tidak layak jual' },
    { productKey: 2,  productName: 'Aqua 1500ml',         unit: 'pcs', qtySystem:  60, qtyActual:  60, difference:  0 },
    { productKey: 3,  productName: 'Indomie Goreng',      unit: 'pcs', qtySystem: 200, qtyActual: 198, difference: -2,  reason: 'Selisih penghitungan manual' },
    { productKey: 4,  productName: 'Indomie Soto',        unit: 'pcs', qtySystem:   8, qtyActual:   8, difference:  0 },
    { productKey: 5,  productName: 'Teh Botol 350ml',     unit: 'pcs', qtySystem:   3, qtyActual:   5, difference: +2,  reason: 'Pengembalian barang dari pelanggan' },
    { productKey: 6,  productName: 'Kopi Kapal Api 65g',  unit: 'pcs', qtySystem:  72, qtyActual:  72, difference:  0 },
    { productKey: 7,  productName: 'Beng-beng',           unit: 'pcs', qtySystem: 180, qtyActual: 179, difference: -1,  reason: 'Kehilangan / dicuri' },
    { productKey: 8,  productName: 'Chitato Original',    unit: 'pcs', qtySystem:  48, qtyActual:  48, difference:  0 },
    { productKey: 9,  productName: 'Good Day Mocca',      unit: 'pcs', qtySystem:  36, qtyActual:  36, difference:  0 },
    { productKey: 10, productName: 'Oreo Original',       unit: 'pcs', qtySystem:  60, qtyActual:  60, difference:  0 },
    { productKey: 11, productName: 'Supermi Ayam Bawang', unit: 'pcs', qtySystem: 150, qtyActual: 150, difference:  0 },
    { productKey: 12, productName: 'Pop Ice Coklat',      unit: 'pcs', qtySystem:  90, qtyActual:  92, difference: +2,  reason: 'Stok bonus dari supplier' },
  ],
  // Opname key=2 (2026-05-12, 10 dari 12 produk diisi)
  2: [
    { productKey: 1,  productName: 'Aqua 600ml',          unit: 'pcs', qtySystem:  96, qtyActual:  95, difference: -1,  reason: 'Kesalahan input stok sebelumnya' },
    { productKey: 2,  productName: 'Aqua 1500ml',         unit: 'pcs', qtySystem:  48, qtyActual:  48, difference:  0 },
    { productKey: 3,  productName: 'Indomie Goreng',      unit: 'pcs', qtySystem: 160, qtyActual: 160, difference:  0 },
    { productKey: 4,  productName: 'Indomie Soto',        unit: 'pcs', qtySystem:  20, qtyActual:  18, difference: -2,  reason: 'Barang rusak / tidak layak jual' },
    { productKey: 5,  productName: 'Teh Botol 350ml',     unit: 'pcs', qtySystem:  24, qtyActual:  24, difference:  0 },
    { productKey: 6,  productName: 'Kopi Kapal Api 65g',  unit: 'pcs', qtySystem:  36, qtyActual:  36, difference:  0 },
    { productKey: 7,  productName: 'Beng-beng',           unit: 'pcs', qtySystem: 120, qtyActual: 122, difference: +2,  reason: 'Pengembalian barang dari pelanggan' },
    { productKey: 8,  productName: 'Chitato Original',    unit: 'pcs', qtySystem:  24, qtyActual:  24, difference:  0 },
    { productKey: 9,  productName: 'Good Day Mocca',      unit: 'pcs', qtySystem:  24, qtyActual:  24, difference:  0 },
    { productKey: 10, productName: 'Oreo Original',       unit: 'pcs', qtySystem:  48, qtyActual:  48, difference:  0 },
    // 2 produk tidak diisi di opname ini (key 11, 12 skip)
  ],
}

// ─── Stock Opnames (dummy riwayat opname) ─────────────────────────────────────
// opnameCode: OPN-{YYYYMMDD}-{NN}

export const stockOpnames = [
  {
    key: 1, tenantId: 1, storeId: 1,
    opnameCode: genOpnameCode('2026-05-19', 1),
    opnameDate: '2026-05-19', createdBy: 'Muhammad Rizal',
    status: 'COMPLETED', filledCount: 12, totalCount: 12,
  },
  {
    key: 2, tenantId: 1, storeId: 1,
    opnameCode: genOpnameCode('2026-05-12', 1),
    opnameDate: '2026-05-12', createdBy: 'Ani Rahayu',
    status: 'COMPLETED', filledCount: 10, totalCount: 12,
  },
]
