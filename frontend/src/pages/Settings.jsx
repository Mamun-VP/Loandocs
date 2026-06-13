import { useEffect, useState } from 'react'
import { summariesAPI } from '../api/client'
import api from '../api/client'
import { Card, CardHeader, CardBody } from '../components/ui/Card'

function Row({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ on, onChange }) {
  return <div onClick={onChange} style={{ width: 38, height: 22, borderRadius: 11, background: on ? '#1b3a6b' : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: on ? 19 : 3, transition: 'left .2s' }} />
  </div>
}

export default function Settings() {
  const [cfg, setCfg] = useState(null)
  const [toggles, setToggles] = useState({ flagLow: true, autoExclude: true, auditLog: true, includeAuditTrail: false })

  useEffect(() => { api.get('/settings/').then(r => setCfg(r.data)).catch(console.error) }, [])

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Settings</h1>
      <Card>
        <CardHeader>AI Processing</CardHeader>
        <CardBody>
          <Row label="AI provider" desc="LLM used for statement analysis">
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>Claude (Anthropic)</option><option>GPT-4 (OpenAI)</option>
            </select>
          </Row>
          <Row label="Flag low-confidence remarks" desc={`Highlight AI remarks below ${cfg ? (cfg.ai_confidence_threshold*100).toFixed(0) : 85}% confidence for manual review`}>
            <Toggle on={toggles.flagLow} onChange={() => setToggles(t => ({...t, flagLow: !t.flagLow}))} />
          </Row>
          <Row label="Auto-exclude one-time credits" desc="AI identifies and excludes non-recurring large credits">
            <Toggle on={toggles.autoExclude} onChange={() => setToggles(t => ({...t, autoExclude: !t.autoExclude}))} />
          </Row>
          <Row label="Confidence threshold" desc="Flag remarks below this level">
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>85%</option><option>90%</option><option>75%</option><option>95%</option>
            </select>
          </Row>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Report Output</CardHeader>
        <CardBody>
          <Row label="Default assessment period" desc="Months included in each report">
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>12 months</option><option>6 months</option><option>24 months</option>
            </select>
          </Row>
          <Row label="Balance snapshot days" desc="Days of month for average balance calculation">
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>1st, 8th, 17th, 25th</option><option>1st, 10th, 20th</option>
            </select>
          </Row>
          <Row label="Include audit trail in PDF" desc="Append processing log to report">
            <Toggle on={toggles.includeAuditTrail} onChange={() => setToggles(t => ({...t, includeAuditTrail: !t.includeAuditTrail}))} />
          </Row>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Security &amp; Data</CardHeader>
        <CardBody>
          <Row label="Document retention" desc="How long uploaded files are stored">
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>Permanent</option><option>90 days</option><option>365 days</option>
            </select>
          </Row>
          <Row label="Audit log — report views" desc="Log every time a report is viewed or downloaded">
            <Toggle on={toggles.auditLog} onChange={() => setToggles(t => ({...t, auditLog: !t.auditLog}))} />
          </Row>
          <Row label="Session timeout" desc="Auto-logout after inactivity" >
            <select style={{ padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 6, fontSize: 12 }}>
              <option>8 hours</option><option>4 hours</option><option>1 hour</option>
            </select>
          </Row>
        </CardBody>
      </Card>
    </div>
  )
}
