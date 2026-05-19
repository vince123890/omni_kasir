import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme, Breadcrumb, Modal } from 'antd'
import { DashboardOutlined, CreditCardOutlined, TeamOutlined, LogoutOutlined, UserOutlined, DownOutlined, ShopOutlined, LockOutlined, ExclamationCircleOutlined, SafetyOutlined } from '@ant-design/icons'
import ChangePasswordModal from '../components/ChangePasswordModal'
import { authApi } from '../api'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/app/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/app/admin/subscriptions', icon: <CreditCardOutlined />, label: 'Subscription Plan' },
  { key: '/app/admin/tenants', icon: <TeamOutlined />, label: 'Management Tenant' },
  { key: '/app/admin/users', icon: <SafetyOutlined />, label: 'Kelola Admin' },
]

const breadcrumbMap: Record<string, string> = {
  '/app/admin/dashboard': 'Dashboard',
  '/app/admin/subscriptions': 'Subscription Plan',
  '/app/admin/tenants': 'Management Tenant',
  '/app/admin/users': 'Kelola Admin',
}

function getBreadcrumbs(pathname: string) {
  const items = [{ title: 'Admin Platform' }]
  const label = breadcrumbMap[pathname]
  if (label) items.push({ title: label })
  else if (pathname.startsWith('/app/admin/tenants/')) items.push({ title: 'Management Tenant' }, { title: 'Detail Tenant' })
  return items
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: 'Anda yakin ingin keluar dari sesi ini?',
      okText: 'Ya, Logout',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => { await authApi.logout(); navigate('/app/login') },
    })
  }

  const userMenu = {
    items: [
      { key: 'changepw', icon: <LockOutlined />, label: 'Ganti Password', onClick: () => setChangePwOpen(true) },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" style={{ background: '#1e1b4b' }} width={220}>
        <div style={{ padding: collapsed ? '20px 8px' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          <ShopOutlined style={{ fontSize: 22, color: '#a5b4fc' }} />
          {!collapsed && (
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>Omni Kasir</Text>
              <Text style={{ color: '#a5b4fc', fontSize: 11 }}>Admin Platform</Text>
            </div>
          )}
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[
            location.pathname.startsWith('/app/admin/tenants/')
              ? '/app/admin/tenants'
              : location.pathname
          ]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#1e1b4b', borderRight: 'none' }}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', height: 56 }}>
          <Breadcrumb items={getBreadcrumbs(location.pathname)} style={{ fontSize: 13 }} />
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: token.colorError }} icon={<UserOutlined />} size="small" />
              <Text strong style={{ fontSize: 13 }}>Super Admin</Text>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} userName="Super Admin" />
    </Layout>
  )
}
