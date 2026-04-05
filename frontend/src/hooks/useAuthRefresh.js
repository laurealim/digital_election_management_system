import { useQuery } from '@tanstack/react-query'
import { me } from '@/api/auth'
import useAuthStore from '@/store/authStore'

/**
 * Periodically polls GET /auth/me (every 60s) and syncs
 * roles + permissions into the Zustand store so that
 * permission changes made by super admin take effect
 * without the user having to log out & back in.
 */
export default function useAuthRefresh() {
  const token      = useAuthStore((s) => s.token)
  const updateUser = useAuthStore((s) => s.updateUser)

  useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await me()
      const user = res.data.data
      updateUser(user)
      return user
    },
    enabled: !!token,
    refetchInterval: 60_000,          // every 60 seconds
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    retry: false,
  })
}
