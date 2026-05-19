import { describe, it, expect, beforeEach } from 'vitest'
import { productApi, stockMovementApi, storeOpnameApi, storeConvertApi, storeTransactionApi } from '../../api/store.api'

beforeEach(() => {
  localStorage.setItem('omnikasir_access_token', 'mock-access-token-store')
})

describe('productApi', () => {
  it('list — return produk dengan stockStatus', async () => {
    const result = await productApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const product = result.data[0]
    expect(product).toHaveProperty('sku')
    expect(product).toHaveProperty('stockStatus')
    expect(['aman', 'menipis', 'kritis', 'habis']).toContain(product.stockStatus)
  })

  it('list — produk punya buyPrice dan sellPrice', async () => {
    const result = await productApi.list()
    const p = result.data[0]
    expect(p.buyPrice).toBeGreaterThan(0)
    expect(p.sellPrice).toBeGreaterThan(0)
  })

  it('list dengan filter low-stock — hanya produk menipis/kritis', async () => {
    const result = await productApi.list({ filter: 'low-stock' })
    expect(result.data.every(p => p.stock <= p.minStock)).toBe(true)
  })

  it('list — meta tersedia', async () => {
    const result = await productApi.list()
    expect(result.meta).toHaveProperty('total')
    expect(result.meta).toHaveProperty('page')
    expect(result.meta.page).toBe(1)
  })

  it('create — berhasil buat produk baru', async () => {
    const result = await productApi.create({ name: 'Es Teh Manis', category: 'Minuman', unit: 'pcs', buyPrice: 2000, sellPrice: 3000, minStock: 20, initialStock: 50 })
    expect(result.name).toBe('Es Teh Manis')
    expect(result.sku).toMatch(/^PRD-/)
    expect(result.stock).toBe(50)
  })

  it('remove — sukses hapus produk tanpa transaksi', async () => {
    // id 99 tidak ada di transaksi → sukses
    await expect(productApi.remove(99)).resolves.not.toThrow()
  })

  it('remove — throw 400 jika produk ada di transaksi', async () => {
    // id 1 sudah ada di transaksi
    await expect(productApi.remove(1)).rejects.toThrow()
  })
})

describe('stockMovementApi', () => {
  it('list — return movements dengan productName', async () => {
    const result = await stockMovementApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].productName).toBeTruthy()
    expect(result.data[0].movementCode).toMatch(/^STK-/)
  })

  it('list — movement punya qtyBefore dan qtyAfter', async () => {
    const result = await stockMovementApi.list()
    const m = result.data[0]
    expect(m).toHaveProperty('qtyBefore')
    expect(m).toHaveProperty('qtyAfter')
    expect(m.qtyAfter).toBeGreaterThanOrEqual(m.qtyBefore)
  })
})

describe('storeOpnameApi', () => {
  it('list — return riwayat opname', async () => {
    const result = await storeOpnameApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const o = result.data[0]
    expect(o.opnameCode).toMatch(/^OPN-/)
    expect(o.status).toBe('COMPLETED')
    expect(o).toHaveProperty('selisihCount')
  })
})

describe('storeConvertApi', () => {
  it('list — return riwayat konversi', async () => {
    const result = await storeConvertApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const c = result.data[0]
    expect(c).toHaveProperty('fromQty')
    expect(c).toHaveProperty('fromUnit')
    expect(c).toHaveProperty('toQty')
    expect(c).toHaveProperty('toUnit')
    expect(c.movementCode).toMatch(/^STK-CVT-/)
  })
})

describe('storeTransactionApi', () => {
  it('list — return transaksi dengan items', async () => {
    const result = await storeTransactionApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const tx = result.data[0]
    expect(tx.items.length).toBeGreaterThan(0)
    expect(tx.items[0]).toHaveProperty('productName')
    expect(tx.items[0]).toHaveProperty('subtotal')
  })
})
