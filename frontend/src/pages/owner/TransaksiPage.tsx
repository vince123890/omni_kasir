import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Typography, Space, Input, Tag, Button, Row, Col, Select, Spin } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, RiseOutlined, ShopOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { ownerStoreApi, ownerTransactionApi } from '../../api'
import type { Store, Transaction, TransactionItem } from '../../api/types'

const { Title, Text } = Typography

export default function TransaksiPage() {
  const [searchParams] = useSearchParams()
  const [txList, setTxList] = useState<Transaction[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<number | 'all'>(() => {
    const p = searchParams.get('storeId')
    return p ? parseInt(p) : 'all'
  })
  const [dateFilter, setDateFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const p = searchParams.get('storeId')
    if (p) setStoreFilter(parseInt(p))
  }, [searchParams])

  const load = useCallback(() => {
    setLoading(true)
    ownerTransactionApi.list({
      page,
      limit: 20,
      search: search || undefined,
      storeId: storeFilter !== 'all' ? storeFilter : undefined,
      date: dateFilter || undefined,
    }).then(res => {
      setTxList(res.data)
      setTotal(res.meta?.total ?? 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page, search, storeFilter, dateFilter])

  useEffect(() => {
    load()
    ownerStoreApi.list().then(res => setStores(res.stores)).catch(() => {})
  }, [load])

  const totalOmzet = txList.reduce((s, t) => s + t.totalAmount, 0)
  const hasActiveFilter = storeFilter !== 'all' || dateFilter !== '' || search !== ''

  const expandedRowRender = (record: Transaction) => {
    const cols = [
      { title: 'Produk', dataIndex: 'productName', key: 'productName' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'center' as const },
      { title: 'Harga', dataIndex: 'price', key: 'price', render: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
      { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => <Text strong>Rp {v.toLocaleString('id-ID')}</Text> },
    ]
    return (
      <div style={{ padding: '8px 48px' }}>
        <Table columns={cols} dataSource={(record.items || []).map((d, i) => ({ ...d, key: i }))} pagination={false} size="small" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary">Bayar: <Text strong>Rp {record.paidAmount.toLocaleString('id-ID')}</Text></Text>
          <Text type="secondary">Kembalian: <Text strong style={{ color: '#059669' }}>Rp {record.changeAmount.toLocaleString('id-ID')}</Text></Text>
        </div>
      </div>
    )
  }

  const columns = [
    { title: 'Kode Transaksi', dataIndex: 'transactionCode', key: 'code', render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Waktu', dataIndex: 'createdAt', key: 'time', render: (v: string) => new Date(v).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) + ' WIB' },
    { title: 'Store', dataIndex: 'storeName', key: 'store', render: (v: string) => <Space size={4}><ShopOutlined style={{ color: '#bfbfbf' }} /><Text>{v || '—'}</Text></Space> },
    { title: 'Kasir', dataIndex: 'cashierName', key: 'cashier' },
    { title: 'Item', key: 'items', render: (_: unknown, r: Transaction) => `${(r.items || []).length} item` },
    { title: 'Total', dataIndex: 'totalAmount', key: 'total', render: (v: number) => <Text strong style={{ color: '#4f46e5' }}>Rp {v.toLocaleString('id-ID')}</Text> },
    { title: 'Metode', dataIndex: 'paymentMethod', key: 'method', render: (v: string) => <Tag color="blue">{v}</Tag> },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Riwayat Transaksi</Title>
        <Text type="secondary">Semua store</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={[24, 0]} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <Col xs={12} sm={8}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13 }}><ShoppingCartOutlined style={{ marginRight: 6, color: '#4f46e5' }} />Total Transaksi</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: '#4f46e5' }}>{total} <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>trx</Text></Text>
            </Space>
          </Col>
          <Col xs={12} sm={8}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13 }}><RiseOutlined style={{ marginRight: 6, color: '#059669' }} />Total Omzet</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>Rp {totalOmzet.toLocaleString('id-ID')}</Text>
            </Space>
          </Col>
        </Row>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
            Breakdown per Store{hasActiveFilter && <Text type="secondary" style={{ fontSize: 11 }}> (sesuai filter aktif)</Text>}
          </Text>
          <Row gutter={[16, 12]}>
            {stores.map(s => {
              const sTx = txList.filter(t => t.storeName === s.name || (t as any).storeId === s.id)
              const sRevenue = sTx.reduce((sum, t) => sum + t.totalAmount, 0)
              const pct = txList.length > 0 ? Math.round((sTx.length / txList.length) * 100) : 0
              return (
                <Col xs={24} sm={8} key={s.id}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #4f46e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text strong style={{ fontSize: 13 }}>{s.name}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{sTx.length}</Text>
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>trx</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Rp {sRevenue.toLocaleString('id-ID')}</Text>
                      </div>
                      <Tag color={pct > 50 ? 'blue' : 'default'} style={{ marginTop: 2 }}>{pct}%</Tag>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Cari kode transaksi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 220 }} />
          <Select value={storeFilter} onChange={v => { setStoreFilter(v); setPage(1) }} style={{ width: 200 }}
            options={[{ value: 'all', label: 'Semua Store' }, ...stores.map(s => ({ value: s.id, label: s.name }))]} />
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
            style={{ padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, height: 32, cursor: 'pointer' }} />
          {hasActiveFilter && (
            <Button type="link" style={{ padding: 0, color: '#dc2626' }} onClick={() => { setStoreFilter('all'); setDateFilter(''); setSearch(''); setPage(1) }}>
              Reset Filter
            </Button>
          )}
        </Space>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={txList.map(t => ({ ...t, key: t.id }))}
            expandable={{ expandedRowRender }}
            pagination={{ current: page, pageSize: 20, total, onChange: setPage, showSizeChanger: false }}
            size="middle"
            locale={{ emptyText: 'Tidak ada transaksi ditemukan' }}
          />
        </Spin>
      </Card>
    </Space>
  )
}
