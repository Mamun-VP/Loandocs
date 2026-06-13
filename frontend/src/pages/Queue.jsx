import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { documentsAPI } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const STEPS = ['pending','extracting','analyzing','generating']
const STEP_LABELS = { pending: 'Queued', extracting: 'Extracting text', analyzing: 'AI analysis', generating: 'Generating PDF' }

function ProgressBar({ doc }) {
  const idx = STEPS.indexOf(doc.status)
  const pct = doc.status === 'complete' || doc.status === 'flagged' ? 100 : idx < 0 ? 100 : ((idx+1)/STEPS.length)*100
  const color = doc.status === 'failed' ? '#e24b4a' : doc.status === 'flagged' ? '#ef9f27' : doc.status === 'complete' ? '#639922' : '#2e5fa3'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{doc.applicant_name}</span>
        <span style={{ fontSize: 11, color: '#666' }}>{doc.processing_step || STEP_LABELS[doc.status] || doc.status}</span>
      </div>
      <div style={{ height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .5s' }} />
      </div>
      {doc.error_message && <div style={{ fontSize: 11, color: '#a32d2d', marginTop: 4 }}>Error: {doc.error_message}</div>}
    </div>
  )
}

export default function Queue() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [retrying, setRetrying] = useState({})
  const focusId = searchParams.get('id')

  const fetchDocs = () => {
    documentsAPI.list({ limit: 20 }).then(r => setDocs(r.data.items)).catch(console.error)
  }

  const handleRetry = (id) => {
    setRetrying(r => ({ ...r, [id]: true }))
    documentsAPI.retry(id)
      .then(() => fetchDocs())
      .catch(err => alert(err.response?.data?.detail || 'Retry failed'))
      .finally(() => setRetrying(r => ({ ...r, [id]: false })))
  }

  useEffect(() => { fetchDocs() }, [])

  const active = docs.filter(d => ['pending','extracting','analyzing','generating'].includes(d.status))
  const done = docs.filter(d => ['complete','flagged','failed'].includes(d.status))

  usePolling(fetchDocs, 3000, active.length > 0)

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Processing Queue</h1>

      {active.length > 0 && (
        <Card>
          <CardHeader><span>Active <Badge type="info">{active.length}</Badge></span></CardHeader>
          <CardBody>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 14, background: '#eef3fb', padding: '8px 12px', borderRadius: 6 }}>
              Pipeline: ① Upload &amp; validate → ② Text extraction → ③ AI analysis → ④ PDF generation
            </div>
            {active.map(d => <ProgressBar key={d.id} doc={d} />)}
          </CardBody>
        </Card>
      )}

      {active.length === 0 && <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 10, padding: 32, textAlign: 'center', color: '#aaa', marginBottom: 16 }}>No documents currently processing.</div>}

      <Card>
        <CardHeader>Completed</CardHeader>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Applicant','Status','Confidence','Time','Action'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: '#666', borderBottom: '0.5px solid #eee', fontWeight: 500, background: '#fafafa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {done.map(d => {
              const conf = d.ai_confidence ? Math.min(...Object.values(d.ai_confidence)) : null
              return (
                <tr key={d.id} style={{ borderBottom: '0.5px solid #f0f0f0', background: d.id === focusId ? '#f0f7ff' : 'transparent' }}>
                  <td style={{ padding: '10px 14px' }}><div style={{ fontWeight: 500 }}>{d.applicant_name}</div><div style={{ fontSize: 11, color: '#999' }}>{d.loan_reference || d.id.slice(0,8).toUpperCase()}</div></td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge type={d.status === 'complete' ? 'success' : d.status === 'flagged' ? 'warning' : 'danger'}>{d.status}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: conf && conf < 0.85 ? '#854f0b' : '#3b6d11' }}>
                    {conf !== null ? `${(conf*100).toFixed(0)}%` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#888' }}>{d.processed_at ? new Date(d.processed_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {d.has_summary && <Button size="sm" onClick={() => navigate(`/report/${d.id}`)}>View Report</Button>}
                    {d.status === 'failed' && (
                      <div>
                        <Button size="sm" variant="danger" disabled={retrying[d.id]} onClick={() => handleRetry(d.id)}>{retrying[d.id] ? 'Retrying…' : 'Retry'}</Button>
                        {d.error_message && <div style={{ fontSize: 10, color: '#a32d2d', marginTop: 4, maxWidth: 220, wordBreak: 'break-word' }} title={d.error_message}>{d.error_message.length > 120 ? d.error_message.slice(0, 120) + '…' : d.error_message}</div>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {done.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No completed documents yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
