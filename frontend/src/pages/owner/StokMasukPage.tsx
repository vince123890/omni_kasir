import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Typography, Space, Modal, Form, Select, InputNumber, DatePicker, Tag, notification, Statistic, Row, Col, Spin } from 'antd'
import { PlusOutlined, InboxOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { stockInApi, stockMovementApi, productApi } from '../../api'
import type { Product, StockMovement } from '../../api/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function StokMasukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [history, setHistory] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [api, ctx] = notification.useNotification()
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  const loadProducts = useCallback(() => {
    productApi.list({ limit: 500 }).then(res => setProducts(res.data)).catch(() => {})
  }, [])

  const loadHistory = useCallback(() => {
    setLoading(true)
    stockMovementApi.list({ type: 'IN', limit: 50 })
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadProducts()
    loadHistory()
  }, [loadProducts, loadHistory])

  const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null
  const totalItem = history.reduce((s, h) => s + h.qty, 0)

  const handleAdd = async (values: Record<string, unknown>) => {
    const product = products.find(p => p.id === values.productId)
    if (!product) return
    try {
      const result = await stockInApi.create({
        productId: values.productId as number,
        qty: values.qty as number,
        buyPrice: values.buyPrice as number,
        date: dayjs(values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        note: values.note as string | undefined,
      })
      form.resetFields()
      setSelectedProductId(null)
      setOpen(false)
      api.success({
        message: 'Stok Masuk Berhasil Dicatat',
        description: (
          <Space direction="vertical" size={2}>
            <span>{result.productName} +{result.qty} · Stok baru: {result.stockAfter}</span>
            <span>Kode: <strong>{result.movementCode}</strong></span>
          </Space>
        ),
        icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
        duration: 5,
      })
      loadProducts()
      loadHistory()
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Gagal mencatat stok masuk' })
    }
  }

  const columns = [
    { title: 'Kode Penerimaan', dataIndex: 'movementCode', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Tanggal', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString('id') },
    { title: 'Produk', dataIndex: 'productName', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Qty Masuk', key: 'qty', render: (_: unknown, r: StockMovement) => <Tag color="blue">+{r.qty}</Tag> },
    { title: 'Stok Sesudah', dataIndex: 'qtyAfter', render: (v: number) => <Text strong style={{ color: '#059669' }}>{v}</Text> },
    { title: 'Keterangan', dataIndex: 'note', render: (v: string | null) => <Text type="secondary">{v || '—'}</Text> },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Input Stok Masuk</Title>
          <Text type="secondary">Catat penerimaan barang dari supplier</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
          Input Stok Masuk
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <Statistic title="Total Item Masuk" value={totalItem} valueStyle={{ color: '#059669', fontSize: 20 }} suffix="pcs" prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <Statistic title="Jumlah Record" value={history.length} valueStyle={{ color: '#4f46e5', fontSize: 20 }} suffix="record" />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        title={<Space><InboxOutlined />Riwayat Stok Masuk</Space>}>
        <Spin spinning={loading}>
          <Table columns={columns} dataSource={history.map(h => ({ ...h, key: h.id }))} pagination={{ pageSize: 10 }} size="middle"
            locale={{ emptyText: 'Belum ada stok masuk' }} />
        </Spin>
      </Card>

      <Modal title="Input Stok Masuk" open={open}
        onCancel={() => { setOpen(false); form.resetFields(); setSelectedProductId(null) }}
        onOk={() => form.validateFields().then(handleAdd)}
        okText="Simpan" cancelText="Batal"
        okButtonProps={{ style: { background: '#059669', borderColor: '#059669' } }}
        width={480}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Produk" name="productId" rules={[{ required: true, message: 'Pilih produk' }]}>
            <Select placeholder="Pilih produk" showSearch optionFilterProp="label"
              onChange={(v: number) => setSelectedProductId(v)}
              options={products.map(p => ({ value: p.id, label: `${p.name} (stok: ${p.stock} ${p.unit})` }))} />
          </Form.Item>
          {selectedProduct && (
            <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 12 }}>
                Stok saat ini: <Text strong>{selectedProduct.stock} {selectedProduct.unit}</Text>
                {' '}· Harga beli terakhir: <Text strong>Rp {selectedProduct.buyPrice.toLocaleString('id-ID')}</Text>
              </Text>
            </div>
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Jumlah Masuk" name="qty" rules={[{ required: true }, { type: 'number', min: 1 }]}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder="0" addonAfter={selectedProduct?.unit || 'pcs'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Harga Beli (Rp)" name="buyPrice" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0"
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => Number(v!.replace(/\./g, '')) as 0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Tanggal Penerimaan" name="date" initialValue={dayjs()} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Keterangan" name="note">
            <Select placeholder="Pilih atau kosongkan" allowClear options={[
              { value: 'Restock mingguan', label: 'Restock mingguan' },
              { value: 'Restock bulanan', label: 'Restock bulanan' },
              { value: 'Stok hampir habis', label: 'Stok hampir habis' },
              { value: 'Pesanan baru', label: 'Pesanan baru' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
