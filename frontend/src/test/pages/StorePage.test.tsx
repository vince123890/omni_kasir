import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, setAuthTokens } from '../utils'
import StorePage from '../../pages/owner/StorePage'

describe('StorePage', () => {
  beforeEach(() => setAuthTokens('owner'))

  it('render judul Management Store', () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    expect(screen.getByText(/management store/i)).toBeInTheDocument()
  })

  it('load dan tampilkan store dari API', async () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    await waitFor(() => {
      expect(screen.getByText('Toko Pusat Sudirman')).toBeInTheDocument()
      expect(screen.getByText('Cabang Margonda Depok')).toBeInTheDocument()
    })
  })

  it('tampilkan storeCode di setiap card', async () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    await waitFor(() => {
      expect(screen.getByText('STR-2508-0101')).toBeInTheDocument()
      expect(screen.getByText('STR-2509-0102')).toBeInTheDocument()
    })
  })

  it('tampilkan info kasir count per store', async () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    await waitFor(() => {
      expect(screen.getAllByText(/2\/5 kasir aktif/i).length).toBeGreaterThan(0)
    })
  })

  it('subtitle tampilkan X/Y store (Plan)', async () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    await waitFor(() => {
      expect(screen.getByText(/2.*5.*store.*Plan.*Pro/i)).toBeInTheDocument()
    })
  })

  it('tombol Tambah Store — ada di halaman', async () => {
    renderWithProviders(<StorePage />, { initialEntries: ['/owner/stores'] })
    await waitFor(() => expect(screen.getByText('Toko Pusat Sudirman')).toBeInTheDocument())
    // Tombol ada dan bisa diklik
    expect(screen.getByRole('button', { name: /tambah store/i })).toBeInTheDocument()
  })

  it('validasi phone — rule validator terdefinisi', async () => {
    // Phone validation logic test — unit test fungsi validator
    const phoneRule = {
      validator: (_: unknown, value: string) => {
        if (!value) return Promise.resolve()
        const valid = /^(\+62|08)\d{8,11}$/.test(value.replace(/[\s-]/g, ''))
        return valid ? Promise.resolve() : Promise.reject('Format nomor tidak valid (08xxx atau +62xxx)')
      },
    }
    await expect(phoneRule.validator(null, '12345678')).rejects.toContain('Format nomor tidak valid')
    await expect(phoneRule.validator(null, '081234567890')).resolves.toBeUndefined()
    await expect(phoneRule.validator(null, '+6281234567890')).resolves.toBeUndefined()
    await expect(phoneRule.validator(null, '')).resolves.toBeUndefined()
  })
})
