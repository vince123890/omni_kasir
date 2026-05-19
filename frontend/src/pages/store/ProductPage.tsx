import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Button, Tag, Typography, Space, Input, Modal, Form, InputNumber, Select, Row, Col, notification, Alert, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { productApi } from '../../api'
import type { Product } from '../../api/types'
import { useSearchParams } from 'react-router-dom'

const { Title, Text } = Typography

const stockTag = (stock: number, minStock: number) => {
  if (stock === 0) return <Tag color="error">Habis</Tag>
  if (stock <= Math.floor(minStock * 0.3)) return <Tag color="error">Kritis</Tag>
  if (stock <= minStock) return <Tag color="warning">Menipis</Tag>
  return <Tag color="success">Aman</Tag>
}

const DEFAULT_CATEGORIES = ['Minuman', 'Makanan', 'Snack']
const DEFAULT_UNITS      = ['pcs', 'kg', 'gram', 'liter', 'ml', 'lusin', 'pak']
const DEFAULT_CONV_UNITS = ['dus', 'karton', 'box', 'slop', 'bal', 'karung', 'galon']

export default function ProductPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low-stock'>(() =>
    searchParams.get('filter') === 'low-stock' ? 'low-stock' : 'all'
  )
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  useEffect(() => {
    setStockFilter(searchParams.get('filter') === 'low-stock' ? 'low-stock' : 'all')
  }, [searchParams])

  const load = useCallback(() => {
    setLoading(true)
    productApi.list({ limit: 500, search: search || undefined, category: categoryFilter !== 'all' ? categoryFilter : undefined, filter: stockFilter === 'low-stock' ? 'low-stock' : undefined })
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, categoryFilter, stockFilter])

  useEffect(() => { load() }, [load])

  const categories = ['all', ...Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map(p => p.category)]))]
  const unitSuggestions = [...new Set([...DEFAULT_UNITS, ...products.map(p => p.unit).filter(Boolean)])]
  const convUnitSuggestions = [...new Set([...DEFAULT_CONV_UNITS, ...products.map(p => p.conversionUnit ?? '').filter(Boolean)])]

  const openEdit = (p: Product) => {
    setEditTarget(p)
    editForm.setFieldsValue({
      name: p.name, category: p.category, unit: p.unit,
      convUnit: p.conversionUnit, convRate: p.conversionRate,
      buyPrice: p.buyPrice, sellPrice: p.sellPrice, minStock: p.minStock,
    })
    setEditOpen(true)
  }

  const handleAdd = async (values: Record<string, unknown>) => {
    try {
      const result = await productApi.create({
        name: values.name as string,
        category: values.category as string,
        unit: values.unit as string,
        conversionUnit: values.convUnit as string | undefined,
        conversionRate: values.convRate as number | undefined,
        buyPrice: values.buyPrice as number,
        sellPrice: values.sellPrice as number,
        initialStock: values.stock as number | undefined,
        minStock: values.minStock as number,
      })
      addForm.resetFields()
      setAddOpen(false)
      api.success({ message: 'Produk berhasil ditambahkan', description: result.name, icon: <CheckCircleOutlined style={{ color: '#059669' }} /> })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal menambah produk' })
    }
  }

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editTarget) return
    try {
      await productApi.update(editTarget.id, {
        name: values.name as string,
        category: values.category as string,
        unit: values.unit as string,
        conversionUnit: values.convUnit as string | undefined,
        conversionRate: values.convRate as number | undefined,
        buyPrice: values.buyPrice as number,
        sellPrice: values.sellPrice as number,
        minStock: values.minStock as number,
      })
      setEditOpen(false)
      api.success({ message: 'Produk berhasil diupdate' })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal update produk' })
    }
  }

  const handleDelete = async (id: number, name: string) => {
    try {
      await productApi.remove(id)
      api.success({ message: `Produk "${name}" berhasil dihapus` })
      load()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal menghapus produk' })
    }
  }

  const makeCreatableSelect = (form: typeof addForm, fieldName: string, options: string[], placeholder: string) => (
    <Select
      showSearch
      allowClear
      placeholder={placeholder}
      onSearch={val => form.setFieldValue(fieldName, val || undefined)}
      onChange={val => form.setFieldValue(fieldName, val)}
      filterOption={false}
      options={options.map(o => ({ value: o, label: o }))}
    />
  )

  const productForm = (form: typeof addForm, isEdit = false) => (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <Form.Item label="Nama Produk" name="name" rules={[{ required: true }]}>
        <Input placeholder="Aqua 600ml" />
      </Form.Item>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Kategori" name="category" rules={[{ required: true }]}>
            {makeCreatableSelect(form, 'category', DEFAULT_CATEGORIES, 'Pilih atau ketik kategori baru')}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Satuan Jual" name="unit" rules={[{ required: true }]}>
            {makeCreatableSelect(form, 'unit', unitSuggestions, 'pcs, kg, liter...')}
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Satuan Beli / Besar" name="convUnit">
            {makeCreatableSelect(form, 'convUnit', convUnitSuggestions, 'dus, karton, box...')}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Rate Konversi" name="convRate">
            <InputNumber style={{ width: '100%' }} placeholder="24" min={1} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item label="Harga Beli (Rp)" name="buyPrice" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="2500" min={0}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={v => Number(v!.replace(/\./g, '')) as 0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Harga Jual (Rp)" name="sellPrice" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="3500" min={0}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={v => Number(v!.replace(/\./g, '')) as 0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label={isEdit ? 'Stok Saat Ini' : 'Stok Awal'} name="stock">
            <InputNumber style={{ width: '100%' }} placeholder="0" min={0} disabled={isEdit} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label={<Space size={4}><span>Min Stok</span><Text type="secondary" style={{ fontSize: 11 }}>(alert stok menipis)</Text></Space>} name="minStock" rules={[{ required: true }, { type: 'number', min: 1 }]}>
            <InputNumber style={{ width: '100%' }} placeholder="24" min={1} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )

  const columns = [
    {
      title: 'Nama Produk', key: 'name',
      render: (_: unknown, r: Product) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.name}</Text>
          <Text code style={{ fontSize: 11 }}>{r.sku ?? '—'}</Text>
        </Space>
      ),
    },
    { title: 'Kategori', dataIndex: 'category', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Konversi', key: 'conv', render: (_: unknown, r: Product) => r.conversionUnit ? <Text type="secondary" style={{ fontSize: 12 }}>1 {r.conversionUnit} = {r.conversionRate} {r.unit}</Text> : <Text type="secondary">—</Text> },
    { title: 'Harga Beli', dataIndex: 'buyPrice', render: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
    { title: 'Harga Jual', dataIndex: 'sellPrice', render: (v: number) => <Text strong style={{ color: '#4f46e5' }}>Rp {v.toLocaleString('id-ID')}</Text> },
    {
      title: 'Stok', key: 'stock',
      render: (_: unknown, r: Product) => (
        <Space direction="vertical" size={0}>
          <Space>{r.stock} {r.unit} {stockTag(r.stock, r.minStock)}</Space>
          <Text type="secondary" style={{ fontSize: 11 }}>min: {r.minStock} {r.unit}</Text>
        </Space>
      ),
    },
    {
      title: 'Aksi', key: 'action',
      render: (_: unknown, r: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} type="text" onClick={() => openEdit(r)} />
          <Button size="small" icon={<DeleteOutlined />} type="text" danger
            onClick={() => Modal.confirm({
              title: 'Hapus produk ini?',
              content: `"${r.name}" akan dihapus permanen.`,
              okText: 'Hapus', cancelText: 'Batal', okButtonProps: { danger: true },
              onOk: () => handleDelete(r.id, r.name),
            })} />
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Management Produk</Title>
          <Text type="secondary">{products.length} produk terdaftar</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Tambah Produk
        </Button>
      </div>

      {stockFilter === 'low-stock' && (
        <Alert type="warning" showIcon message={`Menampilkan ${products.length} produk dengan stok di bawah minimum`}
          action={<Button size="small" onClick={() => setStockFilter('all')}>Tampilkan Semua</Button>} />
      )}

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 160 }}
            options={categories.map(c => ({ value: c, label: c === 'all' ? 'Semua Kategori' : c }))} />
          <Button type={stockFilter === 'low-stock' ? 'primary' : 'default'} danger={stockFilter === 'low-stock'}
            onClick={() => setStockFilter(stockFilter === 'low-stock' ? 'all' : 'low-stock')}
            style={stockFilter === 'low-stock' ? {} : { borderColor: '#d97706', color: '#d97706' }}>
            {stockFilter === 'low-stock' ? '⚠ Stok Menipis' : '⚠ Tampilkan Menipis'}
          </Button>
        </Space>
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={products.map(p => ({ ...p, key: p.id }))} pagination={{ pageSize: 10 }} size="middle" scroll={{ x: true }}
            locale={{ emptyText: stockFilter === 'low-stock' ? 'Semua stok di atas minimum 👍' : 'Belum ada produk' }} />
        </Spin>
      </Card>

      <Modal title="Tambah Produk" open={addOpen}
        onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.validateFields().then(handleAdd)}
        okText="Simpan Produk" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={560}>
        {productForm(addForm)}
      </Modal>

      <Modal title={`Edit Produk — ${editTarget?.name}`} open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then(handleEdit)}
        okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }} width={560}>
        {productForm(editForm, true)}
      </Modal>
    </Space>
  )
}
