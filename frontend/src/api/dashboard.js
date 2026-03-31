import api from './axios'

export const getOrgAdminDashboard  = () => api.get('/dashboard')
export const getSuperAdminDashboard = () => api.get('/admin/dashboard')
