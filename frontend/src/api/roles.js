import api from './axios'

// ─── Permissions matrix ───────────────────────────────────────────────────────
export const getRolesAndPermissions = ()              => api.get('/admin/roles')
export const updateRolePermissions  = (roleId, perms) => api.put(`/admin/roles/${roleId}/permissions`, { permissions: perms })

// ─── Voter + role management ──────────────────────────────────────────────────
export const getVotersWithRoles  = (params)           => api.get('/admin/voters', { params })
export const syncUserRoles       = (userId, roles)    => api.put(`/admin/users/${userId}/roles`, { roles })

// ─── Filter dropdowns ─────────────────────────────────────────────────────────
export const getOrganizationsList = ()                => api.get('/admin/organizations-list')
export const getElectionsList     = (orgId)           => api.get('/admin/elections-list', { params: { organization_id: orgId } })

// ─── Staff users (for RolesPage staff tab) ────────────────────────────────────
export const getStaffUsers    = (params)       => api.get('/admin/users', { params })
export const updateStaffRole  = (userId, roles) => api.put(`/admin/users/${userId}/role`, { roles })
