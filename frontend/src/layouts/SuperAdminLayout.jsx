import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { Building2, LayoutDashboard, Vote, ShieldCheck, Trophy, UserCog } from 'lucide-react'

const links = [
  { to: '/admin/dashboard',     label: 'ড্যাশবোর্ড',       icon: LayoutDashboard },
  { to: '/admin/organizations', label: 'সংগঠন',            icon: Building2 },
  { to: '/admin/users',         label: 'ব্যবহারকারী',       icon: UserCog },
  { to: '/admin/elections',     label: 'নির্বাচন',          icon: Vote },
  { to: '/admin/roles',         label: 'ভূমিকা ও অনুমতি',  icon: ShieldCheck },
  { to: '/results',             label: 'ফলাফল',             icon: Trophy },
]

export default function SuperAdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar title="সুপার অ্যাডমিন" links={links} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
