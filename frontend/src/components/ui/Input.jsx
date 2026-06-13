export function Input({ label, type = 'text', value, onChange, placeholder, required, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
    {label && <label style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{label}{required && ' *'}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      style={{ padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', width: '100%' }} />
  </div>
}

export function Select({ label, value, onChange, children, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
    {label && <label style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{label}</label>}
    <select value={value} onChange={onChange}
      style={{ padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif', background: '#fff' }}>
      {children}
    </select>
  </div>
}
