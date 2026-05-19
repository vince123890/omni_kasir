/**
 * Test factories — buat mock objects yang konsisten di semua test
 */
import * as bcrypt from 'bcrypt'

export const HASHED_PASSWORD = bcrypt.hashSync('password123', 1)

export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: HASHED_PASSWORD,
    role: 'kasir' as const,
    tenantId: 1,
    storeId: 1,
    isActive: true,
    passwordChangedAt: null,
    lastLogin: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides,
  }
}

export function makeAdmin(overrides: Partial<any> = {}) {
  return makeUser({ id: 1, name: 'Super Admin', email: 'admin@omnikasir.com', role: 'admin', tenantId: null, storeId: null, ...overrides })
}

export function makeOwner(overrides: Partial<any> = {}) {
  return makeUser({ id: 2, name: 'Budi Santoso', email: 'budi@majujaya.com', role: 'owner', storeId: null, ...overrides })
}

export function makeAdminStore(overrides: Partial<any> = {}) {
  return makeUser({ id: 8, name: 'Muhammad Rizal', email: 'rizal@majujaya.com', role: 'admin_store', ...overrides })
}

export function makeTenant(overrides: Partial<any> = {}) {
  return {
    id: 1,
    tenantCode: 'TNT-202508-001',
    entityType: 'PT',
    name: 'Maju Jaya Sejahtera',
    fullName: 'PT Maju Jaya Sejahtera',
    phone: null,
    isActive: true,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-15'),
    ...overrides,
  }
}

export function makeSubscription(overrides: Partial<any> = {}) {
  return {
    id: 1,
    tenantId: 1,
    planId: 2,
    startAt: new Date('2025-08-15'),
    expiredAt: new Date('2026-08-15'),
    isActive: true,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-15'),
    ...overrides,
  }
}

export function makeSubscriptionPlan(overrides: Partial<any> = {}) {
  return {
    id: 2,
    name: 'Pro',
    price: 299000,
    durationDays: 30,
    maxStores: 5,
    maxCashiersPerStore: 5,
    isActive: true,
    isPopular: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function makeStore(overrides: Partial<any> = {}) {
  return {
    id: 1,
    storeCode: 'STR-2508-0101',
    tenantId: 1,
    name: 'Toko Pusat Sudirman',
    address: 'Jl. Sudirman No. 10, Jakarta Pusat',
    phone: '021-12345678',
    isActive: true,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-15'),
    deletedAt: null,
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<any> = {}) {
  return {
    id: 1,
    storeId: 1,
    tenantId: 1,
    sku: 'PRD-01-001',
    name: 'Aqua 600ml',
    category: 'Minuman',
    unit: 'pcs',
    conversionUnit: 'dus',
    conversionRate: 24,
    buyPrice: 2500,
    sellPrice: 3500,
    stock: 120,
    minStock: 48,
    barcode: null,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides,
  }
}

export function makeTransaction(overrides: Partial<any> = {}) {
  return {
    id: 1,
    transactionCode: 'TRX-20260519-001',
    storeId: 1,
    tenantId: 1,
    cashierId: 11,
    totalAmount: 17000,
    paidAmount: 20000,
    changeAmount: 3000,
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    note: null,
    createdAt: new Date('2026-05-19T08:45:00Z'),
    ...overrides,
  }
}

export function makeStockMovement(overrides: Partial<any> = {}) {
  return {
    id: 1,
    movementCode: 'STK-IN-20260519-001',
    productId: 1,
    storeId: 1,
    tenantId: 1,
    type: 'IN' as const,
    qty: 48,
    qtyBefore: 72,
    qtyAfter: 120,
    referenceId: null,
    note: 'Restock mingguan',
    createdBy: 8,
    createdAt: new Date('2026-05-19T09:00:00Z'),
    ...overrides,
  }
}

/** Buat mock Repository TypeORM */
export function mockRepo<T = any>() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation((dto: any) => dto),
    update: jest.fn(),
    delete: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    }),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    },
  } as unknown as jest.Mocked<any>
}
