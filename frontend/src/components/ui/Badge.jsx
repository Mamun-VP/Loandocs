export function Badge({ type = 'neutral', children }) {
  const styles = {
    success: { background: '#eaf3de', color: '#3b6d11' },
    warning: { background: '#faeeda', color: '#854f0b' },
    danger:  { background: '#fcebeb', color: '#a32d2d' },
    info:    { background: '#e6f1fb', color: '#185fa5' },
    neutral: { background: '#f0f0f0', color: '#555' },
  }
  return <span style={{ ...styles[type], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{children}</span>
}
