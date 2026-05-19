import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme, Badge, Tag, Tooltip, Breadcrumb, Modal } from 'antd'
import {
  DashboardOutlined, AppstoreOutlined, InboxOutlined,
  RetweetOutlined, HistoryOutlined, ShoppingCartOutlined,
  LogoutOutlined, UserOutlined, DownOutlined, ShopOutlined, LockOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import ChangePasswordModal from '../components/ChangePasswordModal'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/app/store/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/app/store/products', icon: <AppstoreOutlined />, label: 'Management Produk' },
  { key: '/app/store/stok-masuk', icon: <InboxOutlined />, label: 'Stok Masuk' },
  { key: '/app/store/open-stok', icon: <ShoppingCartOutlined />, label: 'Open Stok' },
  { key: '/app/store/convert-stok', icon: <RetweetOutlined />, label: 'Convert Stok' },
  { key: '/app/store/transaksi', icon: <HistoryOutlined />, label: 'Riwayat Transaksi' },
]

const breadcrumbMap: Record<string, string> = {
  '/app/store/dashboard': 'Dashboard',
  '/app/store/products': 'Management Produk',
  '/app/store/stok-masuk': 'Stok Masuk',
  '/app/store/open-stok': 'Open Stok',
  '/app/store/convert-stok': 'Convert Stok',
  '/app/store/transaksi': 'Riwayat Transaksi',
}

export default function AdminStoreLayout() {
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
                <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Admin Store</Tag>
              </Space>
              <Text strong style={{ color: '#fff', fontSize: 13, display: 'block' }}>{storeName}</Text>
              <Text style={{ color: '#a5b4fc', fontSize: 11 }}>{entityType} {tenantName}</Text>
            </Space>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#1e1b4b', borderRight: 'none' }}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', height: 56 }}>
          <Space>
            <Breadcrumb items={breadcrumbItems} style={{ fontSize: 13 }} />
            <Badge status="success" text={<Text style={{ fontSize: 12, color: '#059669' }}>Shift Aktif</Text>} />
          </Space>
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: token.colorSuccess }} icon={<UserOutlined />} size="small" />
              <Text strong style={{ fontSize: 13 }}>{user?.name ?? '...'}</Text>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} userName={user?.name ?? ''} />
    </Layout>
  )
}
