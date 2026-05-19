import { useState } from 'react'
import { Table, Card, Button, Typography, Space, Tag, Avatar, Modal, Form, Input, notification, Popconfirm } from 'antd'
import { PlusOutlined, SafetyOutlined, CheckCircleOutlined, StopOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface AdminUser {
  key: number
  id: number
  name: string
  email: string
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

const initialAdmins: AdminUser[] = [
  {
    key: 1, id: 1,
    name: 'Super Admin',
    email: 'admin@omnikasir.com',
    isActive: true,
    createdAt: '2025-01-01',
    lastLogin: '2026-05-19 07:00',
  },
]

export default function AdminUserPage() {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  const handleAdd = (values: { name: string; email: string; password: string }) => {
    const emailExists = admins.some(a => a.email.toLowerCase() === values.email.toLowerCase())
    if (emailExists) {
      form.setFields([{ name: 'email', errors: ['Email sudah digunakan'] }])
      return
    }
    const newAdmin: AdminUser = {
      key: Date.now(),
      id: Date.now(),
      name: values.name,
      email: values.email,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: null,
    }
    setAdmins(prev => [...prev, newAdmin])
    form.resetFields()
    setAddOpen(false)
    api.success({
      message: 'Admin berhasil ditambahkan',
      description: newAdmin.name,
      icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
    })
  }

  const toggleStatus = (admin: AdminUser) => {
    if (admin.id === 1) {
      api.warning({ message: 'Super Admin utama tidak bisa dinonaktifkan' })
      return
    }
    setAdmins(prev => prev.map(a =>
      a.key === admin.key ? { ...a, isActive: !a.isActive } : a
    ))
    api.success({
      message: `Admin berhasil ${admin.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
      description: admin.name,
    })
  }

  const columns = [
    {
      title: 'Admin',
      key: 'admin',
      render: (_: unknown, r: AdminUser) => (
        <Space>
          <Avatar style={{ background: '#4f46e5', fontSize: 14 }}>
            {r.name.charAt(0).toUpperCase()}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Space size={6}>
              <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
              {r.id === 1 && (
                <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>Utama</Tag>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? 'Aktif' : 'Nonaktif'}</Tag>
      ),
    },
    { title: 'Bergabung', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    {
      title: 'Login Terakhir',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 160,
      render: (v: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{v ?? '—'}</Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_: unknown, r: AdminUser) => (
        r.id === 1 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ) : (
          <Popconfirm
            title={r.isActive ? 'Nonaktifkan admin ini?' : 'Aktifkan kembali?'}
            description={r.name}
            onConfirm={() => toggleStatus(r)}
            okText="Ya"
            cancelText="Batal"
            okButtonProps={{ danger: r.isActive }}
          >
            <Button
              size="small"
              type="link"
              danger={r.isActive}
              icon={r.isActive ? <StopOutlined /> : <PlayCircleOutlined />}
              style={!r.isActive ? { color: '#059669' } : {}}
            >
              {r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          </Popconfirm>
        )
      ),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Kelola Admin</Title>
          <Text type="secondary">{admins.length} akun admin platform · role tidak bisa diubah</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddOpen(true)}
          style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
        >
          Tambah Admin
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eef2ff', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <SafetyOutlined style={{ color: '#4f46e5', marginTop: 2 }} />
          <div>
            <Text strong style={{ fontSize: 13, color: '#4f46e5' }}>Tentang Akun Admin Platform</Text><br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Role admin bersifat tetap dan tidak bisa diubah. Admin Platform memiliki akses penuh ke semua tenant, subscription, dan konfigurasi platform. Gunakan dengan bijak.
            </Text>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={admins}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title="Tambah Admin Platform"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields() }}
        onOk={() => form.validateFields().then(handleAdd)}
        okText="Tambah Admin"
        cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }}
        width={440}
      >
        <div style={{ padding: '8px 0 4px', marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
          Admin baru akan mendapat akses penuh ke seluruh platform. Role otomatis = Admin.
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama"
            name="name"
            rules={[{ required: true, message: 'Nama wajib diisi' }, { min: 2 }]}
          >
            <Input placeholder="Nama lengkap admin" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true }, { type: 'email', message: 'Format email tidak valid' }]}
          >
            <Input placeholder="admin@omnikasir.com" />
          </Form.Item>
          <Form.Item
            label="Password Awal"
            name="password"
            rules={[{ required: true }, { min: 8, message: 'Min 8 karakter' }]}
          >
            <Input.Password placeholder="Min. 8 karakter" />
          </Form.Item>
        </Form>
        <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
          ⚠️ Sampaikan email dan password awal ke admin baru secara aman. Minta mereka ganti password setelah login pertama.
        </div>
      </Modal>

    </Space>
  )
}
