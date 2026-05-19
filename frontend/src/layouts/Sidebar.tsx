import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { ExclamationCircleOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

interface SidebarProps {
  role: 'admin' | 'owner' | 'store' | 'kasir'
  tenantName?: string
  storeName?: string
  userName: string
  navItems: NavItem[]
}

export default function Sidebar({ role, tenantName, storeName, userName, navItems }: SidebarProps) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roleLabel = { admin: 'Admin Platform', owner: 'Owner', store: 'Admin Store', kasir: 'Kasir' }[role]
  const roleColor = { admin: 'bg-red-500', owner: 'bg-indigo-500', store: 'bg-cyan-500', kasir: 'bg-emerald-500' }[role]

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: 'Anda yakin ingin keluar dari sesi ini?',
      okText: 'Ya, Logout',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => { try { await import('../api').then(m => m.authApi.logout()) } catch {} navigate('/app/login') },
    })
  }

  const SidebarContent = () => (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm">Omni Kasir</div>
            {tenantName && <div className="text-xs text-slate-400 truncate">{tenantName}</div>}
            {storeName && <div className="text-xs text-slate-400 truncate">{storeName}</div>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${roleColor} rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-xs text-slate-400">{roleLabel}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
      >
        {mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col min-h-screen">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="sidebar-overlay visible"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-0 h-full z-50 flex flex-col">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}
