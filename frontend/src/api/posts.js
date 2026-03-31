import api from './axios'

export const getPosts = (electionId) =>
  api.get(`/elections/${electionId}/posts`)

export const createPost = (electionId, data) =>
  api.post(`/elections/${electionId}/posts`, data)

export const updatePost = (electionId, postId, data) =>
  api.put(`/elections/${electionId}/posts/${postId}`, data)

export const deletePost = (electionId, postId) =>
  api.delete(`/elections/${electionId}/posts/${postId}`)

export const getCandidates = (electionId, postId) =>
  api.get(`/elections/${electionId}/posts/${postId}/candidates`)

export const addCandidate = (electionId, postId, data) =>
  api.post(`/elections/${electionId}/posts/${postId}/candidates`, data)

export const removeCandidate = (electionId, postId, candidateId) =>
  api.delete(`/elections/${electionId}/posts/${postId}/candidates/${candidateId}`)
