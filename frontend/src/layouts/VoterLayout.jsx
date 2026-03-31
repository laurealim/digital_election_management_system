import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { logout } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { queryClient } from '@/main'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function VoterLayout() {
  const navigate    = useNavigate()
  const { t }       = useTranslation()
  const logoutStore = useAuthStore((s) => s.logout)
  const user        = useAuthStore((s) => s.user)

  async function handleLogout() {
    try { await logout() } catch (_) { /* ignore */ }
    queryClient.clear()
    logoutStore()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top nav bar */}
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-primary">DEMS</span>
        <nav className="flex items-center gap-6">
          <NavLink
            to="/voter/dashboard"
            className={({ isActive }) =>
              cn('text-sm font-medium', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
            }
          >
            {t('nav.my_elections')}
          </NavLink>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{user?.name}</span>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="text-destructive hover:underline text-xs">
            {t('nav.sign_out')}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
