import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { Vote, LayoutDashboard, Trophy } from 'lucide-react'
import useAuthStore, { selectRoles } from '@/store/authStore'

const ROLE_TITLES = {
  org_admin:      'সংগঠন অ্যাডমিন',
  org_user:       'সংগঠন ব্যবহারকারী',
  election_admin: 'নির্বাচন অ্যাডমিন',
  election_user:  'নির্বাচন ব্যবহারকারী',
}

const links = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { to: '/elections', label: 'নির্বাচন',    icon: Vote },
  { to: '/results',   label: 'ফলাফল',       icon: Trophy },
]

export default function OrgAdminLayout() {
  const roles = useAuthStore(selectRoles)
  // Show highest-priority management role title
  const title = ROLE_TITLES[roles.find((r) => ROLE_TITLES[r])] ?? 'ব্যবস্থাপনা'

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar title={title} links={links} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
