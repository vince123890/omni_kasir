import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, Avatar, Button, Alert, Spin } from 'antd'
import { ShopOutlined, TeamOutlined, ShoppingCartOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ownerStoreApi, ownerUserApi, ownerTransactionApi } from '../../api'
import type { Store, StoreUser, Transaction } from '../../api/types'

const { Title, Text } = Typography

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [users, setUsers] = useState<StoreUser[]>([])
  const [todayTxs, setTodayTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const expiredAt = user?.expiredAt ?? null

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      ownerStoreApi.list().then(res => setStores(res.stores)),
      ownerUserApi.list({ limit: 100 }).then(res => setUsers(res.data)),
      ownerTransactionApi.list({ date: today, limit: 100 }).then(res => setTodayTxs(res.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const daysUntilExpired = expiredAt
    ? Math.ceil((new Date(expiredAt).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const showExpiryAlert = daysUntilExpired !== null && daysUntilExpired >= 0 && daysUntilExpired <= 7

  const todayRevenue = todayTxs.reduce((sum, t) => sum + t.totalAmount, 0)

  const stats = [
    { title: 'Total Store', value: stores.length, icon: <ShopOutlined />, color: '#4f46e5', bg: '#eef2ff', onClick: () => navigate('/app/owner/stores') },
    { title: 'Kasir Aktif', value: users.filter(u => u.isActive && u.role === 'kasir').length, icon: <TeamOutlined />, color: '#059669', bg: '#ecfdf5', onClick: () => navigate('/app/owner/users') },
    { title: 'Transaksi Hari Ini', value: todayTxs.length, icon: <ShoppingCartOutlined />, color: '#d97706', bg: '#fffbeb', onClick: () => navigate('/app/owner/transaksi') },
    { title: 'Omzet Hari Ini', value: todayRevenue > 0 ? `Rp ${(todayRevenue / 1000).toFixed(0)}rb` : 'Rp 0', icon: <RiseOutlined />, color: '#dc2626', bg: '#fef2f2', onClick: () => navigate('/app/owner/transaksi') },
  ]

  const storeColumns = [
    {
      title: 'Nama Store', key: 'name',
      render: (_: unknown, r: Store) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.name}</Text>
          <Text code style={{ fontSize: 11 }}>{r.storeCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Kasir', key: 'kasir',
      render: (_: unknown, r: Store) => (
        <Button type="link" size="small" style={{ padding: 0, color: '#4f46e5' }}
          onClick={e => { e.stopPropagation(); navigate(`/owner/users?storeId=${r.id}`) }}>
          {r.kasirCount}/{r.maxKasir} kasir
        </Button>
      ),
    },
    { title: 'Tx/Bln', dataIndex: 'txMonth', render: (v: number) => `${(v || 0).toLocaleString()} trx` },
    { title: 'Revenue', dataIndex: 'revenue', render: (v: string) => <Text strong style={{ color: '#059669' }}>{v || '-'}</Text> },
    { title: 'Status', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Aktif' : 'Tutup'}</Tag> },
    {
      title: '', key: 'action',
      render: (_: unknown, r: Store) => (
        <Button type="link" size="small" style={{ padding: 0 }}
          onClick={e => { e.stopPropagation(); navigate(`/owner/transaksi?storeId=${r.id}`) }}>
          Transaksi
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">{stores.length} store · {users.filter(u => u.isActive && u.role === 'kasir').length} kasir aktif</Text>
      </div>

      {showExpiryAlert && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={
            daysUntilExpired === 0
              ? 'Subscription Anda berakhir hari ini!'
              : `Subscription Anda berakhir dalam ${daysUntilExpired} hari (${expiredAt})`
          }
          description="Hubungi admin platform untuk memperpanjang subscription agar layanan tidak terganggu."
          action={<Button size="small" type="primary" danger>Hubungi Admin</Button>}
        />
      )}

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={24} sm={12} xl={6} key={s.title}>
            <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }} onClick={s.onClick}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>
                  {typeof s.value === 'number'
                    ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                    : <div style={{ color: s.color, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                  }
                </div>
                <Avatar size={44} style={{ background: s.bg, color: s.color, fontSize: 20 }} icon={s.icon} />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<Space><ShopOutlined />Performa Store</Space>}
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        extra={<Button type="link" onClick={() => navigate('/app/owner/stores')} style={{ color: '#4f46e5', padding: 0 }}>Kelola Store →</Button>}
      >
        <Spin spinning={loading}>
          <Table
            columns={storeColumns}
            dataSource={stores.map(s => ({ ...s, key: s.id }))}
            pagination={false}
            size="middle"
            onRow={(r) => ({ onClick: () => navigate(`/owner/transaksi?storeId=${r.id}`), style: { cursor: 'pointer' } })}
          />
        </Spin>
      </Card>
    </Space>
  )
}
