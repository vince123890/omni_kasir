import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { Store } from '../../entities/store.entity'
import { User } from '../../entities/user.entity'
import { Transaction } from '../../entities/transaction.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    private config: ConfigService,
  ) {}

  // ── Stores ──────────────────────────────────────────────────────────────

  async getStores(tenantId: number) {
    const sub = await this.subRepo.findOne({ where: { tenantId, isActive: true } })
    const plan = sub ? await this.planRepo.findOne({ where: { id: sub.planId } }) : undefined
    const stores = await this.storeRepo.find({ where: { tenantId } })
    const users = await this.userRepo.find({ where: { tenantId } })

    // Hitung transaksi & revenue bulan ini per store
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const txStats = await this.txRepo
      .createQueryBuilder('t')
      .select('t.storeId', 'storeId')
      .addSelect('COUNT(*)', 'txCount')
      .addSelect('SUM(t.totalAmount)', 'revenue')
      .where('t.tenantId = :tenantId', { tenantId })
      .andWhere('DATE(t.createdAt) BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
      .groupBy('t.storeId')
      .getRawMany()

    const statsMap = new Map(txStats.map((s: any) => [s.storeId, { txCount: parseInt(s.txCount), revenue: parseInt(s.revenue) || 0 }]))

    return {
      data: stores.map(s => {
        const stats = statsMap.get(s.id) ?? { txCount: 0, revenue: 0 }
        return {
          ...s,
          kasirCount: users.filter(u => u.storeId === s.id && u.role === 'kasir' && u.isActive).length,
          maxKasir: plan?.maxCashiersPerStore || 0,
          txMonth: stats.txCount,
          revenue: stats.revenue >= 1000000
            ? `Rp ${(stats.revenue / 1000000).toFixed(1)} jt`
            : stats.revenue >= 1000
            ? `Rp ${(stats.revenue / 1000).toFixed(0)} rb`
            : `Rp ${stats.revenue.toLocaleString('id-ID')}`,
        }
      }),
      meta: { totalStores: stores.length, maxStores: plan?.maxStores || 0, maxCashiersPerStore: plan?.maxCashiersPerStore || 0, planName: plan?.name || '-' },
    }
  }

  async createStore(tenantId: number, dto: { name: string; address: string; phone?: string }) {
    const sub = await this.subRepo.findOne({ where: { tenantId, isActive: true } })
    const plan = sub ? await this.planRepo.findOne({ where: { id: sub.planId } }) : undefined
    const currentCount = await this.storeRepo.count({ where: { tenantId } })
    if (plan && currentCount >= plan.maxStores) {
      throw new ForbiddenException(`Batas store telah tercapai (${currentCount}/${plan.maxStores}). Upgrade subscription.`)
    }

    const storeSeq = currentCount + 1
    const ym = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7)
    const tenantSeq = tenantId.toString().padStart(2, '0')
    const storeCode = `STR-${ym}-${tenantSeq}${String(storeSeq).padStart(2, '0')}`

    return this.storeRepo.save(this.storeRepo.create({ ...dto, tenantId, storeCode, isActive: true }))
  }

  async updateStore(id: number, tenantId: number, dto: any) {
    const store = await this.storeRepo.findOne({ where: { id, tenantId } })
    if (!store) throw new NotFoundException('Store tidak ditemukan')
    Object.assign(store, dto)
    return this.storeRepo.save(store)
  }

  async deleteStore(id: number, tenantId: number) {
    const store = await this.storeRepo.findOne({ where: { id, tenantId } })
    if (!store) throw new NotFoundException('Store tidak ditemukan')
    const txCount = await this.txRepo.count({ where: { storeId: id } })
    if (txCount > 0) throw new BadRequestException('Store tidak dapat dihapus karena memiliki riwayat transaksi. Gunakan nonaktifkan.')
    await this.storeRepo.softRemove(store)
    return { message: 'Store berhasil dihapus' }
  }

  async setStoreStatus(id: number, tenantId: number, isActive: boolean) {
    const store = await this.storeRepo.findOne({ where: { id, tenantId } })
    if (!store) throw new NotFoundException('Store tidak ditemukan')
    store.isActive = isActive
    await this.storeRepo.save(store)
    return { message: `Store berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` }
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async getUsers(tenantId: number, params: { storeId?: number; role?: string; search?: string; page?: number; limit?: number }) {
    const { storeId, role, search, page = 1, limit = 10 } = params
    const skip = (page - 1) * limit
    const where: any = { tenantId }
    if (storeId) where.storeId = storeId
    if (role) where.role = role
    if (search) where.name = ILike(`%${search}%`)

    const [data, total] = await this.userRepo.findAndCount({ where, skip, take: limit })
    const stores = await this.storeRepo.find({ where: { tenantId } })

    return {
      data: data.map(u => ({ ...u, password: undefined, storeName: stores.find(s => s.id === u.storeId)?.name })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async createUser(storeId: number, tenantId: number, dto: { name: string; email: string; password: string; role: 'kasir' | 'admin_store' }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email sudah digunakan')

    // BL-004: batas kasir per store
    if (dto.role === 'kasir') {
      const sub = await this.subRepo.findOne({ where: { tenantId, isActive: true } })
      const plan = sub ? await this.planRepo.findOne({ where: { id: sub.planId } }) : undefined
      const kasirCount = await this.userRepo.count({ where: { storeId, role: 'kasir', isActive: true } })
      if (plan && kasirCount >= plan.maxCashiersPerStore) {
        throw new ForbiddenException(`Store ini sudah mencapai batas ${plan.maxCashiersPerStore} kasir aktif`)
      }
    }

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 10)
    const hashed = await bcrypt.hash(dto.password, rounds)
    const user = new User()
    user.name = dto.name
    user.email = dto.email
    user.password = hashed
    user.role = dto.role
    user.tenantId = tenantId
    user.storeId = storeId
    user.isActive = true
    const saved = await this.userRepo.save(user)
    return { ...saved, password: undefined }
  }

  async updateUser(id: number, tenantId: number, dto: { name?: string; email?: string }) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } })
    if (!user) throw new NotFoundException('User tidak ditemukan')
    Object.assign(user, dto)
    await this.userRepo.save(user)
    return { message: 'Data user berhasil diupdate' }
  }

  async setUserStatus(id: number, tenantId: number, isActive: boolean) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } })
    if (!user) throw new NotFoundException('User tidak ditemukan')
    user.isActive = isActive
    await this.userRepo.save(user)
    return { message: `User berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` }
  }

  // ── Transactions ─────────────────────────────────────────────────────────

  async getTransactions(tenantId: number, params: { page?: number; limit?: number; search?: string; date?: string; storeId?: number; cashierId?: number }) {
    const { page = 1, limit = 10, search, date, storeId, cashierId } = params
    const skip = (page - 1) * limit

    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'i')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit)

    if (storeId) qb.andWhere('t.storeId = :storeId', { storeId })
    if (cashierId) qb.andWhere('t.cashierId = :cashierId', { cashierId })
    if (date) qb.andWhere('DATE(t.createdAt) = :date', { date })
    if (search) qb.andWhere('t.transactionCode LIKE :search', { search: `%${search}%` })

    const [txs, total] = await qb.getManyAndCount()

    // Enrich cashier dan store names secara terpisah
    const cashierIds = [...new Set(txs.map(t => t.cashierId).filter(Boolean))]
    const storeIds   = [...new Set(txs.map(t => t.storeId).filter(Boolean))]

    const cashiers = cashierIds.length ? await this.userRepo.find({ where: cashierIds.map(id => ({ id })) as any }) : []
    const storeList = storeIds.length  ? await this.storeRepo.find({ where: storeIds.map(id => ({ id })) as any }) : []

    const cashierMap = new Map(cashiers.map(u => [u.id, u.name]))
    const storeMap   = new Map(storeList.map(s => [s.id, s.name]))

    return {
      data: txs.map(t => ({
        id: t.id,
        transactionCode: t.transactionCode,
        storeId: t.storeId,
        storeName: storeMap.get(t.storeId) ?? null,
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
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getTransactionSummary(tenantId: number, dateFrom?: string, dateTo?: string) {
    const stores = await this.storeRepo.find({ where: { tenantId } })
    const result: { storeId: number; storeName: string; totalTransactions: number; totalRevenue: number }[] = []
    for (const store of stores) {
      const txs = await this.txRepo.find({ where: { tenantId, storeId: store.id } })
      const filtered = txs.filter(t => {
        const d = t.createdAt.toISOString().split('T')[0]
        return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)
      })
      result.push({ storeId: store.id, storeName: store.name, totalTransactions: filtered.length, totalRevenue: filtered.reduce((s, t) => s + t.totalAmount, 0) })
    }
    return result
  }
}
