import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { Building2, LayoutDashboard, Vote, ShieldCheck, Trophy, UserCog, KeyRound, Radio } from 'lucide-react'

const links = [
  { to: '/admin/dashboard',     label: 'ড্যাশবোর্ড',       icon: LayoutDashboard },
  { to: '/admin/organizations', label: 'সংগঠন',            icon: Building2 },
  { to: '/admin/users',         label: 'ব্যবহারকারী',       icon: UserCog },
  { to: '/admin/elections',     label: 'নির্বাচন',          icon: Vote },
  { to: '/admin/live-elections', label: 'লাইভ স্ট্যাটাস',   icon: Radio },
  { to: '/admin/roles',         label: 'ভূমিকা ও অনুমতি',  icon: ShieldCheck },
  { to: '/results',             label: 'ফলাফল',             icon: Trophy },
  { to: '/admin/reset-password', label: 'পাসওয়ার্ড রিসেট', icon: KeyRound },
]

export default function SuperAdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar title="সুপার অ্যাডমিন" links={links} />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
