import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Typography, Space, Input, Tag, Statistic, Row, Col, Select, Spin } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, RiseOutlined } from '@ant-design/icons'
import { storeTransactionApi } from '../../api'
import type { Transaction } from '../../api/types'

const { Title, Text } = Typography

export default function StoreTransaksiPage() {
  const [txList, setTxList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    storeTransactionApi.list({
      page,
      limit: 20,
      search: search || undefined,
      date: dateFilter || undefined,
    }).then(res => {
      setTxList(res.data)
      setTotal(res.meta?.total ?? 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page, search, dateFilter])

  useEffect(() => { load() }, [load])

  const totalOmzet = txList.reduce((s, t) => s + t.totalAmount, 0)
  const hasFilter = dateFilter !== '' || search !== ''

  const expandedRowRender = (record: Transaction) => {
    const cols = [
      { title: 'Produk', dataIndex: 'productName', key: 'productName' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'center' as const },
      { title: 'Harga', dataIndex: 'price', key: 'price', render: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
      { title: 'Subtotal', dataIndex: 'subtotal', key: 'sub', render: (v: number) => <Text strong>Rp {v.toLocaleString('id-ID')}</Text> },
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
    { title: 'Kode Transaksi', dataIndex: 'transactionCode', render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Waktu', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) + ' WIB' },
    { title: 'Kasir', dataIndex: 'cashierName' },
    { title: 'Item', key: 'items', render: (_: unknown, r: Transaction) => `${(r.items || []).length} item` },
    { title: 'Total', dataIndex: 'totalAmount', render: (v: number) => <Text strong style={{ color: '#4f46e5' }}>Rp {v.toLocaleString('id-ID')}</Text> },
    { title: 'Bayar', dataIndex: 'paidAmount', render: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
    { title: 'Kembalian', dataIndex: 'changeAmount', render: (v: number) => <Text style={{ color: '#059669' }}>Rp {v.toLocaleString('id-ID')}</Text> },
    { title: 'Metode', dataIndex: 'paymentMethod', render: (v: string) => <Tag color="blue">{v}</Tag> },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Riwayat Transaksi</Title>
        <Text type="secondary">Store ini saja</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic title="Total Transaksi" value={total} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#4f46e5', fontSize: 24, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic title="Total Omzet" value={`Rp ${totalOmzet.toLocaleString('id-ID')}`} prefix={<RiseOutlined />} valueStyle={{ color: '#059669', fontSize: 20, fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Cari kode transaksi..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 220 }} />
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
            style={{ padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, height: 32, cursor: 'pointer' }} />
          {hasFilter && (
            <a style={{ color: '#dc2626', cursor: 'pointer', fontSize: 13 }} onClick={() => { setSearch(''); setDateFilter(''); setPage(1) }}>
              Reset Filter
            </a>
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
