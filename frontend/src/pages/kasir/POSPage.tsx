import { useState, useEffect } from 'react'
import { Input, Button, Typography, Space, Tag, Badge, InputNumber, Empty, notification, Card, Row, Col } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { kasirProductApi, kasirTransactionApi } from '../../api'
import type { Product } from '../../api/types'

const { Text, Title } = Typography

interface CartItem { id: number; name: string; price: number; qty: number; stock: number; unit: string }

const categoryColors: Record<string, string> = { Minuman: 'blue', Makanan: 'orange', Snack: 'purple' }

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paid, setPaid] = useState<number | null>(null)
  const [category, setCategory] = useState('Semua')
  const [loading, setLoading] = useState(false)
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    kasirProductApi.list({ limit: 500 }).then(res => setProducts(res.data)).catch(() => {})
  }, [])

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = products.filter(p =>
    (category === 'Semua' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  )

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const change = (paid ?? 0) - cartTotal

  const addToCart = (p: Product) => {
    if (p.stock <= 0) { api.warning({ message: 'Stok habis', description: p.name }); return }
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id)
      if (existing) {
        if (existing.qty >= p.stock) { api.warning({ message: 'Stok tidak cukup', description: `Maks: ${p.stock} ${p.unit}` }); return prev }
        return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { id: p.id, name: p.name, price: p.sellPrice, qty: 1, stock: p.stock, unit: p.unit }]
    })
  }

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) { removeFromCart(id); return }
    const item = cart.find(c => c.id === id)
    if (item && qty > item.stock) { api.warning({ message: `Maks stok: ${item.stock} ${item.unit}` }); return }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c))
  }

  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.id !== id))

  const handleCheckout = async () => {
    if (cart.length === 0) { api.warning({ message: 'Keranjang kosong' }); return }
    if (!paid || paid < cartTotal) { api.error({ message: 'Jumlah bayar tidak cukup' }); return }
    setLoading(true)
    try {
      const result = await kasirTransactionApi.create({
        items: cart.map(c => ({ productId: c.id, qty: c.qty })),
        paidAmount: paid,
      })
      api.success({
        message: 'Transaksi Berhasil',
        description: (
          <Space direction="vertical" size={2}>
            <span>Kode: <strong>{result.transactionCode}</strong></span>
            <span>Total: <strong>Rp {result.totalAmount.toLocaleString('id-ID')}</strong></span>
            <span>Kembalian: <strong style={{ color: '#059669' }}>Rp {result.changeAmount.toLocaleString('id-ID')}</strong></span>
          </Space>
        ),
        icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
        duration: 6,
      })
      setCart([])
      setPaid(null)
      // Reload products to reflect updated stock
      kasirProductApi.list({ limit: 500 }).then(res => setProducts(res.data)).catch(() => {})
    } catch (e: any) {
      api.error({ message: e?.response?.data?.message ?? 'Transaksi gagal' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {contextHolder}

      {/* Kiri: Produk */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, borderRight: '1px solid #f0f0f0' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input prefix={<SearchOutlined />} placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} allowClear />

          <Space size={6} style={{ flexWrap: 'wrap' }}>
            {categories.map(c => (
              <Button key={c} size="small" type={category === c ? 'primary' : 'default'}
                style={category === c ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </Space>

          {filtered.length === 0
            ? <Empty description="Produk tidak ditemukan" style={{ marginTop: 40 }} />
            : (
              <Row gutter={[8, 8]}>
                {filtered.map(p => (
                  <Col xs={12} sm={8} md={6} lg={6} xl={4} key={p.id}>
                    <Card
                      hoverable={p.stock > 0}
                      size="small"
                      style={{ borderRadius: 10, opacity: p.stock === 0 ? 0.5 : 1, cursor: p.stock === 0 ? 'not-allowed' : 'pointer', border: '1px solid #f0f0f0' }}
                      onClick={() => addToCart(p)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Tag color={categoryColors[p.category] || 'default'} style={{ fontSize: 10, margin: 0, width: 'fit-content' }}>{p.category}</Tag>
                        <Text strong style={{ fontSize: 12, lineHeight: '1.3' }}>{p.name}</Text>
                        <Text style={{ color: '#4f46e5', fontWeight: 700, fontSize: 13 }}>Rp {p.sellPrice.toLocaleString('id-ID')}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{p.stock} {p.unit} tersisa</Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
        </Space>
      </div>

      {/* Kanan: Keranjang */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <ShoppingCartOutlined style={{ color: '#4f46e5' }} />
            <Title level={5} style={{ margin: 0 }}>Keranjang</Title>
            {cart.length > 0 && <Badge count={cart.reduce((s, c) => s + c.qty, 0)} color="#4f46e5" />}
          </Space>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {cart.length === 0
            ? <Empty description="Keranjang kosong" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            : cart.map(item => (
              <div key={item.id} style={{ padding: '8px 16px', borderBottom: '1px solid #fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>{item.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Rp {item.price.toLocaleString('id-ID')} / {item.unit}</Text>
                  </div>
                  <Button type="text" icon={<DeleteOutlined />} size="small" danger onClick={() => removeFromCart(item.id)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Space size={4}>
                    <Button size="small" icon={<MinusOutlined />} onClick={() => updateQty(item.id, item.qty - 1)} />
                    <InputNumber size="small" min={1} max={item.stock} value={item.qty} onChange={v => v && updateQty(item.id, v)} style={{ width: 50 }} />
                    <Button size="small" icon={<PlusOutlined />} onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} />
                  </Space>
                  <Text strong style={{ color: '#4f46e5' }}>Rp {(item.price * item.qty).toLocaleString('id-ID')}</Text>
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary">Total</Text>
            <Text strong style={{ fontSize: 18, color: '#4f46e5' }}>Rp {cartTotal.toLocaleString('id-ID')}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Jumlah Bayar (Rp)</Text>
            <InputNumber
              style={{ width: '100%', marginTop: 4 }}
              min={0}
              value={paid}
              onChange={v => setPaid(v)}
              placeholder="0"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={v => Number(v!.replace(/\./g, '')) as 0}
              size="large"
            />
          </div>
          {paid !== null && paid > 0 && (
            <div style={{ padding: '6px 12px', background: change >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, marginBottom: 12 }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Kembalian</Text>
                <Text strong style={{ color: change >= 0 ? '#059669' : '#dc2626', fontSize: 16 }}>
                  Rp {Math.abs(change).toLocaleString('id-ID')}
                </Text>
              </Space>
              {change < 0 && <Text type="danger" style={{ fontSize: 11 }}>Bayar kurang Rp {Math.abs(change).toLocaleString('id-ID')}</Text>}
            </div>
          )}
          <Button type="primary" block size="large" loading={loading}
            disabled={cart.length === 0 || !paid || paid < cartTotal}
            onClick={handleCheckout}
            style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}>
            Bayar
          </Button>
          <Button block size="small" style={{ marginTop: 8 }} onClick={() => { setCart([]); setPaid(null) }} disabled={cart.length === 0}>
            Kosongkan Keranjang
          </Button>
        </div>
      </div>
    </div>
  )
}
