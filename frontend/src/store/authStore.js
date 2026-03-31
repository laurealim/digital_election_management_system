import { create } from 'zustand'

const TOKEN_KEY = 'dems_token'
const USER_KEY  = 'dems_user'

const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user:  JSON.parse(localStorage.getItem(USER_KEY) || 'null'),

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
}))

export default useAuthStore

// ─── Convenience selectors (use inside components) ───────────────────────────

/** Returns the user's roles array, e.g. ['org_admin', 'voter'] */
export const selectRoles = (s) => s.user?.roles ?? []

/** Returns the user's permissions array, e.g. ['create-elections', ...] */
export const selectPermissions = (s) => s.user?.permissions ?? []

/** True if user has the given role */
export const hasRole = (role) => (s) => (s.user?.roles ?? []).includes(role)

/** True if user has the given permission */
export const hasPermission = (perm) => (s) => (s.user?.permissions ?? []).includes(perm)

/** True if user is super_admin (bypasses all permission checks) */
export const isSuperAdmin = (s) => (s.user?.roles ?? []).includes('super_admin')
