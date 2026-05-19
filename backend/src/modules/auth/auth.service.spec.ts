import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { User } from '../../entities/user.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Store } from '../../entities/store.entity'
import {
  mockRepo, makeUser, makeAdmin, makeOwner, makeTenant,
  makeSubscription, makeSubscriptionPlan, makeStore, HASHED_PASSWORD,
} from '../../test/factories'

describe('AuthService', () => {
  let service: AuthService
  let userRepo: ReturnType<typeof mockRepo>
  let subscriptionRepo: ReturnType<typeof mockRepo>
  let tenantRepo: ReturnType<typeof mockRepo>
  let storeRepo: ReturnType<typeof mockRepo>
  let planRepo: ReturnType<typeof mockRepo>
  let jwtService: jest.Mocked<JwtService>
  let configService: jest.Mocked<ConfigService>

  beforeEach(async () => {
    userRepo = mockRepo()
    subscriptionRepo = mockRepo()
    tenantRepo = mockRepo()
    storeRepo = mockRepo()
    planRepo = mockRepo()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(SubscriptionPlan), useValue: planRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
        { provide: getRepositoryToken(Store), useValue: storeRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token'), verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jwtService = module.get(JwtService)
    configService = module.get(ConfigService)
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('berhasil login admin — return token dan user', async () => {
      const admin = makeAdmin({ password: HASHED_PASSWORD })
      userRepo.findOne.mockResolvedValue(admin)
      userRepo.update.mockResolvedValue({ affected: 1 })

      const result = await service.login({ email: 'admin@omnikasir.com', password: 'password123' })

      expect(result.accessToken).toBe('mock-jwt-token')
      expect(result.user.role).toBe('admin')
      expect(result.user.email).toBe('admin@omnikasir.com')
      expect(result.user).not.toHaveProperty('password')
    })

    it('berhasil login owner — cek subscription aktif', async () => {
      const owner = makeOwner({ password: HASHED_PASSWORD })
      userRepo.findOne.mockResolvedValue(owner)
      userRepo.update.mockResolvedValue({ affected: 1 })
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription({ expiredAt: new Date('2099-12-31') }))

      const result = await service.login({ email: 'budi@majujaya.com', password: 'password123' })
      expect(result.user.tenantId).toBe(1)
    })

    it('throw 401 jika email tidak ditemukan', async () => {
      userRepo.findOne.mockResolvedValue(null)
      await expect(service.login({ email: 'notexist@x.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('throw 401 jika password salah', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ password: HASHED_PASSWORD }))
      await expect(service.login({ email: 'test@x.com', password: 'wrongpassword' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('throw 401 jika akun nonaktif', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ isActive: false, password: HASHED_PASSWORD }))
      await expect(service.login({ email: 'test@x.com', password: 'password123' }))
        .rejects.toThrow('Akun Anda dinonaktifkan')
    })

    it('throw 401 jika subscription expired (BL-002)', async () => {
      const owner = makeOwner({ password: HASHED_PASSWORD, tenantId: 1 })
      userRepo.findOne.mockResolvedValue(owner)
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription({ expiredAt: new Date('2020-01-01') }))

      await expect(service.login({ email: owner.email, password: 'password123' }))
        .rejects.toThrow('Subscription Anda telah berakhir')
    })

    it('throw 401 jika subscription tidak ada', async () => {
      const owner = makeOwner({ password: HASHED_PASSWORD, tenantId: 1 })
      userRepo.findOne.mockResolvedValue(owner)
      subscriptionRepo.findOne.mockResolvedValue(null)

      await expect(service.login({ email: owner.email, password: 'password123' }))
        .rejects.toThrow('Subscription Anda telah berakhir')
    })

    it('admin tidak perlu cek subscription (BL-002)', async () => {
      const admin = makeAdmin({ password: HASHED_PASSWORD, tenantId: null })
      userRepo.findOne.mockResolvedValue(admin)
      userRepo.update.mockResolvedValue({ affected: 1 })

      const result = await service.login({ email: admin.email, password: 'password123' })
      // subscriptionRepo tidak boleh dipanggil untuk admin
      expect(subscriptionRepo.findOne).not.toHaveBeenCalled()
      expect(result.user.role).toBe('admin')
    })

    it('update lastLogin setelah berhasil login', async () => {
      userRepo.findOne.mockResolvedValue(makeAdmin({ password: HASHED_PASSWORD }))
      userRepo.update.mockResolvedValue({ affected: 1 })

      await service.login({ email: 'admin@omnikasir.com', password: 'password123' })
      expect(userRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ lastLogin: expect.any(Date) }))
    })
  })

  // ── me ────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('return profil admin — tanpa tenant/store info', async () => {
      userRepo.findOne.mockResolvedValue(makeAdmin())
      const result = await service.me(1)
      expect(result.name).toBe('Super Admin')
      expect(result.tenantName).toBeNull()
      expect(result.storeName).toBeNull()
    })

    it('return profil owner — dengan tenantName dan planName', async () => {
      userRepo.findOne.mockResolvedValue(makeOwner())
      tenantRepo.findOne.mockResolvedValue(makeTenant())
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription({ expiredAt: new Date('2026-08-15') }))
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ name: 'Pro' }))

      const result = await service.me(2)
      expect(result.tenantName).toBe('Maju Jaya Sejahtera')
      expect(result.tenantEntityType).toBe('PT')
      expect(result.planName).toBe('Pro')
      expect(result.expiredAt).toBe('2026-08-15')
    })

    it('return profil admin_store — dengan storeName', async () => {
      userRepo.findOne.mockResolvedValue(makeAdminStore())
      tenantRepo.findOne.mockResolvedValue(makeTenant())
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription({ expiredAt: new Date('2026-08-15') }))
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan())
      storeRepo.findOne.mockResolvedValue(makeStore({ name: 'Toko Pusat Sudirman' }))

      const result = await service.me(8)
      expect(result.storeName).toBe('Toko Pusat Sudirman')
    })

    it('throw 401 jika user tidak ditemukan', async () => {
      userRepo.findOne.mockResolvedValue(null)
      await expect(service.me(999)).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── changePassword ────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('berhasil ganti password', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ password: HASHED_PASSWORD }))
      userRepo.update.mockResolvedValue({ affected: 1 })
      configService.get.mockReturnValue(1)

      const result = await service.changePassword(1, {
        oldPassword: 'password123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      })
      expect(result.message).toBe('Password berhasil diubah')
      expect(userRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ passwordChangedAt: expect.any(Date) }))
    })

    it('throw 400 jika confirm password tidak sesuai', async () => {
      await expect(service.changePassword(1, {
        oldPassword: 'password123', newPassword: 'newpass', confirmPassword: 'berbeda',
      })).rejects.toThrow('Konfirmasi password tidak sesuai')
    })

    it('throw 400 jika password lama salah', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ password: HASHED_PASSWORD }))
      await expect(service.changePassword(1, {
        oldPassword: 'wrongpassword', newPassword: 'newpass123', confirmPassword: 'newpass123',
      })).rejects.toThrow('Password lama tidak sesuai')
    })

    it('throw 400 jika password baru sama dengan lama', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ password: HASHED_PASSWORD }))
      await expect(service.changePassword(1, {
        oldPassword: 'password123', newPassword: 'password123', confirmPassword: 'password123',
      })).rejects.toThrow('Password baru harus berbeda')
    })
  })
})

// helper untuk makeAdminStore
function makeAdminStore(overrides: Partial<any> = {}) {
  return makeUser({ id: 8, name: 'Muhammad Rizal', email: 'rizal@majujaya.com', role: 'admin_store', ...overrides })
}
