import { Modal, Form, Input, notification } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

interface Props {
  open: boolean
  onClose: () => void
  userName: string
}

export default function ChangePasswordModal({ open, onClose, userName }: Props) {
  const [form] = Form.useForm()
  const [api, ctx] = notification.useNotification()

  const handleOk = () => {
    form.validateFields().then(() => {
      form.resetFields()
      onClose()
      api.success({
        message: 'Password berhasil diubah',
        description: `Password ${userName} telah diperbarui.`,
        icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
      })
    })
  }

  return (
    <>
      {ctx}
      <Modal
        title="Ganti Password"
        open={open}
        onCancel={() => { form.resetFields(); onClose() }}
        onOk={handleOk}
        okText="Simpan Password"
        cancelText="Batal"
        okButtonProps={{ style: { background: '#4f46e5', borderColor: '#4f46e5' } }}
        width={400}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Password Lama" name="oldPassword" rules={[{ required: true, message: 'Masukkan password lama' }]}>
            <Input.Password placeholder="Password saat ini" />
          </Form.Item>
          <Form.Item label="Password Baru" name="newPassword"
            rules={[{ required: true, message: 'Masukkan password baru' }, { min: 8, message: 'Min 8 karakter' }]}>
            <Input.Password placeholder="Min. 8 karakter" />
          </Form.Item>
          <Form.Item label="Konfirmasi Password Baru" name="confirm" dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Konfirmasi password baru' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue('newPassword') === value
                    ? Promise.resolve()
                    : Promise.reject('Password tidak cocok')
                },
              }),
            ]}>
            <Input.Password placeholder="Ulangi password baru" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
