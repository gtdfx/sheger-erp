import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { api } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(email, password)
      localStorage.setItem('sheger_token', data.token)
      localStorage.setItem('sheger_user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      {/* Background image with slight blur and zoom */}
      <div style={{
        position: 'absolute', inset: '-30px', zIndex: 0,
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 25%',
        filter: 'blur(2px) brightness(0.7) saturate(1.15)',
      }} />

      {/* Subtle dark overlay at top/bottom for text readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, rgba(12,24,41,0.25) 0%, transparent 30%, transparent 70%, rgba(12,24,41,0.3) 100%)',
      }} />
      {/* Vignette - light to keep center bright */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,24,41,0.25) 100%)',
      }} />

      {/* Subtle gold glow in corners */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(196,163,90,0.12), transparent 60%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(30,77,140,0.15), transparent 60%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

      {/* Animated particles effect */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            borderRadius: '50%',
            background: 'rgba(196,163,90,0.2)',
            left: `${15 + i * 15}%`,
            top: `${20 + i * 10}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.3; }
          to { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .login-card-shimmer {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(196,163,90,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          border-radius: 20px 20px 0 0;
        }
      `}</style>

      {/* Login card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>
        <div style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.6)',
          padding: '36px 32px', textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.1) inset',
          animation: 'cardEntry 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          opacity: 0, transform: 'translateY(20px)',
        }}>
          <div className="login-card-shimmer" />
          {/* Logo */}
          <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', borderRadius: '12px', background: 'rgba(30,77,140,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 className="w-8 h-8" style={{ color: '#1e4d8c' }} />
          </div>

          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#141b2d', letterSpacing: '-0.03em' }}>
            Sheger <span style={{ color: '#1e4d8c' }}>Real Estate</span>
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#5a6578', margin: '4px 0 24px' }}>Real Estate Management System</p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5a6578', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#7d8899' }} />
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ paddingLeft: '40px' }} placeholder="Enter username" required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5a6578', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#7d8899' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingLeft: '40px', paddingRight: '44px' }} placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '36px', padding: 0, border: 0, borderRadius: '8px', background: 'transparent', color: '#7d8899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem' }}>
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 16px', marginTop: '8px', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', color: '#7d8899', marginTop: '20px' }}>
            Sheger Real Estate PLC — Bole, Addis Ababa
          </p>
        </div>
      </div>
    </div>
  )
}
