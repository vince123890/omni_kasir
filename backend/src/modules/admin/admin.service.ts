import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Subscription } from '../../entities/subscription.entity'
import { User } from '../../entities/user.entity'
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { CreateAdminUserDto } from './dto/create-admin-user.dto'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private config: ConfigService,
  ) {}

  // ── Subscription Plans ──────────────────────────────────────────────────

  async getPlans() {
    const plans = await this.planRepo.find({ order: { price: 'ASC' } })
    const tenants = await this.tenantRepo.find()
    const subs = await this.subRepo.find({ where: { isActive: true } })
    return plans.map(p => ({
      ...p,
      tenantCount: subs.filter(s => s.planId === p.id).length,
    }))
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const existing = await this.planRepo.findOne({ where: { name: ILike(dto.name) } })
    if (existing) throw new ConflictException(`Nama plan "${dto.name}" sudah digunakan`)
    return this.planRepo.save(this.planRepo.create(dto))
  }

  async updatePlan(id: number, dto: Partial<CreateSubscriptionPlanDto> & { isActive?: boolean; isPopular?: boolean }) {
    const plan = await this.planRepo.findOne({ where: { id } })
    if (!plan) throw new NotFoundException('Plan tidak ditemukan')
    if (dto.name && dto.name !== plan.name) {
      const dup = await this.planRepo.findOne({ where: { name: ILike(dto.name) } })
      if (dup) throw new ConflictException(`Nama plan "${dto.name}" sudah digunakan`)
    }
    // BL-017: hanya 1 plan populer
    if (dto.isPopular === true) {
      await this.planRepo.update({}, { isPopular: false })
    }
    Object.assign(plan, dto)
    return this.planRepo.save(plan)
  }

  async deletePlan(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } })
    if (!plan) throw new NotFoundException('Plan tidak ditemukan')
    const count = await this.subRepo.count({ where: { planId: id, isActive: true } })
    if (count > 0) throw new BadRequestException(`Plan tidak bisa dihapus. ${count} tenant masih menggunakan plan ini.`)
    await this.planRepo.remove(plan)
    return { message: 'Plan berhasil dihapus' }
  }

  // ── Tenants ─────────────────────────────────────────────────────────────

  async getTenants(params: { search?: string; entityType?: string; status?: string; plan?: string; page?: number; limit?: number }) {
    const { search, entityType, page = 1, limit = 10 } = params
    const skip = (page - 1) * limit

    const qb = this.tenantRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t', 'sub', 'sub.tenantId = t.id AND sub.isActive = 1')

    if (search) qb.andWhere('(t.name LIKE :s OR t.fullName LIKE :s)', { s: `%${search}%` })
    if (entityType) qb.andWhere('t.entityType = :et', { et: entityType })

    const tenants = await this.tenantRepo.find({
      where: search ? [{ name: ILike(`%${search}%`) }] : {},
      skip, take: limit,
    })
    const total = await this.tenantRepo.count()

    const subs = await this.subRepo.find({ relations: ['plan'] })
    const users = await this.userRepo.find({ where: { role: 'owner' } })

    const data = tenants
      .filter(t => !entityType || t.entityType === entityType)
      .map(t => {
        const sub = subs.find(s => s.tenantId === t.id && s.isActive)
        const owner = users.find(u => u.tenantId === t.id)
        const now = new Date()
        let status = 'nonaktif'
        if (t.isActive && sub) {
          status = new Date(sub.expiredAt) >= now ? 'aktif' : 'expired'
        }
        return {
          ...t,
          owner: owner?.name,
          email: owner?.email,
          plan: (sub?.plan as any)?.name,
          expired: sub?.expiredAt,
          joinDate: t.createdAt?.toISOString().split('T')[0],
          status,
        }
      })

    const filtered = params.status ? data.filter(d => d.status === params.status) : data
    const planFiltered = params.plan ? filtered.filter(d => d.plan === params.plan) : filtered

    return {
      data: planFiltered.slice(skip, skip + limit),
      meta: { total: planFiltered.length, page, limit, totalPages: Math.ceil(planFiltered.length / limit) },
    }
  }

  async getTenantDetail(id: number) {
    const tenant = await this.tenantRepo.findOne({ where: { id } })
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan')

    const owner = await this.userRepo.findOne({ where: { tenantId: id, role: 'owner' } })
    const sub = await this.subRepo.findOne({ where: { tenantId: id, isActive: true }, relations: ['plan'] })
    const allSubs = await this.subRepo.find({ where: { tenantId: id }, relations: ['plan'], order: { startAt: 'ASC' } })
    const users = await this.userRepo.find({ where: { tenantId: id } })

    const now = new Date()
    const status = tenant.isActive && sub
      ? (new Date(sub.expiredAt) >= now ? 'aktif' : 'expired')
      : 'nonaktif'

    return {
      ...tenant,
      owner: owner?.name,
      email: owner?.email,
      plan: (sub?.plan as any)?.name,
      expired: sub?.expiredAt,
      joinDate: tenant.createdAt?.toISOString().split('T')[0],
      status,
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, lastLogin: u.lastLogin })),
      subscriptionHistory: allSubs.map(s => ({
        plan: (s.plan as any)?.name,
        startAt: s.startAt,
        expiredAt: s.expiredAt,
        status: new Date(s.expiredAt) >= now && s.isActive ? 'active' : 'expired',
      })),
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        inactiveUsers: users.filter(u => !u.isActive).length,
      },
    }
  }

  async createTenant(dto: CreateTenantDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email sudah digunakan')

    const plan = await this.planRepo.findOne({ where: { id: dto.planId } })
    if (!plan) throw new NotFoundException('Plan tidak ditemukan')

    // Auto-generate tenantCode
    const count = await this.tenantRepo.count()
    const ym = dto.startDate.replace(/-/g, '').slice(0, 6)
    const tenantCode = `TNT-${ym}-${String(count + 1).padStart(3, '0')}`

    const tenant = await this.tenantRepo.save(this.tenantRepo.create({
      tenantCode,
      entityType: dto.entityType,
      name: dto.name,
      fullName: `${dto.entityType} ${dto.name}`,
      isActive: true,
    }))

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 10)
    const hashed = await bcrypt.hash(dto.password, rounds)
    const owner = new User()
    owner.name = dto.ownerName
    owner.email = dto.email
    owner.password = hashed
    owner.role = 'owner'
    owner.tenantId = tenant.id
    owner.isActive = true
    const savedOwner = await this.userRepo.save(owner)

    const startDate = new Date(dto.startDate)
    const expiredAt = new Date(startDate)
    expiredAt.setDate(expiredAt.getDate() + plan.durationDays)

    const sub = await this.subRepo.save(this.subRepo.create({
      tenantId: tenant.id,
      planId: dto.planId,
      startAt: startDate,
      expiredAt,
      isActive: true,
    }))

    return { tenantId: tenant.id, tenantCode, ownerId: savedOwner.id, subscriptionId: sub.id }
  }

  async updateTenant(id: number, dto: { entityType?: string; name?: string; ownerName?: string }) {
    const tenant = await this.tenantRepo.findOne({ where: { id } })
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan')
    if (dto.name || dto.entityType) {
      tenant.name = dto.name || tenant.name
      tenant.entityType = dto.entityType || tenant.entityType
      tenant.fullName = `${tenant.entityType} ${tenant.name}`
    }
    await this.tenantRepo.save(tenant)
    if (dto.ownerName) {
      await this.userRepo.update({ tenantId: id, role: 'owner' }, { name: dto.ownerName })
    }
    return tenant
  }

  async setTenantStatus(id: number, isActive: boolean) {
    const tenant = await this.tenantRepo.findOne({ where: { id } })
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan')
    tenant.isActive = isActive
    await this.tenantRepo.save(tenant)
    return { message: `Tenant berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` }
  }

  async renewSubscription(id: number, dto: { planId: number; startDate: string; durationDays: number }) {
    const tenant = await this.tenantRepo.findOne({ where: { id } })
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan')
    const plan = await this.planRepo.findOne({ where: { id: dto.planId } })
    if (!plan) throw new NotFoundException('Plan tidak ditemukan')

    await this.subRepo.update({ tenantId: id, isActive: true }, { isActive: false })

    const startAt = new Date(dto.startDate)
    const expiredAt = new Date(startAt)
    expiredAt.setDate(expiredAt.getDate() + dto.durationDays)

    await this.subRepo.save(this.subRepo.create({ tenantId: id, planId: dto.planId, startAt, expiredAt, isActive: true }))
    if (!tenant.isActive) { tenant.isActive = true; await this.tenantRepo.save(tenant) }

    return { newExpiredAt: expiredAt.toISOString().split('T')[0], plan: plan.name }
  }

  // ── Admin Users ─────────────────────────────────────────────────────────

  async getAdminUsers() {
    return this.userRepo.find({ where: { role: 'admin' }, order: { id: 'ASC' } })
  }

  async createAdminUser(dto: CreateAdminUserDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email sudah digunakan')

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 10)
    const hashed = await bcrypt.hash(dto.password, rounds)
    const user = new User()
    user.name = dto.name
    user.email = dto.email
    user.password = hashed
    user.role = 'admin'
    user.isActive = true
    return this.userRepo.save(user)
  }

  async setAdminUserStatus(id: number, isActive: boolean) {
    const user = await this.userRepo.findOne({ where: { id, role: 'admin' } })
    if (!user) throw new NotFoundException('Admin tidak ditemukan')
    if (user.id === 1) throw new ForbiddenException('Admin utama tidak bisa dinonaktifkan')
    user.isActive = isActive
    await this.userRepo.save(user)
    return { message: `Admin berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` }
  }
}
