import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { summariesAPI, documentsAPI } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

function inr(v) {
  if (v == null) return '—'
  try {
    const n = Math.round(Number(v))
    const s = Math.abs(n).toString()
    let r = s.slice(-3), rest = s.slice(0,-3)
    while (rest.length) { r = rest.slice(-2) + ',' + r; rest = rest.slice(0,-2) }
    return (n < 0 ? '-' : '') + r.replace(/^,/, '')
  } catch { return String(v) }
}

function pct(v) { return v != null ? `${(v*100).toFixed(0)}%` : '—' }

const tabs = ['accounts','credits','balance','notes','footer']
const tabLabels = { accounts:'Account Details', credits:'Monthly Credits', balance:'Balance Position', notes:'Notes & Flags', footer:'Appraiser Footer' }

export default function Report() {
  const { id } = useParams()
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('accounts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    summariesAPI.get(id).then(r => setSummary(r.data)).catch(err => setError(err.response?.data?.detail || 'Failed to load report')).finally(() => setLoading(false))
  }, [id])

  const downloadPdf = async () => {
    try {
      const r = await documentsAPI.downloadPdf(id)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url; a.download = `BSA_${id.slice(0,8)}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('PDF not available') }
  }

  if (loading) return <div style={{ padding: 40, color: '#888' }}>Loading report…</div>
  if (error) return <div style={{ padding: 40, color: '#a32d2d' }}>Error: {error}</div>
  if (!summary) return null

  const banks = [...new Set((summary.monthly_credits || []).map(c => c.bank_name))]
  const months = [...new Set((summary.monthly_credits || []).map(c => c.month))]
  const aggs = summary.aggregates || {}
  const conf = summary.ai_confidence || {}

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Sidebar */}
      <div>
        <Card style={{ marginBottom: 12 }}>
          <CardHeader>{summary.loan_reference || id.slice(0,8).toUpperCase()}</CardHeader>
          <div>
            {tabs.map(t => (
              <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 16px', borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer', fontSize: 13, fontWeight: tab===t ? 500 : 400, color: tab===t ? '#1b3a6b' : '#555', background: tab===t ? '#eef3fb' : 'transparent', display:'flex', alignItems:'center', gap:6 }}>
                {tabLabels[t]}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <CardBody style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>AI Confidence</div>
            {Object.entries({ 'Income': conf.income_classification, 'Balance': conf.balance_extraction, 'Remarks': conf.remarks_classification }).map(([k,v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>{k}</span>
                  <span style={{ color: v >= 0.85 ? '#3b6d11' : '#854f0b', fontWeight: 500 }}>{pct(v)}</span>
                </div>
                <div style={{ height: 4, background: '#eee', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(v||0)*100}%`, background: v >= 0.85 ? '#639922' : '#ef9f27', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={downloadPdf}>⬇ Download PDF</Button>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>{tabLabels[tab]} — {summary.applicant_name}</CardHeader>
        <CardBody>

          {tab === 'accounts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              {(summary.account_details || []).map((a, i) => (
                <div key={i} style={{ border: '0.5px solid #ddd', borderLeft: '3px solid #2e5fa3', padding: '12px 14px', background: '#eef3fb', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#1b3a6b', marginBottom: 8 }}>{a.bank_name}</div>
                  {[['Account No.', a.account_number_masked], ['Applicant', a.applicant_name], ['Co-Applicant', a.co_applicant_name || '—'], ['Type', a.account_type], ['From', a.statement_period_from], ['To', a.statement_period_to]].map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: '#666' }}>{k}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === 'credits' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr><th rowSpan={2} style={th('left', '#1b3a6b')}>Month</th>
                    {banks.map(b => <th key={b} colSpan={2} style={th('center', '#1b3a6b')}>{b}</th>)}
                    <th rowSpan={2} style={th('left', '#1b3a6b')}>Remarks</th>
                  </tr>
                  <tr>{banks.map(b => [<th key={b+'a'} style={th('right','#2e5fa3')}>Applicant (₹)</th>, <th key={b+'b'} style={th('right','#2e5fa3')}>Co-Appl. (₹)</th>])}</tr>
                </thead>
                <tbody>
                  {months.map((m, mi) => {
                    const rmk = (summary.monthly_credits || []).find(c => c.month === m)
                    return (
                      <tr key={m} style={{ background: mi%2 ? '#f7f8fc' : '#fff' }}>
                        <td style={td('left', true)}>{m}</td>
                        {banks.map(b => { const row = (summary.monthly_credits||[]).find(c => c.month===m && c.bank_name===b); return [<td key={b+'a'} style={td()}>{row ? inr(row.applicant_amount) : '—'}</td>, <td key={b+'b'} style={td()}>{row ? inr(row.co_applicant_amount) : '—'}</td>] })}
                        <td style={{ ...td('left'), fontStyle: 'italic', color: '#666', fontSize: 11 }}>{rmk?.is_one_time ? '⚠ One-time: ' : ''}{rmk?.remarks || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#dce8f8', fontWeight: 600 }}>
                    <td style={td('left', true)}>Total</td>
                    {banks.map(b => { const t = (aggs.credit_totals||{})[b]||{}; return [<td key={b+'a'} style={td()}>{inr(t.applicant)}</td>, <td key={b+'b'} style={td()}>{inr(t.co_applicant)}</td>] })}
                    <td style={{ ...td('left'), fontStyle:'italic', color:'#666', fontSize:11 }}>Excl. one-time credits</td>
                  </tr>
                  <tr style={{ background: '#eef3fb', fontWeight: 600, color: '#1b3a6b' }}>
                    <td style={td('left', true)}>Avg./Month</td>
                    {banks.map(b => { const a = (aggs.credit_averages||{})[b]||{}; return [<td key={b+'a'} style={td()}>{inr(a.applicant)}</td>, <td key={b+'b'} style={td()}>{inr(a.co_applicant)}</td>] })}
                    <td style={{ ...td('left'), fontSize:11 }}>{((aggs.credit_averages||{})[banks[0]]||{}).months_count||12}-month basis</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {tab === 'balance' && Object.entries(aggs.balance_averages || {}).map(([bank, monthsData]) => (
            <div key={bank} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2e5fa3', marginBottom: 8 }}>{bank}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Month','1st','8th','17th','25th','Monthly Avg.'].map((h,i) => <th key={h} style={th(i===0?'left':'right','#1b3a6b')}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(monthsData).map(([m, v], mi) => (
                      <tr key={m} style={{ background: mi%2 ? '#f7f8fc' : '#fff' }}>
                        <td style={td('left', true)}>{m}</td>
                        <td style={td()}>{inr(v.day_1)}</td><td style={td()}>{inr(v.day_8)}</td>
                        <td style={td()}>{inr(v.day_17)}</td><td style={td()}>{inr(v.day_25)}</td>
                        <td style={td()}>{inr(v.monthly_avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={5} style={{ ...td('left'), background:'#1b3a6b', color:'#fff', fontWeight:600 }}>Grand Average Balance</td>
                      <td style={{ ...td(), background:'#1b3a6b', color:'#fff', fontWeight:600 }}>{inr((aggs.grand_balance_averages||{})[bank])}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {tab === 'notes' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 10 }}>Analyst Notes</div>
              <div style={{ background: '#f7f8fc', borderLeft: '3px solid #2e5fa3', padding: '12px 16px', borderRadius: 4, marginBottom: 16 }}>
                {(summary.notes || []).length > 0 ? summary.notes.map((n,i) => (
                  <div key={i} style={{ fontSize: 12, color: '#555', padding: '4px 0', display: 'flex', gap: 6 }}><span style={{ color: '#2e5fa3' }}>◆</span>{n}</div>
                )) : <div style={{ fontSize: 12, color: '#999' }}>No notes recorded.</div>}
              </div>
              {(summary.ai_flags || []).length > 0 && (<>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 10 }}>AI Confidence Flags</div>
                {summary.ai_flags.map((f, i) => (
                  <div key={i} style={{ background: '#faeeda', borderLeft: '3px solid #ef9f27', padding: '10px 14px', borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#633806', marginBottom: 3 }}>⚠ {f.field} — {f.severity?.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: '#854f0b' }}>{f.message} (Confidence: {pct(f.confidence)})</div>
                  </div>
                ))}
              </>)}
              {(summary.ai_flags || []).length === 0 && <Badge type="success">✓ No AI flags — all confidence scores above threshold</Badge>}
            </div>
          )}

          {tab === 'footer' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                {[['Prepared by (Appraiser)', summary.appraiser_name], ['Date', new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})], ['Reviewed by', '']].map(([label, val]) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
                    <div style={{ borderBottom: '1px solid #aaa', fontSize: 14, fontWeight: 500, minHeight: 22, paddingBottom: 3 }}>{val || ' '}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0f4ff', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#555' }}>
                <strong>Report reference:</strong> {summary.loan_reference || id.slice(0,8).toUpperCase()} &nbsp;·&nbsp;
                <strong>Classification:</strong> Confidential — Internal Use Only &nbsp;·&nbsp;
                <strong>Generated:</strong> LoanDocs AI
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Button variant="primary" onClick={downloadPdf}>⬇ Download PDF</Button>
                <Button onClick={() => window.print()}>🖨 Print</Button>
              </div>
            </div>
          )}

        </CardBody>
      </Card>
    </div>
  )
}

const th = (align='center', bg='#1b3a6b') => ({ padding: '7px 10px', textAlign: align, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', background: bg, color: '#fff', border: '1px solid #2e5fa3', whiteSpace: 'nowrap' })
const td = (align='right', bold=false) => ({ padding: '6px 10px', border: '0.5px solid #ddd', textAlign: align, fontWeight: bold ? 600 : 400 })
