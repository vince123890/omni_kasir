import { useState } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Space, Modal, Form, Input, InputNumber, Switch, Divider, List, Popconfirm, notification, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CrownOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Plan {
  id: number
  name: string
  price: number
  durationDays: number
  maxStores: number
  maxCashiers: number
  isActive: boolean
  isPopular: boolean
  tenantCount: number
  features: string[]
}

const initialPlans: Plan[] = [
  { id: 1, name: 'Basic', price: 99000, durationDays: 30, maxStores: 1, maxCashiers: 2, isActive: true, isPopular: false, tenantCount: 9, features: ['1 Store', '2 Kasir per store'] },
  { id: 2, name: 'Pro', price: 299000, durationDays: 30, maxStores: 5, maxCashiers: 5, isActive: true, isPopular: true, tenantCount: 11, features: ['5 Store', '5 Kasir per store'] },
  { id: 3, name: 'Enterprise', price: 699000, durationDays: 30, maxStores: 999, maxCashiers: 999, isActive: true, isPopular: false, tenantCount: 4, features: ['Unlimited store', 'Unlimited kasir per store'] },
]

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Plan | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  const buildFeatures = (maxStores: number, maxCashiers: number): string[] => [
    maxStores >= 999 ? 'Unlimited store' : `${maxStores} Store`,
    maxCashiers >= 999 ? 'Unlimited kasir per store' : `${maxCashiers} Kasir per store`,
  ]

  const handleAdd = (values: Omit<Plan, 'id' | 'tenantCount' | 'features' | 'isActive' | 'isPopular'>) => {
    const newPlan: Plan = {
      ...values, id: Date.now(), tenantCount: 0, isActive: true, isPopular: false,
      features: buildFeatures(values.maxStores, values.maxCashiers),
    }
    setPlans(prev => [...prev, newPlan])
    addForm.resetFields()
    setAddOpen(false)
    api.success({ message: 'Plan berhasil ditambahkan', icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
  }

  const handleEdit = (plan: Plan) => {
    setEditTarget(plan)
    editForm.setFieldsValue(plan)
    setEditOpen(true)
  }

  const handleEditSave = (values: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === editTarget!.id ? {
      ...p, ...values,
      features: buildFeatures(values.maxStores ?? p.maxStores, values.maxCashiers ?? p.maxCashiers),
    } : p))
    setEditOpen(false)
    api.success({ message: 'Plan berhasil diupdate', icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
  }

  const handleDelete = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    api.success({ message: 'Plan berhasil dihapus' })
  }

  const handleToggleActive = (id: number, checked: boolean) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: checked } : p))
  }

  // Hanya 1 plan yang bisa "Paling Populer" — uncheck yang lain otomatis
  const handleTogglePopular = (id: number, checked: boolean) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      isPopular: p.id === id ? checked : false,
    })))
    if (checked) {
      const plan = plans.find(p => p.id === id)
      api.success({ message: `"${plan?.name}" ditandai sebagai Paling Populer` })
    }
  }

  const planForm = (form: typeof addForm, excludeId?: number) => (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <Form.Item
        label="Nama Plan"
        name="name"
        rules={[
          { required: true, message: 'Nama plan wajib diisi' },
          {
            validator: (_, value) => {
              const duplicate = plans.find(p =>
                p.name.trim().toLowerCase() === value?.trim().toLowerCase() &&
                p.id !== excludeId
              )
              return duplicate
                ? Promise.reject(`Nama plan "${value}" sudah digunakan`)
                : Promise.resolve()
            },
          },
        ]}
      >
        <Input placeholder="Contoh: Pro" />
      </Form.Item>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Harga (Rp/bulan)" name="price" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="299000"
              min={0}
              prefix="Rp"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={v => Number(v!.replace(/\./g, '')) as 0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Durasi (hari)" name="durationDays" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="30" min={1} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Maks Store" name="maxStores" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="5" min={1} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Maks Kasir/Store" name="maxCashiers" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="5" min={1} />
          </Form.Item>
        </Col>
      </Row>

    </Form>
  )

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Subscription Plan</Title>
          <Text type="secondary">Kelola paket langganan platform</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Tambah Plan
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {plans.map((plan) => (
          <Col xs={24} md={8} key={plan.id}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: plan.isPopular ? '#4f46e5' : '#f0f0f0',
                borderWidth: plan.isPopular ? 2 : 1,
                boxShadow: plan.isPopular ? '0 8px 24px rgba(79,70,229,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                opacity: plan.isActive ? 1 : 0.6,
              }}
              styles={{ body: { padding: 24 } }}
            >
              {/* Flag Paling Populer — bisa di-toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: plan.isPopular ? 12 : 4 }}>
                <Tooltip title={plan.isPopular ? 'Klik untuk hapus label Paling Populer' : 'Klik untuk tandai sebagai Paling Populer'}>
                  <div
                    onClick={() => handleTogglePopular(plan.id, !plan.isPopular)}
                    style={{ cursor: 'pointer' }}
                  >
                    {plan.isPopular ? (
                      <Tag
                        color="blue"
                        icon={<CrownOutlined />}
                        style={{ userSelect: 'none' }}
                      >
                        PALING POPULER
                      </Tag>
                    ) : (
                      <Tag
                        icon={<CrownOutlined />}
                        style={{ color: '#bfbfbf', borderColor: '#e8e8e8', background: '#fafafa', userSelect: 'none' }}
                      >
                        Tandai Populer
                      </Tag>
                    )}
                  </div>
                </Tooltip>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{plan.name}</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>{plan.tenantCount} tenant aktif</Text>
                </div>
                <Space>
                  <Button size="small" icon={<EditOutlined />} type="text" onClick={() => handleEdit(plan)} />
                  <Popconfirm
                    title="Hapus plan ini?"
                    description={plan.tenantCount > 0 ? `${plan.tenantCount} tenant masih menggunakan plan ini.` : 'Plan akan dihapus permanen.'}
                    onConfirm={() => handleDelete(plan.id)}
                    okText="Hapus" cancelText="Batal" okButtonProps={{ danger: true }}
                  >
                    <Button size="small" icon={<DeleteOutlined />} type="text" danger />
                  </Popconfirm>
                </Space>
              </div>

              <div style={{ margin: '16px 0' }}>
                <Text style={{ fontSize: 28, fontWeight: 700 }}>
                  Rp {plan.price.toLocaleString('id-ID')}
                </Text>
                <Text type="secondary">/bulan · {plan.durationDays} hari</Text>
              </div>

              <Divider style={{ margin: '12px 0' }} />
              <List size="small" dataSource={plan.features} renderItem={(f) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Space>
                    <CheckOutlined style={{ color: '#059669', fontSize: 13 }} />
                    <Text style={{ fontSize: 13 }}>{f}</Text>
                  </Space>
                </List.Item>
              )} />

              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16} style={{ textAlign: 'center' }}>
                <Col span={12}>
                  <Text strong style={{ fontSize: 18 }}>{plan.maxStores === 999 ? '∞' : plan.maxStores}</Text>
                  <br /><Text type="secondary" style={{ fontSize: 11 }}>Maks Store</Text>
                </Col>
                <Col span={12}>
                  <Text strong style={{ fontSize: 18 }}>{plan.maxCashiers === 999 ? '∞' : plan.maxCashiers}</Text>
                  <br /><Text type="secondary" style={{ fontSize: 11 }}>Kasir/Store</Text>
                </Col>
              </Row>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Switch
                  checked={plan.isActive}
                  checkedChildren="Aktif"
                  unCheckedChildren="Nonaktif"
                  onChange={(checked) => handleToggleActive(plan.id, checked)}
                />
                {!plan.isActive && <Tag color="default">Dinonaktifkan</Tag>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal Tambah */}
      <Modal title="Tambah Subscription Plan" open={addOpen}
        onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.validateFields().then(handleAdd)}
        okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }}
        width={480}>
        {planForm(addForm)}
      </Modal>

      {/* Modal Edit */}
      <Modal title={`Edit Plan — ${editTarget?.name}`} open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then(handleEditSave)}
        okText="Simpan Perubahan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }}
        width={480}>
        {planForm(editForm, editTarget?.id)}
      </Modal>
    </Space>
  )
}
