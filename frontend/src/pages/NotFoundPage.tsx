import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Result
        status="404"
        title="404"
        subTitle="Halaman yang Anda cari tidak ditemukan."
        extra={
          <Button type="primary" onClick={() => navigate(-1)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
            Kembali
          </Button>
        }
      />
    </div>
  )
}
