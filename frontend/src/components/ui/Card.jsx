export function Card({ children, style }) {
  return <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 12, overflow: 'hidden', marginBottom: 16, ...style }}>{children}</div>
}
export function CardHeader({ children, action }) {
  return <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 14, fontWeight: 500 }}>{children}</span>
    {action}
  </div>
}
export function CardBody({ children, style }) {
  return <div style={{ padding: 18, ...style }}>{children}</div>
}
