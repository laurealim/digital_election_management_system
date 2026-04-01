import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const MANAGEMENT_ROLES = ['org_admin', 'org_user', 'election_admin', 'election_user', 'moderator']

function defaultRedirect(roles = []) {
  if (roles.includes('super_admin'))                       return '/admin/dashboard'
  if (roles.some((r) => MANAGEMENT_ROLES.includes(r)))    return '/dashboard'
  return '/voter/dashboard'
}

/**
 * allow: array of roles — user must have at least one of them to access.
 * Super admin always passes.
 */
export default function RoleGuard({ allow, children }) {
  const user  = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []

  // Super admin bypasses all role guards
  const permitted = roles.includes('super_admin') || roles.some((r) => allow.includes(r))

  if (!permitted) {
    return <Navigate to={defaultRedirect(roles)} replace />
  }

  return children
}
