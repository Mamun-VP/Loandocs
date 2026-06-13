import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsAPI } from '../api/client'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function Upload() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ applicant_name:'', co_applicant_name:'', loan_reference:'', loan_type:'Home Loan', appraiser_name:'', assessment_months:'12' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => /\.(pdf|csv|xlsx|xls)$/i.test(f.name))
    setFiles(prev => [...prev, ...valid])
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (!form.applicant_name) { setError('Applicant name is required'); return }
    if (files.length === 0) { setError('Please upload at least one bank statement'); return }
    setError(''); setLoading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      const r = await documentsAPI.upload(fd)
      navigate(`/queue?id=${r.data.document_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Upload Bank Statements</h1>

      <Card>
        <CardHeader>Applicant Information</CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Input label="Applicant name *" value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} placeholder="Full legal name" />
            <Input label="Co-applicant name" value={form.co_applicant_name} onChange={e => set('co_applicant_name', e.target.value)} placeholder="Optional" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Input label="Loan reference ID" value={form.loan_reference} onChange={e => set('loan_reference', e.target.value)} placeholder="e.g. LN-2026-00892" />
            <Select label="Loan type" value={form.loan_type} onChange={e => set('loan_type', e.target.value)}>
              {['Home Loan','Personal Loan','Business Loan','Vehicle Loan'].map(t => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Assessment period" value={form.assessment_months} onChange={e => set('assessment_months', e.target.value)}>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 24 months</option>
            </Select>
            <Input label="Appraiser name" value={form.appraiser_name} onChange={e => set('appraiser_name', e.target.value)} placeholder="For report footer" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Upload Documents</CardHeader>
        <CardBody>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{ border: `1.5px dashed ${dragging ? '#2e5fa3' : '#ccc'}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#eef3fb' : '#fafafa', marginBottom: 14, transition: 'all .15s' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>☁</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Drop bank statements here, or click to browse</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Supports PDF bank statements and CSV / Excel exports</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {['PDF','CSV','XLSX','XLS'].map(f => <span key={f} style={{ padding: '3px 10px', border: '0.5px solid #ccc', borderRadius: 20, fontSize: 11, color: '#666' }}>{f}</span>)}
            </div>
            <input ref={fileRef} type="file" multiple accept=".pdf,.csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {files.map((f, i) => (
                <div key={i} style={{ background: '#fafafa', border: '0.5px solid #eee', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>📄 {f.name}</span>
                    <span style={{ fontSize: 11, color: '#888', marginLeft: 10 }}>{(f.size/1024).toFixed(0)} KB</span>
                  </div>
                  <button onClick={() => setFiles(fs => fs.filter((_,j) => j!==i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d', fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ background: '#fcebeb', color: '#a32d2d', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setFiles([])}>Clear</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Uploading…' : '⚡ Process with AI'}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
