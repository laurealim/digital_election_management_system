import { NavLink, Link } from 'react-router-dom'
import { Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PublicNavbar() {
  const linkClass = ({ isActive }) =>
    `text-sm hidden sm:inline transition-colors ${
      isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Vote size={22} className="text-primary" />
        <span className="text-xl font-bold text-primary">DEMS</span>
        <span className="hidden sm:inline text-xs text-muted-foreground ml-1">ডিজিটাল নির্বাচন ব্যবস্থাপনা</span>
      </Link>

      <div className="flex items-center gap-4">
        <NavLink to="/results"     className={linkClass}>ফলাফল</NavLink>
        <NavLink to="/voter-list"  className={linkClass}>সদস্য তালিকা</NavLink>
        <NavLink to="/nominations" className={linkClass}>মনোনয়ন</NavLink>
        <Link to="/login">
          <Button variant="ghost" size="sm">লগইন</Button>
        </Link>
      </div>
    </header>
  )
}