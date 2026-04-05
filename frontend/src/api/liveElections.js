import api from './axios'

export const getAdminLiveElections = () =>
  api.get('/admin/live-elections')

export const toggleLiveDisplay = (electionId) =>
  api.patch(`/admin/elections/${electionId}/toggle-live-display`)

export const updateLiveRefreshInterval = (interval) =>
  api.put('/admin/settings/live-refresh-interval', { interval })
