import api from './axios'

export const getResults = (electionId) =>
  api.get(`/elections/${electionId}/results`)

export const exportResultsPdf = (electionId) =>
  api.get(`/elections/${electionId}/results/export/pdf`, { responseType: 'blob' })

export const exportResultsExcel = (electionId) =>
  api.get(`/elections/${electionId}/results/export/excel`, { responseType: 'blob' })

export const getMyCandidateResults = (electionId) =>
  api.get(`/elections/${electionId}/results/mine`)
