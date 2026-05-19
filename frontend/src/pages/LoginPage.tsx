import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import axios from 'axios'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'

const REDIRECT_MAP: Record<string, string> = {
  admin:       '/app/admin/dashboard',
  owner:       '/app/owner/dashboard',
  admin_store: '/app/store/dashboard',
  kasir:       '/app/kasir/pos',
}

const features = [
  { icon: '⚡', label: 'Transaksi real-time' },
  { icon: '📦', label: 'Stok otomatis terpantau' },
  { icon: '📊', label: 'Laporan semua toko' },
  { icon: '🔒', label: 'Isolasi data per bisnis' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()
  const { setUser, user } = useAuth()

  if (user) return <Navigate to={REDIRECT_MAP[user.role] || '/app/admin/dashboard'} replace />

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const data = await authApi.login(values.email, values.password)
      setUser(data.user)
      navigate(REDIRECT_MAP[data.user.role] || '/app/login')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Email atau password salah')
      } else {
        setError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Google Fonts — sama dengan landing page */}
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root { font-family: 'DM Sans', sans-serif; }

        /* ── left panel ── */
        .lp-left {
          flex: 1;
          background: #080a14;
          display: flex; flex-direction: column; justify-content: center;
          padding: 64px 60px;
          position: relative; overflow: hidden;
        }
        .lp-orb-1 {
          position: absolute; top: -120px; left: -80px;
          width: 480px; height: 480px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, transparent 68%);
        }
        .lp-orb-2 {
          position: absolute; bottom: -80px; right: -80px;
          width: 360px; height: 360px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(ellipse, rgba(129,140,248,0.1) 0%, transparent 68%);
        }
        .lp-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 500; color: rgba(165,180,252,0.7);
          text-decoration: none; margin-bottom: 48px;
          transition: color .2s;
          position: relative; z-index: 1;
        }
        .lp-back:hover { color: #a5b4fc; }
        .lp-logo {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 40px; position: relative; z-index: 1;
        }
        .lp-logo-mark {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #818cf8);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-logo-mark svg { width: 22px; height: 22px; color: #fff; }
        .lp-logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800; color: #eef0ff;
        }
        .lp-headline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 800; line-height: 1.1;
          color: #eef0ff; margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .lp-headline-grad {
          background: linear-gradient(95deg, #818cf8 0%, #4f46e5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-sub {
          font-size: 15px; color: #8b9ac8; line-height: 1.75;
          max-width: 380px; margin-bottom: 44px;
          position: relative; z-index: 1;
        }
        .lp-features {
          display: flex; flex-direction: column; gap: 14px;
          position: relative; z-index: 1;
        }
        .lp-feat-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(79,70,229,0.2);
          border-radius: 12px;
          font-size: 14px; color: #c7d0f0;
        }
        .lp-feat-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(79,70,229,0.16);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 40px;
          background: rgba(79,70,229,0.12); border: 1px solid rgba(79,70,229,0.28);
          color: #a5b4fc; padding: 6px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
          position: relative; z-index: 1;
        }
        .lp-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #818cf8; animation: lp-blink 2.2s infinite;
        }
        @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── right panel ── */
        .lp-right {
          width: 440px; flex-shrink: 0;
          background: #0d0f1e;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; justify-content: center;
          padding: 56px 48px;
        }
        .lp-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800; color: #eef0ff;
          margin-bottom: 6px;
        }
        .lp-form-sub {
          font-size: 14px; color: #8b9ac8; margin-bottom: 36px;
        }
        .lp-label {
          display: block;
          font-size: 13px; font-weight: 600; color: #c7d0f0;
          margin-bottom: 7px;
        }
        .lp-field-wrap { margin-bottom: 20px; }
        .lp-field-wrap .ant-form-item { margin-bottom: 0 !important; }
        .lp-field-wrap .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(79,70,229,0.3) !important;
          border-radius: 10px !important; height: 46px;
          color: #eef0ff !important;
        }
        .lp-field-wrap .ant-input-affix-wrapper:focus-within {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.18) !important;
        }
        .lp-field-wrap .ant-input-affix-wrapper input {
          background: transparent !important; color: #eef0ff !important;
        }
        .lp-field-wrap .ant-input-affix-wrapper input::placeholder { color: #4a5480 !important; }
        .lp-field-wrap .ant-form-item-explain-error { font-size: 12px; margin-top: 5px; }
        .lp-btn-submit {
          width: 100%; height: 48px !important; border-radius: 10px !important;
          background: #4f46e5 !important; border-color: #4f46e5 !important;
          font-size: 15px !important; font-weight: 700 !important;
          font-family: 'DM Sans', sans-serif !important;
          box-shadow: 0 0 24px rgba(79,70,229,0.3) !important;
          transition: all .2s !important;
        }
        .lp-btn-submit:hover { background: #4338ca !important; border-color: #4338ca !important; box-shadow: 0 0 36px rgba(79,70,229,0.45) !important; }
        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 28px 0 24px;
        }
        .lp-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .lp-divider-text { font-size: 12px; color: #4a5480; white-space: nowrap; }
        .lp-footer-note {
          font-size: 12px; color: #4a5480; text-align: center; margin-top: 32px;
          line-height: 1.6;
        }
        .lp-footer-note a { color: #6366f1; text-decoration: none; }
        .lp-footer-note a:hover { color: #818cf8; }

        /* responsive */
        @media (max-width: 900px) {
          .lp-left { display: none; }
          .lp-right { width: 100%; border-left: none; padding: 48px 32px; }
        }
        @media (max-width: 480px) {
          .lp-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="lp-root" style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── LEFT PANEL ── */}
        <div className="lp-left">
          <div className="lp-orb-1" aria-hidden="true" />
          <div className="lp-orb-2" aria-hidden="true" />

          <a href="/" className="lp-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Kembali ke beranda
          </a>

          <div className="lp-logo">
            <div className="lp-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span className="lp-logo-name">Omni Kasir</span>
          </div>

          <h1 className="lp-headline">
            Kelola semua toko<br />
            dari <span className="lp-headline-grad">satu dashboard.</span>
          </h1>

          <p className="lp-sub">
            Platform kasir SaaS multi-tenant untuk bisnis modern. Transaksi real-time, stok otomatis, laporan lengkap.
          </p>

          <div className="lp-features">
            {features.map((f) => (
              <div className="lp-feat-item" key={f.label}>
                <div className="lp-feat-icon">{f.icon}</div>
                {f.label}
              </div>
            ))}
          </div>

          <div className="lp-badge">
            <span className="lp-badge-dot" />
            500+ bisnis aktif di Indonesia
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lp-right">
          <div className="lp-form-title">Masuk</div>
          <div className="lp-form-sub">Selamat datang kembali di Omni Kasir</div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <div className="lp-field-wrap">
              <Form.Item
                name="email"
                label={<span className="lp-label">Email</span>}
                rules={[
                  { required: true, message: 'Masukkan email Anda' },
                  { type: 'email', message: 'Format email tidak valid' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#4a5480' }} />}
                  placeholder="nama@email.com"
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="lp-field-wrap">
              <Form.Item
                name="password"
                label={<span className="lp-label">Password</span>}
                rules={[{ required: true, message: 'Masukkan password Anda' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#4a5480' }} />}
                  placeholder="Masukkan password"
                  size="large"
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="lp-btn-submit"
              >
                {loading ? 'Memproses...' : 'Masuk →'}
              </Button>
            </Form.Item>
          </Form>

          <div className="lp-divider">
            <div className="lp-divider-line" />
            <span className="lp-divider-text">belum punya akun?</span>
            <div className="lp-divider-line" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <a
              href="mailto:hello@omnikasir.id"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 10,
                border: '1px solid rgba(79,70,229,0.3)',
                fontSize: 14, fontWeight: 600, color: '#a5b4fc',
                textDecoration: 'none', transition: 'all .2s',
                width: '100%', justifyContent: 'center',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(79,70,229,0.6)'
                el.style.background = 'rgba(79,70,229,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(79,70,229,0.3)'
                el.style.background = 'transparent'
              }}
            >
              Hubungi kami untuk akses
            </a>
          </div>

          <div className="lp-footer-note">
            © 2026 Omni Kasir · <a href="/privacy">Privasi</a> · <a href="/terms">Syarat</a>
          </div>
        </div>

      </div>
    </>
  )
}
