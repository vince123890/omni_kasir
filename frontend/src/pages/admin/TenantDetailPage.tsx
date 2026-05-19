import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Space, Tag, Button, Table, Descriptions, Avatar, Statistic, Tabs, Timeline, Modal, Form, Input, Select, DatePicker, notification, Tooltip, Spin } from 'antd'
import { ArrowLeftOutlined, ShopOutlined, TeamOutlined, ReloadOutlined, StopOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { tenantApi, subscriptionPlanApi } from '../../api'
import type { TenantDetail, SubscriptionPlan } from '../../api/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const entityColors: Record<string, string> = { PT: '#4f46e5', CV: '#0891b2', UD: '#d97706' }
const entityBg: Record<string, string>     = { PT: '#eef2ff', CV: '#ecfeff', UD: '#fffbeb' }

export default function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [api, ctx] = notification.useNotification()
  const [data, setData] = useState<TenantDetail | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [renewForm] = Form.useForm()

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    tenantApi.detail(Number(id)).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
    subscriptionPlanApi.list().then(setPlans).catch(() => {})
  }, [load])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>

  if (!data) {
    return (
      <Space direction="vertical" align="center" style={{ width: '100%', paddingTop: 80 }}>
        <Title level={4} type="secondary">Tenant tidak ditemukan</Title>
        <Button onClick={() => navigate('/app/admin/tenants')}>Kembali ke daftar</Button>
      </Space>
    )
  }

  const isAktif = data.status === 'aktif'
  const planOptions = plans.map(p => ({ value: p.name, label: `${p.name} — Rp ${(p.price / 1000).toFixed(0)}rb/bln` }))

  const handleOpenEdit = () => {
    editForm.setFieldsValue({ entityType: data.entityType, name: data.name, email: data.email })
    setEditOpen(true)
  }

  const handleEdit = async (values: Record<string, string>) => {
    try {
      await tenantApi.update(data.id, { entityType: values.entityType, name: values.name })
      setEditOpen(false)
      api.success({ message: 'Data tenant berhasil diupdate', icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal update tenant' })
    }
  }

  const handleRenew = async (values: Record<string, unknown>) => {
    try {
      const plan = plans.find(p => p.name === values.plan)
      if (!plan) { api.error({ message: 'Plan tidak ditemukan' }); return }
      const res = await tenantApi.renewSubscription(data.id, {
        planId: plan.id,
        startDate: (values.startDate as dayjs.Dayjs).format('YYYY-MM-DD'),
        durationDays: values.duration as number,
      })
      setRenewOpen(false)
      renewForm.resetFields()
      api.success({ message: 'Subscription berhasil diperpanjang', description: `Expired: ${res.newExpiredAt}`, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal perpanjang subscription' })
    }
  }

  const handleToggleStatus = async () => {
    try {
      await tenantApi.setStatus(data.id, !isAktif)
      api.success({ message: `Tenant berhasil ${!isAktif ? 'diaktifkan' : 'dinonaktifkan'}`, description: data.fullName })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal mengubah status' })
    }
  }

  const storeColumns = [
    { title: 'Nama Store', key: 'name', render: (_: unknown, r: typeof data.stores[0]) => (
      <Space direction="vertical" size={0}>
        <Text strong>{r.name}</Text>
        <Text code style={{ fontSize: 11 }}>{r.storeCode}</Text>
      </Space>
    )},
    { title: 'Alamat', dataIndex: 'address', render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Kasir', key: 'kasir', render: (_: unknown, r: typeof data.stores[0]) => `${r.kasirCount}/${r.maxKasir}` },
    { title: 'Tx/Bln', dataIndex: 'txMonth', render: (v: number) => (v || 0).toLocaleString() },
    { title: 'Status', dataIndex: 'status', render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Aktif' : 'Nonaktif'}</Tag> },
  ]

  const userColumns = [
    { title: 'User', key: 'user', render: (_: unknown, r: typeof data.users[0]) => (
      <Space>
        <Avatar size="small" style={{ background: '#ecfdf5', color: '#059669' }}>{r.name.charAt(0)}</Avatar>
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
        </Space>
      </Space>
    )},
    { title: 'Role', dataIndex: 'role', render: (v: string) => <Tag color={v === 'kasir' ? 'green' : 'cyan'}>{v}</Tag> },
    { title: 'Store', dataIndex: 'store' },
    { title: 'Login Terakhir', dataIndex: 'lastLogin', render: (v: string | null) => v ? new Date(v).toLocaleString('id') : '-' },
    { title: 'Status', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Aktif' : 'Nonaktif'}</Tag> },
  ]

  const tabItems = [
    {
      key: 'stores',
      label: <span><ShopOutlined /> Store ({data.stats.totalStores})</span>,
      children: <Table columns={storeColumns} dataSource={data.stores.map(s => ({ ...s, key: s.id }))} pagination={false} size="middle" />,
    },
    {
      key: 'users',
      label: <span><TeamOutlined /> User Store ({data.stats.totalUsers})</span>,
      children: <Table columns={userColumns} dataSource={data.users.map((u, i) => ({ ...u, key: u.id ?? i }))} pagination={false} size="middle" />,
    },
    {
      key: 'history',
      label: 'Riwayat Subscription',
      children: (
        <Timeline style={{ marginTop: 16 }} items={data.subscriptionHistory.map((h, i) => ({
          key: i,
          color: h.status === 'active' ? 'green' : 'gray',
          children: (
            <Space direction="vertical" size={0}>
              <Space>
                <Text strong>{h.plan}</Text>
                <Tag color={h.status === 'active' ? 'success' : 'default'}>{h.status === 'active' ? 'Aktif' : 'Expired'}</Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>{h.startAt} s/d {h.expiredAt}</Text>
            </Space>
          ),
        }))} />
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/app/admin/tenants')}>Kembali</Button>
        <div style={{ flex: 1 }}>
          <Space align="center" size={12}>
            <Avatar size={48} style={{ background: entityBg[data.entityType], color: entityColors[data.entityType], fontSize: 14, fontWeight: 700 }}>
              {data.entityType}
            </Avatar>
            <div>
              <Title level={3} style={{ margin: 0 }}>{data.fullName}</Title>
              <Space size={6}>
                <Tag color={isAktif ? 'success' : 'error'} icon={isAktif ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>{data.status}</Tag>
                <Tag color={data.plan === 'Enterprise' ? 'purple' : data.plan === 'Pro' ? 'blue' : 'default'}>{data.plan}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>Aktif s/d {data.expired}</Text>
              </Space>
            </div>
          </Space>
        </div>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={handleOpenEdit}>Edit</Button>
          <Button icon={<ReloadOutlined />} style={{ color: '#059669', borderColor: '#059669' }} onClick={() => { renewForm.resetFields(); setRenewOpen(true) }}>Perpanjang</Button>
          <Button
            icon={isAktif ? <StopOutlined /> : <PlayCircleOutlined />}
            danger={isAktif}
            style={!isAktif ? { color: '#059669', borderColor: '#059669' } : {}}
            onClick={() => {
              Modal.confirm({
                title: isAktif ? 'Nonaktifkan tenant ini?' : 'Aktifkan tenant ini?',
                icon: <ExclamationCircleOutlined style={{ color: isAktif ? '#dc2626' : '#059669' }} />,
                content: isAktif ? 'Semua user tenant tidak bisa login setelah dinonaktifkan.' : 'Tenant akan bisa login kembali.',
                okText: 'Ya, lanjutkan',
                cancelText: 'Batal',
                okButtonProps: { danger: isAktif },
                onOk: handleToggleStatus,
              })
            }}
          >
            {isAktif ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Descriptions title="Informasi Tenant" column={2} size="small">
              <Descriptions.Item label="Kode Tenant"><Text code style={{ fontSize: 13 }}>{data.tenantCode}</Text></Descriptions.Item>
              <Descriptions.Item label="Jenis Usaha"><Tag color="blue">{data.entityType}</Tag></Descriptions.Item>
              <Descriptions.Item label="Nama Bisnis"><Text strong>{data.name}</Text></Descriptions.Item>
              <Descriptions.Item label="Nama Owner">{data.owner}</Descriptions.Item>
              <Descriptions.Item label="Email Owner">{data.email}</Descriptions.Item>
              <Descriptions.Item label="Bergabung Sejak">{data.joinDate}</Descriptions.Item>
              <Descriptions.Item label="Subscription Expired">{data.expired}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}><Statistic title="Total Store" value={data.stats.totalStores} valueStyle={{ color: '#4f46e5' }} prefix={<ShopOutlined />} /></Col>
              <Col span={12}><Statistic title="Total User" value={data.stats.totalUsers} valueStyle={{ color: '#059669' }} prefix={<TeamOutlined />} /></Col>
              <Col span={12}><Statistic title="User Aktif" value={data.stats.activeUsers} valueStyle={{ color: '#059669' }} /></Col>
              <Col span={12}><Statistic title="Nonaktif" value={data.stats.inactiveUsers} valueStyle={{ color: '#d97706' }} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Tabs items={tabItems} />
      </Card>

      {/* Modal Edit */}
      <Modal title={`Edit Tenant — ${data.fullName}`} open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then(handleEdit)} okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={480}>
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="Jenis Usaha" name="entityType" rules={[{ required: true }]}>
                <Select options={[{ value: 'PT', label: 'PT' }, { value: 'CV', label: 'CV' }, { value: 'UD', label: 'UD' }]} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Nama Bisnis" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={<Space size={4}><span>Email Owner</span><Tooltip title="Email tidak bisa diubah dari sini."><span style={{ color: '#bfbfbf', fontSize: 12, cursor: 'help' }}>ⓘ</span></Tooltip></Space>} name="email">
            <Input disabled style={{ background: '#f5f5f5', color: '#bfbfbf' }} suffix={<span style={{ fontSize: 11, color: '#bfbfbf' }}>Tidak bisa diubah</span>} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Perpanjang */}
      <Modal title={`Perpanjang Subscription — ${data.fullName}`} open={renewOpen} onCancel={() => setRenewOpen(false)}
        onOk={() => renewForm.validateFields().then(handleRenew)} okText="Perpanjang" cancelText="Batal"
        okButtonProps={{ style: { background: '#059669', borderColor: '#059669' } }} width={420}>
        <Form form={renewForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Plan saat ini: </Text>
            <Tag color={data.plan === 'Pro' ? 'blue' : data.plan === 'Enterprise' ? 'purple' : 'default'}>{data.plan}</Tag>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>Expired: {data.expired}</Text>
          </div>
          <Form.Item label="Plan Baru" name="plan" rules={[{ required: true }]}>
            <Select options={planOptions} />
          </Form.Item>
          <Form.Item label="Tanggal Mulai" name="startDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Durasi" name="duration" rules={[{ required: true }]}>
            <Select options={[{ value: 30, label: '30 hari (1 bulan)' }, { value: 90, label: '90 hari (3 bulan)' }, { value: 180, label: '180 hari (6 bulan)' }, { value: 365, label: '365 hari (1 tahun)' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
