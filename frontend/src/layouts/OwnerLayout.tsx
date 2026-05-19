import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme, Tag, Tooltip, Breadcrumb, Modal } from 'antd'
import { DashboardOutlined, ShopOutlined, TeamOutlined, LogoutOutlined, UserOutlined, DownOutlined, BankOutlined, LockOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import ChangePasswordModal from '../components/ChangePasswordModal'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/app/owner/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/app/owner/stores', icon: <ShopOutlined />, label: 'Management Store' },
  { key: '/app/owner/users', icon: <TeamOutlined />, label: 'Kasir & Admin Store' },
  { key: '/app/owner/transaksi', icon: <HistoryOutlined />, label: 'Riwayat Transaksi' },
]

const breadcrumbMap: Record<string, string> = {
  '/app/owner/dashboard': 'Dashboard',
  '/app/owner/stores': 'Management Store',
  '/app/owner/users': 'Kasir & Admin Store',
  '/app/owner/transaksi': 'Riwayat Transaksi',
}

export default function OwnerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const { user, logout } = useAuth()

  const tenantName = user?.tenantName ?? '...'
  const entityType = user?.tenantEntityType ?? ''
  const planName   = user?.planName ?? ''
  const expiredAt  = user?.expiredAt ?? ''

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
    { title: tenantName },
    ...(breadcrumbMap[location.pathname] ? [{ title: breadcrumbMap[location.pathname] }] : []),
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" style={{ background: '#1e1b4b' }} width={220}>
        <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          {collapsed ? (
            <Tooltip title={`${entityType} ${tenantName}`} placement="right">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BankOutlined style={{ fontSize: 22, color: '#a5b4fc' }} />
              </div>
            </Tooltip>
          ) : (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space size={8}>
                <BankOutlined style={{ fontSize: 18, color: '#a5b4fc' }} />
                <Text strong style={{ color: '#fff', fontSize: 13 }}>{entityType}</Text>
                <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Owner</Tag>
              </Space>
              <Text style={{ color: '#c7d2fe', fontSize: 12, display: 'block', lineHeight: '1.3' }}>{tenantName}</Text>
            </Space>
          )}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} style={{ background: '#1e1b4b', borderRight: 'none' }} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', height: 56 }}>
          <Space>
            <Breadcrumb items={breadcrumbItems} style={{ fontSize: 13 }} />
            {planName && <Tag color="blue" style={{ margin: 0 }}>Plan {planName}</Tag>}
            {expiredAt && <Tag color="success" style={{ margin: 0 }}>Aktif s/d {expiredAt}</Tag>}
          </Space>
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: token.colorPrimary }} icon={<UserOutlined />} size="small" />
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
