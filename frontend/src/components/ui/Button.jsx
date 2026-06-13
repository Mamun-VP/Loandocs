export function Button({ children, onClick, variant = 'default', size = 'md', disabled, style, type = 'button' }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '0.5px solid #ccc', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 500, opacity: disabled ? 0.5 : 1, transition: 'background .15s' }
  const sizes = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '8px 16px', fontSize: 13 } }
  const variants = {
    default: { background: '#fff', color: '#1a1a2e' },
    primary: { background: '#1b3a6b', color: '#fff', border: '0.5px solid #1b3a6b' },
    danger:  { background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' },
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>
}
