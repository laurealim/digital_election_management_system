import api from './axios'

export const getVoters = (electionId, params) =>
  api.get(`/elections/${electionId}/voters`, { params })

export const addVoter = (electionId, data) =>
  api.post(`/elections/${electionId}/voters`, data)

export const updateVoter = (electionId, voterId, data) =>
  api.put(`/elections/${electionId}/voters/${voterId}`, data)

export const deleteVoter = (electionId, voterId) =>
  api.delete(`/elections/${electionId}/voters/${voterId}`)

export const resendInvitation = (electionId, voterId) =>
  api.post(`/elections/${electionId}/voters/${voterId}/resend-invitation`)

export const copyVotersFrom = (electionId, sourceElectionId) =>
  api.post(`/elections/${electionId}/voters/copy-from/${sourceElectionId}`)

export const importVoters = (electionId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/elections/${electionId}/voters/import`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const exportVoters = (electionId) =>
  api.get(`/elections/${electionId}/voters/export`, { responseType: 'blob' })

export const sendBulkInvitations = (electionId, voterIds = []) =>
  api.post(`/elections/${electionId}/voters/send-invitations`, { voter_ids: voterIds })
