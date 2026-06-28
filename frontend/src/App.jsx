import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import NewPatientPage from './pages/NewPatientPage'
import PatientSummaryPage from './pages/PatientSummaryPage'
import AskRecordsPage from './pages/AskRecordsPage'
import InsurancePage from './pages/InsurancePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/patients" replace />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/new" element={<NewPatientPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="summary" element={<PatientSummaryPage />} />
        <Route path="ask" element={<AskRecordsPage />} />
        <Route path="insurance" element={<InsurancePage />} />
      </Route>
    </Routes>
  )
}
