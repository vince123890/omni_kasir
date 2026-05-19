import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { Product } from '../../entities/product.entity'
import { StockMovement } from '../../entities/stock-movement.entity'
import { StockOpname } from '../../entities/stock-opname.entity'
import { StockOpnameItem } from '../../entities/stock-opname-item.entity'
import { Transaction } from '../../entities/transaction.entity'

@Injectable()
export class AdminStoreService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    @InjectRepository(StockOpname) private opnameRepo: Repository<StockOpname>,
    @InjectRepository(StockOpnameItem) private opnameItemRepo: Repository<StockOpnameItem>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  // ── Products ─────────────────────────────────────────────────────────────

  async getProducts(storeId: number, tenantId: number, params: { search?: string; category?: string; filter?: string; page?: number; limit?: number }) {
    const { search, category, filter, page = 1, limit = 10 } = params
    const skip = (page - 1) * limit
    const where: any = { storeId, tenantId, isActive: true }
    if (search) where.name = ILike(`%${search}%`)
    if (category) where.category = category

    let [data, total] = await this.productRepo.findAndCount({ where, skip, take: limit, order: { name: 'ASC' } })

    if (filter === 'low-stock') {
      data = data.filter(p => p.stock <= p.minStock)
      total = data.length
    }

    return {
      data: data.map(p => ({
        ...p,
        stockStatus: p.stock === 0 ? 'habis' : p.stock <= Math.floor(p.minStock * 0.3) ? 'kritis' : p.stock <= p.minStock ? 'menipis' : 'aman',
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async createProduct(storeId: number, tenantId: number, userId: number, dto: any) {
    const count = await this.productRepo.count({ where: { storeId } })
    const sku = `PRD-${String(storeId).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`
    const product = (await this.productRepo.save(this.productRepo.create({ ...dto, storeId, tenantId, sku, stock: dto.initialStock || 0, isActive: true }))) as unknown as Product

    // BL-013: stok awal jadi StockMovement
    if ((dto.initialStock || 0) > 0) {
      const code = `STK-IN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(count + 1).padStart(3,'0')}`
      await this.movementRepo.save(this.movementRepo.create({ movementCode: code, productId: product.id, storeId, tenantId, type: 'IN', qty: dto.initialStock, qtyBefore: 0, qtyAfter: dto.initialStock, note: 'Stok awal', createdBy: userId }))
    }
    return { id: product.id, sku: product.sku, name: product.name, stock: product.stock }
  }

  async updateProduct(id: number, storeId: number, dto: any) {
    const product = await this.productRepo.findOne({ where: { id, storeId } })
    if (!product) throw new NotFoundException('Produk tidak ditemukan')
    Object.assign(product, dto)
    return this.productRepo.save(product)
  }

  async deleteProduct(id: number, storeId: number) {
    const product = await this.productRepo.findOne({ where: { id, storeId } })
    if (!product) throw new NotFoundException('Produk tidak ditemukan')
    const txCount = await this.txRepo.createQueryBuilder('t').innerJoin('t.items', 'i').where('i.productId = :id', { id }).getCount()
    if (txCount > 0) throw new BadRequestException('Produk tidak dapat dihapus karena sudah pernah ada di transaksi penjualan.')
    await this.productRepo.softRemove(product)
    return { message: 'Produk berhasil dihapus' }
  }

  // ── Stock In ──────────────────────────────────────────────────────────────

  async stockIn(storeId: number, tenantId: number, userId: number, dto: { productId: number; qty: number; buyPrice: number; date: string; note?: string }) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId, storeId } })
    if (!product) throw new NotFoundException('Produk tidak ditemukan')

    const qtyBefore = product.stock
    product.stock += dto.qty
    product.buyPrice = dto.buyPrice
    await this.productRepo.save(product)

    const count = await this.movementRepo.count({ where: { storeId, type: 'IN' } })
    const code = `STK-IN-${dto.date.replace(/-/g,'')}-${String(count + 1).padStart(3,'0')}`
    await this.movementRepo.save(this.movementRepo.create({ movementCode: code, productId: dto.productId, storeId, tenantId, type: 'IN', qty: dto.qty, qtyBefore, qtyAfter: product.stock, note: dto.note, createdBy: userId }))

    return { movementCode: code, productName: product.name, qty: dto.qty, stockBefore: qtyBefore, stockAfter: product.stock }
  }

  // ── Opname ────────────────────────────────────────────────────────────────

  async createOpname(storeId: number, tenantId: number, userId: number, items: { productId: number; qtyActual: number; reason?: string }[]) {
    // BL-020: wajib reason jika selisih
    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId, storeId } })
      if (!product) throw new NotFoundException(`Produk ${item.productId} tidak ditemukan`)
      const diff = item.qtyActual - product.stock
      if (diff !== 0 && !item.reason) throw new BadRequestException(`Alasan selisih wajib diisi untuk produk "${product.name}"`)
    }

    const count = await this.opnameRepo.count({ where: { storeId } })
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
    const opnameCode = `OPN-${today}-${String(count + 1).padStart(2,'0')}`

    const opname = await this.opnameRepo.save(this.opnameRepo.create({ opnameCode, storeId, tenantId, opnameDate: new Date(), createdBy: userId, status: 'COMPLETED' }))

    const savedItems: { productId: number; productName: string; qtySystem: number; qtyActual: number; difference: number; reason: string | null }[] = []
    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } })
      const qtySystem = product!.stock
      const diff = item.qtyActual - qtySystem
      const opnameItem = await this.opnameItemRepo.save(this.opnameItemRepo.create({ opnameId: opname.id, productId: item.productId, qtySystem, qtyActual: item.qtyActual, difference: diff, reason: item.reason }))
      if (diff !== 0) { product!.stock = item.qtyActual; await this.productRepo.save(product!) }
      savedItems.push({ productId: item.productId, productName: product!.name, qtySystem, qtyActual: item.qtyActual, difference: diff, reason: item.reason || null })
    }

    return { opnameCode, filledCount: items.length, adjustedCount: savedItems.filter(i => i.difference !== 0).length, items: savedItems }
  }

  async getOpnames(storeId: number, params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 10 } = params
    const skip = (page - 1) * limit
    const [data, total] = await this.opnameRepo.findAndCount({ where: { storeId }, relations: ['items', 'createdByUser'], skip, take: limit, order: { createdAt: 'DESC' } })
    return {
      data: data.map(o => ({ ...o, createdByName: (o.createdByUser as any)?.name, selisihCount: (o.items || []).filter((i: any) => i.difference !== 0).length })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOpnameItems(id: number, storeId: number) {
    const opname = await this.opnameRepo.findOne({ where: { id, storeId }, relations: ['items', 'items.product', 'createdByUser'] })
    if (!opname) throw new NotFoundException('Opname tidak ditemukan')
    const items = (opname.items || []).map((i: any) => ({ productId: i.productId, productName: i.product?.name, unit: i.product?.unit, qtySystem: i.qtySystem, qtyActual: i.qtyActual, difference: i.difference, reason: i.reason }))
    return { opnameCode: opname.opnameCode, opnameDate: opname.opnameDate, createdByName: (opname.createdByUser as any)?.name, status: opname.status, items, summary: { totalFilled: items.length, sesuai: items.filter(i => i.difference === 0).length, selisih: items.filter(i => i.difference !== 0).length } }
  }

  // ── Convert ───────────────────────────────────────────────────────────────

  async convertStock(storeId: number, tenantId: number, userId: number, dto: { productId: number; qty: number }) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId, storeId } })
    if (!product) throw new NotFoundException('Produk tidak ditemukan')
    if (!product.conversionUnit || !product.conversionRate) throw new BadRequestException('Produk ini tidak memiliki konfigurasi konversi')

    const resultQty = dto.qty * product.conversionRate
    if (product.stock < resultQty) throw new BadRequestException(`Stok tidak mencukupi untuk konversi. Maks: ${Math.floor(product.stock / product.conversionRate)} ${product.conversionUnit}`)

    const qtyBefore = product.stock
    product.stock += resultQty
    await this.productRepo.save(product)

    const count = await this.movementRepo.count({ where: { storeId, type: 'CONVERT' } })
    const code = `STK-CVT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(count + 1).padStart(3,'0')}`
    await this.movementRepo.save(this.movementRepo.create({ movementCode: code, productId: dto.productId, storeId, tenantId, type: 'CONVERT', qty: resultQty, qtyBefore, qtyAfter: product.stock, createdBy: userId }))

    return { movementCode: code, productName: product.name, fromQty: dto.qty, fromUnit: product.conversionUnit, toQty: resultQty, toUnit: product.unit, stockBefore: qtyBefore, stockAfter: product.stock }
  }

  private async enrichMovementsWithNames(movements: StockMovement[]): Promise<any[]> {
    const productIds = [...new Set(movements.map(m => m.productId).filter(Boolean))]
    const userIds    = [...new Set(movements.map(m => m.createdBy).filter(Boolean))]

    const products = productIds.length
      ? await this.productRepo.find({ where: productIds.map(id => ({ id })) as any })
      : []
    const users = userIds.length
      ? await this.movementRepo.manager.getRepository('users').find({ where: userIds.map(id => ({ id })) as any }) as any[]
      : []

    const productMap = new Map(products.map(p => [p.id, p]))
    const userMap    = new Map(users.map((u: any) => [u.id, u]))

    return movements.map(m => ({
      ...m,
      productName:   productMap.get(m.productId)?.name ?? null,
      productUnit:   productMap.get(m.productId)?.unit ?? null,
      conversionUnit: (productMap.get(m.productId) as any)?.conversionUnit ?? null,
      createdByName: userMap.get(m.createdBy)?.name ?? null,
    }))
  }

  async getConversions(storeId: number, params: any) {
    const { page = 1, limit = 10 } = params
    const skip = (page - 1) * limit
    const [movements, total] = await this.movementRepo.findAndCount({
      where: { storeId, type: 'CONVERT' }, skip, take: limit, order: { createdAt: 'DESC' },
    })
    const enriched = await this.enrichMovementsWithNames(movements)
    return {
      data: enriched.map(m => ({
        id: m.id, movementCode: m.movementCode, productId: m.productId,
        productName: m.productName, fromQty: m.qty, fromUnit: m.conversionUnit,
        toQty: m.qtyAfter - m.qtyBefore, toUnit: m.productUnit,
        stockBefore: m.qtyBefore, stockAfter: m.qtyAfter,
        createdByName: m.createdByName, createdAt: m.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  // ── Movements ─────────────────────────────────────────────────────────────

  async getMovements(storeId: number, params: any) {
    const { page = 1, limit = 10, type, productId } = params
    const skip = (page - 1) * limit
    const where: any = { storeId }
    if (type) where.type = type
    if (productId) where.productId = +productId
    const [movements, total] = await this.movementRepo.findAndCount({ where, skip, take: limit, order: { createdAt: 'DESC' } })
    const enriched = await this.enrichMovementsWithNames(movements)
    return {
      data: enriched.map(m => ({
        id: m.id, movementCode: m.movementCode, type: m.type, productId: m.productId,
        productName: m.productName, qty: m.qty, qtyBefore: m.qtyBefore, qtyAfter: m.qtyAfter,
        note: m.note, createdBy: m.createdBy, createdByName: m.createdByName, createdAt: m.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  async getTransactions(storeId: number, params: any) {
    const { page = 1, limit = 10, search, date, cashierId } = params
    const skip = (page - 1) * limit

    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'i')
      .where('t.storeId = :storeId', { storeId })
      .orderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit)

    if (cashierId) qb.andWhere('t.cashierId = :cashierId', { cashierId: +cashierId })
    if (date) qb.andWhere('DATE(t.createdAt) = :date', { date })
    if (search) qb.andWhere('t.transactionCode LIKE :search', { search: `%${search}%` })

    const [txs, total] = await qb.getManyAndCount()

    // Enrich cashier names secara terpisah
    const cashierIds = [...new Set(txs.map(t => t.cashierId).filter(Boolean))]
    const cashiers = cashierIds.length
      ? await this.txRepo.manager.getRepository('users').find({ where: cashierIds.map(id => ({ id })) as any }) as any[]
      : []
    const cashierMap = new Map(cashiers.map((u: any) => [u.id, u.name]))

    return {
      data: txs.map(t => ({
        id: t.id,
        transactionCode: t.transactionCode,
        storeId: t.storeId,
        cashierId: t.cashierId,
        cashierName: cashierMap.get(t.cashierId) ?? null,
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        changeAmount: t.changeAmount,
        paymentMethod: t.paymentMethod,
        status: t.status,
        items: (t.items || []).map(i => ({
          productId: i.productId,
          productName: i.productName,
          qty: i.qty,
          price: i.price,
          subtotal: i.subtotal,
        })),
        createdAt: t.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }
}
