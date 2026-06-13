import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsAPI } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const statusMap = { complete:'success', flagged:'warning', failed:'danger', pending:'neutral', extracting:'info', analyzing:'info', generating:'info' }

export default function Applications() {
  const [docs, setDocs] = useState([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = {}
    if (statusFilter) params.status = statusFilter
    documentsAPI.list(params).then(r => { setDocs(r.data.items); setTotal(r.data.total) }).catch(console.error)
  }, [statusFilter])

  const filtered = docs.filter(d => !search || d.applicant_name.toLowerCase().includes(search.toLowerCase()) || (d.loan_reference||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>All Applications <span style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>({total})</span></h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/upload')}>+ New Application</Button>
      </div>
      <Card>
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #eee', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or reference…"
            style={{ flex: 1, minWidth: 200, padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 13, background: '#fff' }}>
            <option value="">All statuses</option>
            {['complete','flagged','failed','pending','extracting','analyzing','generating'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Ref ID','Applicant','Loan Type','Files','Uploaded','Status','Action'].map(h => (
                <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#666', borderBottom: '0.5px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{d.loan_reference || d.id.slice(0,8).toUpperCase()}</td>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{d.applicant_name}{d.co_applicant_name && <div style={{ fontSize: 11, color: '#999' }}>+ {d.co_applicant_name}</div>}</td>
                <td style={{ padding: '10px 16px', color: '#555' }}>{d.loan_type || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#555' }}>{d.files?.length || 0}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#888' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 16px' }}><Badge type={statusMap[d.status]||'neutral'}>{d.status}</Badge></td>
                <td style={{ padding: '10px 16px' }}>
                  {d.has_summary && <Button size="sm" onClick={() => navigate(`/report/${d.id}`)}>View</Button>}
                  {!d.has_summary && ['pending','extracting','analyzing','generating'].includes(d.status) && <Button size="sm" onClick={() => navigate(`/queue?id=${d.id}`)}>Track</Button>}
                  {d.status === 'failed' && <Button size="sm" variant="danger" onClick={() => navigate('/upload')}>Retry</Button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No applications found.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
