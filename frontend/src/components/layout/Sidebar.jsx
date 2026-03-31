import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { logout } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { queryClient } from '@/main'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function Sidebar({ title, links }) {
  const navigate      = useNavigate()
  const { t }         = useTranslation()
  const logoutStore   = useAuthStore((s) => s.logout)
  const user          = useAuthStore((s) => s.user)

  async function handleLogout() {
    try { await logout() } catch (_) { /* ignore */ }
    queryClient.clear()
    logoutStore()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r flex flex-col">
      {/* Logo / title */}
      <div className="px-6 py-5 border-b">
        <span className="text-lg font-bold text-primary">DEMS</span>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/')}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {Icon && <Icon size={16} />}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t">
        <p className="text-xs font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate mb-3">{user?.email}</p>
        <div className="flex items-center justify-between">
          <button onClick={handleLogout} className="text-xs text-destructive hover:underline">
            {t('nav.sign_out')}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </aside>
  )
}
