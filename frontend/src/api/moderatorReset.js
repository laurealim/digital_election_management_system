import api from './axios'

export const getModeratorElections = () =>
  api.get('/moderator/elections')

export const getModeratorVoters = (electionId, params) =>
  api.get(`/moderator/elections/${electionId}/voters`, { params })

export const updateModeratorVoter = (voterId, data) =>
  api.put(`/moderator/voters/${voterId}`, data)

export const generateResetLink = (voterId) =>
  api.post(`/moderator/voters/${voterId}/generate-reset-link`)
