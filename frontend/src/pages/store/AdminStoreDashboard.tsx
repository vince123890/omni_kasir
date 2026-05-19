import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, List, Progress, Button, Spin } from 'antd'
import { AppstoreOutlined, InboxOutlined, ShoppingCartOutlined, WarningOutlined, RiseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { productApi, storeTransactionApi } from '../../api'
import type { Product, Transaction } from '../../api/types'

const { Title, Text } = Typography

export default function AdminStoreDashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [todayTxs, setTodayTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      productApi.list({ limit: 200 }).then(res => setProducts(res.data)),
      storeTransactionApi.list({ date: today, limit: 50 }).then(res => setTodayTxs(res.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const todayRevenue = todayTxs.reduce((s, t) => s + t.totalAmount, 0)
  const lowStock = products.filter(p => p.stock <= p.minStock).slice(0, 5)

  const stats = [
    { title: 'Total Produk', value: products.length, icon: <AppstoreOutlined />, color: '#059669', bg: '#ecfdf5', onClick: () => navigate('/app/store/products') },
    { title: 'Transaksi Hari Ini', value: todayTxs.length, icon: <ShoppingCartOutlined />, color: '#d97706', bg: '#fffbeb', onClick: () => navigate('/app/store/transaksi') },
    { title: 'Omzet Hari Ini', value: todayRevenue > 0 ? `Rp ${(todayRevenue / 1000).toFixed(0)}rb` : 'Rp 0', icon: <RiseOutlined />, color: '#4f46e5', bg: '#eef2ff', onClick: () => navigate('/app/store/transaksi') },
    { title: 'Stok Menipis', value: lowStock.length, icon: <WarningOutlined />, color: '#dc2626', bg: '#fef2f2', onClick: () => navigate('/app/store/products?filter=low-stock') },
  ]

  const txColumns = [
    { title: 'Kode', dataIndex: 'transactionCode', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Waktu', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) },
    { title: 'Kasir', dataIndex: 'cashierName' },
    { title: 'Total', dataIndex: 'totalAmount', render: (v: number) => <Text strong style={{ color: '#4f46e5' }}>Rp {v.toLocaleString('id-ID')}</Text> },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Ringkasan operasional hari ini</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stats.map(s => (
            <Col xs={24} sm={12} xl={6} key={s.title}>
              <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }} onClick={s.onClick}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>
                    {typeof s.value === 'number'
                      ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                      : <div style={{ color: s.color, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                    }
                  </div>
                  <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 20 }}>{s.icon}</div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title={<Space><ShoppingCartOutlined />Transaksi Hari Ini</Space>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            extra={<Button type="link" onClick={() => navigate('/app/store/transaksi')} style={{ padding: 0, color: '#059669' }}>Lihat semua →</Button>}
          >
            {todayTxs.length === 0
              ? <Text type="secondary">Belum ada transaksi hari ini</Text>
              : <Table columns={txColumns} dataSource={todayTxs.map(t => ({ ...t, key: t.id }))} pagination={false} size="small" />
            }
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            title={<Space><WarningOutlined style={{ color: '#d97706' }} />Stok Menipis</Space>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            extra={<Button type="link" onClick={() => navigate('/app/store/products?filter=low-stock')} style={{ padding: 0, color: '#4f46e5' }}>Lihat Produk →</Button>}
          >
            {lowStock.length === 0
              ? <Text type="secondary">Semua stok aman 👍</Text>
              : <List dataSource={lowStock} renderItem={p => {
                const pct = Math.round((p.stock / p.minStock) * 100)
                const isCritical = p.stock <= Math.floor(p.minStock * 0.3)
                return (
                  <List.Item style={{ padding: '10px 0', cursor: 'pointer' }} onClick={() => navigate('/app/store/products?filter=low-stock')}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 13 }}>{p.name}</Text>
                        <Tag color={isCritical ? 'error' : 'warning'}>{p.stock} {p.unit}</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Min stok: {p.minStock} {p.unit}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{pct}% dari minimum</Text>
                      </div>
                      <Progress percent={Math.min(pct, 100)} size="small" status={isCritical ? 'exception' : 'active'} strokeColor={isCritical ? '#dc2626' : '#d97706'} />
                    </div>
                  </List.Item>
                )
              }} />
            }
          </Card>
        </Col>
      </Row>

      <Card title={<Space><InboxOutlined />Aksi Cepat</Space>} bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space wrap>
          <Button icon={<InboxOutlined />} onClick={() => navigate('/app/store/stok-masuk')}>Input Stok Masuk</Button>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/app/store/open-stok')}>Open Stok / Opname</Button>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/app/store/convert-stok')}>Convert Stok</Button>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/app/store/products')}>Kelola Produk</Button>
        </Space>
      </Card>
    </Space>
  )
}
