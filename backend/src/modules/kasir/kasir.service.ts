import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Transaction } from '../../entities/transaction.entity'
import { TransactionItem } from '../../entities/transaction-item.entity'
import { Product } from '../../entities/product.entity'
import { StockMovement } from '../../entities/stock-movement.entity'
import { AdminStoreService } from '../admin-store/admin-store.service'

@Injectable()
export class KasirService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem) private txItemRepo: Repository<TransactionItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private adminStoreService: AdminStoreService,
    private dataSource: DataSource,
  ) {}

  async createTransaction(storeId: number, tenantId: number, cashierId: number, dto: {
    items: { productId: number; qty: number }[]
    paidAmount: number
    paymentMethod?: string
    note?: string
  }) {
    // BL-005: validasi stok + pessimistic lock dalam satu DB transaction
    return this.dataSource.transaction(async (manager) => {
      let totalAmount = 0
      const itemsData: { product: Product; qty: number }[] = []

      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId, storeId },
          lock: { mode: 'pessimistic_write' },
        })
        if (!product) throw new BadRequestException(`Produk ${item.productId} tidak ditemukan`)
        if (product.stock < item.qty) {
          throw new BadRequestException(`Stok tidak mencukupi untuk "${product.name}". Tersedia: ${product.stock}`)
        }
        totalAmount += product.sellPrice * item.qty
        itemsData.push({ product, qty: item.qty })
      }

      if (dto.paidAmount < totalAmount) throw new BadRequestException('Nominal bayar kurang dari total transaksi')

      // Auto-generate transactionCode
      const count = await manager.count(Transaction, { where: { storeId } })
      const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
      const transactionCode = `TRX-${today}-${String(count + 1).padStart(3,'0')}`

      const tx = manager.create(Transaction, {
        transactionCode, storeId, tenantId, cashierId,
        totalAmount, paidAmount: dto.paidAmount,
        changeAmount: dto.paidAmount - totalAmount,
        paymentMethod: (dto.paymentMethod || 'CASH') as 'CASH',
        status: 'COMPLETED',
        note: dto.note,
      })
      const savedTx = await manager.save(tx)

      const savedItems: TransactionItem[] = []
      for (const { product, qty } of itemsData) {
        // BL-007: snapshot nama dan harga
        const txItem = manager.create(TransactionItem, {
          transactionId: savedTx.id, productId: product.id,
          productName: product.name, qty, price: product.sellPrice, subtotal: product.sellPrice * qty,
        })
        savedItems.push(await manager.save(txItem))

        // Kurangi stok + catat StockMovement OUT
        const qtyBefore = product.stock
        product.stock -= qty
        await manager.save(product)

        const mvCount = await manager.count(StockMovement, { where: { storeId, type: 'OUT' } })
        await manager.save(manager.create(StockMovement, {
          movementCode: transactionCode, productId: product.id, storeId, tenantId, type: 'OUT',
          qty, qtyBefore, qtyAfter: product.stock, referenceId: transactionCode, createdBy: cashierId,
        }))
      }

      return {
        transactionCode: savedTx.transactionCode,
        totalAmount: savedTx.totalAmount,
        paidAmount: savedTx.paidAmount,
        changeAmount: savedTx.changeAmount,
        paymentMethod: savedTx.paymentMethod,
        items: savedItems.map(i => ({ productId: i.productId, productName: i.productName, qty: i.qty, price: i.price, subtotal: i.subtotal })),
      }
    })
  }

  async getTransactions(storeId: number, params: any) {
    const { page = 1, limit = 10, search, date } = params
    const skip = (page - 1) * limit

    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'i')
      .where('t.storeId = :storeId', { storeId })
      .orderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit)

    if (date) qb.andWhere('DATE(t.createdAt) = :date', { date })
    if (search) qb.andWhere('t.transactionCode LIKE :search', { search: `%${search}%` })

    const [txs, total] = await qb.getManyAndCount()

    // Enrich cashier names secara terpisah
    const cashierIds = [...new Set(txs.map(t => t.cashierId).filter(Boolean))]
    const cashiers = cashierIds.length
      ? await this.txRepo.manager.getRepository('users').find({ where: cashierIds.map(id => ({ id })) as any }) as any[]
      : []
    const cashierMap = new Map(cashiers.map((u: any) => [u.id, u.name]))

    const data = txs.map(t => ({
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
      createdAt: t.createdAt,
      items: (t.items || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        qty: i.qty,
        price: i.price,
        subtotal: i.subtotal,
      })),
    }))

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }
}
