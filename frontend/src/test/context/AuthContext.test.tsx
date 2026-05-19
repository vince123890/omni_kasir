import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import { clearAuthTokens, setAuthTokens } from '../utils'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>
)

describe('AuthContext', () => {
  beforeEach(() => clearAuthTokens())

  it('user null saat tidak ada token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('user terisi dari localStorage jika token ada', () => {
    setAuthTokens('admin')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.role).toBe('admin')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('setUser — update user dan simpan ke localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.setUser({ id: 1, name: 'Test Admin', email: 'test@test.com', role: 'admin', tenantId: null, storeId: null })
    })
    expect(result.current.user?.name).toBe('Test Admin')
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('omni_user')).toContain('Test Admin')
  })

  it('logout — hapus user dan token dari localStorage', () => {
    setAuthTokens('admin')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).not.toBeNull()

    act(() => { result.current.logout() })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('omnikasir_access_token')).toBeNull()
    expect(localStorage.getItem('omni_user')).toBeNull()
  })

  it('user owner — tenantId tidak null, storeId null', () => {
    setAuthTokens('owner')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.tenantId).toBe(1)
    expect(result.current.user?.storeId).toBeNull()
  })

  it('user kasir — tenantId dan storeId tidak null', () => {
    setAuthTokens('kasir')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.tenantId).toBe(1)
    expect(result.current.user?.storeId).toBe(1)
  })

  it('user admin_store — punya tenantName dan storeName', () => {
    setAuthTokens('admin_store')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.tenantName).toBe('Maju Jaya Sejahtera')
    expect(result.current.user?.storeName).toBe('Toko Pusat Sudirman')
  })

  it('setUser null — hapus dari localStorage', () => {
    setAuthTokens('admin')
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => { result.current.setUser(null) })
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('omni_user')).toBeNull()
  })
})
