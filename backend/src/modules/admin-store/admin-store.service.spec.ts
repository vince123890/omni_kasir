import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { AdminStoreService } from './admin-store.service'
import { Product } from '../../entities/product.entity'
import { StockMovement } from '../../entities/stock-movement.entity'
import { StockOpname } from '../../entities/stock-opname.entity'
import { StockOpnameItem } from '../../entities/stock-opname-item.entity'
import { Transaction } from '../../entities/transaction.entity'
import { mockRepo, makeProduct, makeStockMovement } from '../../test/factories'

describe('AdminStoreService', () => {
  let service: AdminStoreService
  let productRepo: ReturnType<typeof mockRepo>
  let movementRepo: ReturnType<typeof mockRepo>
  let opnameRepo: ReturnType<typeof mockRepo>
  let opnameItemRepo: ReturnType<typeof mockRepo>
  let txRepo: ReturnType<typeof mockRepo>

  beforeEach(async () => {
    productRepo = mockRepo()
    movementRepo = mockRepo()
    opnameRepo = mockRepo()
    opnameItemRepo = mockRepo()
    txRepo = mockRepo()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStoreService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(StockMovement), useValue: movementRepo },
        { provide: getRepositoryToken(StockOpname), useValue: opnameRepo },
        { provide: getRepositoryToken(StockOpnameItem), useValue: opnameItemRepo },
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
      ],
    }).compile()

    service = module.get<AdminStoreService>(AdminStoreService)
  })

  // ── getProducts ────────────────────────────────────────────────────────────

  describe('getProducts', () => {
    it('return list produk dengan stockStatus', async () => {
      const products = [
        makeProduct({ stock: 120, minStock: 48 }),                    // aman
        makeProduct({ id: 2, stock: 8, minStock: 20, name: 'Menipis' }),  // menipis (8 ≤ 20)
        makeProduct({ id: 3, stock: 3, minStock: 24, name: 'Kritis' }),   // kritis (3 ≤ floor(24*0.3)=7)
        makeProduct({ id: 4, stock: 0, minStock: 10, name: 'Habis' }),    // habis
      ]
      productRepo.findAndCount.mockResolvedValue([products, products.length])

      const result = await service.getProducts(1, 1, {})
      expect(result.data[0].stockStatus).toBe('aman')
      expect(result.data[1].stockStatus).toBe('menipis')
      expect(result.data[2].stockStatus).toBe('kritis')
      expect(result.data[3].stockStatus).toBe('habis')
    })

    it('filter low-stock — hanya produk dengan stock <= minStock', async () => {
      const products = [
        makeProduct({ stock: 120, minStock: 48 }),
        makeProduct({ id: 2, stock: 8, minStock: 20 }),
        makeProduct({ id: 3, stock: 3, minStock: 24 }),
      ]
      productRepo.findAndCount.mockResolvedValue([products, products.length])

      const result = await service.getProducts(1, 1, { filter: 'low-stock' })
      expect(result.data.length).toBe(2)  // only id 2 and 3
      expect(result.data.every(p => p.stock <= p.minStock)).toBe(true)
    })

    it('return meta pagination yang benar', async () => {
      productRepo.findAndCount.mockResolvedValue([[makeProduct()], 15])

      const result = await service.getProducts(1, 1, { page: 2, limit: 5 })
      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(5)
      expect(result.meta.total).toBe(15)
      expect(result.meta.totalPages).toBe(3)
    })
  })

  // ── createProduct ──────────────────────────────────────────────────────────

  describe('createProduct', () => {
    it('berhasil buat produk — generate SKU', async () => {
      productRepo.count.mockResolvedValue(0)
      const saved = makeProduct({ id: 99, sku: 'PRD-01-001' })
      productRepo.save.mockResolvedValue(saved)
      movementRepo.count.mockResolvedValue(0)
      movementRepo.save.mockResolvedValue({})

      const result = await service.createProduct(1, 1, 8, {
        name: 'Es Teh Manis', category: 'Minuman', unit: 'pcs',
        buyPrice: 2000, sellPrice: 3000, minStock: 20,
      })

      expect(result.sku).toBe('PRD-01-001')
      expect(result.name).toBe('Aqua 600ml') // dari makeProduct
    })

    it('BL-013: buat StockMovement IN jika initialStock > 0', async () => {
      productRepo.count.mockResolvedValue(0)
      productRepo.save.mockResolvedValue(makeProduct({ id: 99 }))
      movementRepo.count.mockResolvedValue(0)
      movementRepo.save.mockResolvedValue({})

      await service.createProduct(1, 1, 8, {
        name: 'Produk Baru', initialStock: 50, buyPrice: 1000, sellPrice: 2000, minStock: 10,
      })

      expect(movementRepo.save).toHaveBeenCalledTimes(1)
      expect(movementRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'IN', qty: 50, qtyBefore: 0, qtyAfter: 50, note: 'Stok awal',
      }))
    })

    it('tidak buat StockMovement jika initialStock = 0', async () => {
      productRepo.count.mockResolvedValue(0)
      productRepo.save.mockResolvedValue(makeProduct({ id: 99 }))

      await service.createProduct(1, 1, 8, { name: 'Produk Kosong', initialStock: 0, buyPrice: 1000, sellPrice: 2000, minStock: 10 })

      expect(movementRepo.save).not.toHaveBeenCalled()
    })
  })

  // ── updateProduct ─────────────────────────────────────────────────────────

  describe('updateProduct', () => {
    it('berhasil update produk', async () => {
      const product = makeProduct()
      productRepo.findOne.mockResolvedValue(product)
      productRepo.save.mockResolvedValue({ ...product, name: 'Aqua Updated' })

      const result = await service.updateProduct(1, 1, { name: 'Aqua Updated' })
      expect(productRepo.save).toHaveBeenCalled()
    })

    it('throw NotFoundException jika produk tidak ada', async () => {
      productRepo.findOne.mockResolvedValue(null)
      await expect(service.updateProduct(999, 1, {})).rejects.toThrow(NotFoundException)
    })
  })

  // ── deleteProduct ─────────────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('berhasil hapus produk tanpa transaksi', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct())
      txRepo.createQueryBuilder().getCount.mockResolvedValue(0)
      productRepo.softRemove.mockResolvedValue({})

      const result = await service.deleteProduct(1, 1)
      expect(result.message).toBe('Produk berhasil dihapus')
      expect(productRepo.softRemove).toHaveBeenCalled()
    })

    it('throw BadRequestException jika produk ada di transaksi', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct())
      txRepo.createQueryBuilder().getCount.mockResolvedValue(3)

      await expect(service.deleteProduct(1, 1)).rejects.toThrow(BadRequestException)
      expect(productRepo.softRemove).not.toHaveBeenCalled()
    })

    it('throw NotFoundException jika produk tidak ditemukan', async () => {
      productRepo.findOne.mockResolvedValue(null)
      await expect(service.deleteProduct(999, 1)).rejects.toThrow(NotFoundException)
    })
  })

  // ── stockIn ───────────────────────────────────────────────────────────────

  describe('stockIn', () => {
    it('berhasil input stok masuk — update stock dan buyPrice', async () => {
      const product = makeProduct({ stock: 72, buyPrice: 2500 })
      productRepo.findOne.mockResolvedValue(product)
      productRepo.save.mockResolvedValue({ ...product, stock: 120, buyPrice: 2600 })
      movementRepo.count.mockResolvedValue(0)
      movementRepo.save.mockResolvedValue({})

      const result = await service.stockIn(1, 1, 8, {
        productId: 1, qty: 48, buyPrice: 2600, date: '2026-05-18', note: 'Restock',
      })

      expect(result.stockBefore).toBe(72)
      expect(result.stockAfter).toBe(120)
      expect(result.qty).toBe(48)
      expect(result.movementCode).toMatch(/^STK-IN-/)
    })

    it('generate movementCode dengan format STK-IN-YYYYMMDD-NNN', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct({ stock: 100 }))
      productRepo.save.mockResolvedValue({ stock: 148 })
      movementRepo.count.mockResolvedValue(2)
      movementRepo.save.mockResolvedValue({})

      const result = await service.stockIn(1, 1, 8, {
        productId: 1, qty: 48, buyPrice: 2500, date: '2026-05-18',
      })
      expect(result.movementCode).toBe('STK-IN-20260518-003')
    })

    it('throw NotFoundException jika produk tidak ada', async () => {
      productRepo.findOne.mockResolvedValue(null)
      await expect(service.stockIn(1, 1, 8, { productId: 999, qty: 10, buyPrice: 2500, date: '2026-05-18' }))
        .rejects.toThrow(NotFoundException)
    })
  })

  // ── createOpname ──────────────────────────────────────────────────────────

  describe('createOpname', () => {
    it('berhasil simpan opname — update stok jika ada selisih', async () => {
      const product = makeProduct({ stock: 120 })
      productRepo.findOne.mockResolvedValue(product)
      productRepo.save.mockResolvedValue({ ...product, stock: 118 })
      opnameRepo.count.mockResolvedValue(0)
      opnameRepo.save.mockResolvedValue({ id: 1, opnameCode: 'OPN-20260519-01' })
      opnameItemRepo.save.mockResolvedValue({})

      const result = await service.createOpname(1, 1, 8, [
        { productId: 1, qtyActual: 118, reason: 'Barang rusak' },
      ])

      expect(result.opnameCode).toBe('OPN-20260519-01')
      expect(result.adjustedCount).toBe(1)
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ stock: 118 }))
    })

    it('tidak update stok jika tidak ada selisih', async () => {
      const product = makeProduct({ stock: 120 })
      productRepo.findOne.mockResolvedValue(product)
      opnameRepo.count.mockResolvedValue(0)
      opnameRepo.save.mockResolvedValue({ id: 1, opnameCode: 'OPN-20260519-01' })
      opnameItemRepo.save.mockResolvedValue({})

      await service.createOpname(1, 1, 8, [{ productId: 1, qtyActual: 120 }])
      expect(productRepo.save).not.toHaveBeenCalled()
    })

    it('BL-020: throw BadRequestException jika selisih tapi tidak ada reason', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct({ stock: 120 }))
      await expect(service.createOpname(1, 1, 8, [
        { productId: 1, qtyActual: 100 },  // selisih -20, tidak ada reason
      ])).rejects.toThrow(BadRequestException)
    })

    it('BL-020: berhasil jika tidak ada selisih tanpa reason', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct({ stock: 120 }))
      opnameRepo.count.mockResolvedValue(0)
      opnameRepo.save.mockResolvedValue({ id: 1, opnameCode: 'OPN-20260519-01' })
      opnameItemRepo.save.mockResolvedValue({})

      // Tidak ada reason tapi tidak ada selisih → OK
      await expect(service.createOpname(1, 1, 8, [
        { productId: 1, qtyActual: 120 },
      ])).resolves.not.toThrow()
    })

    it('throw NotFoundException jika produk tidak ditemukan', async () => {
      productRepo.findOne.mockResolvedValue(null)
      await expect(service.createOpname(1, 1, 8, [
        { productId: 999, qtyActual: 10 },
      ])).rejects.toThrow(NotFoundException)
    })
  })

  // ── convertStock ──────────────────────────────────────────────────────────

  describe('convertStock', () => {
    it('berhasil konversi 2 dus → 48 pcs', async () => {
      const product = makeProduct({ stock: 72, conversionUnit: 'dus', conversionRate: 24 })
      productRepo.findOne.mockResolvedValue(product)
      productRepo.save.mockResolvedValue({ ...product, stock: 120 })
      movementRepo.count.mockResolvedValue(0)
      movementRepo.save.mockResolvedValue({})

      const result = await service.convertStock(1, 1, 11, { productId: 1, qty: 2 })

      expect(result.fromQty).toBe(2)
      expect(result.fromUnit).toBe('dus')
      expect(result.toQty).toBe(48)
      expect(result.toUnit).toBe('pcs')
      expect(result.stockBefore).toBe(72)
      expect(result.stockAfter).toBe(120)
    })

    it('throw BadRequestException jika stok tidak cukup untuk konversi', async () => {
      const product = makeProduct({ stock: 10, conversionUnit: 'dus', conversionRate: 24 })
      productRepo.findOne.mockResolvedValue(product)

      await expect(service.convertStock(1, 1, 11, { productId: 1, qty: 5 }))
        .rejects.toThrow(BadRequestException)
    })

    it('throw BadRequestException jika produk tidak punya conversionUnit', async () => {
      const product = makeProduct({ conversionUnit: null, conversionRate: null })
      productRepo.findOne.mockResolvedValue(product)

      await expect(service.convertStock(1, 1, 11, { productId: 1, qty: 1 }))
        .rejects.toThrow(BadRequestException)
    })

    it('generate movementCode STK-CVT-YYYYMMDD-NNN', async () => {
      const product = makeProduct({ stock: 100, conversionUnit: 'dus', conversionRate: 24 })
      productRepo.findOne.mockResolvedValue(product)
      productRepo.save.mockResolvedValue({})
      movementRepo.count.mockResolvedValue(1)
      movementRepo.save.mockResolvedValue({})

      const result = await service.convertStock(1, 1, 11, { productId: 1, qty: 1 })
      expect(result.movementCode).toMatch(/^STK-CVT-\d{8}-002$/)
    })
  })
})
