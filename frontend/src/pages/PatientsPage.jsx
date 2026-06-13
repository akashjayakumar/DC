import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, User } from 'lucide-react'
import { getPatients } from '../api/patients'
import clsx from 'clsx'

const RISK_COLORS = {
  high:   'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low:    'bg-green-50 text-green-700',
}

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
  ]
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0]
  return (
    <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0', color)}>
      {initials}
    </div>
  )
}

function RiskBadge({ noShows = 0 }) {
  const risk = noShows >= 3 ? 'high' : noShows >= 1 ? 'medium' : 'low'
  const label = noShows >= 3 ? 'High risk' : noShows >= 1 ? 'Med risk' : 'Low risk'
  return (
    <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', RISK_COLORS[risk])}>
      {label}
    </span>
  )
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getPatients(0, 200)
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-[13px] text-gray-700 outline-none placeholder:text-gray-400"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-[13px] font-medium px-3 py-2 rounded-lg hover:bg-brand-800 transition-colors"
        >
          <Plus size={14} />
          New patient
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-5 py-2 text-[12px] text-gray-400 border-b border-gray-100 bg-white sticky top-0">
          {loading ? 'Loading...' : `${filtered.length} patients`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-[13px]">
            Loading patients...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <User size={32} strokeWidth={1} />
            <p className="text-[13px]">No patients found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(p => (
              <div
                key={p._id}
                onClick={() => navigate(`/patients/${p._id}`)}
                className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Avatar name={p.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{p.name}</p>
                    <RiskBadge noShows={0} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {p.age} yrs · {p.gender} · {p.phone}
                  </p>
                  {p.conditions?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.conditions.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-gray-300 text-[18px]">›</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
