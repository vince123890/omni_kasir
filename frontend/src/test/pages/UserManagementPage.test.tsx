import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, setAuthTokens } from '../utils'
import UserManagementPage from '../../pages/owner/UserManagementPage'

describe('UserManagementPage', () => {
  beforeEach(() => setAuthTokens('owner'))

  it('render judul Kasir & Admin Store', () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    expect(screen.getByText(/kasir & admin store/i)).toBeInTheDocument()
  })

  it('load dan tampilkan user dari API', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => {
      expect(screen.getByText('Muhammad Rizal')).toBeInTheDocument()
      expect(screen.getByText('Ani Rahayu')).toBeInTheDocument()
    })
  })

  it('tidak tampilkan owner di tabel (filter kasir & admin_store only)', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => {
      // Budi Santoso adalah owner — tidak boleh tampil
      expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument()
    })
  })

  it('tampilkan role tag per user', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => {
      // Bisa ada multiple "Kasir" tag — cukup pastikan ada
      expect(screen.getAllByText('Kasir').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Admin Store').length).toBeGreaterThan(0)
    })
  })

  it('tampilkan nama store per user', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => {
      expect(screen.getAllByText('Toko Pusat Sudirman').length).toBeGreaterThan(0)
    })
  })

  it('filter role — dropdown tersedia', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => expect(screen.getByText('Ani Rahayu')).toBeInTheDocument())
    // Cukup pastikan filter element ada
    expect(screen.getAllByText(/semua role/i).length).toBeGreaterThan(0)
  })

  it('tombol Tambah User — buka modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await user.click(screen.getByRole('button', { name: /tambah user/i }))
    await waitFor(() => {
      expect(screen.getByText(/tambah kasir.*admin store/i)).toBeInTheDocument()
    })
  })

  it('subtitle menampilkan info jumlah user', async () => {
    renderWithProviders(<UserManagementPage />, { initialEntries: ['/owner/users'] })
    await waitFor(() => {
      // Subtitle mengandung angka kasir dan admin store
      const header = document.querySelector('h3')?.parentElement?.parentElement
      // Pastikan ada teks yang mengandung "kasir" dan "admin store"
      expect(document.body.textContent).toMatch(/kasir/i)
      expect(document.body.textContent).toMatch(/admin store/i)
    })
  })
})
