import { describe, it, expect, beforeEach } from 'vitest'
import { kasirProductApi, kasirTransactionApi, kasirOpnameApi, kasirConvertApi } from '../../api/kasir.api'

beforeEach(() => {
  localStorage.setItem('omnikasir_access_token', 'mock-access-token-kasir')
})

describe('kasirProductApi', () => {
  it('list — return produk untuk POS', async () => {
    const result = await kasirProductApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const p = result.data[0]
    expect(p).toHaveProperty('sellPrice')
    expect(p).toHaveProperty('stock')
    expect(p).toHaveProperty('category')
  })

  it('list — semua produk punya stock >= 0', async () => {
    const result = await kasirProductApi.list()
    expect(result.data.every(p => p.stock >= 0)).toBe(true)
  })

  it('list — meta tersedia', async () => {
    const result = await kasirProductApi.list()
    expect(result.meta.total).toBeGreaterThan(0)
  })
})

describe('kasirTransactionApi', () => {
  it('create — transaksi berhasil dengan bayar cukup', async () => {
    const result = await kasirTransactionApi.create({
      items: [{ productId: 1, qty: 2 }],
      paidAmount: 10000,
    })
    expect(result.transactionCode).toMatch(/^TRX-/)
    expect(result.changeAmount).toBeGreaterThanOrEqual(0)
    expect(result.paymentMethod).toBe('CASH')
  })

  it('create — throw 400 jika bayar kurang', async () => {
    await expect(kasirTransactionApi.create({
      items: [{ productId: 1, qty: 2 }],
      paidAmount: 100,  // terlalu kecil
    })).rejects.toThrow()
  })

  it('create — kembalian = paidAmount - totalAmount', async () => {
    const result = await kasirTransactionApi.create({
      items: [{ productId: 1, qty: 1 }],
      paidAmount: 5000,
    })
    expect(result.changeAmount).toBe(result.paidAmount - result.totalAmount)
  })

  it('list — return riwayat transaksi dengan items', async () => {
    const result = await kasirTransactionApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    const tx = result.data[0]
    expect(tx.transactionCode).toMatch(/^TRX-/)
    expect(tx.items.length).toBeGreaterThan(0)
    expect(tx.cashierName).toBe('Ani Rahayu')
  })

  it('list — items punya productName dan subtotal', async () => {
    const result = await kasirTransactionApi.list()
    const item = result.data[0].items[0]
    expect(item).toHaveProperty('productName')
    expect(item).toHaveProperty('subtotal')
    expect(item.subtotal).toBe(item.qty * item.price)
  })
})

describe('kasirOpnameApi', () => {
  it('list — return daftar opname (mungkin kosong)', async () => {
    const result = await kasirOpnameApi.list()
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('kasirConvertApi', () => {
  it('list — return daftar konversi (mungkin kosong)', async () => {
    const result = await kasirConvertApi.list()
    expect(Array.isArray(result.data)).toBe(true)
  })
})
