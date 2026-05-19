import { AppDataSource } from '../../data-source'
import { SubscriptionPlan } from '../entities/subscription-plan.entity'
import { Subscription } from '../entities/subscription.entity'
import { Tenant } from '../entities/tenant.entity'
import { User } from '../entities/user.entity'
import { Store } from '../entities/store.entity'
import { Product } from '../entities/product.entity'
import { StockMovement } from '../entities/stock-movement.entity'
import { StockOpname } from '../entities/stock-opname.entity'
import { StockOpnameItem } from '../entities/stock-opname-item.entity'
import { Transaction } from '../entities/transaction.entity'
import { TransactionItem } from '../entities/transaction-item.entity'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
dotenv.config()

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10')

async function hashPw(plain: string) {
  return bcrypt.hash(plain, ROUNDS)
}

async function seed() {
  await AppDataSource.initialize()
  console.log('✅ Database connected')

  const planRepo       = AppDataSource.getRepository(SubscriptionPlan)
  const subRepo        = AppDataSource.getRepository(Subscription)
  const tenantRepo     = AppDataSource.getRepository(Tenant)
  const userRepo       = AppDataSource.getRepository(User)
  const storeRepo      = AppDataSource.getRepository(Store)
  const productRepo    = AppDataSource.getRepository(Product)
  const movementRepo   = AppDataSource.getRepository(StockMovement)
  const opnameRepo     = AppDataSource.getRepository(StockOpname)
  const opnameItemRepo = AppDataSource.getRepository(StockOpnameItem)
  const txRepo         = AppDataSource.getRepository(Transaction)
  const txItemRepo     = AppDataSource.getRepository(TransactionItem)

  // ── 1. Subscription Plans ───────────────────────────────────────────────────
  const planDefs = [
    { name: 'Basic',      price: 99000,  durationDays: 30,  maxStores: 1,   maxCashiersPerStore: 2,   isActive: true, isPopular: false },
    { name: 'Pro',        price: 299000, durationDays: 30,  maxStores: 5,   maxCashiersPerStore: 5,   isActive: true, isPopular: true  },
    { name: 'Enterprise', price: 699000, durationDays: 30,  maxStores: 999, maxCashiersPerStore: 999, isActive: true, isPopular: false },
  ]
  const planMap: Record<string, SubscriptionPlan> = {}
  for (const def of planDefs) {
    let plan = await planRepo.findOne({ where: { name: def.name } })
    if (!plan) { plan = await planRepo.save(planRepo.create(def)); console.log(`✅ Plan "${def.name}" seeded`) }
    else console.log(`⏭  Plan "${def.name}" already exists`)
    planMap[def.name] = plan
  }

  // ── 2. Super Admin ──────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@omnikasir.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const adminName     = process.env.ADMIN_NAME     || 'Super Admin'
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } })
  if (!adminUser) {
    adminUser = await userRepo.save(userRepo.create({ name: adminName, email: adminEmail, password: await hashPw(adminPassword), role: 'admin', isActive: true }))
    console.log(`✅ Super Admin "${adminEmail}" seeded`)
  } else console.log(`⏭  Super Admin "${adminEmail}" already exists`)

  // ── 3. Tenants + Owner Users + Subscriptions ────────────────────────────────
  const tenantDefs = [
    { tenantCode: 'TNT-202508-001', entityType: 'PT' as const, name: 'Maju Jaya Sejahtera',  fullName: 'PT Maju Jaya Sejahtera',  isActive: true,  plan: 'Pro',        startAt: '2025-08-15', expiredAt: '2026-05-24', ownerName: 'Budi Santoso',   ownerEmail: 'budi@majujaya.com',  ownerPw: 'budi123'  },
    { tenantCode: 'TNT-202506-002', entityType: 'CV' as const, name: 'Warung Bu Sari',        fullName: 'CV Warung Bu Sari',        isActive: true,  plan: 'Basic',      startAt: '2025-06-01', expiredAt: '2026-06-01', ownerName: 'Sari Dewi',      ownerEmail: 'sari@warung.com',    ownerPw: 'sari123'  },
    { tenantCode: 'TNT-202501-003', entityType: 'PT' as const, name: 'Rezeki Abadi Mandiri',  fullName: 'PT Rezeki Abadi Mandiri',  isActive: true,  plan: 'Enterprise', startAt: '2025-01-01', expiredAt: '2026-12-31', ownerName: 'Hendra Kusuma',  ownerEmail: 'hendra@rezeki.com',  ownerPw: 'hendra123'},
    { tenantCode: 'TNT-202511-004', entityType: 'UD' as const, name: 'Toko Pak Agus',         fullName: 'UD Toko Pak Agus',         isActive: false, plan: 'Basic',      startAt: '2025-11-10', expiredAt: '2026-05-10', ownerName: 'Agus Setiawan',  ownerEmail: 'agus@toko.com',      ownerPw: 'agus123'  },
    { tenantCode: 'TNT-202507-005', entityType: 'CV' as const, name: 'Barokah Jaya Abadi',    fullName: 'CV Barokah Jaya Abadi',    isActive: true,  plan: 'Pro',        startAt: '2025-07-20', expiredAt: '2026-07-20', ownerName: 'Rina Marlina',   ownerEmail: 'rina@barokah.com',   ownerPw: 'rina123'  },
    { tenantCode: 'TNT-202509-006', entityType: 'UD' as const, name: 'Sumber Rejeki',          fullName: 'UD Sumber Rejeki',          isActive: false, plan: 'Basic',      startAt: '2025-09-05', expiredAt: '2026-09-05', ownerName: 'Dian Pertiwi',   ownerEmail: 'dian@sumber.com',    ownerPw: 'dian123'  },
  ]

  const tenantIds: number[] = []
  for (const def of tenantDefs) {
    let tenant = await tenantRepo.findOne({ where: { tenantCode: def.tenantCode } })
    if (!tenant) {
      tenant = await tenantRepo.save(tenantRepo.create({ tenantCode: def.tenantCode, entityType: def.entityType, name: def.name, fullName: def.fullName, isActive: def.isActive }))
      console.log(`✅ Tenant "${def.fullName}" seeded`)
    } else console.log(`⏭  Tenant "${def.fullName}" already exists`)
    tenantIds.push(tenant.id)

    // Owner user
    let owner = await userRepo.findOne({ where: { email: def.ownerEmail } })
    if (!owner) {
      owner = await userRepo.save(userRepo.create({ name: def.ownerName, email: def.ownerEmail, password: await hashPw(def.ownerPw), role: 'owner', tenantId: tenant.id, isActive: def.isActive }))
      console.log(`  ✅ Owner "${def.ownerEmail}" seeded`)
    } else console.log(`  ⏭  Owner "${def.ownerEmail}" already exists`)

    // Subscription
    const existingSub = await subRepo.findOne({ where: { tenantId: tenant.id } })
    if (!existingSub) {
      const plan = planMap[def.plan]
      await subRepo.save(subRepo.create({ tenantId: tenant.id, planId: plan.id, startAt: new Date(def.startAt), expiredAt: new Date(def.expiredAt), isActive: def.isActive }))
      console.log(`  ✅ Subscription "${def.plan}" for "${def.name}" seeded`)
    } else console.log(`  ⏭  Subscription for "${def.name}" already exists`)
  }

  const [t1Id] = tenantIds  // Maju Jaya Sejahtera = first tenant

  // ── 4. Stores (for tenant 1) ────────────────────────────────────────────────
  const storeDefs = [
    { storeCode: 'STR-2508-0101', tenantId: t1Id, name: 'Toko Pusat Sudirman',      address: 'Jl. Sudirman No. 10, Jakarta Pusat', phone: '021-12345678', isActive: true },
    { storeCode: 'STR-2509-0102', tenantId: t1Id, name: 'Cabang Margonda Depok',    address: 'Jl. Margonda No. 45, Depok',          phone: '021-87654321', isActive: true },
    { storeCode: 'STR-2510-0103', tenantId: t1Id, name: 'Cabang Ahmad Yani Bekasi', address: 'Jl. Ahmad Yani No. 22, Bekasi',        phone: '021-11223344', isActive: true },
  ]
  const storeIds: number[] = []
  for (const def of storeDefs) {
    let store = await storeRepo.findOne({ where: { storeCode: def.storeCode } })
    if (!store) {
      store = await storeRepo.save(storeRepo.create(def))
      console.log(`✅ Store "${def.name}" seeded`)
    } else console.log(`⏭  Store "${def.name}" already exists`)
    storeIds.push(store.id)
  }
  const [s1Id, s2Id, s3Id] = storeIds

  // ── 5. Admin Store Users ─────────────────────────────────────────────────────
  const adminStoreDefs = [
    { name: 'Muhammad Rizal', email: 'rizal@majujaya.com', pw: 'rizal123',  tenantId: t1Id, storeId: s1Id },
    { name: 'Siti Nurhaliza', email: 'siti@majujaya.com',  pw: 'siti123',   tenantId: t1Id, storeId: s2Id },
    { name: 'Brama Wijaya',   email: 'brama@majujaya.com', pw: 'brama123',  tenantId: t1Id, storeId: s3Id },
  ]
  const adminStoreIds: Record<number, number> = {}  // storeId -> userId
  for (const def of adminStoreDefs) {
    let u = await userRepo.findOne({ where: { email: def.email } })
    if (!u) {
      u = await userRepo.save(userRepo.create({ name: def.name, email: def.email, password: await hashPw(def.pw), role: 'admin_store', tenantId: def.tenantId, storeId: def.storeId, isActive: true }))
      console.log(`✅ AdminStore "${def.email}" seeded`)
    } else console.log(`⏭  AdminStore "${def.email}" already exists`)
    adminStoreIds[def.storeId] = u.id
  }

  // ── 6. Kasir Users ──────────────────────────────────────────────────────────
  const kasirDefs = [
    { name: 'Ani Rahayu',    email: 'ani@majujaya.com',   pw: 'ani123',    tenantId: t1Id, storeId: s1Id, isActive: true  },
    { name: 'Bowo Santoso',  email: 'bowo@majujaya.com',  pw: 'bowo123',   tenantId: t1Id, storeId: s1Id, isActive: true  },
    { name: 'Citra Dewi',    email: 'citra@majujaya.com', pw: 'citra123',  tenantId: t1Id, storeId: s1Id, isActive: false },
    { name: 'Dani Pratama',  email: 'dani@majujaya.com',  pw: 'dani123',   tenantId: t1Id, storeId: s2Id, isActive: true  },
    { name: 'Eka Sari',      email: 'eka@majujaya.com',   pw: 'eka123',    tenantId: t1Id, storeId: s2Id, isActive: true  },
    { name: 'Fajar Nugroho', email: 'fajar@majujaya.com', pw: 'fajar123',  tenantId: t1Id, storeId: s3Id, isActive: true  },
    { name: 'Gita Permata',  email: 'gita@majujaya.com',  pw: 'gita123',   tenantId: t1Id, storeId: s3Id, isActive: true  },
  ]
  const kasirIdByEmail: Record<string, number> = {}
  for (const def of kasirDefs) {
    let u = await userRepo.findOne({ where: { email: def.email } })
    if (!u) {
      u = await userRepo.save(userRepo.create({ name: def.name, email: def.email, password: await hashPw(def.pw), role: 'kasir', tenantId: def.tenantId, storeId: def.storeId, isActive: def.isActive }))
      console.log(`✅ Kasir "${def.email}" seeded`)
    } else console.log(`⏭  Kasir "${def.email}" already exists`)
    kasirIdByEmail[def.email] = u.id
  }

  const aniId  = kasirIdByEmail['ani@majujaya.com']
  const bowoId = kasirIdByEmail['bowo@majujaya.com']
  const rizalId = adminStoreIds[s1Id]

  // ── 7. Products (store 1) ───────────────────────────────────────────────────
  const productDefs = [
    { sku: 'PRD-01-001', name: 'Aqua 600ml',          category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 24, buyPrice: 2500,  sellPrice: 3500,  stock: 120, minStock: 48 },
    { sku: 'PRD-01-002', name: 'Aqua 1500ml',         category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 12, buyPrice: 4500,  sellPrice: 6000,  stock:  60, minStock: 24 },
    { sku: 'PRD-01-003', name: 'Indomie Goreng',      category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2800,  sellPrice: 3500,  stock: 200, minStock: 40 },
    { sku: 'PRD-01-004', name: 'Indomie Soto',        category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2800,  sellPrice: 3500,  stock:   8, minStock: 20 },
    { sku: 'PRD-01-005', name: 'Teh Botol 350ml',     category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 24, buyPrice: 4000,  sellPrice: 5000,  stock:   3, minStock: 24 },
    { sku: 'PRD-01-006', name: 'Kopi Kapal Api 65g',  category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 36, buyPrice: 5500,  sellPrice: 7000,  stock:  72, minStock: 36 },
    { sku: 'PRD-01-007', name: 'Beng-beng',           category: 'Snack',   unit: 'pcs', conversionUnit: 'dus',    conversionRate: 60, buyPrice: 1800,  sellPrice: 2500,  stock: 180, minStock: 60 },
    { sku: 'PRD-01-008', name: 'Chitato Original',    category: 'Snack',   unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 8000,  sellPrice: 10000, stock:  48, minStock: 24 },
    { sku: 'PRD-01-009', name: 'Good Day Mocca',      category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 4500,  sellPrice: 5500,  stock:  36, minStock: 24 },
    { sku: 'PRD-01-010', name: 'Oreo Original',       category: 'Snack',   unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 7000,  sellPrice: 8500,  stock:  60, minStock: 24 },
    { sku: 'PRD-01-011', name: 'Supermi Ayam Bawang', category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2200,  sellPrice: 3000,  stock: 150, minStock: 40 },
    { sku: 'PRD-01-012', name: 'Pop Ice Coklat',      category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 48, buyPrice: 1500,  sellPrice: 2000,  stock:  90, minStock: 48 },
  ]
  const productIdByName: Record<string, number> = {}
  for (const def of productDefs) {
    let p = await productRepo.findOne({ where: { sku: def.sku, storeId: s1Id } })
    if (!p) {
      p = await productRepo.save(productRepo.create({ ...def, storeId: s1Id, tenantId: t1Id, isActive: true }))
      console.log(`✅ Product "${def.name}" seeded`)

      // BL-013: initial stock → StockMovement IN
      const code = `STK-IN-20260101-${String(productDefs.indexOf(def) + 1).padStart(3, '0')}`
      const existingMov = await movementRepo.findOne({ where: { movementCode: code } })
      if (!existingMov) {
        await movementRepo.save(movementRepo.create({ movementCode: code, productId: p.id, storeId: s1Id, tenantId: t1Id, type: 'IN', qty: def.stock, qtyBefore: 0, qtyAfter: def.stock, note: 'Stok awal', createdBy: rizalId }))
      }
    } else console.log(`⏭  Product "${def.name}" already exists`)
    productIdByName[def.name] = p.id
  }

  // ── 8. Additional Stock Movements (IN) ─────────────────────────────────────
  const movDefs = [
    { code: 'STK-IN-20260518-001', productName: 'Aqua 600ml',     qty: 48,  qtyBefore:  72, qtyAfter: 120, note: 'Restock mingguan',       storeId: s1Id, userId: rizalId, date: '2026-05-18' },
    { code: 'STK-IN-20260518-002', productName: 'Indomie Goreng', qty: 80,  qtyBefore: 120, qtyAfter: 200, note: 'Restock mingguan',       storeId: s1Id, userId: rizalId, date: '2026-05-18' },
  ]
  for (const def of movDefs) {
    const existing = await movementRepo.findOne({ where: { movementCode: def.code } })
    if (!existing) {
      const productId = productIdByName[def.productName]
      if (productId) {
        await movementRepo.save(movementRepo.create({ movementCode: def.code, productId, storeId: def.storeId, tenantId: t1Id, type: 'IN', qty: def.qty, qtyBefore: def.qtyBefore, qtyAfter: def.qtyAfter, note: def.note, createdBy: def.userId }))
        console.log(`✅ StockMovement "${def.code}" seeded`)
      }
    } else console.log(`⏭  StockMovement "${def.code}" already exists`)
  }

  // ── 9. Stock Conversions ────────────────────────────────────────────────────
  const cvtDefs = [
    { code: 'STK-CVT-20260519-001', productName: 'Aqua 600ml',     qty: 48,  qtyBefore:  72, qtyAfter: 120, userId: aniId,  storeId: s1Id },
    { code: 'STK-CVT-20260519-002', productName: 'Indomie Goreng', qty: 40,  qtyBefore: 160, qtyAfter: 200, userId: bowoId, storeId: s1Id },
  ]
  for (const def of cvtDefs) {
    const existing = await movementRepo.findOne({ where: { movementCode: def.code } })
    if (!existing) {
      const productId = productIdByName[def.productName]
      if (productId) {
        await movementRepo.save(movementRepo.create({ movementCode: def.code, productId, storeId: def.storeId, tenantId: t1Id, type: 'CONVERT', qty: def.qty, qtyBefore: def.qtyBefore, qtyAfter: def.qtyAfter, createdBy: def.userId }))
        console.log(`✅ Conversion "${def.code}" seeded`)
      }
    } else console.log(`⏭  Conversion "${def.code}" already exists`)
  }

  // ── 10. Transactions ─────────────────────────────────────────────────────────
  const txDefs = [
    {
      code: 'TRX-20260519-001', cashierId: aniId, total: 17000, paid: 20000, change: 3000,
      items: [
        { name: 'Aqua 600ml',     qty: 2, price: 3500 },
        { name: 'Indomie Goreng', qty: 2, price: 3500 },
        { name: 'Beng-beng',      qty: 2, price: 2500 },
      ],
    },
    {
      code: 'TRX-20260519-002', cashierId: bowoId, total: 27500, paid: 30000, change: 2500,
      items: [
        { name: 'Chitato Original', qty: 1, price: 10000 },
        { name: 'Teh Botol 350ml',  qty: 2, price:  5000 },
        { name: 'Aqua 1500ml',      qty: 1, price:  6000 },
        { name: 'Beng-beng',        qty: 1, price:  2500 },
      ],
    },
    {
      code: 'TRX-20260519-003', cashierId: aniId, total: 10500, paid: 50000, change: 39500,
      items: [
        { name: 'Indomie Goreng', qty: 3, price: 3500 },
      ],
    },
    {
      code: 'TRX-20260519-004', cashierId: aniId, total: 38000, paid: 40000, change: 2000,
      items: [
        { name: 'Kopi Kapal Api 65g', qty: 2, price: 7000 },
        { name: 'Oreo Original',      qty: 1, price: 8500 },
        { name: 'Good Day Mocca',     qty: 1, price: 5500 },
        { name: 'Aqua 600ml',         qty: 3, price: 3500 },
      ],
    },
    {
      code: 'TRX-20260519-005', cashierId: bowoId, total: 13000, paid: 15000, change: 2000,
      items: [
        { name: 'Pop Ice Coklat',      qty: 2, price: 2000 },
        { name: 'Supermi Ayam Bawang', qty: 3, price: 3000 },
      ],
    },
  ]
  for (const def of txDefs) {
    const existing = await txRepo.findOne({ where: { transactionCode: def.code } })
    if (!existing) {
      const tx = await txRepo.save(txRepo.create({ transactionCode: def.code, storeId: s1Id, tenantId: t1Id, cashierId: def.cashierId, totalAmount: def.total, paidAmount: def.paid, changeAmount: def.change, paymentMethod: 'CASH', status: 'COMPLETED' }))
      for (const item of def.items) {
        const productId = productIdByName[item.name]
        if (productId) {
          await txItemRepo.save(txItemRepo.create({ transactionId: tx.id, productId, productName: item.name, qty: item.qty, price: item.price, subtotal: item.qty * item.price }))
        }
      }
      console.log(`✅ Transaction "${def.code}" seeded`)
    } else console.log(`⏭  Transaction "${def.code}" already exists`)
  }

  // ── 11. Stock Opnames ────────────────────────────────────────────────────────
  const opnameDefs: Array<{ code: string; date: string; userId: number; items: Array<{ name: string; qtySystem: number; qtyActual: number; reason?: string }> }> = [
    {
      code: 'OPN-20260519-01', date: '2026-05-19', userId: rizalId,
      items: [
        { name: 'Aqua 600ml',          qtySystem: 120, qtyActual: 118, reason: 'Barang rusak / tidak layak jual' },
        { name: 'Aqua 1500ml',         qtySystem:  60, qtyActual:  60 },
        { name: 'Indomie Goreng',      qtySystem: 200, qtyActual: 198, reason: 'Selisih penghitungan manual' },
        { name: 'Indomie Soto',        qtySystem:   8, qtyActual:   8 },
        { name: 'Teh Botol 350ml',     qtySystem:   3, qtyActual:   5, reason: 'Pengembalian barang dari pelanggan' },
        { name: 'Kopi Kapal Api 65g',  qtySystem:  72, qtyActual:  72 },
        { name: 'Beng-beng',           qtySystem: 180, qtyActual: 179, reason: 'Kehilangan / dicuri' },
        { name: 'Chitato Original',    qtySystem:  48, qtyActual:  48 },
        { name: 'Good Day Mocca',      qtySystem:  36, qtyActual:  36 },
        { name: 'Oreo Original',       qtySystem:  60, qtyActual:  60 },
        { name: 'Supermi Ayam Bawang', qtySystem: 150, qtyActual: 150 },
        { name: 'Pop Ice Coklat',      qtySystem:  90, qtyActual:  92, reason: 'Stok bonus dari supplier' },
      ],
    },
    {
      code: 'OPN-20260512-01', date: '2026-05-12', userId: aniId,
      items: [
        { name: 'Aqua 600ml',         qtySystem:  96, qtyActual:  95, reason: 'Kesalahan input stok sebelumnya' },
        { name: 'Aqua 1500ml',        qtySystem:  48, qtyActual:  48 },
        { name: 'Indomie Goreng',     qtySystem: 160, qtyActual: 160 },
        { name: 'Indomie Soto',       qtySystem:  20, qtyActual:  18, reason: 'Barang rusak / tidak layak jual' },
        { name: 'Teh Botol 350ml',    qtySystem:  24, qtyActual:  24 },
        { name: 'Kopi Kapal Api 65g', qtySystem:  36, qtyActual:  36 },
        { name: 'Beng-beng',          qtySystem: 120, qtyActual: 122, reason: 'Pengembalian barang dari pelanggan' },
        { name: 'Chitato Original',   qtySystem:  24, qtyActual:  24 },
        { name: 'Good Day Mocca',     qtySystem:  24, qtyActual:  24 },
        { name: 'Oreo Original',      qtySystem:  48, qtyActual:  48 },
      ],
    },
  ]
  for (const def of opnameDefs) {
    const existing = await opnameRepo.findOne({ where: { opnameCode: def.code } })
    if (!existing) {
      const opname = await opnameRepo.save(opnameRepo.create({ opnameCode: def.code, storeId: s1Id, tenantId: t1Id, opnameDate: new Date(def.date), createdBy: def.userId, status: 'COMPLETED' }))
      for (const item of def.items) {
        const productId = productIdByName[item.name]
        if (productId) {
          const diff = item.qtyActual - item.qtySystem
          await opnameItemRepo.save(opnameItemRepo.create({ opnameId: opname.id, productId, qtySystem: item.qtySystem, qtyActual: item.qtyActual, difference: diff, reason: item.reason }))
        }
      }
      console.log(`✅ Opname "${def.code}" seeded`)
    } else console.log(`⏭  Opname "${def.code}" already exists`)
  }

  await AppDataSource.destroy()
  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('  Login accounts:')
  console.log('  ─────────────────────────────────────────────')
  console.log(`  Super Admin  : admin@omnikasir.com  / admin123`)
  console.log(`  Owner        : budi@majujaya.com    / budi123`)
  console.log(`  Admin Store  : rizal@majujaya.com   / rizal123`)
  console.log(`  Kasir        : ani@majujaya.com     / ani123`)
  console.log('  ─────────────────────────────────────────────')
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
