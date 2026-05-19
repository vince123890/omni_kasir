import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Select, InputNumber, Button, Typography, Space, Alert, Table, notification, Modal, Badge, Tag, Spin } from 'antd'
import { RetweetOutlined, ArrowRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import { kasirProductApi, kasirConvertApi, storeConvertApi } from '../../api'
import type { Product, ConversionRecord } from '../../api/types'
import { useAuth } from '../../context/AuthContext'

const { Title, Text } = Typography

export default function ConvertStokPage() {
  const { user } = useAuth()
  const convertApi = user?.role === 'admin_store' ? storeConvertApi : kasirConvertApi
  const [products, setProducts] = useState<Product[]>([])
  const [conversions, setConversions] = useState<ConversionRecord[]>([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [loadingHist, setLoadingHist] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [qty, setQty] = useState<number | null>(null)
  const [api, ctx] = notification.useNotification()

  const loadProducts = useCallback(() => {
    setLoadingProd(true)
    kasirProductApi.list({ limit: 200 }).then(res => setProducts(res.data)).catch(() => {}).finally(() => setLoadingProd(false))
  }, [])

  const loadHistory = useCallback(() => {
    setLoadingHist(true)
    convertApi.list({ limit: 20 }).then(res => setConversions(res.data)).catch(() => {}).finally(() => setLoadingHist(false))
  }, [])

  useEffect(() => { loadProducts(); loadHistory() }, [loadProducts, loadHistory])

  const convertibleProducts = products.filter(p => p.conversionUnit && p.conversionRate && p.conversionRate > 0)
  const selectedProduct = selectedId ? products.find(p => p.id === selectedId) : null
  const maxQty = selectedProduct ? Math.floor(selectedProduct.stock / (selectedProduct.conversionRate ?? 1)) : 0
  const resultQty = qty && selectedProduct ? qty * (selectedProduct.conversionRate ?? 1) : 0

  const handleConvert = () => {
    if (!selectedProduct || !qty) return
    if (qty > maxQty) { api.error({ message: `Stok tidak cukup. Maks konversi: ${maxQty} ${selectedProduct.conversionUnit}` }); return }
    Modal.confirm({
      title: 'Konfirmasi Konversi',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: (
        <Space direction="vertical" size={4}>
          <Text>Produk: <strong>{selectedProduct.name}</strong></Text>
          <Space>
            <Tag color="orange">{qty} {selectedProduct.conversionUnit}</Tag>
            <ArrowRightOutlined />
            <Tag color="green">+{resultQty} {selectedProduct.unit}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>Stok setelah konversi: {selectedProduct.stock + resultQty} {selectedProduct.unit}</Text>
        </Space>
      ),
      okText: 'Ya, Konversi',
      cancelText: 'Batal',
      okButtonProps: { style: { background: '#d97706', borderColor: '#d97706' } },
      onOk: async () => {
        try {
          const result = await convertApi.create(selectedProduct.id, qty)
          api.success({
            message: 'Konversi Berhasil',
            description: (
              <Space direction="vertical" size={2}>
                <span>Kode: <strong>{result.movementCode}</strong></span>
                <span>{qty} {result.fromUnit} → +{result.toQty} {result.toUnit}</span>
                <span>Stok baru: <strong>{result.stockAfter} {result.toUnit}</strong></span>
              </Space>
            ),
            icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
            duration: 6,
          })
          setSelectedId(null); setQty(null)
          loadProducts(); loadHistory()
        } catch (e: any) {
          api.error({ message: e?.response?.data?.message ?? 'Konversi gagal' })
        }
      },
    })
  }

  const histColumns = [
    { title: 'Kode', dataIndex: 'movementCode', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Tanggal', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString('id') },
    { title: 'Produk', dataIndex: 'productName', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'Dari', key: 'from',
      render: (_: unknown, r: ConversionRecord) => <Tag color="orange">{r.fromQty} {r.fromUnit}</Tag>,
    },
    {
      title: 'Jadi', key: 'to',
      render: (_: unknown, r: ConversionRecord) => <Tag color="green">+{r.toQty} {r.toUnit}</Tag>,
    },
    {
      title: 'Stok Sesudah', key: 'after',
      render: (_: unknown, r: ConversionRecord) => <Text strong style={{ color: '#059669' }}>{r.stockAfter} {r.toUnit}</Text>,
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%', padding: 24 }}>
      {ctx}
      <div>
        <Title level={3} style={{ margin: 0 }}>Convert Stok</Title>
        <Text type="secondary">Ubah satuan beli besar ke satuan jual eceran</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<Space><RetweetOutlined />Form Konversi</Space>} bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Pilih Produk</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Cari produk dengan konversi..."
                  showSearch
                  optionFilterProp="label"
                  value={selectedId}
                  onChange={v => { setSelectedId(v); setQty(null) }}
                  options={convertibleProducts.map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.stock} ${p.unit})`,
                  }))}
                />
              </div>

              {selectedProduct && (
                <>
                  <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong>{selectedProduct.name}</Text>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Stok saat ini</Text>
                        <Badge count={`${selectedProduct.stock} ${selectedProduct.unit}`} color="#d97706" />
                      </Space>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Konversi</Text>
                        <Text>1 {selectedProduct.conversionUnit} = {selectedProduct.conversionRate} {selectedProduct.unit}</Text>
                      </Space>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Maks konversi</Text>
                        <Text strong style={{ color: '#059669' }}>{maxQty} {selectedProduct.conversionUnit}</Text>
                      </Space>
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Jumlah {selectedProduct.conversionUnit} yang dikonversi
                    </Text>
                    <InputNumber
                      style={{ width: '100%', marginTop: 4 }}
                      min={1}
                      max={maxQty}
                      value={qty}
                      onChange={setQty}
                      placeholder={`1 - ${maxQty}`}
                      addonAfter={selectedProduct.conversionUnit}
                    />
                  </div>

                  {qty && qty > 0 && (
                    <Alert
                      type="info"
                      showIcon
                      message={
                        <Space>
                          <Tag color="orange">{qty} {selectedProduct.conversionUnit}</Tag>
                          <ArrowRightOutlined />
                          <Tag color="green">+{resultQty} {selectedProduct.unit}</Tag>
                          <Text>Stok baru: <strong>{selectedProduct.stock + resultQty} {selectedProduct.unit}</strong></Text>
                        </Space>
                      }
                    />
                  )}

                  <Button type="primary" block icon={<RetweetOutlined />}
                    disabled={!qty || qty < 1 || qty > maxQty}
                    onClick={handleConvert}
                    style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 600 }}>
                    Konversi Sekarang
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><HistoryOutlined />Riwayat Konversi</Space>} bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Spin spinning={loadingHist}>
              <Table columns={histColumns} dataSource={conversions.map(c => ({ ...c, key: c.id }))} pagination={{ pageSize: 10 }} size="small"
                locale={{ emptyText: 'Belum ada riwayat konversi' }} />
            </Spin>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
