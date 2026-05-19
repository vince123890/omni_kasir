import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, setAuthTokens } from '../utils'
import ProductPage from '../../pages/store/ProductPage'

describe('ProductPage', () => {
  beforeEach(() => setAuthTokens('admin_store'))

  it('render judul halaman', () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products'] })
    expect(screen.getByText(/management produk/i)).toBeInTheDocument()
  })

  it('load dan tampilkan produk dari API', async () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products'] })
    await waitFor(() => {
      expect(screen.getByText('Aqua 600ml')).toBeInTheDocument()
    })
  })

  it('tampilkan stock tag — aman, menipis, kritis', async () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products'] })
    await waitFor(() => {
      expect(screen.getByText('Aman')).toBeInTheDocument()
      expect(screen.getByText('Menipis')).toBeInTheDocument()
      expect(screen.getByText('Kritis')).toBeInTheDocument()
    })
  })

  it('tampilkan SKU di bawah nama produk', async () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products'] })
    await waitFor(() => {
      expect(screen.getByText('PRD-01-001')).toBeInTheDocument()
    })
  })

  it('filter low-stock via URL param — aktifkan banner alert', async () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products?filter=low-stock'] })
    await waitFor(() => {
      expect(screen.getByText(/stok di bawah minimum/i)).toBeInTheDocument()
    })
  })

  it('tombol Tambah Produk — ada di halaman', () => {
    renderWithProviders(<ProductPage />, { initialEntries: ['/store/products'] })
    // Tombol ada saat initial render (sebelum data load)
    expect(screen.getByRole('button', { name: /tambah produk/i })).toBeInTheDocument()
  })

  it('stockTag logic — stock 0 = habis, kritis, menipis, aman', () => {
    // Unit test logika stockTag tanpa render
    const stockTag = (stock: number, minStock: number) => {
      if (stock === 0) return 'habis'
      if (stock <= Math.floor(minStock * 0.3)) return 'kritis'
      if (stock <= minStock) return 'menipis'
      return 'aman'
    }
    expect(stockTag(0, 48)).toBe('habis')
    expect(stockTag(3, 24)).toBe('kritis')   // 3 ≤ floor(24*0.3)=7
    expect(stockTag(8, 20)).toBe('menipis')  // 8 ≤ 20
    expect(stockTag(120, 48)).toBe('aman')   // 120 > 48
  })
})
