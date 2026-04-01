import useAuthStore from '@/store/authStore'

const MANAGEMENT_ROLES = ['org_admin', 'org_user', 'election_admin', 'election_user', 'moderator']

/**
 * Returns the base path prefix for the current user's highest-priority role.
 * Super admin: '/admin'
 * Management roles: '' (root)
 * Voter/candidate: '/voter'
 */
export default function useBasePath() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])

  if (roles.includes('super_admin'))                    return '/admin'
  if (roles.some((r) => MANAGEMENT_ROLES.includes(r))) return ''
  return '/voter'
}
