import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { type ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'

interface WrapperProps {
  routerProps?: MemoryRouterProps
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: ReactNode,
  { routerProps, initialEntries = ['/'], ...options }: WrapperProps & RenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries} {...routerProps}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}

// Helper: set localStorage tokens (simulates logged-in state)
export function setAuthTokens(role: 'admin' | 'owner' | 'admin_store' | 'kasir' = 'admin') {
  const tokenMap = {
    admin:       'mock-access-token-admin',
    owner:       'mock-access-token-owner',
    admin_store: 'mock-access-token-store',
    kasir:       'mock-access-token-kasir',
  }
  const userMap = {
    admin:       { id: 1, name: 'Super Admin',     email: 'admin@omnikasir.com', role: 'admin',       tenantId: null, storeId: null },
    owner:       { id: 2, name: 'Budi Santoso',    email: 'budi@majujaya.com',   role: 'owner',       tenantId: 1,    storeId: null },
    admin_store: { id: 8, name: 'Muhammad Rizal',  email: 'rizal@majujaya.com',  role: 'admin_store', tenantId: 1,    storeId: 1, tenantName: 'Maju Jaya Sejahtera', storeName: 'Toko Pusat Sudirman', planName: 'Pro', expiredAt: '2026-08-15' },
    kasir:       { id: 11, name: 'Ani Rahayu',     email: 'ani@majujaya.com',    role: 'kasir',       tenantId: 1,    storeId: 1, tenantName: 'Maju Jaya Sejahtera', storeName: 'Toko Pusat Sudirman' },
  }
  localStorage.setItem('omnikasir_access_token', tokenMap[role])
  localStorage.setItem('omni_user', JSON.stringify(userMap[role]))
}

export function clearAuthTokens() {
  localStorage.removeItem('omnikasir_access_token')
  localStorage.removeItem('omnikasir_refresh_token')
  localStorage.removeItem('omni_user')
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
