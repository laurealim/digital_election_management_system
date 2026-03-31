import useAuthStore, { isSuperAdmin } from '@/store/authStore'

const MANAGEMENT_ROLES = ['org_admin', 'org_user', 'election_admin', 'election_user']

/**
 * Returns the base path prefix for election routes based on the user's roles.
 * super_admin → '/admin', management roles → ''
 */
export default function useBasePath() {
  const roles      = useAuthStore((s) => s.user?.roles ?? [])
  const superAdmin = useAuthStore(isSuperAdmin)
  if (superAdmin) return '/admin'
  if (roles.some((r) => MANAGEMENT_ROLES.includes(r))) return ''
  return ''
}
