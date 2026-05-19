import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Button, Tag, Typography, Space, Input, Select, Modal, Form, DatePicker, Dropdown, Row, Col, notification, Avatar, Tooltip, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, MoreOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, ReloadOutlined, StopOutlined, PlayCircleOutlined, EyeOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { tenantApi, subscriptionPlanApi } from '../../api'
import type { Tenant, SubscriptionPlan } from '../../api/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const entityColors: Record<string, string> = { PT: 'blue', CV: 'cyan', UD: 'orange' }

export default function TenantPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [selected, setSelected] = useState<Tenant | null>(null)
  const [search, setSearch] = useState('')
  const [filterEntity, setFilterEntity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [renewForm] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  const load = useCallback(() => {
    setLoading(true)
    tenantApi.list({ limit: 100 }).then(res => setTenants(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    subscriptionPlanApi.list().then(setPlans).catch(() => {})
  }, [load])

  const filtered = tenants.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.owner.toLowerCase().includes(search.toLowerCase()) ||
      d.entityType.toLowerCase().includes(search.toLowerCase())
    const matchEntity = filterEntity === 'all' || d.entityType === filterEntity
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    const matchPlan   = filterPlan === 'all' || d.plan === filterPlan
    return matchSearch && matchEntity && matchStatus && matchPlan
  })

  const openEdit = (t: Tenant) => { setSelected(t); editForm.setFieldsValue(t); setEditOpen(true) }
  const openRenew = (t: Tenant) => { setSelected(t); renewForm.resetFields(); setRenewOpen(true) }

  const toggleStatus = async (t: Tenant) => {
    const newActive = t.status !== 'aktif'
    try {
      await tenantApi.setStatus(t.id, newActive)
      load()
      api.success({ message: `Tenant ${newActive ? 'diaktifkan' : 'dinonaktifkan'}`, description: t.fullName })
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal mengubah status' })
    }
  }

  const handleAdd = async (values: Record<string, unknown>) => {
    try {
      const plan = plans.find(p => p.name === values.plan)
      if (!plan) { api.error({ message: 'Plan tidak ditemukan' }); return }
      await tenantApi.create({
        entityType: values.entityType as string,
        name: values.name as string,
        ownerName: values.ownerName as string,
        email: values.email as string,
        password: values.password as string,
        planId: plan.id,
        startDate: (values.startDate as dayjs.Dayjs).format('YYYY-MM-DD'),
      })
      addForm.resetFields(); setAddOpen(false)
      api.success({ message: 'Tenant berhasil dibuat', icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal membuat tenant' })
    }
  }

  const handleEdit = async (values: Partial<Tenant>) => {
    try {
      await tenantApi.update(selected!.id, { entityType: values.entityType, name: values.name })
      setEditOpen(false)
      api.success({ message: 'Tenant berhasil diupdate' })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal update tenant' })
    }
  }

  const handleRenew = async (values: Record<string, unknown>) => {
    try {
      const plan = plans.find(p => p.name === values.plan)
      if (!plan) { api.error({ message: 'Plan tidak ditemukan' }); return }
      const res = await tenantApi.renewSubscription(selected!.id, {
        planId: plan.id,
        startDate: (values.startDate as dayjs.Dayjs).format('YYYY-MM-DD'),
        durationDays: values.duration as number,
      })
      setRenewOpen(false)
      api.success({ message: 'Subscription berhasil diperpanjang', description: `Expired: ${res.newExpiredAt}`, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal perpanjang subscription' })
    }
  }

  const getActions = (t: Tenant): MenuProps['items'] => [
    { key: 'view', icon: <EyeOutlined />, label: 'Lihat Detail', onClick: () => navigate(`/admin/tenants/${t.id}`) },
    { key: 'edit', icon: <EditOutlined />, label: 'Edit Tenant', onClick: () => openEdit(t) },
    { key: 'renew', icon: <ReloadOutlined />, label: 'Perpanjang Subscription', onClick: () => openRenew(t) },
    { type: 'divider' as const },
    {
      key: 'toggle', label: t.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan',
      icon: t.status === 'aktif' ? <StopOutlined /> : <PlayCircleOutlined />,
      onClick: () => toggleStatus(t),
    },
  ]

  const columns = [
    {
      title: 'Bisnis / Owner', key: 'name',
      render: (_: unknown, r: Tenant) => (
        <Space>
          <Avatar style={{ background: entityColors[r.entityType] === 'blue' ? '#4f46e5' : entityColors[r.entityType] === 'cyan' ? '#0891b2' : '#d97706', fontSize: 12 }}>
            {r.entityType}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Space size={6}>
              <Text strong>{r.name}</Text>
              <Tag color={entityColors[r.entityType]} style={{ margin: 0, fontSize: 11 }}>{r.entityType}</Tag>
            </Space>
            <Space size={6}>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.owner} · {r.email}</Text>
              <Text code style={{ fontSize: 11 }}>{r.tenantCode}</Text>
            </Space>
          </Space>
        </Space>
      ),
    },
    { title: 'Plan', dataIndex: 'plan', render: (v: string) => <Tag color={v === 'Enterprise' ? 'purple' : v === 'Pro' ? 'blue' : 'default'}>{v}</Tag> },
    { title: 'Bergabung', dataIndex: 'joinDate' },
    { title: 'Expired', dataIndex: 'expired' },
    {
      title: 'Status', dataIndex: 'status',
      render: (s: string) => <Tag icon={s === 'aktif' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={s === 'aktif' ? 'success' : s === 'expired' ? 'warning' : 'error'}>{s}</Tag>,
    },
    {
      title: '', key: 'action',
      render: (_: unknown, r: Tenant) => (
        <Dropdown menu={{ items: getActions(r) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const planOptions = plans.map(p => ({ value: p.name, label: `${p.name} — Rp ${(p.price / 1000).toFixed(0)}rb/bln` }))

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Management Tenant</Title>
          <Text type="secondary">{filtered.length} dari {tenants.length} tenant</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Tambah Tenant
        </Button>
      </div>

      <Space>
        {['PT', 'CV', 'UD'].map(et => (
          <Tag key={et} color={entityColors[et]} style={{ padding: '4px 12px', fontSize: 13 }}>
            {et}: {tenants.filter(t => t.entityType === et).length} tenant
          </Tag>
        ))}
      </Space>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Cari nama, owner, atau PT/CV/UD..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          <Select value={filterEntity} onChange={setFilterEntity} style={{ width: 120 }} options={[{ value: 'all', label: 'Semua Jenis' }, { value: 'PT', label: 'PT' }, { value: 'CV', label: 'CV' }, { value: 'UD', label: 'UD' }]} />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 140 }} options={[{ value: 'all', label: 'Semua Status' }, { value: 'aktif', label: 'Aktif' }, { value: 'expired', label: 'Expired' }, { value: 'nonaktif', label: 'Nonaktif' }]} />
          <Select value={filterPlan} onChange={setFilterPlan} style={{ width: 140 }} options={[{ value: 'all', label: 'Semua Plan' }, ...plans.map(p => ({ value: p.name, label: p.name }))]} />
          {(filterEntity !== 'all' || filterStatus !== 'all' || filterPlan !== 'all' || search) && (
            <Button type="link" style={{ padding: 0, color: '#dc2626' }} onClick={() => { setFilterEntity('all'); setFilterStatus('all'); setFilterPlan('all'); setSearch('') }}>
              Reset Filter
            </Button>
          )}
        </Space>
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={filtered.map(t => ({ ...t, key: t.id }))} pagination={{ pageSize: 10 }} size="middle" />
        </Spin>
      </Card>

      {/* Modal Tambah */}
      <Modal title="Tambah Tenant Baru" open={addOpen} onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.validateFields().then(handleAdd)} okText="Buat Tenant" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={520}>
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="Jenis Usaha" name="entityType" rules={[{ required: true }]}>
                <Select options={[{ value: 'PT', label: 'PT' }, { value: 'CV', label: 'CV' }, { value: 'UD', label: 'UD' }]} placeholder="PT" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Nama Bisnis" name="name" rules={[{ required: true }]}>
                <Input placeholder="Berkah Abadi Mandiri" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Nama Owner" name="ownerName" rules={[{ required: true }]}>
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email Owner" name="email" rules={[{ required: true }, { type: 'email' }]}>
                <Input placeholder="john@bisnis.com" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Password Awal" name="password" rules={[{ required: true }, { min: 8, message: 'Min 8 karakter' }]}>
            <Input.Password placeholder="Min. 8 karakter" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Subscription Plan" name="plan" rules={[{ required: true }]}>
                <Select options={planOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tanggal Mulai" name="startDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal title={`Edit Tenant — ${selected?.fullName}`} open={editOpen} onCancel={() => setEditOpen(false)}
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
          <Form.Item
            label={
              <Space size={4}>
                <span>Email Owner</span>
                <Tooltip title="Email adalah kredensial login owner dan tidak bisa diubah di sini.">
                  <span style={{ color: '#bfbfbf', fontSize: 12, cursor: 'help' }}>ⓘ</span>
                </Tooltip>
              </Space>
            }
            name="email"
          >
            <Input disabled style={{ background: '#f5f5f5', color: '#bfbfbf' }} suffix={<span style={{ fontSize: 11, color: '#bfbfbf' }}>Tidak bisa diubah</span>} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Perpanjang */}
      <Modal title={`Perpanjang Subscription — ${selected?.fullName}`} open={renewOpen} onCancel={() => setRenewOpen(false)}
        onOk={() => renewForm.validateFields().then(handleRenew)} okText="Perpanjang" cancelText="Batal"
        okButtonProps={{ style: { background: '#059669', borderColor: '#059669' } }} width={420}>
        <Form form={renewForm} layout="vertical" style={{ marginTop: 16 }}>
          {selected && (
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Plan saat ini: </Text>
              <Tag color="blue">{selected.plan}</Tag>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>Expired: {selected.expired}</Text>
            </div>
          )}
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
