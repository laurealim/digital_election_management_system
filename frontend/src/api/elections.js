import api from './axios'

export const getElections = (params) =>
  api.get('/elections', { params })

export const getElection = (id) =>
  api.get(`/elections/${id}`)

export const createElection = (data) =>
  api.post('/elections', data)

export const updateElection = (id, data) =>
  api.put(`/elections/${id}`, data)

export const deleteElection = (id) =>
  api.delete(`/elections/${id}`)

export const updateElectionStatus = (id, status) =>
  api.patch(`/elections/${id}/status`, { status })

export const duplicateElection = (id) =>
  api.post(`/elections/${id}/duplicate`)

export const togglePublicResult = (id) =>
  api.patch(`/elections/${id}/public-result`)
