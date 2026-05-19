import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Button, Tag, Typography, Space, Input, Select, Modal, Form, Avatar, notification, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, ShopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { ownerStoreApi, ownerUserApi } from '../../api'
import type { Store, StoreUser } from '../../api/types'

const { Title, Text } = Typography

export default function UserManagementPage() {
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState<StoreUser[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [maxKasirPerStore, setMaxKasirPerStore] = useState(999)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoreUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<number | 'all'>(() => {
    const p = searchParams.get('storeId')
    return p ? parseInt(p) : 'all'
  })
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  useEffect(() => {
    const p = searchParams.get('storeId')
    if (p) setStoreFilter(parseInt(p))
  }, [searchParams])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      ownerUserApi.list({ limit: 200 }).then(res => setUsers(res.data)),
      ownerStoreApi.list().then(res => { setStores(res.stores); setMaxKasirPerStore(res.meta.maxStores) }),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u =>
    (u.role === 'kasir' || u.role === 'admin_store') &&  // exclude owner
    (storeFilter === 'all' || u.storeId === storeFilter) &&
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || (u.storeName ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const openEdit = (u: StoreUser) => {
    setEditTarget(u)
    editForm.setFieldsValue({ name: u.name, email: u.email, storeId: u.storeId })
    setEditOpen(true)
  }

  const toggleStatus = async (u: StoreUser) => {
    try {
      await ownerUserApi.setStatus(u.id, !u.isActive)
      api.success({ message: `User ${!u.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, description: u.name, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal mengubah status' })
    }
  }

  const handleAdd = async (values: Record<string, unknown>) => {
    try {
      await ownerUserApi.create(values.storeId as number, {
        name: values.name as string,
        email: values.email as string,
        password: values.password as string,
        role: values.role as 'kasir' | 'admin_store',
      })
      addForm.resetFields(); setAddOpen(false)
      api.success({ message: `${values.role === 'admin_store' ? 'Admin Store' : 'Kasir'} berhasil ditambahkan`, description: values.name as string, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal menambah user' })
    }
  }

  const handleEdit = async (values: Record<string, unknown>) => {
    try {
      await ownerUserApi.update(editTarget!.id, { name: values.name as string, email: values.email as string })
      setEditOpen(false)
      api.success({ message: 'Data user berhasil diupdate' })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal update user' })
    }
  }

  const storeOptions = [
    { value: 'all' as const, label: 'Semua Store' },
    ...stores.map(s => {
      const kasirCount = users.filter(u => u.storeId === s.id && u.isActive && u.role === 'kasir').length
      return { value: s.id, label: `${s.name} (${kasirCount}/${maxKasirPerStore} kasir)` }
    }),
  ]

  const columns = [
    {
      title: 'Nama', key: 'nama',
      render: (_: unknown, r: StoreUser) => (
        <Space>
          <Avatar style={{ background: r.isActive ? (r.role === 'admin_store' ? '#eff6ff' : '#ecfdf5') : '#f5f5f5', color: r.isActive ? (r.role === 'admin_store' ? '#3b82f6' : '#059669') : '#bfbfbf' }}>
            {r.name.charAt(0)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </Space>
        </Space>
      ),
    },
    { title: 'Role', dataIndex: 'role', render: (v: string) => <Tag color={v === 'admin_store' ? 'blue' : 'green'}>{v === 'admin_store' ? 'Admin Store' : 'Kasir'}</Tag> },
    { title: 'Store', dataIndex: 'storeName', render: (v: string) => <Space size={4}><ShopOutlined style={{ color: '#bfbfbf' }} /><Text>{v}</Text></Space> },
    { title: 'Login Terakhir', dataIndex: 'lastLogin', render: (v: string | null) => v ? new Date(v).toLocaleString('id') : '-' },
    { title: 'Status', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Aktif' : 'Nonaktif'}</Tag> },
    {
      title: 'Aksi', key: 'action',
      render: (_: unknown, r: StoreUser) => (
        <Space>
          <Button size="small" type="link" style={{ padding: 0 }} onClick={() => openEdit(r)}>Edit</Button>
          <Button size="small" type="link" danger={r.isActive} style={{ padding: 0 }} onClick={() => toggleStatus(r)}>
            {r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </Space>
      ),
    },
  ]

  const userForm = (form: typeof addForm, isEdit = false) => (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      {!isEdit && (
        <Form.Item label="Role" name="role" rules={[{ required: true }]} initialValue="kasir">
          <Select options={[
            { value: 'kasir', label: 'Kasir — operator transaksi POS' },
            { value: 'admin_store', label: 'Admin Store — kelola produk & stok' },
          ]} />
        </Form.Item>
      )}
      <Form.Item label="Nama" name="name" rules={[{ required: true }, { min: 2 }]}>
        <Input placeholder="Nama lengkap" />
      </Form.Item>
      <Form.Item label="Email" name="email" rules={[{ required: true }, { type: 'email' }]}>
        <Input placeholder="user@bisnis.com" />
      </Form.Item>
      {!isEdit && (
        <Form.Item label="Password Awal" name="password" rules={[{ required: true }, { min: 8 }]}>
          <Input.Password placeholder="Min. 8 karakter" />
        </Form.Item>
      )}
      <Form.Item label="Assign ke Store" name="storeId" rules={[{ required: true }]}>
        <Select options={stores.map(s => ({ value: s.id, label: s.name }))} placeholder="Pilih store" />
      </Form.Item>
    </Form>
  )

  const selectedStoreName = storeFilter !== 'all' ? stores.find(s => s.id === storeFilter)?.name : null

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Kasir & Admin Store</Title>
          <Text type="secondary">
            {users.filter(u => u.role === 'kasir').length} kasir · {users.filter(u => u.role === 'admin_store').length} admin store
            {selectedStoreName && <> · <Text strong style={{ color: '#4f46e5' }}>Filter: {selectedStoreName}</Text></>}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Tambah User
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 150 }} options={[{ value: 'all', label: 'Semua Role' }, { value: 'kasir', label: 'Kasir' }, { value: 'admin_store', label: 'Admin Store' }]} />
          <Select value={storeFilter} onChange={v => setStoreFilter(v)} style={{ width: 220 }} options={storeOptions} />
          {storeFilter !== 'all' && <Button type="link" style={{ padding: 0, color: '#dc2626' }} onClick={() => setStoreFilter('all')}>Reset</Button>}
        </Space>
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={filtered.map(u => ({ ...u, key: u.id }))} pagination={{ pageSize: 10 }} size="middle" locale={{ emptyText: 'Tidak ada user ditemukan' }} />
        </Spin>
      </Card>

      <Modal title="Tambah Kasir / Admin Store" open={addOpen} onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.validateFields().then(handleAdd)} okText="Tambah" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={480}>
        {userForm(addForm)}
      </Modal>

      <Modal title={`Edit User — ${editTarget?.name}`} open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then(handleEdit)} okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={480}>
        {userForm(editForm, true)}
      </Modal>
    </Space>
  )
}
