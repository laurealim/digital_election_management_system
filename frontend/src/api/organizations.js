import api from './axios'

// Public
export const registerOrganization = (data) =>
  api.post('/organizations', data)

// Org admin
export const getMyOrganization = (id) =>
  api.get(`/organizations/${id}`)

// Super admin
export const getAdminOrganizations = (params) =>
  api.get('/admin/organizations', { params })

export const getAdminOrganization = (id) =>
  api.get(`/admin/organizations/${id}`)

export const toggleOrganizationStatus = (id) =>
  api.patch(`/admin/organizations/${id}/toggle-status`)

export const createAdminOrganization = (data) =>
  api.post('/admin/organizations', data)
