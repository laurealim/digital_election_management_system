import api from './axios'

export const getStaffUsers      = (params)         => api.get('/admin/users', { params })
export const createStaffUser    = (data)           => api.post('/admin/users', data)
export const updateStaffUser    = (userId, data)   => api.put(`/admin/users/${userId}`, data)
export const updateStaffRole    = (userId, roles)  => api.put(`/admin/users/${userId}/role`, { roles })
export const toggleUserStatus   = (userId)         => api.patch(`/admin/users/${userId}/toggle-status`)
export const deactivateUser     = (userId)         => api.delete(`/admin/users/${userId}`)
export const resendSetupEmail   = (userId)         => api.post(`/admin/users/${userId}/resend-setup`)