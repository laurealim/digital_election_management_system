import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useAuthRefresh from '@/hooks/useAuthRefresh'

export default function AuthGuard({ children }) {
  const token = useAuthStore((s) => s.token)

  // Periodically sync roles & permissions from /auth/me
  useAuthRefresh()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
