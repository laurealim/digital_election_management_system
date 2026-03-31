import api from './axios'

export const getPublicResults  = (page = 1) =>
  api.get('/public/results', { params: { page } })

export const getPublicElectionResult = (id) =>
  api.get(`/public/results/${id}`)
