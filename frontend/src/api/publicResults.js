import api from './axios'

export const getPublicResults  = (page = 1) =>
  api.get('/public/results', { params: { page } })

export const getPublicElectionResult = (id) =>
  api.get(`/public/results/${id}`)

export const getPublicFocalPoints = () =>
  api.get('/public/focal-points')

export const getPublicVoterList = () =>
  api.get('/public/voter-list')

export const getPublicVoterListByElection = (id) =>
  api.get(`/public/voter-list/${id}`)
