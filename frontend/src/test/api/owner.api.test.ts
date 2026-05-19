import { describe, it, expect, beforeEach } from 'vitest'
import { ownerStoreApi, ownerUserApi, ownerTransactionApi } from '../../api/owner.api'

beforeEach(() => {
  localStorage.setItem('omnikasir_access_token', 'mock-access-token-owner')
})

describe('ownerStoreApi', () => {
  it('list — return stores dan meta plan', async () => {
    const result = await ownerStoreApi.list()
    expect(result.stores.length).toBeGreaterThan(0)
    expect(result.meta.planName).toBe('Pro')
    expect(result.meta.maxStores).toBe(5)
    expect(result.meta.maxCashiersPerStore).toBe(5)
  })

  it('list — store punya kasirCount dan maxKasir', async () => {
    const result = await ownerStoreApi.list()
    const store = result.stores[0]
    expect(store).toHaveProperty('kasirCount')
    expect(store).toHaveProperty('maxKasir')
    expect(store.storeCode).toMatch(/^STR-/)
  })

  it('list — store punya txMonth dan revenue', async () => {
    const result = await ownerStoreApi.list()
    const store = result.stores[0]
    expect(store).toHaveProperty('txMonth')
    expect(store).toHaveProperty('revenue')
  })

  it('create — berhasil tambah store baru', async () => {
    const result = await ownerStoreApi.create({ name: 'Cabang Baru', address: 'Jl. Test 123' })
    expect(result.name).toBe('Cabang Baru')
    expect(result.storeCode).toMatch(/^STR-/)
  })
})

describe('ownerUserApi', () => {
  it('list — return kasir dan admin store', async () => {
    const result = await ownerUserApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const roles = result.data.map(u => u.role)
    expect(roles).toContain('kasir')
    expect(roles).toContain('admin_store')
  })

  it('list — user punya storeName', async () => {
    const result = await ownerUserApi.list()
    const kasir = result.data.find(u => u.role === 'kasir')!
    expect(kasir.storeName).toBeTruthy()
    expect(kasir.storeName).toBe('Toko Pusat Sudirman')
  })

  it('list — kasir nonaktif ada di list', async () => {
    const result = await ownerUserApi.list()
    const nonaktif = result.data.filter(u => !u.isActive)
    expect(nonaktif.length).toBeGreaterThan(0)
  })

  it('list dengan filter role kasir', async () => {
    const result = await ownerUserApi.list({ role: 'kasir' })
    // MSW tidak filter tapi test bahwa call berhasil
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('ownerTransactionApi', () => {
  it('list — return transaksi dengan items', async () => {
    const result = await ownerTransactionApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const tx = result.data[0]
    expect(tx).toHaveProperty('transactionCode')
    expect(tx).toHaveProperty('cashierName')
    expect(tx).toHaveProperty('storeName')
    expect(tx.items.length).toBeGreaterThan(0)
  })

  it('list — meta total tersedia', async () => {
    const result = await ownerTransactionApi.list()
    expect(result.meta.total).toBeGreaterThan(0)
  })
})
