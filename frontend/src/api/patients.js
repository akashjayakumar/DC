import client from './client'

export const getPatients = (skip = 0, limit = 100) =>
  client.get(`/patients/?skip=${skip}&limit=${limit}`).then(r => r.data)

export const getPatient = (id) =>
  client.get(`/patients/${id}`).then(r => r.data)

export const createPatient = (data) =>
  client.post('/patients/', data).then(r => r.data)

export const updatePatient = (id, data) =>
  client.put(`/patients/${id}`, data).then(r => r.data)

export const deletePatient = (id) =>
  client.delete(`/patients/${id}`).then(r => r.data)

export const getVisits = (patientId) =>
  client.get(`/visits/patient/${patientId}`).then(r => r.data)

export const createVisit = (data) =>
  client.post('/visits/', data).then(r => r.data)

export const getDocuments = (patientId) =>
  client.get(`/documents/patient/${patientId}`).then(r => r.data)

export const uploadDocument = (formData) =>
  client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const getPatientSummary = (patientId) =>
  client.post('/ai/patient-summary', { patient_id: patientId }).then(r => r.data)

export const ragQuery = (query, patientId = null) =>
  client.post('/ai/query', { query, patient_id: patientId }).then(r => r.data)

export const predictNoShow = (data) =>
  client.post('/ai/predict-noshow', data).then(r => r.data)
