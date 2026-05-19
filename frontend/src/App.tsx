import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ProductProvider } from './context/ProductContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'

import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import SubscriptionPage from './pages/admin/SubscriptionPage'
import TenantPage from './pages/admin/TenantPage'
import TenantDetailPage from './pages/admin/TenantDetailPage'
import AdminUserPage from './pages/admin/AdminUserPage'

import OwnerLayout from './layouts/OwnerLayout'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import StorePage from './pages/owner/StorePage'
import UserManagementPage from './pages/owner/UserManagementPage'
import TransaksiPage from './pages/owner/TransaksiPage'

import AdminStoreLayout from './layouts/AdminStoreLayout'
import AdminStoreDashboard from './pages/store/AdminStoreDashboard'
import ProductPage from './pages/store/ProductPage'
import StokMasukPage from './pages/owner/StokMasukPage'
import StoreTransaksiPage from './pages/store/StoreTransaksiPage'

import KasirLayout from './layouts/KasirLayout'
import POSPage from './pages/kasir/POSPage'
import OpenStokPage from './pages/kasir/OpenStokPage'
import ConvertStokPage from './pages/kasir/ConvertStokPage'
import RiwayatPage from './pages/kasir/RiwayatPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page — root */}
          <Route path="/" element={<LandingPage />} />

          {/* App routes under /app */}
          <Route path="/app/login" element={<LoginPage />} />
          <Route path="/app/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Platform */}
          <Route path="/app/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="subscriptions" element={<SubscriptionPage />} />
            <Route path="tenants" element={<TenantPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="users" element={<AdminUserPage />} />
          </Route>

          {/* Owner */}
          <Route path="/app/owner" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="stores" element={<StorePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="transaksi" element={<TransaksiPage />} />
          </Route>

          {/* Admin Store */}
          <Route path="/app/store" element={
            <ProtectedRoute allowedRoles={['admin_store']}>
              <ProductProvider>
                <AdminStoreLayout />
              </ProductProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/store/dashboard" replace />} />
            <Route path="dashboard" element={<AdminStoreDashboard />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="stok-masuk" element={<StokMasukPage />} />
            <Route path="open-stok" element={<OpenStokPage />} />
            <Route path="convert-stok" element={<ConvertStokPage />} />
            <Route path="transaksi" element={<StoreTransaksiPage />} />
          </Route>

          {/* Kasir */}
          <Route path="/app/kasir" element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <ProductProvider>
                <KasirLayout />
              </ProductProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/kasir/pos" replace />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="open-stok" element={<OpenStokPage />} />
            <Route path="convert-stok" element={<ConvertStokPage />} />
            <Route path="riwayat" element={<RiwayatPage />} />
          </Route>

          {/* Legacy redirects — pastikan link lama tidak 404 */}
          <Route path="/login" element={<Navigate to="/app/login" replace />} />
          <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
          <Route path="/owner/*" element={<Navigate to="/app/owner" replace />} />
          <Route path="/store/*" element={<Navigate to="/app/store" replace />} />
          <Route path="/kasir/*" element={<Navigate to="/app/kasir" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
