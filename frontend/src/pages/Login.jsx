import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('officer@loandocs.ai')
  const [password, setPassword] = useState('officer123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch (err) { setError(err.response?.data?.detail || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
      <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: '#1b3a6b', borderRadius: 10, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22 }}>⊞</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1b3a6b' }}>LoanDocs AI</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Internal Loan Officer Portal</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
          </div>
          {error && <div style={{ background: '#fcebeb', color: '#a32d2d', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#1b3a6b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 16 }}>Default: officer@loandocs.ai / officer123</p>
      </div>
    </div>
  )
}
