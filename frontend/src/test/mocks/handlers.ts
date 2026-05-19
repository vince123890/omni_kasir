import { http, HttpResponse } from 'msw'

const BASE = '/api'

// ── Auth ────────────────────────────────────────────────────────────────────

export const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }

    if (email === 'admin@omnikasir.com' && password === 'admin123') {
      return HttpResponse.json({
        statusCode: 200, message: 'Berhasil',
        data: {
          accessToken: 'mock-access-token-admin',
          refreshToken: 'mock-refresh-token-admin',
          user: { id: 1, name: 'Super Admin', email, role: 'admin', tenantId: null, storeId: null },
        },
      })
    }
    if (email === 'budi@majujaya.com' && password === 'budi123') {
      return HttpResponse.json({
        statusCode: 200, message: 'Berhasil',
        data: {
          accessToken: 'mock-access-token-owner',
          refreshToken: 'mock-refresh-token-owner',
          user: { id: 2, name: 'Budi Santoso', email, role: 'owner', tenantId: 1, storeId: null },
        },
      })
    }
    if (email === 'rizal@majujaya.com' && password === 'rizal123') {
      return HttpResponse.json({
        statusCode: 200, message: 'Berhasil',
        data: {
          accessToken: 'mock-access-token-store',
          refreshToken: 'mock-refresh-token-store',
          user: { id: 8, name: 'Muhammad Rizal', email, role: 'admin_store', tenantId: 1, storeId: 1 },
        },
      })
    }
    if (email === 'ani@majujaya.com' && password === 'ani123') {
      return HttpResponse.json({
        statusCode: 200, message: 'Berhasil',
        data: {
          accessToken: 'mock-access-token-kasir',
          refreshToken: 'mock-refresh-token-kasir',
          user: { id: 11, name: 'Ani Rahayu', email, role: 'kasir', tenantId: 1, storeId: 1 },
        },
      })
    }
    return HttpResponse.json({ statusCode: 401, message: 'Email atau password salah' }, { status: 401 })
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        id: 8, name: 'Muhammad Rizal', email: 'rizal@majujaya.com', role: 'admin_store',
        tenantId: 1, storeId: 1,
        tenantName: 'Maju Jaya Sejahtera', tenantEntityType: 'PT',
        storeName: 'Toko Pusat Sudirman', planName: 'Pro', expiredAt: '2026-08-15',
      },
    })
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ statusCode: 200, message: 'Logout berhasil' })
  }),

  http.patch(`${BASE}/auth/change-password`, async ({ request }) => {
    const body = await request.json() as Record<string, string>
    if (body.oldPassword === 'wrongpass') {
      return HttpResponse.json({ statusCode: 400, message: 'Password lama tidak sesuai' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 200, message: 'Password berhasil diubah' })
  }),
]

// ── Admin ───────────────────────────────────────────────────────────────────

export const adminHandlers = [
  http.get(`${BASE}/admin/tenants`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') ?? ''
    const tenants = [
      { id: 1, tenantCode: 'TNT-202508-001', entityType: 'PT', name: 'Maju Jaya Sejahtera', fullName: 'PT Maju Jaya Sejahtera', owner: 'Budi Santoso', email: 'budi@majujaya.com', plan: 'Pro', status: 'aktif', expired: '2026-08-15', joinDate: '2025-08-15' },
      { id: 2, tenantCode: 'TNT-202506-002', entityType: 'CV', name: 'Warung Bu Sari', fullName: 'CV Warung Bu Sari', owner: 'Sari Dewi', email: 'sari@warung.com', plan: 'Basic', status: 'aktif', expired: '2026-06-01', joinDate: '2025-06-01' },
      { id: 4, tenantCode: 'TNT-202511-004', entityType: 'UD', name: 'Toko Pak Agus', fullName: 'UD Toko Pak Agus', owner: 'Agus Setiawan', email: 'agus@toko.com', plan: 'Basic', status: 'nonaktif', expired: '2026-05-10', joinDate: '2025-11-10' },
    ].filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: { data: tenants, meta: { total: tenants.length, page: 1, limit: 10, totalPages: 1 } },
    })
  }),

  http.get(`${BASE}/admin/subscription-plans`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: [
        { id: 1, name: 'Basic', price: 99000, durationDays: 30, maxStores: 1, maxCashiersPerStore: 2, isActive: true, isPopular: false, tenantCount: 2 },
        { id: 2, name: 'Pro', price: 299000, durationDays: 30, maxStores: 5, maxCashiersPerStore: 5, isActive: true, isPopular: true, tenantCount: 2 },
        { id: 3, name: 'Enterprise', price: 699000, durationDays: 30, maxStores: 999, maxCashiersPerStore: 999, isActive: true, isPopular: false, tenantCount: 1 },
      ],
    })
  }),

  http.get(`${BASE}/admin/users`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: [
        { id: 1, name: 'Super Admin', email: 'admin@omnikasir.com', isActive: true, createdAt: '2025-01-01', lastLogin: '2026-05-19T07:00:00Z' },
      ],
    })
  }),

  http.post(`${BASE}/admin/users`, async ({ request }) => {
    const body = await request.json() as Record<string, string>
    if (body.email === 'admin@omnikasir.com') {
      return HttpResponse.json({ statusCode: 409, message: 'Email sudah digunakan' }, { status: 409 })
    }
    return HttpResponse.json({
      statusCode: 201, message: 'Admin berhasil ditambahkan',
      data: { id: 99, name: body.name, email: body.email, isActive: true, createdAt: '2026-05-19' },
    }, { status: 201 })
  }),
]

