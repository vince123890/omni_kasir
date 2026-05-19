import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, Avatar, Alert, Button, Badge, Spin } from 'antd'
import { TeamOutlined, ShopOutlined, CreditCardOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { tenantApi } from '../../api'
import type { Tenant } from '../../api/types'

const { Title, Text } = Typography

const entityColors: Record<string, string> = { PT: '#4f46e5', CV: '#0891b2', UD: '#d97706' }
const entityBg: Record<string, string>     = { PT: '#eef2ff', CV: '#ecfeff', UD: '#fffbeb' }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tenantApi.list({ limit: 100 }).then(res => {
      setTenants(res.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const expiringSoon = tenants.filter(t => {
    const diff = (new Date(t.expired).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7 && t.status === 'aktif'
  })

  const stats = [
    { title: 'Total Tenant', value: tenants.length, suffix: 'tenant', icon: <TeamOutlined />, color: '#4f46e5', bg: '#eef2ff', trend: `${tenants.filter(t => t.status === 'aktif').length} aktif`, up: true },
    { title: 'Total Store Aktif', value: tenants.reduce((acc, t) => acc + (t.storeCount ?? 0), 0), suffix: 'store', icon: <ShopOutlined />, color: '#059669', bg: '#ecfdf5', trend: `dari ${tenants.length} tenant`, up: true },
    { title: 'Subscription Aktif', value: tenants.filter(t => t.status === 'aktif').length, icon: <CreditCardOutlined />, color: '#d97706', bg: '#fffbeb', trend: `${expiringSoon.length} akan expired`, up: expiringSoon.length === 0 },
    { title: 'Plan Enterprise', value: tenants.filter(t => t.plan === 'Enterprise').length, icon: <RiseOutlined />, color: '#dc2626', bg: '#fef2f2', trend: `${tenants.filter(t => t.plan === 'Pro').length} Pro · ${tenants.filter(t => t.plan === 'Basic').length} Basic`, up: true },
  ]

  const columns = [
    {
      title: 'Nama Bisnis',
      key: 'name',
      render: (_: unknown, r: Tenant) => (
        <Space>
          <Avatar size={32} style={{ background: entityBg[r.entityType], color: entityColors[r.entityType], fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {r.entityType}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
            <Space size={6}>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.owner}</Text>
              <Text code style={{ fontSize: 11 }}>{r.tenantCode}</Text>
            </Space>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color={plan === 'Enterprise' ? 'purple' : plan === 'Pro' ? 'blue' : 'default'}>{plan}</Tag>
      ),
    },
    { title: 'Expired', dataIndex: 'expired', key: 'expired' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'aktif' ? 'success' : s === 'expired' ? 'warning' : 'error'}>{s}</Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, r: Tenant) => (
        <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => navigate(`/admin/tenants/${r.id}`)}>
          Detail
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Dashboard Admin</Title>
        <Text type="secondary">Selamat datang kembali, Super Admin</Text>
      </div>

      {expiringSoon.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={
            <Space>
              <Text strong>{expiringSoon.length} tenant akan expired dalam 7 hari:</Text>
              {expiringSoon.map(t => (
                <Tag key={t.id} color="warning" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/tenants/${t.id}`)}>
                  {t.fullName} ({t.expired})
                </Tag>
              ))}
            </Space>
          }
          action={<Button size="small" onClick={() => navigate('/app/admin/tenants')}>Kelola</Button>}
        />
      )}

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={24} sm={12} xl={6} key={s.title}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>
                  <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                  <Text style={{ fontSize: 12, color: s.up ? '#059669' : '#d97706' }}>
                    {s.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {s.trend}
                  </Text>
                </div>
                <Avatar size={44} style={{ background: s.bg, color: s.color, fontSize: 20 }} icon={s.icon} />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Daftar Tenant</span>
            {tenants.filter(t => t.status === 'expired').length > 0 && (
              <Badge count={tenants.filter(t => t.status === 'expired').length} color="orange" />
            )}
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        extra={
          <Button type="link" style={{ color: '#4f46e5', padding: 0 }} onClick={() => navigate('/app/admin/tenants')}>
            Lihat semua →
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={tenants.slice(0, 5).map(t => ({ ...t, key: t.id }))}
            pagination={false}
            size="middle"
          />
        </Spin>
      </Card>
    </Space>
  )
}
