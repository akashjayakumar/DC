import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Brain, Upload, FileText, Plus,
  Calendar, Stethoscope, AlertCircle, Sparkles, X
} from 'lucide-react'
import {
  getPatient, getVisits, getDocuments,
  getPatientSummary, uploadDocument, createVisit
} from '../api/patients'
import clsx from 'clsx'

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'
  const colors = ['bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700']
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0]
  const sz = size === 'lg' ? 'w-12 h-12 text-[16px]' : 'w-9 h-9 text-[12px]'
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-medium flex-shrink-0', color, sz)}>
      {initials}
    </div>
  )
}

function StatBox({ value, label, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className={clsx('text-lg font-medium', color)}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function VisitRow({ visit }) {
  const date = visit.date
    ? new Date(visit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-[11px] text-gray-400 w-24 flex-shrink-0 pt-0.5">{date}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-800">{visit.diagnosis}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{visit.treatment}</p>
        {visit.teeth_involved?.length > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">Teeth: {visit.teeth_involved.join(', ')}</p>
        )}
      </div>
      {visit.cost && (
        <div className="text-[12px] text-gray-500 flex-shrink-0">₹{visit.cost.toLocaleString()}</div>
      )}
    </div>
  )
}

function AddVisitModal({ patientId, onClose, onSaved }) {
  const [form, setForm] = useState({
    diagnosis: '', treatment: '', notes: '', cost: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.diagnosis || !form.treatment) return
    setSaving(true)
    try {
      await createVisit({
        patient_id: patientId,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        notes: form.notes || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
      })
      onSaved()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-medium text-gray-900">Log visit</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Diagnosis *', key: 'diagnosis', placeholder: 'e.g. Dental Caries – Class II' },
            { label: 'Treatment *', key: 'treatment', placeholder: 'e.g. Composite Filling' },
            { label: 'Notes', key: 'notes', placeholder: 'Optional clinical notes' },
            { label: 'Cost (₹)', key: 'cost', placeholder: 'e.g. 3200', type: 'number' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="text-[11px] text-gray-500 block mb-1">{label}</label>
              <input
                type={type || 'text'}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-brand-600"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-[13px] text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.diagnosis || !form.treatment}
            className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-[13px] font-medium disabled:opacity-50 hover:bg-brand-800"
          >
            {saving ? 'Saving...' : 'Save visit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [docs, setDocs] = useState([])
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [p, v, d] = await Promise.all([
        getPatient(id),
        getVisits(id),
        getDocuments(id),
      ])
      setPatient(p)
      setVisits(v)
      setDocs(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const fetchSummary = async () => {
    setSummaryLoading(true)
    try {
      const res = await getPatientSummary(id)
      setSummary(res.summary)
    } catch (e) {
      setSummary('Failed to generate summary. Check that your Gemini API key is set correctly in .env.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('patient_id', id)
    const fileType = document.getElementById('uploadFileType').value
    fd.append('file_type', fileType)
    fd.append('file', file)
    try {
      await uploadDocument(fd)
      const d = await getDocuments(id)
      setDocs(d)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-[13px]">
      Loading patient...
    </div>
  )

  if (!patient) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-[13px]">
      Patient not found.
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/patients')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <Avatar name={patient.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-medium text-gray-900">{patient.name}</h1>
          <p className="text-[12px] text-gray-400">
            {patient.age} yrs · {patient.gender} · {patient.phone}
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.png,.jpg" onChange={handleUpload} />
          <select
            id="uploadFileType"
            defaultValue="clinical_note"
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] text-gray-600 outline-none"
          >
            <option value="clinical_note">Clinical Note</option>
            <option value="treatment_report">Treatment Report</option>
            <option value="insurance">Insurance</option>
            <option value="xray">X-Ray</option>
            <option value="lab_result">Lab Result</option>
          </select>
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-[12px] px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload size={13} />
            {uploading ? 'Uploading...' : 'Upload doc'}
          </button>
          <button
            onClick={() => setShowVisitModal(true)}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-[12px] px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <Plus size={13} />
            Log visit
          </button>
          <button
            onClick={fetchSummary}
            disabled={summaryLoading}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-[12px] px-3 py-1.5 rounded-lg hover:bg-brand-800 disabled:opacity-60"
          >
            <Brain size={13} />
            {summaryLoading ? 'Generating...' : 'AI summary'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-4">

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox value={visits.length} label="Total visits" />
          <StatBox value={patient.conditions?.length || 0} label="Conditions" />
          <StatBox value={docs.length} label="Documents" />
          <StatBox
            value={patient.conditions?.length > 1 ? 'High' : 'Low'}
            label="Risk level"
            color={patient.conditions?.length > 1 ? 'text-red-600' : 'text-green-600'}
          />
        </div>

        {/* Conditions & allergies */}
        {(patient.conditions?.length > 0 || patient.allergies?.length > 0) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-gray-700 mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-gray-400" /> Medical info
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions?.map(c => (
                <span key={c} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
              ))}
              {patient.allergies?.map(a => (
                <span key={a} className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">⚠ {a}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {(summary || summaryLoading) && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 mb-2">
              <Sparkles size={13} /> AI clinical summary
            </div>
            {summaryLoading ? (
              <div className="text-[13px] text-blue-400 animate-pulse">Generating summary...</div>
            ) : (
              <p className="text-[13px] text-blue-900 leading-relaxed whitespace-pre-line">{summary}</p>
            )}
          </div>
        )}

        {/* Visit history */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" /> Visit history
            </h2>
            <button
              onClick={() => setShowVisitModal(true)}
              className="text-[11px] text-brand-600 hover:underline"
            >
              + Log visit
            </button>
          </div>
          {visits.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">No visits yet</p>
          ) : (
            visits.map(v => <VisitRow key={v._id} visit={v} />)
          )}
        </div>

        {/* Documents */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h2 className="text-[12px] font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            <FileText size={14} className="text-gray-400" /> Documents
          </h2>
          {docs.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">No documents uploaded</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {docs.map(d => (
                <div key={d._id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <FileText size={16} className="text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-gray-700 truncate">{d.original_name}</p>
                    <p className="text-[10px] text-gray-400">{d.file_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showVisitModal && (
        <AddVisitModal
          patientId={id}
          onClose={() => setShowVisitModal(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
