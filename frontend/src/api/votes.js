import api from './axios'

export const getMyElections = (params) =>
  api.get('/elections', { params })

export const getElection = (electionId) =>
  api.get(`/elections/${electionId}`)

export const getVotingStatus = (electionId) =>
  api.get(`/elections/${electionId}/voting-status`)

export const castVote = (electionId, votes) =>
  api.post(`/elections/${electionId}/vote`, { votes })

export const getElectionPosts = (electionId) =>
  api.get(`/elections/${electionId}/posts`)

export const getPostCandidates = (electionId, postId) =>
  api.get(`/elections/${electionId}/posts/${postId}/candidates`)
