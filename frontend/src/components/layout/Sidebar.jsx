import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const nav = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/upload', label: 'Upload Documents', icon: '↑' },
  { to: '/queue', label: 'Processing Queue', icon: '⏱' },
  { to: '/applications', label: 'All Applications', icon: '☰' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside style={{ width: 210, background: '#fff', borderRight: '0.5px solid #eee', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 10 }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, background: '#1b3a6b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>⊞</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1b3a6b' }}>LoanDocs AI</div>
          <div style={{ fontSize: 10, color: '#888' }}>Internal Portal</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
              color: isActive ? '#1b3a6b' : '#666', background: isActive ? '#eef3fb' : 'transparent',
              fontWeight: isActive ? 500 : 400, fontSize: 13, textDecoration: 'none', marginBottom: 2,
            })}>
            <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#b5d4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#0c447c' }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#888' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '6px 10px', background: 'none', border: '0.5px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#666' }}>Sign out</button>
      </div>
    </aside>
  )
}