// ── Owner ───────────────────────────────────────────────────────────────────

export const ownerHandlers = [
  http.get(`${BASE}/owner/stores`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, storeCode: 'STR-2508-0101', name: 'Toko Pusat Sudirman', address: 'Jl. Sudirman No. 10', phone: '021-12345678', kasirCount: 2, maxKasir: 5, txMonth: 5, revenue: 'Rp 106 rb', isActive: true, createdAt: '2025-08-15T00:00:00Z' },
          { id: 2, storeCode: 'STR-2509-0102', name: 'Cabang Margonda Depok', address: 'Jl. Margonda No. 45', phone: '021-87654321', kasirCount: 2, maxKasir: 5, txMonth: 0, revenue: 'Rp 0', isActive: true, createdAt: '2025-09-15T00:00:00Z' },
        ],
        meta: { totalStores: 2, maxStores: 5, maxCashiersPerStore: 5, planName: 'Pro' },
      },
    })
  }),

  http.post(`${BASE}/owner/stores`, async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({
      statusCode: 201, message: 'Store berhasil ditambahkan',
      data: { id: 4, storeCode: 'STR-2605-0104', name: body.name },
    }, { status: 201 })
  }),

  http.get(`${BASE}/owner/users`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 8, name: 'Muhammad Rizal', email: 'rizal@majujaya.com', role: 'admin_store', storeId: 1, storeName: 'Toko Pusat Sudirman', isActive: true, lastLogin: null },
          { id: 11, name: 'Ani Rahayu', email: 'ani@majujaya.com', role: 'kasir', storeId: 1, storeName: 'Toko Pusat Sudirman', isActive: true, lastLogin: '2026-05-19T08:23:00Z' },
          { id: 12, name: 'Bowo Santoso', email: 'bowo@majujaya.com', role: 'kasir', storeId: 1, storeName: 'Toko Pusat Sudirman', isActive: true, lastLogin: '2026-05-19T07:55:00Z' },
          { id: 13, name: 'Citra Dewi', email: 'citra@majujaya.com', role: 'kasir', storeId: 1, storeName: 'Toko Pusat Sudirman', isActive: false, lastLogin: null },
        ],
        meta: { total: 4, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.get(`${BASE}/owner/transactions`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 5, transactionCode: 'TRX-20260519-005', storeId: 1, storeName: 'Toko Pusat Sudirman', cashierId: 12, cashierName: 'Bowo Santoso', totalAmount: 13000, paidAmount: 15000, changeAmount: 2000, paymentMethod: 'CASH', status: 'COMPLETED', createdAt: '2026-05-19T15:00:00Z', items: [{ productId: 12, productName: 'Pop Ice Coklat', qty: 2, price: 2000, subtotal: 4000 }] },
          { id: 1, transactionCode: 'TRX-20260519-001', storeId: 1, storeName: 'Toko Pusat Sudirman', cashierId: 11, cashierName: 'Ani Rahayu', totalAmount: 17000, paidAmount: 20000, changeAmount: 3000, paymentMethod: 'CASH', status: 'COMPLETED', createdAt: '2026-05-19T08:45:00Z', items: [{ productId: 1, productName: 'Aqua 600ml', qty: 2, price: 3500, subtotal: 7000 }] },
        ],
        meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),
]

// ── Admin Store ──────────────────────────────────────────────────────────────

