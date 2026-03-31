import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const logout = () =>
  api.post('/auth/logout')

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (data) =>
  api.post('/auth/reset-password', data)

export const setupPassword = (data) =>
  api.post('/auth/setup-password', data)

export const me = () =>
  api.get('/auth/me')
