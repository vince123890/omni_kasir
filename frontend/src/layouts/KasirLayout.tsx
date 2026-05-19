import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme, Badge, Tag, Tooltip, Breadcrumb, Modal } from 'antd'
import { ShoppingCartOutlined, InboxOutlined, RetweetOutlined, HistoryOutlined, LogoutOutlined, UserOutlined, DownOutlined, ShopOutlined, LockOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import ChangePasswordModal from '../components/ChangePasswordModal'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/app/kasir/pos', icon: <ShoppingCartOutlined />, label: 'Transaksi (POS)' },
  { key: '/app/kasir/open-stok', icon: <InboxOutlined />, label: 'Open Stok' },
  { key: '/app/kasir/convert-stok', icon: <RetweetOutlined />, label: 'Convert Stok' },
  { key: '/app/kasir/riwayat', icon: <HistoryOutlined />, label: 'Riwayat Transaksi' },
]

const breadcrumbMap: Record<string, string> = {
  '/app/kasir/pos': 'Transaksi (POS)',
  '/app/kasir/open-stok': 'Open Stok',
  '/app/kasir/convert-stok': 'Convert Stok',
  '/app/kasir/riwayat': 'Riwayat Transaksi',
}

export default function KasirLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const { user, logout } = useAuth()

  const storeName  = user?.storeName ?? '...'
  const tenantName = user?.tenantName ?? ''
  const entityType = user?.tenantEntityType ?? ''

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: 'Anda yakin ingin keluar dari sesi ini?',
      okText: 'Ya, Logout',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await import('../api').then(m => m.authApi.logout()) } catch {}
        logout()
        navigate('/app/login')
      },
    })
  }

  const userMenu = {
    items: [
      { key: 'changepw', icon: <LockOutlined />, label: 'Ganti Password', onClick: () => setChangePwOpen(true) },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
    ],
  }

  const breadcrumbItems = [
    { title: storeName },
    ...(breadcrumbMap[location.pathname] ? [{ title: breadcrumbMap[location.pathname] }] : []),
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" style={{ background: '#1e1b4b' }} width={220}>
        <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          {collapsed ? (
            <Tooltip title={`${storeName} · ${entityType} ${tenantName}`} placement="right">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ShopOutlined style={{ fontSize: 22, color: '#a5b4fc' }} />
              </div>
            </Tooltip>
          ) : (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space size={8}>
                <ShopOutlined style={{ fontSize: 16, color: '#a5b4fc' }} />
                <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Kasir</Tag>
              </Space>
              <Text strong style={{ color: '#fff', fontSize: 13, display: 'block' }}>{storeName}</Text>
              <Text style={{ color: '#a5b4fc', fontSize: 11 }}>{entityType} {tenantName}</Text>
            </Space>
          )}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} style={{ background: '#1e1b4b', borderRight: 'none' }} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', height: 56 }}>
          <Space>
            <Breadcrumb items={breadcrumbItems} style={{ fontSize: 13 }} />
            <Badge status="success" text={<Text style={{ fontSize: 12, color: '#059669' }}>Shift Aktif · 08:00 WIB</Text>} />
          </Space>
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: token.colorSuccess }} icon={<UserOutlined />} size="small" />
              <Text strong style={{ fontSize: 13 }}>{user?.name ?? '...'}</Text>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} userName={user?.name ?? ''} />
    </Layout>
  )
}
