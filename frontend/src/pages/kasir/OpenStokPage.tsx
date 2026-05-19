import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Button, Typography, Space, Tag, InputNumber, notification, Modal, Tabs, Badge, Select, Empty, Spin } from 'antd'
import { SaveOutlined, CheckCircleOutlined, ExclamationCircleOutlined, HistoryOutlined, InboxOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { kasirProductApi, kasirOpnameApi, storeOpnameApi } from '../../api'
import type { Product, OpnameSummary, OpnameDetail, OpnameItemDetail } from '../../api/types'
import { useAuth } from '../../context/AuthContext'

const { Title, Text } = Typography

const REASON_OPTIONS = [
  { value: 'Barang rusak / tidak layak jual',    label: 'Barang rusak / tidak layak jual' },
  { value: 'Kehilangan / dicuri',                label: 'Kehilangan / dicuri' },
  { value: 'Kesalahan input stok sebelumnya',    label: 'Kesalahan input stok sebelumnya' },
  { value: 'Selisih penghitungan manual',        label: 'Selisih penghitungan manual' },
  { value: 'Stok bonus dari supplier',           label: 'Stok bonus dari supplier' },
  { value: 'Pengembalian barang dari pelanggan', label: 'Pengembalian barang dari pelanggan' },
  { value: 'Lainnya',                            label: 'Lainnya' },
]

interface OpnameRow {
  key: number
  productId: number
  name: string
  unit: string
  qtySystem: number
  qtyActual: number | null
  reason: string
}

export default function OpenStokPage() {
  const { user } = useAuth()
  const opnameApi = user?.role === 'admin_store' ? storeOpnameApi : kasirOpnameApi
  const [products, setProducts] = useState<Product[]>([])
  const [opnameRows, setOpnameRows] = useState<OpnameRow[]>([])
  const [history, setHistory] = useState<OpnameSummary[]>([])
  const [histTotal, setHistTotal] = useState(0)
  const [loadingProd, setLoadingProd] = useState(false)
  const [loadingHist, setLoadingHist] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<OpnameDetail | null>(null)
  const [histPage, setHistPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [api, ctx] = notification.useNotification()

  const loadProducts = useCallback(() => {
    setLoadingProd(true)
    kasirProductApi.list({ limit: 500 }).then(res => setProducts(res.data)).catch(() => {}).finally(() => setLoadingProd(false))
  }, [])

  const loadHistory = useCallback(() => {
    setLoadingHist(true)
    opnameApi.list({ page: histPage, limit: 10 }).then(res => {
      setHistory(res.data)
      setHistTotal(res.meta?.total ?? 0)
    }).catch(() => {}).finally(() => setLoadingHist(false))
  }, [histPage])

  useEffect(() => { loadProducts() }, [loadProducts])
  useEffect(() => { loadHistory() }, [loadHistory])

  const addProduct = (productId: number) => {
    if (opnameRows.find(r => r.productId === productId)) { api.warning({ message: 'Produk sudah ditambahkan' }); return }
    const p = products.find(p => p.id === productId)
    if (!p) return
    setOpnameRows(prev => [...prev, { key: Date.now(), productId: p.id, name: p.name, unit: p.unit, qtySystem: p.stock, qtyActual: null, reason: '' }])
  }

  const updateRow = (key: number, field: 'qtyActual' | 'reason', value: number | string | null) => {
    setOpnameRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r))
  }

  const removeRow = (key: number) => setOpnameRows(prev => prev.filter(r => r.key !== key))

  const handleSave = () => {
    const incomplete = opnameRows.find(r => r.qtyActual === null)
    if (incomplete) { api.warning({ message: `Isi jumlah aktual untuk semua produk`, description: incomplete.name }); return }
    const needReason = opnameRows.find(r => r.qtyActual !== r.qtySystem && !r.reason)
    if (needReason) { api.warning({ message: `Alasan wajib diisi jika ada selisih`, description: needReason.name }); return }

    Modal.confirm({
      title: 'Simpan Hasil Open Stok?',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: (
        <Space direction="vertical" size={4}>
          <Text>Total produk: <strong>{opnameRows.length}</strong></Text>
          <Text>Selisih: <strong style={{ color: '#dc2626' }}>{opnameRows.filter(r => r.qtyActual !== r.qtySystem).length} produk</strong></Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Stok sistem akan disesuaikan dengan jumlah aktual.</Text>
        </Space>
      ),
      okText: 'Ya, Simpan',
      cancelText: 'Batal',
      okButtonProps: { style: { background: '#059669', borderColor: '#059669' } },
      onOk: async () => {
        try {
          const result = await opnameApi.create(
            opnameRows.map(r => ({ productId: r.productId, qtyActual: r.qtyActual!, reason: r.reason || undefined }))
          )
          api.success({
            message: 'Open Stok Berhasil Disimpan',
            description: (
              <Space direction="vertical" size={2}>
                <span>Kode: <strong>{result.opnameCode}</strong></span>
                <span>{result.filledCount} produk diisi · {result.adjustedCount} disesuaikan</span>
              </Space>
            ),
            icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
            duration: 6,
          })
          setOpnameRows([])
          loadProducts()
          loadHistory()
        } catch (e: any) {
          api.error({ message: e?.response?.data?.message ?? 'Gagal menyimpan opname' })
        }
      },
    })
  }

  const openDetail = async (id: number) => {
    try {
      const d = await opnameApi.detail(id)
      setDetail(d); setDetailOpen(true)
    } catch { api.error({ message: 'Gagal memuat detail opname' }) }
  }

  const availableToAdd = products.filter(p => !opnameRows.find(r => r.productId === p.id) &&
    p.name.toLowerCase().includes(searchText.toLowerCase()))

  const formColumns = [
    { title: 'Produk', key: 'produk', render: (_: unknown, r: OpnameRow) => (
      <Space direction="vertical" size={0}>
        <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>Sistem: {r.qtySystem} {r.unit}</Text>
      </Space>
    )},
    {
      title: 'Jumlah Aktual', key: 'actual',
      render: (_: unknown, r: OpnameRow) => (
        <InputNumber min={0} value={r.qtyActual ?? undefined} onChange={v => updateRow(r.key, 'qtyActual', v)}
          addonAfter={r.unit} style={{ width: 130 }} placeholder="0" />
      ),
    },
    {
      title: 'Selisih', key: 'diff',
      render: (_: unknown, r: OpnameRow) => {
        if (r.qtyActual === null) return <Tag>—</Tag>
        const diff = r.qtyActual - r.qtySystem
        if (diff === 0) return <Tag color="success">Sesuai</Tag>
        return <Tag color={diff > 0 ? 'blue' : 'error'}>{diff > 0 ? '+' : ''}{diff} {r.unit}</Tag>
      },
    },
    {
      title: 'Alasan Selisih', key: 'reason',
      render: (_: unknown, r: OpnameRow) => {
        const diff = r.qtyActual !== null ? r.qtyActual - r.qtySystem : 0
        if (r.qtyActual === null || diff === 0) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        return (
          <Select placeholder="Wajib diisi" style={{ width: 220 }} value={r.reason || undefined}
            onChange={v => updateRow(r.key, 'reason', v)} options={REASON_OPTIONS}
            status={!r.reason ? 'error' : undefined} />
        )
      },
    },
    {
      title: '', key: 'del',
      render: (_: unknown, r: OpnameRow) => (
        <Button type="text" icon={<DeleteOutlined />} danger onClick={() => removeRow(r.key)} />
      ),
    },
  ]

  const histColumns = [
    { title: 'Kode', dataIndex: 'opnameCode', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Tanggal', dataIndex: 'opnameDate', render: (v: string) => new Date(v).toLocaleDateString('id') },
    { title: 'Oleh', dataIndex: 'createdByName' },
    { title: 'Diisi', key: 'filled', render: (_: unknown, r: OpnameSummary) => `${r.filledCount} produk` },
    { title: 'Selisih', key: 'diff', render: (_: unknown, r: OpnameSummary) => r.selisihCount > 0 ? <Badge count={r.selisihCount} color="orange" /> : <Tag color="success">Sesuai</Tag> },
    { title: '', key: 'action', render: (_: unknown, r: OpnameSummary) => <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => openDetail(r.id)}>Detail</Button> },
  ]

  const detailColumns = [
    { title: 'Produk', dataIndex: 'productName', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Satuan', dataIndex: 'unit' },
    { title: 'Sistem', dataIndex: 'qtySystem' },
    { title: 'Aktual', dataIndex: 'qtyActual' },
    {
      title: 'Selisih', key: 'diff',
      render: (_: unknown, r: OpnameItemDetail) => {
        const d = r.difference
        if (d === 0) return <Tag color="success">Sesuai</Tag>
        return <Tag color={d > 0 ? 'blue' : 'error'}>{d > 0 ? '+' : ''}{d} {r.unit}</Tag>
      },
    },
    { title: 'Alasan', dataIndex: 'reason', render: (v: string | null) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : '—' },
  ]

  const tabItems = [
    {
      key: 'form',
      label: <span><InboxOutlined />Form Open Stok {opnameRows.length > 0 && <Badge count={opnameRows.length} color="#4f46e5" />}</span>,
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" style={{ background: '#f8fafc', borderRadius: 8 }}>
            <Space style={{ flexWrap: 'wrap' }}>
              <Select
                showSearch
                placeholder={<Space><SearchOutlined />Cari dan tambah produk...</Space>}
                style={{ width: 300 }}
                value={undefined}
                filterOption={false}
                onSearch={setSearchText}
                onChange={addProduct}
                loading={loadingProd}
                options={availableToAdd.slice(0, 20).map(p => ({ value: p.id, label: `${p.name} (stok: ${p.stock} ${p.unit})` }))}
                notFoundContent="Produk tidak ditemukan"
              >
              </Select>
              {opnameRows.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>{opnameRows.length} produk ditambahkan</Text>
              )}
            </Space>
          </Card>

          {opnameRows.length === 0
            ? <Empty description={<Text type="secondary">Cari dan tambah produk yang ingin di-opname<br /><Text style={{ fontSize: 12 }}>(tidak perlu semua produk, cukup yang ingin diperiksa)</Text></Text>} icon={<PlusOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />} style={{ padding: 40 }} />
            : (
              <>
                <Table columns={formColumns} dataSource={opnameRows} pagination={false} size="middle" scroll={{ x: true }} />
                <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                  <Button onClick={() => setOpnameRows([])} disabled={opnameRows.length === 0}>Reset Form</Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}
                    disabled={opnameRows.length === 0}
                    style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}>
                    Simpan Open Stok ({opnameRows.length} produk)
                  </Button>
                </Space>
              </>
            )}
        </Space>
      ),
    },
    {
      key: 'history',
      label: <span><HistoryOutlined />Riwayat Opname</span>,
      children: (
        <Spin spinning={loadingHist}>
          <Table columns={histColumns} dataSource={history.map(h => ({ ...h, key: h.id }))}
            pagination={{ current: histPage, pageSize: 10, total: histTotal, onChange: setHistPage, showSizeChanger: false }}
            size="middle" locale={{ emptyText: 'Belum ada riwayat opname' }} />
        </Spin>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%', padding: 24 }}>
      {ctx}
      <div>
        <Title level={3} style={{ margin: 0 }}>Open Stok</Title>
        <Text type="secondary">Hitung fisik stok dan sesuaikan dengan sistem</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Tabs items={tabItems} />
      </Card>

      <Modal title={detail ? `Detail Opname — ${detail.opnameCode}` : 'Detail'} open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetail(null) }} footer={null} width={700}>
        {detail && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Text type="secondary">Tanggal: <strong>{new Date(detail.opnameDate).toLocaleDateString('id')}</strong></Text>
              <Text type="secondary">Oleh: <strong>{detail.createdByName}</strong></Text>
              <Tag color="success">Selesai</Tag>
            </Space>
            <Space>
              <Tag>Total: {detail.summary.totalFilled} produk</Tag>
              <Tag color="success">Sesuai: {detail.summary.sesuai}</Tag>
              <Tag color="orange">Selisih: {detail.summary.selisih}</Tag>
            </Space>
            <Table columns={detailColumns} dataSource={detail.items.map((i, idx) => ({ ...i, key: idx }))}
              pagination={false} size="small" />
          </Space>
        )}
      </Modal>
    </Space>
  )
}
