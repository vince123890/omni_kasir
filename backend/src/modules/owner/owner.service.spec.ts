import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OwnerService } from './owner.service'
import { Store } from '../../entities/store.entity'
import { User } from '../../entities/user.entity'
import { Transaction } from '../../entities/transaction.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import {
  mockRepo, makeStore, makeUser, makeSubscription, makeSubscriptionPlan, makeTransaction,
} from '../../test/factories'

describe('OwnerService', () => {
  let service: OwnerService
  let storeRepo: ReturnType<typeof mockRepo>
  let userRepo: ReturnType<typeof mockRepo>
  let txRepo: ReturnType<typeof mockRepo>
  let subRepo: ReturnType<typeof mockRepo>
  let planRepo: ReturnType<typeof mockRepo>

  beforeEach(async () => {
    storeRepo = mockRepo()
    userRepo = mockRepo()
    txRepo = mockRepo()
    subRepo = mockRepo()
    planRepo = mockRepo()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        { provide: getRepositoryToken(Store), useValue: storeRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        { provide: getRepositoryToken(SubscriptionPlan), useValue: planRepo },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(1) } },
      ],
    }).compile()

    service = module.get<OwnerService>(OwnerService)
  })

  // ── getStores ──────────────────────────────────────────────────────────────

  describe('getStores', () => {
    it('return stores dengan kasirCount dan meta plan', async () => {
      subRepo.findOne.mockResolvedValue(makeSubscription())
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ maxStores: 5, maxCashiersPerStore: 5, name: 'Pro' }))
      storeRepo.find.mockResolvedValue([makeStore()])
      userRepo.find.mockResolvedValue([
        makeUser({ storeId: 1, role: 'kasir', isActive: true }),
        makeUser({ id: 2, storeId: 1, role: 'kasir', isActive: true }),
        makeUser({ id: 3, storeId: 1, role: 'kasir', isActive: false }),  // nonaktif tidak dihitung
      ])

      // Mock txRepo queryBuilder for txMonth calculation
      txRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ storeId: 1, txCount: '5', revenue: '106000' }]),
      })

      const result = await service.getStores(1)
      expect(result.data[0].kasirCount).toBe(2)  // hanya kasir aktif
      expect(result.meta.planName).toBe('Pro')
      expect(result.meta.maxStores).toBe(5)
      expect(result.meta.maxCashiersPerStore).toBe(5)
    })

    it('return meta default jika tidak ada subscription', async () => {
      subRepo.findOne.mockResolvedValue(null)
      storeRepo.find.mockResolvedValue([makeStore()])
      userRepo.find.mockResolvedValue([])
      txRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })

      const result = await service.getStores(1)
      expect(result.meta.maxStores).toBe(0)
      expect(result.meta.planName).toBe('-')
    })
  })

  // ── createStore ────────────────────────────────────────────────────────────

  describe('createStore', () => {
    it('berhasil buat store baru', async () => {
      subRepo.findOne.mockResolvedValue(makeSubscription())
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ maxStores: 5 }))
      storeRepo.count.mockResolvedValue(2)
      storeRepo.save.mockResolvedValue(makeStore({ id: 4, name: 'Cabang Baru', storeCode: 'STR-2605-0103' }))

      const result = await service.createStore(1, { name: 'Cabang Baru', address: 'Jl. Test 1' })
      expect(storeRepo.save).toHaveBeenCalled()
    })

    it('BL-003: throw ForbiddenException jika batas store tercapai', async () => {
      subRepo.findOne.mockResolvedValue(makeSubscription())
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ maxStores: 1 }))
      storeRepo.count.mockResolvedValue(1)  // sudah 1 store, maxStores=1

      await expect(service.createStore(1, { name: 'Store Baru', address: 'Test' }))
        .rejects.toThrow(ForbiddenException)
    })
  })

  // ── deleteStore ────────────────────────────────────────────────────────────

  describe('deleteStore', () => {
    it('berhasil hapus store jika tidak ada transaksi', async () => {
      storeRepo.findOne.mockResolvedValue(makeStore())
      txRepo.count.mockResolvedValue(0)
      storeRepo.softRemove.mockResolvedValue({})

      const result = await service.deleteStore(1, 1)
      expect(result.message).toBe('Store berhasil dihapus')
      expect(storeRepo.softRemove).toHaveBeenCalled()
    })

    it('BL-011: throw BadRequest jika store punya transaksi', async () => {
      storeRepo.findOne.mockResolvedValue(makeStore())
      txRepo.count.mockResolvedValue(5)

      await expect(service.deleteStore(1, 1)).rejects.toThrow()
      expect(storeRepo.softRemove).not.toHaveBeenCalled()
    })

    it('throw NotFoundException jika store tidak ditemukan', async () => {
      storeRepo.findOne.mockResolvedValue(null)
      await expect(service.deleteStore(999, 1)).rejects.toThrow(NotFoundException)
    })
  })

  // ── getUsers ───────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('return list users dengan storeName', async () => {
      const users = [
        makeUser({ id: 11, name: 'Ani Rahayu', role: 'kasir', storeId: 1 }),
        makeUser({ id: 8, name: 'Muhammad Rizal', role: 'admin_store', storeId: 1 }),
      ]
      userRepo.findAndCount.mockResolvedValue([users, 2])
      storeRepo.find.mockResolvedValue([makeStore({ id: 1, name: 'Toko Pusat Sudirman' })])

      const result = await service.getUsers(1, {})
      expect(result.data.length).toBe(2)
      expect(result.data[0]).toHaveProperty('storeName')
      expect(result.data[0].storeName).toBe('Toko Pusat Sudirman')
    })

    it('filter by storeId', async () => {
      userRepo.findAndCount.mockResolvedValue([[makeUser()], 1])
      storeRepo.find.mockResolvedValue([makeStore()])

      await service.getUsers(1, { storeId: 1 })
      expect(userRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ storeId: 1 }),
      }))
    })
  })

  // ── createUser ─────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('berhasil tambah kasir baru', async () => {
      userRepo.findOne.mockResolvedValue(null)  // email belum ada
      subRepo.findOne.mockResolvedValue(makeSubscription())
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ maxCashiersPerStore: 5 }))
      userRepo.count.mockResolvedValue(2)  // 2 kasir aktif, max 5 → masih bisa
      userRepo.save.mockResolvedValue(makeUser({ id: 20, name: 'Kasir Baru', role: 'kasir' }))

      const result = await service.createUser(1, 1, {
        name: 'Kasir Baru', email: 'kasir.baru@test.com', password: 'pass123', role: 'kasir',
      })
      expect(userRepo.save).toHaveBeenCalled()
    })

    it('throw ConflictException jika email sudah digunakan', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ email: 'existing@test.com' }))

      await expect(service.createUser(1, 1, {
        name: 'Test', email: 'existing@test.com', password: 'pass123', role: 'kasir',
      })).rejects.toThrow(ConflictException)
    })

    it('BL-004: throw ForbiddenException jika kasir limit tercapai', async () => {
      userRepo.findOne.mockResolvedValue(null)
      subRepo.findOne.mockResolvedValue(makeSubscription())
      planRepo.findOne.mockResolvedValue(makeSubscriptionPlan({ maxCashiersPerStore: 2 }))
      userRepo.count.mockResolvedValue(2)  // sudah 2 kasir aktif = max

      await expect(service.createUser(1, 1, {
        name: 'Extra Kasir', email: 'extra@test.com', password: 'pass123', role: 'kasir',
      })).rejects.toThrow(ForbiddenException)
    })

    it('admin_store tidak dibatasi oleh maxCashiersPerStore', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.save.mockResolvedValue(makeUser({ role: 'admin_store' }))

      // Untuk admin_store, tidak cek limit kasir
      const result = await service.createUser(1, 1, {
        name: 'Admin Store Baru', email: 'admin.baru@test.com', password: 'pass123', role: 'admin_store',
      })
      expect(userRepo.save).toHaveBeenCalled()
      expect(subRepo.findOne).not.toHaveBeenCalled()  // tidak cek subscription untuk admin_store
    })
  })

  // ── getTransactions ────────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('return transaksi dengan cashierName dan storeName', async () => {
      const txs = [makeTransaction()]
      txRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([txs, 1]),
      })
      userRepo.find.mockResolvedValue([{ id: 11, name: 'Ani Rahayu' }])
      storeRepo.find.mockResolvedValue([makeStore({ id: 1, name: 'Toko Pusat Sudirman' })])

      const result = await service.getTransactions(1, {})
      expect(result.data[0].cashierName).toBe('Ani Rahayu')
      expect(result.data[0].storeName).toBe('Toko Pusat Sudirman')
    })
  })
})