export const storeHandlers = [
  http.get(`${BASE}/admin-store/products`, ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    const products = [
      { id: 1, sku: 'PRD-01-001', name: 'Aqua 600ml', category: 'Minuman', unit: 'pcs', conversionUnit: 'dus', conversionRate: 24, buyPrice: 2500, sellPrice: 3500, stock: 120, minStock: 48, stockStatus: 'aman', isActive: true },
      { id: 4, sku: 'PRD-01-004', name: 'Indomie Soto', category: 'Makanan', unit: 'pcs', conversionUnit: 'dus', conversionRate: 40, buyPrice: 2800, sellPrice: 3500, stock: 8, minStock: 20, stockStatus: 'menipis', isActive: true },
      { id: 5, sku: 'PRD-01-005', name: 'Teh Botol 350ml', category: 'Minuman', unit: 'pcs', conversionUnit: 'dus', conversionRate: 24, buyPrice: 4000, sellPrice: 5000, stock: 3, minStock: 24, stockStatus: 'kritis', isActive: true },
    ]
    const filtered = filter === 'low-stock' ? products.filter(p => p.stock <= p.minStock) : products
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: { data: filtered, meta: { total: filtered.length, page: 1, limit: 10, totalPages: 1 } },
    })
  }),

  http.post(`${BASE}/admin-store/products`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      statusCode: 201, message: 'Produk berhasil ditambahkan',
      data: { id: 99, sku: 'PRD-01-099', name: body.name, stock: body.initialStock ?? 0 },
    }, { status: 201 })
  }),

  http.delete(`${BASE}/admin-store/products/:id`, ({ params }) => {
    if (params.id === '1') {
      return HttpResponse.json({ statusCode: 400, message: 'Produk tidak dapat dihapus karena sudah pernah ada di transaksi penjualan.' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 200, message: 'Produk berhasil dihapus' })
  }),

  http.get(`${BASE}/admin-store/stocks/movements`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, movementCode: 'STK-IN-20260518-001', type: 'IN', productId: 1, productName: 'Aqua 600ml', qty: 48, qtyBefore: 72, qtyAfter: 120, note: 'Restock mingguan', createdByName: 'Muhammad Rizal', createdAt: '2026-05-18T09:00:00Z' },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.get(`${BASE}/admin-store/stocks/opname`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, opnameCode: 'OPN-20260519-01', opnameDate: '2026-05-19', createdByName: 'Muhammad Rizal', status: 'COMPLETED', filledCount: 12, totalCount: 12, selisihCount: 4 },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.get(`${BASE}/admin-store/stocks/convert`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, movementCode: 'STK-CVT-20260519-001', productId: 1, productName: 'Aqua 600ml', fromQty: 2, fromUnit: 'dus', toQty: 48, toUnit: 'pcs', stockBefore: 72, stockAfter: 120, createdByName: 'Ani Rahayu', createdAt: '2026-05-19T08:30:00Z' },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.get(`${BASE}/admin-store/transactions`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, transactionCode: 'TRX-20260519-001', cashierId: 11, cashierName: 'Ani Rahayu', totalAmount: 17000, paidAmount: 20000, changeAmount: 3000, paymentMethod: 'CASH', status: 'COMPLETED', createdAt: '2026-05-19T08:45:00Z', items: [{ productId: 1, productName: 'Aqua 600ml', qty: 2, price: 3500, subtotal: 7000 }] },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),
]

// ── Kasir ────────────────────────────────────────────────────────────────────

export const kasirHandlers = [
  http.get(`${BASE}/kasir/products`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, sku: 'PRD-01-001', name: 'Aqua 600ml', category: 'Minuman', unit: 'pcs', conversionUnit: 'dus', conversionRate: 24, buyPrice: 2500, sellPrice: 3500, stock: 120, minStock: 48, stockStatus: 'aman', isActive: true },
          { id: 3, sku: 'PRD-01-003', name: 'Indomie Goreng', category: 'Makanan', unit: 'pcs', conversionUnit: 'dus', conversionRate: 40, buyPrice: 2800, sellPrice: 3500, stock: 200, minStock: 40, stockStatus: 'aman', isActive: true },
          { id: 7, sku: 'PRD-01-007', name: 'Beng-beng', category: 'Snack', unit: 'pcs', conversionUnit: 'dus', conversionRate: 60, buyPrice: 1800, sellPrice: 2500, stock: 180, minStock: 60, stockStatus: 'aman', isActive: true },
        ],
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.post(`${BASE}/kasir/transactions`, async ({ request }) => {
    const body = await request.json() as { items: Array<{ productId: number; qty: number }>; paidAmount: number }
    const totalAmount = body.items.reduce((s, i) => s + (i.productId === 1 ? 3500 : 2500) * i.qty, 0)
    if (body.paidAmount < totalAmount) {
      return HttpResponse.json({ statusCode: 400, message: 'Nominal bayar kurang dari total transaksi' }, { status: 400 })
    }
    return HttpResponse.json({
      statusCode: 201, message: 'Transaksi berhasil',
      data: { transactionCode: 'TRX-20260519-006', totalAmount, paidAmount: body.paidAmount, changeAmount: body.paidAmount - totalAmount, paymentMethod: 'CASH', items: [] },
    }, { status: 201 })
  }),

  http.get(`${BASE}/kasir/transactions`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: {
        data: [
          { id: 1, transactionCode: 'TRX-20260519-001', cashierId: 11, cashierName: 'Ani Rahayu', totalAmount: 17000, paidAmount: 20000, changeAmount: 3000, paymentMethod: 'CASH', status: 'COMPLETED', createdAt: '2026-05-19T08:45:00Z', items: [{ productId: 1, productName: 'Aqua 600ml', qty: 2, price: 3500, subtotal: 7000 }, { productId: 3, productName: 'Indomie Goreng', qty: 2, price: 3500, subtotal: 7000 }] },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    })
  }),

  http.get(`${BASE}/kasir/stocks/opname`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
    })
  }),

  http.get(`${BASE}/kasir/stocks/convert`, () => {
    return HttpResponse.json({
      statusCode: 200, message: 'Berhasil',
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
    })
  }),
]

export const handlers = [...authHandlers, ...adminHandlers, ...ownerHandlers, ...storeHandlers, ...kasirHandlers]
