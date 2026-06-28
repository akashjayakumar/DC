import { useState, useEffect } from 'react'
import { Brain, Search, Sparkles, User } from 'lucide-react'
import { getPatients, getPatientSummary } from '../api/patients'
import clsx from 'clsx'

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'
  const colors = ['bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700']
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0]
  return (
    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0', color)}>
      {initials}
    </div>
  )
}

export default function PatientSummaryPage() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)

  useEffect(() => {
    getPatients(0, 200).then(setPatients).finally(() => setLoadingPatients(false))
  }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  const generate = async (patient) => {
    setSelected(patient)
    setSummary('')
    setLoading(true)
    try {
      const res = await getPatientSummary(patient._id)
      setSummary(res.summary)
    } catch (e) {
      setSummary('Failed to generate summary. Check your Gemini API key in .env.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — patient picker */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-[14px] font-medium text-gray-800 flex items-center gap-2">
            <Brain size={15} className="text-brand-600" /> Patient Summary
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Select a patient to generate AI summary</p>
        </div>
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-gray-400" />
            <input
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-gray-400"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-50">
          {loadingPatients ? (
            <p className="text-[12px] text-gray-400 text-center py-8">Loading...</p>
          ) : filtered.map(p => (
            <div
              key={p._id}
              onClick={() => generate(p)}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors',
                selected?._id === p._id ? 'bg-brand-50 border-l-2 border-brand-600' : 'hover:bg-gray-50'
              )}
            >
              <Avatar name={p.name} />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400">{p.age} yrs · {p.gender}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — summary output */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50 p-6">
        {!selected && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300">
            <Brain size={48} strokeWidth={1} />
            <p className="text-[13px]">Select a patient to generate their AI clinical summary</p>
          </div>
        )}

        {selected && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Patient header */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              <Avatar name={selected.name} />
              <div>
                <p className="text-[14px] font-medium text-gray-900">{selected.name}</p>
                <p className="text-[12px] text-gray-400">{selected.age} yrs · {selected.gender} · {selected.phone}</p>
              </div>
              <button
                onClick={() => generate(selected)}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 bg-brand-600 text-white text-[12px] px-3 py-1.5 rounded-lg hover:bg-brand-800 disabled:opacity-50"
              >
                <Sparkles size={12} />
                {loading ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {/* Conditions */}
            {selected.conditions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.conditions.map(c => (
                  <span key={c} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
                ))}
                {selected.allergies?.map(a => (
                  <span key={a} className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">⚠ {a}</span>
                ))}
              </div>
            )}

            {/* Summary card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 mb-3">
                <Sparkles size={13} /> AI Clinical Summary
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[100, 90, 75, 85].map((w, i) => (
                    <div key={i} className={`h-3 bg-blue-200 rounded animate-pulse`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-blue-900 leading-relaxed whitespace-pre-line">{summary}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
