import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Space, Modal, Form, Input, Statistic, Tooltip, notification, Alert, Spin } from 'antd'
import { PlusOutlined, EnvironmentOutlined, TeamOutlined, EditOutlined, DeleteOutlined, ShopOutlined, CheckCircleOutlined, StopOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ownerStoreApi } from '../../api'
import type { Store } from '../../api/types'

const { Title, Text } = Typography

export default function StorePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [maxStores, setMaxStores] = useState<number>(999)
  const [planName, setPlanName] = useState<string>('')
  const [maxKasir, setMaxKasir] = useState<number>(999)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Store | null>(null)
  const [deleteBlocked, setDeleteBlocked] = useState<Store | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  const load = useCallback(() => {
    setLoading(true)
    ownerStoreApi.list().then(res => {
      setStores(res.stores ?? [])
      const meta = res.meta
      if (meta) {
        setMaxStores(meta.maxStores >= 999 ? Infinity : meta.maxStores)
        setPlanName(meta.planName ?? '')
        setMaxKasir(meta.maxCashiersPerStore ?? meta.maxStores ?? 999)
      }
    }).catch(err => console.error('StorePage load error:', err))
    .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (store: Store) => {
    setEditTarget(store)
    editForm.setFieldsValue({ name: store.name, address: store.address, phone: store.phone })
    setEditOpen(true)
  }

  const handleAdd = async (values: { name: string; address: string; phone?: string }) => {
    try {
      await ownerStoreApi.create(values)
      addForm.resetFields(); setAddOpen(false)
      api.success({ message: 'Store berhasil ditambahkan', description: values.name, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal menambah store' })
    }
  }

  const handleEdit = async (values: { name: string; address: string; phone?: string }) => {
    try {
      await ownerStoreApi.update(editTarget!.id, values)
      setEditOpen(false)
      api.success({ message: 'Store berhasil diupdate' })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal update store' })
    }
  }

  const handleDeleteAttempt = async (store: Store) => {
    try {
      await ownerStoreApi.remove(store.id)
      api.success({ message: `Store "${store.name}" berhasil dihapus` })
      load()
    } catch {
      setDeleteBlocked(store)
    }
  }

  const handleToggleStatus = async (store: Store) => {
    try {
      await ownerStoreApi.setStatus(store.id, !store.isActive)
      setDeleteBlocked(null)
      api.success({ message: `Store "${store.name}" berhasil ${store.isActive ? 'dinonaktifkan' : 'diaktifkan'}` })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal mengubah status store' })
    }
  }

  const phoneRule = {
    validator: (_: unknown, value: string) => {
      if (!value) return Promise.resolve()
      const valid = /^(\+62|08)\d{8,11}$/.test(value.replace(/[\s-]/g, ''))
      return valid ? Promise.resolve() : Promise.reject('Format nomor tidak valid (08xxx atau +62xxx)')
    },
  }

  const storeFormContent = (form: typeof addForm) => (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <Form.Item label="Nama Store" name="name" rules={[{ required: true }, { min: 2 }]}>
        <Input placeholder="Cabang Tangerang" />
      </Form.Item>
      <Form.Item label="Alamat" name="address" rules={[{ required: true }, { min: 5 }]}>
        <Input.TextArea rows={3} placeholder="Jl. ..." />
      </Form.Item>
      <Form.Item label="No. Telepon" name="phone" rules={[phoneRule]}>
        <Input placeholder="08xx atau +62xx" />
      </Form.Item>
    </Form>
  )

  const maxDisplay = maxStores === Infinity ? '∞' : maxStores

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Management Store</Title>
          <Text type="secondary">{stores.length} / {maxDisplay} store (Plan {planName || user?.planName})</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}
          disabled={maxStores !== Infinity && stores.length >= maxStores}
          style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Tambah Store
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stores.map((store) => (
            <Col xs={24} md={12} xl={8} key={store.id}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                actions={[
                  <Tooltip title="Edit Store"><Button type="text" icon={<EditOutlined />} onClick={() => openEdit(store)} /></Tooltip>,
                  <Tooltip title="Kelola Kasir"><Button type="text" icon={<TeamOutlined />} onClick={() => navigate(`/owner/users?storeId=${store.id}`)} /></Tooltip>,
                  store.isActive
                    ? <Tooltip title="Nonaktifkan"><Button type="text" icon={<StopOutlined />} danger onClick={() => handleToggleStatus(store)} /></Tooltip>
                    : <Tooltip title="Aktifkan"><Button type="text" icon={<PlayCircleOutlined />} style={{ color: '#059669' }} onClick={() => handleToggleStatus(store)} /></Tooltip>,
                  <Tooltip title="Hapus Store"><Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDeleteAttempt(store)} /></Tooltip>,
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: '#eef2ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShopOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 14 }}>{store.name}</Text>
                      <Tag color={store.isActive ? 'success' : 'default'} style={{ margin: 0 }}>{store.isActive ? 'Aktif' : 'Nonaktif'}</Tag>
                    </div>
                    <Space direction="vertical" size={2}>
                      <Text code style={{ fontSize: 11 }}>{store.storeCode}</Text>
                      <Space size={4}><EnvironmentOutlined style={{ color: '#bfbfbf', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{store.address}</Text></Space>
                      <Space size={4}><TeamOutlined style={{ color: '#bfbfbf', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{store.kasirCount}/{maxKasir} kasir aktif</Text></Space>
                    </Space>
                  </div>
                </div>
                <Row gutter={16}>
                  <Col span={12}><Statistic title="Transaksi/Bln" value={store.txMonth || 0} valueStyle={{ fontSize: 18, color: '#4f46e5' }} /></Col>
                  <Col span={12}><Statistic title="Revenue/Bln" value={store.revenue || '-'} valueStyle={{ fontSize: 18, color: '#059669' }} /></Col>
                </Row>
              </Card>
            </Col>
          ))}

          {(maxStores === Infinity || stores.length < maxStores) && (
            <Col xs={24} md={12} xl={8}>
              <Card bordered style={{ borderRadius: 12, borderStyle: 'dashed', borderColor: '#d9d9d9', background: '#fafafa', cursor: 'pointer', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAddOpen(true)}>
                <Space direction="vertical" align="center">
                  <div style={{ width: 48, height: 48, border: '2px dashed #d9d9d9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlusOutlined style={{ fontSize: 20, color: '#bfbfbf' }} />
                  </div>
                  <Text type="secondary">Tambah Store Baru</Text>
                  {maxStores !== Infinity && <Text type="secondary" style={{ fontSize: 12 }}>Sisa {maxStores - stores.length} slot (Plan {planName})</Text>}
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </Spin>

      <Modal title="Tambah Store Baru" open={addOpen} onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.validateFields().then(handleAdd)} okText="Buat Store" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={480}>
        {storeFormContent(addForm)}
      </Modal>

      <Modal title={`Edit Store — ${editTarget?.name}`} open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then(handleEdit)} okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={480}>
        {storeFormContent(editForm)}
      </Modal>

      <Modal
        title={`Tidak Bisa Menghapus "${deleteBlocked?.name}"`}
        open={!!deleteBlocked}
        onCancel={() => setDeleteBlocked(null)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteBlocked(null)}>Batal</Button>,
          <Button key="nonaktif" icon={<StopOutlined />} danger onClick={() => deleteBlocked && handleToggleStatus(deleteBlocked)}>
            Nonaktifkan Store
          </Button>,
        ]}
        width={440}
      >
        <Alert type="warning" showIcon message="Store ini memiliki riwayat transaksi"
          description="Store yang sudah memiliki transaksi tidak dapat dihapus untuk menjaga integritas data. Anda dapat menonaktifkannya agar tidak bisa digunakan."
          style={{ marginTop: 16 }} />
      </Modal>
    </Space>
  )
}
