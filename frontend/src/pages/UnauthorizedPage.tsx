import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Result
        status="403"
        title="403"
        subTitle="Anda tidak memiliki akses ke halaman ini."
        extra={
          <Button type="primary" onClick={() => navigate('/app/login')} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
            Kembali ke Login
          </Button>
        }
      />
    </div>
  )
}
