import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Send, Search, Bot, User } from 'lucide-react'
import { getPatients } from '../api/patients'
import client from '../api/client'
import clsx from 'clsx'

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'
  const colors = ['bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700']
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0]
  return (
    <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0', color)}>
      {initials}
    </div>
  )
}

const insuranceQuery = (query, patientId) =>
  client.post('/ai/insurance-query', { query, patient_id: patientId }).then(r => r.data)

const SUGGESTED = [
  "What is the coverage amount?",
  "What procedures are covered?",
  "What is the policy number?",
  "Is root canal treatment covered?",
  "What is the patient copay?",
]

export default function InsurancePage() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    getPatients(0, 200).then(setPatients)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  const selectPatient = (p) => {
    setSelected(p)
    setMessages([{
      role: 'assistant',
      text: `Hi! I can answer questions about ${p.name}'s insurance documents. Make sure you have uploaded their insurance PDF first. What would you like to know?`,
    }])
  }

  const send = async (text) => {
    if (!selected) return
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await insuranceQuery(q, selected._id)
      setMessages(m => [...m, { role: 'assistant', text: res.answer, sources: res.sources }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: 'Error reaching the AI. Check your backend and Gemini API key.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — patient list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-[14px] font-medium text-gray-800 flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-600" /> Insurance Q&A
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Ask about a patient's insurance documents</p>
        </div>

        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-gray-400" />
            <input
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-gray-400"
              placeholder="Filter patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-50">
          {filtered.map(p => (
            <div
              key={p._id}
              onClick={() => selectPatient(p)}
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

      {/* Right — chat */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-2">
          {selected ? (
            <>
              <Avatar name={selected.name} />
              <div>
                <p className="text-[13px] font-medium text-gray-800">{selected.name}</p>
                <p className="text-[11px] text-gray-400">Asking about insurance documents</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                <ShieldCheck size={11} /> Requires uploaded insurance PDF
              </div>
            </>
          ) : (
            <p className="text-[13px] text-gray-400">Select a patient to begin</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300">
              <ShieldCheck size={48} strokeWidth={1} />
              <p className="text-[13px]">Select a patient to ask about their insurance coverage</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={clsx('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={clsx(
                'max-w-lg rounded-xl px-4 py-2.5 text-[13px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
              )}>
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.sources?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                    Source: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={13} className="text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {SUGGESTED.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="text-[11px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-brand-600 hover:text-brand-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2">
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] outline-none focus:border-brand-600 placeholder:text-gray-400"
            placeholder={!selected ? "Select a patient first..." : "Ask about coverage, policy, procedures..."}
            value={input}
            disabled={!selected}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || !selected}
            className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center disabled:opacity-40 hover:bg-brand-800 transition-colors"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
