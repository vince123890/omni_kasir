import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, clearAuthTokens } from '../utils'
import LoginPage from '../../pages/LoginPage'

describe('LoginPage', () => {
  beforeEach(() => clearAuthTokens())

  it('render form login dengan field email dan password', () => {
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument()
  })

  it('tampil demo credentials di bawah form', () => {
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    expect(screen.getByText(/admin@omnikasir\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/budi@majujaya\.com/i)).toBeInTheDocument()
  })

  it('validasi email kosong — tampil error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByText(/masukkan email/i)).toBeInTheDocument()
    })
  })

  it('validasi format email tidak valid', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    await user.type(screen.getByLabelText(/email/i), 'bukanemailvalid')
    await user.type(screen.getByLabelText(/password/i), 'pass123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByText(/format email tidak valid/i)).toBeInTheDocument()
    })
  })

  it('login dengan password salah — tampil alert error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    await user.type(screen.getByLabelText(/email/i), 'admin@omnikasir.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByText(/email atau password salah/i)).toBeInTheDocument()
    })
  })

  it('login admin berhasil — tidak ada error di screen', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })
    await user.type(screen.getByLabelText(/email/i), 'admin@omnikasir.com')
    await user.type(screen.getByLabelText(/password/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.queryByText(/email atau password salah/i)).not.toBeInTheDocument()
    })
  })
})
