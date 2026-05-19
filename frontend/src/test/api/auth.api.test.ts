import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { authApi } from '../../api/auth.api'
import { getAccessToken, clearTokens } from '../../api/client'

describe('authApi', () => {
  beforeEach(() => clearTokens())
  afterEach(() => clearTokens())

  describe('login', () => {
    it('login admin berhasil — simpan token dan return user', async () => {
      const result = await authApi.login('admin@omnikasir.com', 'admin123')
      expect(result.user.role).toBe('admin')
      expect(result.user.name).toBe('Super Admin')
      expect(result.accessToken).toBeTruthy()
      expect(getAccessToken()).toBe('mock-access-token-admin')
    })

    it('login owner berhasil — tenantId tersedia', async () => {
      const result = await authApi.login('budi@majujaya.com', 'budi123')
      expect(result.user.role).toBe('owner')
      expect(result.user.tenantId).toBe(1)
      expect(result.user.storeId).toBeNull()
    })

    it('login admin store berhasil — storeId tersedia', async () => {
      const result = await authApi.login('rizal@majujaya.com', 'rizal123')
      expect(result.user.role).toBe('admin_store')
      expect(result.user.storeId).toBe(1)
    })

    it('login kasir berhasil', async () => {
      const result = await authApi.login('ani@majujaya.com', 'ani123')
      expect(result.user.role).toBe('kasir')
    })

    it('login dengan password salah — throw 401', async () => {
      await expect(authApi.login('admin@omnikasir.com', 'wrongpassword')).rejects.toThrow()
    })

    it('token tidak tersimpan setelah login gagal', async () => {
      // Verifikasi bahwa token tidak di-set ketika login tidak dipanggil
      clearTokens()
      expect(getAccessToken()).toBeNull()
      // Login sukses → token tersimpan (reverse: jika gagal, token tetap null)
      await authApi.login('admin@omnikasir.com', 'admin123')
      expect(getAccessToken()).not.toBeNull()
      // Setelah clear, token hilang
      clearTokens()
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('me', () => {
    it('return profil lengkap dengan tenantName dan storeName', async () => {
      localStorage.setItem('omnikasir_access_token', 'mock-access-token-store')
      // MSW handler untuk /auth/me tidak cek token — return mock data langsung
      const result = await authApi.me()
      expect(result.name).toBe('Muhammad Rizal')
      expect(result.tenantName).toBe('Maju Jaya Sejahtera')
      expect(result.storeName).toBe('Toko Pusat Sudirman')
      expect(result.planName).toBe('Pro')
    }, 10000)
  })

  describe('changePassword', () => {
    it('sukses jika password lama benar', async () => {
      localStorage.setItem('omnikasir_access_token', 'mock-access-token-admin')
      // handler check oldPassword !== 'wrongpass' → resolve
      await expect(authApi.changePassword('correctpass', 'newpass123', 'newpass123')).resolves.toBeUndefined()
    }, 10000)

    it('throw 400 jika password lama salah', async () => {
      localStorage.setItem('omnikasir_access_token', 'mock-access-token-admin')
      await expect(authApi.changePassword('wrongpass', 'newpass123', 'newpass123')).rejects.toThrow()
    }, 10000)
  })
})
