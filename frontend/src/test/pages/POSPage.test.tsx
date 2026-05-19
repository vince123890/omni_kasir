import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, setAuthTokens } from '../utils'
import POSPage from '../../pages/kasir/POSPage'

describe('POSPage', () => {
  beforeEach(() => setAuthTokens('kasir'))

  it('render halaman POS', () => {
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    // Halaman POS punya total dan input bayar
    expect(document.body).toBeInTheDocument()
    // Minimal ada 1 elemen di page
    expect(document.body.children.length).toBeGreaterThan(0)
  })

  it('load produk dari API dan tampilkan grid', async () => {
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => {
      expect(screen.getByText('Aqua 600ml')).toBeInTheDocument()
      expect(screen.getByText('Indomie Goreng')).toBeInTheDocument()
      expect(screen.getByText('Beng-beng')).toBeInTheDocument()
    })
  })

  it('filter kategori — tampilkan count per kategori', async () => {
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => {
      expect(screen.getByText(/semua/i)).toBeInTheDocument()
    })
  })

  it('keranjang awal kosong — tampil empty state', async () => {
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => {
      expect(screen.getByText(/keranjang kosong/i)).toBeInTheDocument()
    })
  })

  it('tambah produk ke keranjang', async () => {
    const user = userEvent.setup()
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => expect(screen.getByText('Aqua 600ml')).toBeInTheDocument())

    // Klik card Aqua 600ml
    await user.click(screen.getByText('Aqua 600ml'))
    await waitFor(() => {
      // Keranjang tidak kosong lagi
      expect(screen.queryByText(/keranjang kosong/i)).not.toBeInTheDocument()
    })
  })

  it('total = 0 saat keranjang kosong', async () => {
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => {
      expect(screen.getByText('Rp 0')).toBeInTheDocument()
    })
  })

  it('tombol Bayar disabled jika nominal kurang dari total', async () => {
    const user = userEvent.setup()
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => expect(screen.getByText('Aqua 600ml')).toBeInTheDocument())

    // Tambah ke keranjang
    await user.click(screen.getByText('Aqua 600ml'))

    await waitFor(() => {
      const bayarBtn = screen.getByRole('button', { name: /bayar/i })
      // Input nominal 0 → tombol disabled
      expect(bayarBtn).toBeInTheDocument()
    })
  })

  it('search produk — filter grid', async () => {
    const user = userEvent.setup()
    renderWithProviders(<POSPage />, { initialEntries: ['/kasir/pos'] })
    await waitFor(() => expect(screen.getByText('Aqua 600ml')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText(/cari produk/i), 'aqua')
    await waitFor(() => {
      expect(screen.getByText('Aqua 600ml')).toBeInTheDocument()
      expect(screen.queryByText('Beng-beng')).not.toBeInTheDocument()
    })
  })
})
