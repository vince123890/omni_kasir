/**
 * seed-fresh.ts — Reset semua tabel & seed ulang dari nol
 * Jalankan: npx ts-node -r tsconfig-paths/register src/database/seed-fresh.ts
 */
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
const hash = (pw: string) => bcrypt.hash(pw, ROUNDS)

async function seedFresh() {
  await AppDataSource.initialize()
  console.log('✅ Database connected')

  const qr = AppDataSource.createQueryRunner()
  await qr.connect()

  // ── 1. Bersihkan semua tabel (urutan: child dulu, parent belakangan) ─────
  console.log('\n🗑  Membersihkan semua tabel...')
  await qr.query('SET FOREIGN_KEY_CHECKS = 0')
  await qr.query('TRUNCATE TABLE stock_opname_items')
  await qr.query('TRUNCATE TABLE stock_opnames')
  await qr.query('TRUNCATE TABLE transaction_items')
  await qr.query('TRUNCATE TABLE transactions')
  await qr.query('TRUNCATE TABLE stock_movements')
  await qr.query('TRUNCATE TABLE products')
  await qr.query('TRUNCATE TABLE stores')
  await qr.query('TRUNCATE TABLE subscriptions')
  await qr.query('TRUNCATE TABLE users')
  await qr.query('TRUNCATE TABLE tenants')
  await qr.query('TRUNCATE TABLE subscription_plans')
  await qr.query('SET FOREIGN_KEY_CHECKS = 1')
  await qr.release()
  console.log('✅ Semua tabel bersih\n')

  // ── Fix FK columns (TypeORM dual-column issue) ────────────────────────────
  // TypeORM creates both camelCase (@Column) and snake_case (@JoinColumn) columns.
  // After seeding via ORM, sync snake_case FKs agar JOIN bekerja.
  const fixQr = AppDataSource.createQueryRunner()
  await fixQr.connect()
  const fixFKs = async () => {
    const tables: [string, string[][]][] = [
      ['transaction_items',  [['transaction_id', 'transactionId'], ['product_id', 'productId']]],
      ['stock_movements',    [['product_id', 'productId'], ['store_id', 'storeId'], ['tenant_id', 'tenantId'], ['created_by', 'createdBy']]],
      ['stock_opname_items', [['opname_id', 'opnameId'], ['product_id', 'productId']]],
      ['stock_opnames',      [['store_id', 'storeId'], ['tenant_id', 'tenantId'], ['created_by', 'createdBy']]],
      ['stores',             [['tenant_id', 'tenantId']]],
      ['subscriptions',      [['tenant_id', 'tenantId'], ['plan_id', 'planId']]],
      ['users',              [['tenant_id', 'tenantId']]],
    ]
    for (const [table, cols] of tables) {
      const sets = cols.map(([snake, camel]) => `${snake}=${camel}`).join(', ')
      const where = cols.map(([snake]) => `${snake} IS NULL`).join(' OR ')
      await fixQr.query(`UPDATE ${table} SET ${sets} WHERE ${where}`)
    }
  }
  await fixFKs()
  await fixQr.release()
  console.log('✅ FK columns synced\n')

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

  // ── 2. Subscription Plans ─────────────────────────────────────────────────
  console.log('📦 Seeding subscription plans...')
  const [planBasic, planPro, planEnterprise] = await planRepo.save([
    planRepo.create({ name: 'Basic',      price: 99000,  durationDays: 30, maxStores: 1,   maxCashiersPerStore: 2,   isActive: true, isPopular: false }),
    planRepo.create({ name: 'Pro',        price: 299000, durationDays: 30, maxStores: 5,   maxCashiersPerStore: 5,   isActive: true, isPopular: true  }),
    planRepo.create({ name: 'Enterprise', price: 699000, durationDays: 30, maxStores: 999, maxCashiersPerStore: 999, isActive: true, isPopular: false }),
  ])
  console.log('  ✅ Plans: Basic, Pro, Enterprise')

  // ── 3. Super Admin ────────────────────────────────────────────────────────
  console.log('\n👤 Seeding super admin...')
  const superAdmin = await userRepo.save(userRepo.create({
    name: 'Super Admin', email: 'admin@omnikasir.com',
    password: await hash('admin123'), role: 'admin', isActive: true,
  }))
  console.log('  ✅ admin@omnikasir.com / admin123')

  // ── 4. Tenants + Owners + Subscriptions ──────────────────────────────────
  console.log('\n🏢 Seeding tenants + owners...')
  const tenantDefs = [
    { code: 'TNT-202508-001', type: 'PT' as const, name: 'Maju Jaya Sejahtera',  full: 'PT Maju Jaya Sejahtera',  active: true,  plan: planPro,        start: '2025-08-15', exp: '2026-08-15', ownerName: 'Budi Santoso',  ownerEmail: 'budi@majujaya.com',  ownerPw: 'budi123'   },
    { code: 'TNT-202506-002', type: 'CV' as const, name: 'Warung Bu Sari',        full: 'CV Warung Bu Sari',        active: true,  plan: planBasic,      start: '2025-06-01', exp: '2026-06-01', ownerName: 'Sari Dewi',     ownerEmail: 'sari@warung.com',    ownerPw: 'sari123'   },
    { code: 'TNT-202501-003', type: 'PT' as const, name: 'Rezeki Abadi Mandiri',  full: 'PT Rezeki Abadi Mandiri',  active: true,  plan: planEnterprise, start: '2025-01-01', exp: '2026-12-31', ownerName: 'Hendra Kusuma', ownerEmail: 'hendra@rezeki.com',  ownerPw: 'hendra123' },
    { code: 'TNT-202511-004', type: 'UD' as const, name: 'Toko Pak Agus',         full: 'UD Toko Pak Agus',         active: false, plan: planBasic,      start: '2025-11-10', exp: '2026-05-10', ownerName: 'Agus Setiawan', ownerEmail: 'agus@toko.com',      ownerPw: 'agus123'   },
    { code: 'TNT-202507-005', type: 'CV' as const, name: 'Barokah Jaya Abadi',    full: 'CV Barokah Jaya Abadi',    active: true,  plan: planPro,        start: '2025-07-20', exp: '2026-07-20', ownerName: 'Rina Marlina',  ownerEmail: 'rina@barokah.com',   ownerPw: 'rina123'   },
    { code: 'TNT-202509-006', type: 'UD' as const, name: 'Sumber Rejeki',          full: 'UD Sumber Rejeki',          active: false, plan: planBasic,      start: '2025-09-05', exp: '2026-09-05', ownerName: 'Dian Pertiwi',  ownerEmail: 'dian@sumber.com',    ownerPw: 'dian123'   },
  ]

  const tenants: Tenant[] = []
  for (const d of tenantDefs) {
    const tenant = await tenantRepo.save(tenantRepo.create({ tenantCode: d.code, entityType: d.type, name: d.name, fullName: d.full, isActive: d.active }))
    await userRepo.save(userRepo.create({ name: d.ownerName, email: d.ownerEmail, password: await hash(d.ownerPw), role: 'owner', tenantId: tenant.id, isActive: d.active }))
    await subRepo.save(subRepo.create({ tenantId: tenant.id, planId: d.plan.id, startAt: new Date(d.start), expiredAt: new Date(d.exp), isActive: d.active }))
    tenants.push(tenant)
    console.log(`  ✅ ${d.full} (${d.ownerEmail})`)
  }

  const t1 = tenants[0]  // PT Maju Jaya Sejahtera

  // ── 5. Stores (tenant 1) ──────────────────────────────────────────────────
  console.log('\n🏪 Seeding stores...')
  const [store1, store2, store3] = await storeRepo.save([
    storeRepo.create({ storeCode: 'STR-2508-0101', tenantId: t1.id, name: 'Toko Pusat Sudirman',      address: 'Jl. Sudirman No. 10, Jakarta Pusat', phone: '021-12345678', isActive: true }),
    storeRepo.create({ storeCode: 'STR-2509-0102', tenantId: t1.id, name: 'Cabang Margonda Depok',    address: 'Jl. Margonda No. 45, Depok',          phone: '021-87654321', isActive: true }),
    storeRepo.create({ storeCode: 'STR-2510-0103', tenantId: t1.id, name: 'Cabang Ahmad Yani Bekasi', address: 'Jl. Ahmad Yani No. 22, Bekasi',        phone: '021-11223344', isActive: true }),
  ])
  console.log('  ✅ 3 stores untuk PT Maju Jaya Sejahtera')

  // ── 6. Admin Store ────────────────────────────────────────────────────────
  console.log('\n👔 Seeding admin store...')
  const [rizal, siti, brama] = await userRepo.save([
    userRepo.create({ name: 'Muhammad Rizal', email: 'rizal@majujaya.com', password: await hash('rizal123'), role: 'admin_store', tenantId: t1.id, storeId: store1.id, isActive: true }),
    userRepo.create({ name: 'Siti Nurhaliza', email: 'siti@majujaya.com',  password: await hash('siti123'),  role: 'admin_store', tenantId: t1.id, storeId: store2.id, isActive: true }),
    userRepo.create({ name: 'Brama Wijaya',   email: 'brama@majujaya.com', password: await hash('brama123'), role: 'admin_store', tenantId: t1.id, storeId: store3.id, isActive: true }),
  ])
  console.log('  ✅ rizal (store1), siti (store2), brama (store3)')

  // ── 7. Kasir ──────────────────────────────────────────────────────────────
  console.log('\n💳 Seeding kasir...')
  const [ani, bowo, citra, dani, eka, fajar, gita] = await userRepo.save([
    userRepo.create({ name: 'Ani Rahayu',    email: 'ani@majujaya.com',   password: await hash('ani123'),   role: 'kasir', tenantId: t1.id, storeId: store1.id, isActive: true  }),
    userRepo.create({ name: 'Bowo Santoso',  email: 'bowo@majujaya.com',  password: await hash('bowo123'),  role: 'kasir', tenantId: t1.id, storeId: store1.id, isActive: true  }),
    userRepo.create({ name: 'Citra Dewi',    email: 'citra@majujaya.com', password: await hash('citra123'), role: 'kasir', tenantId: t1.id, storeId: store1.id, isActive: false }),
    userRepo.create({ name: 'Dani Pratama',  email: 'dani@majujaya.com',  password: await hash('dani123'),  role: 'kasir', tenantId: t1.id, storeId: store2.id, isActive: true  }),
    userRepo.create({ name: 'Eka Sari',      email: 'eka@majujaya.com',   password: await hash('eka123'),   role: 'kasir', tenantId: t1.id, storeId: store2.id, isActive: true  }),
    userRepo.create({ name: 'Fajar Nugroho', email: 'fajar@majujaya.com', password: await hash('fajar123'), role: 'kasir', tenantId: t1.id, storeId: store3.id, isActive: true  }),
    userRepo.create({ name: 'Gita Permata',  email: 'gita@majujaya.com',  password: await hash('gita123'),  role: 'kasir', tenantId: t1.id, storeId: store3.id, isActive: true  }),
  ])
  console.log('  ✅ 7 kasir (ani, bowo, citra, dani, eka, fajar, gita)')

  // ── 8. Products (store 1) ─────────────────────────────────────────────────
  console.log('\n📦 Seeding products...')
  const productDefs = [
    { sku: 'PRD-01-001', name: 'Aqua 600ml',          category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 24, buyPrice: 2500, sellPrice: 3500,  stock: 120, minStock: 48 },
    { sku: 'PRD-01-002', name: 'Aqua 1500ml',         category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 12, buyPrice: 4500, sellPrice: 6000,  stock:  60, minStock: 24 },
    { sku: 'PRD-01-003', name: 'Indomie Goreng',      category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2800, sellPrice: 3500,  stock: 200, minStock: 40 },
    { sku: 'PRD-01-004', name: 'Indomie Soto',        category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2800, sellPrice: 3500,  stock:   8, minStock: 20 },
    { sku: 'PRD-01-005', name: 'Teh Botol 350ml',     category: 'Minuman', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 24, buyPrice: 4000, sellPrice: 5000,  stock:   3, minStock: 24 },
    { sku: 'PRD-01-006', name: 'Kopi Kapal Api 65g',  category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 36, buyPrice: 5500, sellPrice: 7000,  stock:  72, minStock: 36 },
    { sku: 'PRD-01-007', name: 'Beng-beng',           category: 'Snack',   unit: 'pcs', conversionUnit: 'dus',    conversionRate: 60, buyPrice: 1800, sellPrice: 2500,  stock: 180, minStock: 60 },
    { sku: 'PRD-01-008', name: 'Chitato Original',    category: 'Snack',   unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 8000, sellPrice: 10000, stock:  48, minStock: 24 },
    { sku: 'PRD-01-009', name: 'Good Day Mocca',      category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 4500, sellPrice: 5500,  stock:  36, minStock: 24 },
    { sku: 'PRD-01-010', name: 'Oreo Original',       category: 'Snack',   unit: 'pcs', conversionUnit: 'karton', conversionRate: 24, buyPrice: 7000, sellPrice: 8500,  stock:  60, minStock: 24 },
    { sku: 'PRD-01-011', name: 'Supermi Ayam Bawang', category: 'Makanan', unit: 'pcs', conversionUnit: 'dus',    conversionRate: 40, buyPrice: 2200, sellPrice: 3000,  stock: 150, minStock: 40 },
    { sku: 'PRD-01-012', name: 'Pop Ice Coklat',      category: 'Minuman', unit: 'pcs', conversionUnit: 'karton', conversionRate: 48, buyPrice: 1500, sellPrice: 2000,  stock:  90, minStock: 48 },
  ]

  const products: Product[] = []
  for (let i = 0; i < productDefs.length; i++) {
    const d = productDefs[i]
    const p = await productRepo.save(productRepo.create({ ...d, storeId: store1.id, tenantId: t1.id, isActive: true }))
    // BL-013: stok awal → StockMovement IN
    const movCode = `STK-IN-20260101-${String(i + 1).padStart(3, '0')}`
    await movementRepo.save(movementRepo.create({ movementCode: movCode, productId: p.id, storeId: store1.id, tenantId: t1.id, type: 'IN', qty: d.stock, qtyBefore: 0, qtyAfter: d.stock, note: 'Stok awal', createdBy: rizal.id }))
    products.push(p)
  }
  const [pAqua600, pAqua1500, pIndomieGoreng, pIndomeSoto, pTehBotol, pKopi, pBengBeng, pChitato, pGoodDay, pOreo, pSupermi, pPopIce] = products
  console.log('  ✅ 12 produk + 12 initial stock movements')

  // ── 9. Stock Movements IN (restock) ───────────────────────────────────────
  console.log('\n📥 Seeding stock movements (restock)...')
  await movementRepo.save([
    movementRepo.create({ movementCode: 'STK-IN-20260518-001', productId: pAqua600.id,       storeId: store1.id, tenantId: t1.id, type: 'IN', qty: 48,  qtyBefore:  72, qtyAfter: 120, note: 'Restock mingguan',    createdBy: rizal.id }),
    movementRepo.create({ movementCode: 'STK-IN-20260518-002', productId: pIndomieGoreng.id,  storeId: store1.id, tenantId: t1.id, type: 'IN', qty: 80,  qtyBefore: 120, qtyAfter: 200, note: 'Restock mingguan',    createdBy: rizal.id }),
    movementRepo.create({ movementCode: 'STK-IN-20260515-001', productId: pBengBeng.id,       storeId: store2.id, tenantId: t1.id, type: 'IN', qty: 120, qtyBefore:  60, qtyAfter: 180, note: 'Stok hampir habis',   createdBy: siti.id  }),
  ])
  console.log('  ✅ 3 restock movements')

  // ── 10. Stock Conversions ─────────────────────────────────────────────────
  console.log('\n🔄 Seeding stock conversions...')
  await movementRepo.save([
    movementRepo.create({ movementCode: 'STK-CVT-20260519-001', productId: pAqua600.id,      storeId: store1.id, tenantId: t1.id, type: 'CONVERT', qty: 48, qtyBefore:  72, qtyAfter: 120, createdBy: ani.id  }),
    movementRepo.create({ movementCode: 'STK-CVT-20260519-002', productId: pIndomieGoreng.id, storeId: store1.id, tenantId: t1.id, type: 'CONVERT', qty: 40, qtyBefore: 160, qtyAfter: 200, createdBy: bowo.id }),
  ])
  console.log('  ✅ 2 conversion movements')

  // ── 11. Transactions ──────────────────────────────────────────────────────
  console.log('\n🛒 Seeding transactions...')
  const txDefs = [
    { code: 'TRX-20260519-001', cashier: ani,  total: 17000, paid: 20000, change: 3000,
      items: [{ p: pAqua600, qty: 2 }, { p: pIndomieGoreng, qty: 2 }, { p: pBengBeng, qty: 2 }] },
    { code: 'TRX-20260519-002', cashier: bowo, total: 27500, paid: 30000, change: 2500,
      items: [{ p: pChitato, qty: 1 }, { p: pTehBotol, qty: 2 }, { p: pAqua1500, qty: 1 }, { p: pBengBeng, qty: 1 }] },
    { code: 'TRX-20260519-003', cashier: ani,  total: 10500, paid: 50000, change: 39500,
      items: [{ p: pIndomieGoreng, qty: 3 }] },
    { code: 'TRX-20260519-004', cashier: ani,  total: 38000, paid: 40000, change: 2000,
      items: [{ p: pKopi, qty: 2 }, { p: pOreo, qty: 1 }, { p: pGoodDay, qty: 1 }, { p: pAqua600, qty: 3 }] },
    { code: 'TRX-20260519-005', cashier: bowo, total: 13000, paid: 15000, change: 2000,
      items: [{ p: pPopIce, qty: 2 }, { p: pSupermi, qty: 3 }] },
  ]

  for (const d of txDefs) {
    const tx = await txRepo.save(txRepo.create({ transactionCode: d.code, storeId: store1.id, tenantId: t1.id, cashierId: d.cashier.id, totalAmount: d.total, paidAmount: d.paid, changeAmount: d.change, paymentMethod: 'CASH', status: 'COMPLETED' }))
    for (const item of d.items) {
      await txItemRepo.save(txItemRepo.create({ transactionId: tx.id, productId: item.p.id, productName: item.p.name, qty: item.qty, price: item.p.sellPrice, subtotal: item.qty * item.p.sellPrice }))
      // StockMovement OUT
      const outCode = `STK-OUT-${d.code.slice(4)}-${String(item.p.id).padStart(3,'0')}`
      await movementRepo.save(movementRepo.create({ movementCode: outCode, productId: item.p.id, storeId: store1.id, tenantId: t1.id, type: 'OUT', qty: item.qty, qtyBefore: item.p.stock, qtyAfter: item.p.stock - item.qty, referenceId: d.code, createdBy: d.cashier.id }))
    }
  }
  console.log('  ✅ 5 transaksi + transaction items + OUT movements')

  // ── 12. Stock Opnames ─────────────────────────────────────────────────────
  console.log('\n📋 Seeding stock opnames...')
  const opname1 = await opnameRepo.save(opnameRepo.create({ opnameCode: 'OPN-20260519-01', storeId: store1.id, tenantId: t1.id, opnameDate: new Date('2026-05-19'), createdBy: rizal.id, status: 'COMPLETED' }))
  const opname1Items = [
    { p: pAqua600,      sys: 120, act: 118, reason: 'Barang rusak / tidak layak jual' },
    { p: pAqua1500,     sys:  60, act:  60, reason: undefined },
    { p: pIndomieGoreng,sys: 200, act: 198, reason: 'Selisih penghitungan manual' },
    { p: pIndomeSoto,   sys:   8, act:   8, reason: undefined },
    { p: pTehBotol,     sys:   3, act:   5, reason: 'Pengembalian barang dari pelanggan' },
    { p: pKopi,         sys:  72, act:  72, reason: undefined },
    { p: pBengBeng,     sys: 180, act: 179, reason: 'Kehilangan / dicuri' },
    { p: pChitato,      sys:  48, act:  48, reason: undefined },
    { p: pGoodDay,      sys:  36, act:  36, reason: undefined },
    { p: pOreo,         sys:  60, act:  60, reason: undefined },
    { p: pSupermi,      sys: 150, act: 150, reason: undefined },
    { p: pPopIce,       sys:  90, act:  92, reason: 'Stok bonus dari supplier' },
  ]
  for (const i of opname1Items) {
    await opnameItemRepo.save(opnameItemRepo.create({ opnameId: opname1.id as any, productId: i.p.id, qtySystem: i.sys, qtyActual: i.act, difference: i.act - i.sys, reason: i.reason }))
  }

  const opname2 = await opnameRepo.save(opnameRepo.create({ opnameCode: 'OPN-20260512-01', storeId: store1.id, tenantId: t1.id, opnameDate: new Date('2026-05-12'), createdBy: ani.id, status: 'COMPLETED' }))
  const opname2Items = [
    { p: pAqua600,      sys:  96, act:  95, reason: 'Kesalahan input stok sebelumnya' },
    { p: pAqua1500,     sys:  48, act:  48, reason: undefined },
    { p: pIndomieGoreng,sys: 160, act: 160, reason: undefined },
    { p: pIndomeSoto,   sys:  20, act:  18, reason: 'Barang rusak / tidak layak jual' },
    { p: pTehBotol,     sys:  24, act:  24, reason: undefined },
    { p: pKopi,         sys:  36, act:  36, reason: undefined },
    { p: pBengBeng,     sys: 120, act: 122, reason: 'Pengembalian barang dari pelanggan' },
    { p: pChitato,      sys:  24, act:  24, reason: undefined },
    { p: pGoodDay,      sys:  24, act:  24, reason: undefined },
    { p: pOreo,         sys:  48, act:  48, reason: undefined },
  ]
  for (const i of opname2Items) {
    await opnameItemRepo.save(opnameItemRepo.create({ opnameId: opname2.id as any, productId: i.p.id, qtySystem: i.sys, qtyActual: i.act, difference: i.act - i.sys, reason: i.reason }))
  }
  console.log('  ✅ 2 opname (12 items + 10 items)')

  await AppDataSource.destroy()

  console.log('\n' + '═'.repeat(55))
  console.log('🎉  SEEDING SELESAI — Database siap digunakan!')
  console.log('═'.repeat(55))
  console.log('\n  Akun login:')
  console.log('  ┌─────────────┬──────────────────────────┬──────────┐')
  console.log('  │ Role        │ Email                    │ Password │')
  console.log('  ├─────────────┼──────────────────────────┼──────────┤')
  console.log('  │ Super Admin │ admin@omnikasir.com       │ admin123 │')
  console.log('  │ Owner       │ budi@majujaya.com         │ budi123  │')
  console.log('  │ Admin Store │ rizal@majujaya.com        │ rizal123 │')
  console.log('  │ Kasir       │ ani@majujaya.com          │ ani123   │')
  console.log('  └─────────────┴──────────────────────────┴──────────┘')
  console.log('\n  Owner lain:')
  console.log('  sari@warung.com / sari123  |  hendra@rezeki.com / hendra123')
  console.log('\n  Kasir lainnya:')
  console.log('  bowo@majujaya.com / bowo123  |  dani@majujaya.com / dani123')
  console.log('  eka@majujaya.com / eka123    |  fajar@majujaya.com / fajar123')
  console.log('  gita@majujaya.com / gita123')
  console.log('')
}

seedFresh().catch(err => {
  console.error('\n❌ Seed gagal:', err.message)
  process.exit(1)
})
