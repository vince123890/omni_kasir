import { describe, it, expect, beforeEach } from 'vitest'
import { tenantApi, subscriptionPlanApi, adminUserApi } from '../../api/admin.api'

beforeEach(() => {
  localStorage.setItem('omnikasir_access_token', 'mock-access-token-admin')
})

describe('subscriptionPlanApi', () => {
  it('list — return 3 plan', async () => {
    const plans = await subscriptionPlanApi.list()
    expect(plans).toHaveLength(3)
    expect(plans.map(p => p.name)).toContain('Pro')
    expect(plans.find(p => p.isPopular)?.name).toBe('Pro')
  })

  it('list — plan punya field lengkap', async () => {
    const plans = await subscriptionPlanApi.list()
    const pro = plans.find(p => p.name === 'Pro')!
    expect(pro.price).toBe(299000)
    expect(pro.maxStores).toBe(5)
    expect(pro.maxCashiersPerStore).toBe(5)
  })
})

describe('tenantApi', () => {
  it('list — return array tenant dengan meta', async () => {
    const result = await tenantApi.list()
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.meta.total).toBeGreaterThan(0)
    expect(result.meta.page).toBe(1)
  })

  it('list — tenant punya field yang diperlukan', async () => {
    const result = await tenantApi.list()
    const tenant = result.data[0]
    expect(tenant).toHaveProperty('tenantCode')
    expect(tenant).toHaveProperty('entityType')
    expect(tenant).toHaveProperty('owner')
    expect(tenant).toHaveProperty('plan')
    expect(tenant).toHaveProperty('status')
    expect(tenant).toHaveProperty('expired')
  })

  it('list dengan search — filter hasil', async () => {
    const result = await tenantApi.list({ search: 'maju' })
    expect(result.data.every(t => t.name.toLowerCase().includes('maju'))).toBe(true)
  })

  it('list dengan search tidak cocok — return empty', async () => {
    const result = await tenantApi.list({ search: 'zzztidakada' })
    expect(result.data).toHaveLength(0)
  })
})

describe('adminUserApi', () => {
  it('list — return daftar admin', async () => {
    const users = await adminUserApi.list()
    expect(users.length).toBeGreaterThan(0)
    expect(users[0].email).toBe('admin@omnikasir.com')
  })

  it('create — berhasil tambah admin baru', async () => {
    const result = await adminUserApi.create({ name: 'Admin Baru', email: 'baru@omnikasir.com', password: 'password123' })
    expect(result.name).toBe('Admin Baru')
    expect(result.isActive).toBe(true)
  })

  it('create — throw 409 jika email duplikat', async () => {
    await expect(adminUserApi.create({ name: 'Duplikat', email: 'admin@omnikasir.com', password: 'password123' })).rejects.toThrow()
  })
})
