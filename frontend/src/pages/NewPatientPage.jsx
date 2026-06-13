import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createPatient } from '../api/patients'

const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Osteoporosis', 'Blood Thinners']
const ALLERGIES  = ['Penicillin', 'Aspirin', 'Latex', 'Ibuprofen', 'Codeine']

function Toggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
        active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function NewPatientPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', phone: '',
    email: '', conditions: [], allergies: [], notes: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleList = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))
  }

  const submit = async () => {
    if (!form.name || !form.age || !form.phone) {
      setError('Name, age and phone are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const patient = await createPatient({
        ...form,
        age: parseInt(form.age),
      })
      navigate(`/patients/${patient._id}`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create patient.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/patients')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[15px] font-medium text-gray-900">New patient</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
        <div className="max-w-lg mx-auto space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <h2 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Basic info</h2>

            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Full name *</label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="John Doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Age *</label>
                <input
                  type="number" value={form.age} onChange={e => set('age', e.target.value)}
                  placeholder="35" min="0" max="120"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Gender</label>
                <select
                  value={form.gender} onChange={e => set('gender', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500 bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Phone *</label>
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="9876543210"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Email</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-3">Medical conditions</h2>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <Toggle key={c} label={c} active={form.conditions.includes(c)} onClick={() => toggleList('conditions', c)} />
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-3">Known allergies</h2>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map(a => (
                <Toggle key={a} label={a} active={form.allergies.includes(a)} onClick={() => toggleList('allergies', a)} />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-3">Notes</h2>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-[14px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create patient'}
          </button>
        </div>
      </div>
    </div>
  )
}
