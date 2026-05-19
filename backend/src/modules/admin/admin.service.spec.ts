import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AdminService } from './admin.service'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Subscription } from '../../entities/subscription.entity'
import { User } from '../../entities/user.entity'
import { mockRepo, makeSubscriptionPlan, makeTenant, makeSubscription, makeUser, HASHED_PASSWORD } from '../../test/factories'

describe('AdminService', () => {
  let service: AdminService
  let planRepo: ReturnType<typeof mockRepo>
  let tenantRepo: ReturnType<typeof mockRepo>
  let subRepo: ReturnType<typeof mockRepo>
  let userRepo: ReturnType<typeof mockRepo>

  beforeEach(async () => {
    planRepo = mockRepo()
    tenantRepo = mockRepo()
    subRepo = mockRepo()
    userRepo = mockRepo()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(SubscriptionPlan), useValue: planRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(1) } },
      ],
    }).compile()

    service = module.get<AdminService>(AdminService)
  })

  // ── getPlans ───────────────────────────────────────────────────────────────

  describe('getPlans', () => {
    it('return list plan dengan tenantCount', async () => {
      planRepo.find.mockResolvedValue([
        makeSubscriptionPlan({ id: 1, name: 'Basic' }),
        makeSubscriptionPlan({ id: 2, name: 'Pro', isPopular: true }),
      ])
      tenantRepo.find.mockResolvedValue([])
      subRepo.find.mockResolvedValue([
        makeSubscription({ planId: 2 }),
        makeSubscription({ id: 2, planId: 2 }),
      ])

      const result = await service.getPlans()
      const pro = result.find(p => p.name === 'Pro')!
      expect(pro.tenantCount).toBe(2)
      const basic = result.find(p => p.name === 'Basic')!
      expect(basic.tenantCount).toBe(0)
    })
  })

  // ── createPlan ─────────────────────────────────────────────────────────────

  describe('createPlan', () => {
    it('berhasil buat plan baru', async () => {
      planRepo.findOne.mockResolvedValue(null)
      planRepo.save.mockResolvedValue(makeSubscriptionPlan({ id: 4, name: 'Starter' }))

      const result = await service.createPlan({ name: 'Starter', price: 49000, durationDays: 30, maxStores: 1, maxCashiersPerStore: 1 })
      expect(planRepo.save).toHaveBeenCalled()
    })

    it('throw ConflictException jika nama plan sudah ada', async () => {
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ name: 'Pro' }))
      await expect(service.createPlan({ name: 'Pro', price: 200000, durationDays: 30, maxStores: 3, maxCashiersPerStore: 3 }))
        .rejects.toThrow(ConflictException)
    })
  })

  // ── updatePlan ─────────────────────────────────────────────────────────────

  describe('updatePlan', () => {
    it('BL-017: set isPopular → reset semua plan lain', async () => {
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      planRepo.update.mockResolvedValue({ affected: 3 })
      planRepo.save.mockResolvedValue({})

      await service.updatePlan(2, { isPopular: true })
      expect(planRepo.update).toHaveBeenCalledWith({}, { isPopular: false })
    })

    it('tidak reset isPopular jika tidak di-set', async () => {
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      planRepo.save.mockResolvedValue({})

      await service.updatePlan(2, { price: 350000 })
      expect(planRepo.update).not.toHaveBeenCalled()
    })

    it('throw NotFoundException jika plan tidak ditemukan', async () => {
      planRepo.findOne.mockResolvedValue(null)
      await expect(service.updatePlan(999, { price: 100 })).rejects.toThrow(NotFoundException)
    })
  })

  // ── deletePlan ─────────────────────────────────────────────────────────────

  describe('deletePlan', () => {
    it('berhasil hapus plan jika tidak ada tenant aktif', async () => {
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      subRepo.count.mockResolvedValue(0)
      planRepo.remove.mockResolvedValue({})

      const result = await service.deletePlan(1)
      expect(result.message).toBe('Plan berhasil dihapus')
    })

    it('throw BadRequestException jika masih ada tenant pakai plan ini', async () => {
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      subRepo.count.mockResolvedValue(3)

      await expect(service.deletePlan(2)).rejects.toThrow(BadRequestException)
      expect(planRepo.remove).not.toHaveBeenCalled()
    })
  })

  // ── getTenants ─────────────────────────────────────────────────────────────

  describe('getTenants', () => {
    it('return list tenant dengan status aktif/expired/nonaktif', async () => {
      const tenants = [
        makeTenant({ id: 1, isActive: true }),
        makeTenant({ id: 2, isActive: false }),
      ]
      tenantRepo.find.mockResolvedValue(tenants)
      tenantRepo.count.mockResolvedValue(2)
      subRepo.find.mockResolvedValue([
        makeSubscription({ tenantId: 1, expiredAt: new Date('2099-12-31') }),
        makeSubscription({ tenantId: 2, expiredAt: new Date('2020-01-01') }),
      ])
      userRepo.find.mockResolvedValue([makeUser({ role: 'owner', email: 'owner1@test.com', name: 'Owner Satu' })])
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ name: 'Pro' }))

      const result = await service.getTenants({})
      expect(result.data.length).toBe(2)
      expect(result.data[0]).toHaveProperty('status')
    })
  })

  // ── createTenant ───────────────────────────────────────────────────────────

  describe('createTenant', () => {
    it('berhasil buat tenant baru dengan owner dan subscription', async () => {
      userRepo.findOne.mockResolvedValue(null)  // email belum ada
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      tenantRepo.count.mockResolvedValue(5)
      tenantRepo.save.mockResolvedValue(makeTenant({ id: 7 }))
      userRepo.save.mockResolvedValue(makeUser({ id: 20, role: 'owner' }))
      subRepo.save.mockResolvedValue(makeSubscription({ id: 7 }))

      const result = await service.createTenant({
        entityType: 'CV', name: 'Berkah Abadi', ownerName: 'Joko Widodo',
        email: 'joko@berkah.com', password: 'password123', planId: 2, startDate: '2026-05-19',
      })

      expect(result).toHaveProperty('tenantId')
      expect(result).toHaveProperty('ownerId')
      expect(result).toHaveProperty('subscriptionId')
      expect(tenantRepo.save).toHaveBeenCalled()
      expect(userRepo.save).toHaveBeenCalled()
      expect(subRepo.save).toHaveBeenCalled()
    })

    it('throw ConflictException jika email sudah digunakan', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ email: 'existing@test.com' }))

      await expect(service.createTenant({
        entityType: 'PT', name: 'Test', ownerName: 'Test', email: 'existing@test.com',
        password: 'pass123', planId: 1, startDate: '2026-05-19',
      })).rejects.toThrow(ConflictException)
    })
  })

  // ── Tenant Status ──────────────────────────────────────────────────────────

  describe('setTenantStatus', () => {
    it('berhasil nonaktifkan tenant', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant())
      tenantRepo.save.mockResolvedValue({})

      const result = await service.setTenantStatus(1, false)
      expect(tenantRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }))
    })

    it('throw NotFoundException jika tenant tidak ada', async () => {
      tenantRepo.findOne.mockResolvedValue(null)
      await expect(service.setTenantStatus(999, false)).rejects.toThrow(NotFoundException)
    })
  })

  // ── Admin Users ────────────────────────────────────────────────────────────

  describe('getAdminUsers', () => {
    it('return hanya user dengan role admin', async () => {
      userRepo.find.mockResolvedValue([
        makeUser({ role: 'admin', email: 'admin@omnikasir.com' }),
      ])
      const result = await service.getAdminUsers()
      expect(result.every((u: any) => u.role === 'admin')).toBe(true)
    })
  })

  describe('createAdminUser', () => {
    it('berhasil buat admin baru', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.save.mockResolvedValue(makeUser({ id: 10, role: 'admin', email: 'admin2@omnikasir.com' }))

      const result = await service.createAdminUser({ name: 'Admin Dua', email: 'admin2@omnikasir.com', password: 'password123' })
      expect(userRepo.save).toHaveBeenCalled()
    })

    it('throw ConflictException jika email duplikat', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ email: 'admin@omnikasir.com' }))
      await expect(service.createAdminUser({ name: 'Duplikat', email: 'admin@omnikasir.com', password: 'pass123' }))
        .rejects.toThrow(ConflictException)
    })
  })
})
