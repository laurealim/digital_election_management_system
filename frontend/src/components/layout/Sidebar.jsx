import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { logout } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { queryClient } from '@/main'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { Menu, X } from 'lucide-react'

export default function Sidebar({ title, links }) {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { t }         = useTranslation()
  const logoutStore   = useAuthStore((s) => s.logout)
  const user          = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    try { await logout() } catch (_) { /* ignore */ }
    queryClient.clear()
    logoutStore()
    navigate('/login', { replace: true })
  }

  const sidebarContent = (
    <>
      {/* Logo / title */}
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-primary">DEMS</span>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        </div>
        <button className="lg:hidden p-1" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/')}
            onClick={() => setOpen(false)}
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
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="p-1">
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold text-primary">DEMS</span>
        </div>
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.name}</span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <aside
            className="w-64 h-full bg-card flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-card border-r flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}
