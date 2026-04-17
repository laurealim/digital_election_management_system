import api from './axios'

// ─── Public endpoints (no auth required) ─────────────────────────────────────

export const getDesignations = () =>
  api.get('/public/designations')

export const getPublishedElections = (params) =>
  api.get('/public/elections', { params })

export const submitNomination = (data) =>
  api.post('/public/nominations', data)

export const trackNomination = (params) =>
  api.get('/public/nominations/track', { params })

export const getNominationPdfUrl = (token) =>
  `${import.meta.env.VITE_API_BASE_URL}/api/v1/public/nominations/${token}/pdf`

// ─── EC / Admin endpoints (require auth + manage-nominations permission) ─────

export const getElectionNominations = (electionId, params) =>
  api.get(`/elections/${electionId}/nominations`, { params })

export const getNomination = (electionId, nominationId) =>
  api.get(`/elections/${electionId}/nominations/${nominationId}`)

export const verifyNomination = (electionId, nominationId) =>
  api.patch(`/elections/${electionId}/nominations/${nominationId}/verify`)

export const rejectNomination = (electionId, nominationId, data) =>
  api.patch(`/elections/${electionId}/nominations/${nominationId}/reject`, data)

export const markNominationPaid = (electionId, nominationId) =>
  api.patch(`/elections/${electionId}/nominations/${nominationId}/mark-paid`)

export const acceptNomination = (electionId, nominationId) =>
  api.patch(`/elections/${electionId}/nominations/${nominationId}/accept`)

export const getAcceptedNomineesForPost = (electionId, postId) =>
  api.get(`/elections/${electionId}/posts/${postId}/accepted-nominations`)