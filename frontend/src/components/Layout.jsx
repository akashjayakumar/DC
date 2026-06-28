import { Outlet, NavLink } from 'react-router-dom'
import {
  Users, Calendar, FileText, Brain,
  MessageSquare, ShieldCheck, TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { label: 'Patients',        icon: Users,          to: '/patients',     section: 'Main' },
  { label: 'Appointments',    icon: Calendar,       to: '/appointments', section: 'Main',     disabled: true },
  { label: 'Documents',       icon: FileText,       to: '/documents',    section: 'Main',     disabled: true },
  { label: 'Patient Summary', icon: Brain,          to: '/summary',      section: 'AI Tools' },
  { label: 'Ask Records',     icon: MessageSquare,  to: '/ask',          section: 'AI Tools' },
  { label: 'Insurance Q&A',   icon: ShieldCheck,    to: '/insurance',    section: 'AI Tools' },
  { label: 'No-show Risk',    icon: TrendingUp,     to: '/noshow',       section: 'ML',       disabled: true },
]

const sections = ['Main', 'AI Tools', 'ML']

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-[15px] font-medium text-gray-900">🦷 DentalCopilot</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Clinical AI Assistant</div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto scrollbar-hide">
          {sections.map(section => {
            const items = nav.filter(n => n.section === section)
            return (
              <div key={section}>
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400">{section}</p>
                {items.map(({ label, icon: Icon, to, disabled }) =>
                  disabled ? (
                    <div key={to} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-300 cursor-not-allowed">
                      <Icon size={15} />{label}
                    </div>
                  ) : (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => clsx(
                        'flex items-center gap-2.5 px-4 py-2 text-[13px] border-l-2 transition-colors',
                        isActive
                          ? 'text-brand-600 bg-brand-50 border-brand-600 font-medium'
                          : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                      )}
                    >
                      <Icon size={15} />{label}
                    </NavLink>
                  )
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-[11px] font-medium text-teal-700">DR</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-800 truncate">Dr. Admin</p>
            <p className="text-[10px] text-gray-400">Clinic Admin</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
