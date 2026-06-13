import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsAPI } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

function statusBadge(s) {
  const map = { complete: 'success', processing: 'info', extracting: 'info', analyzing: 'info', generating: 'info', flagged: 'warning', failed: 'danger', pending: 'neutral' }
  return <Badge type={map[s] || 'neutral'}>{s}</Badge>
}

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    documentsAPI.list({ limit: 10 }).then(r => {
      const items = r.data.items
      setDocs(items)
      const today = new Date().toDateString()
      setStats({
        total: r.data.total,
        today: items.filter(d => new Date(d.created_at).toDateString() === today).length,
        pending: items.filter(d => ['pending','extracting','analyzing','generating'].includes(d.status)).length,
        flagged: items.filter(d => d.status === 'flagged').length,
      })
    }).catch(console.error)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/upload')}>+ New Application</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Applications', value: stats.total, sub: 'All time' },
          { label: 'Processed Today', value: stats.today, sub: 'Uploads today' },
          { label: 'Processing Now', value: stats.pending, sub: 'In queue' },
          { label: 'Flagged for Review', value: stats.flagged || 0, sub: 'Need attention' },
        ].map(m => (
          <div key={m.label} style={{ background: '#f0f4ff', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader action={<Button size="sm" onClick={() => navigate('/applications')}>View all</Button>}>Recent Applications</CardHeader>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Applicant','Loan Type','Uploaded','Status','Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#666', borderBottom: '0.5px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontWeight: 500 }}>{d.applicant_name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{d.loan_reference || d.id.slice(0,8).toUpperCase()}</div>
                </td>
                <td style={{ padding: '10px 16px', color: '#555' }}>{d.loan_type || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#555', fontSize: 12 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 16px' }}>{statusBadge(d.status)}</td>
                <td style={{ padding: '10px 16px' }}>
                  {d.has_summary
                    ? <Button size="sm" onClick={() => navigate(`/report/${d.id}`)}>View Report</Button>
                    : <Button size="sm" onClick={() => navigate(`/queue`)}>Track</Button>}
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No applications yet. <span style={{ color: '#1b3a6b', cursor: 'pointer' }} onClick={() => navigate('/upload')}>Upload your first document →</span></td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
