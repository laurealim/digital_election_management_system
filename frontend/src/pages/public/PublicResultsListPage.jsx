import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicResults } from '@/api/publicResults'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, BarChart2, CalendarDays, ChevronRight, ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function PublicResultsListPage() {
  const [page, setPage] = useState(1)
  const { user }        = useAuthStore()
  const navigate        = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['public-results', page],
    queryFn:  () => getPublicResults(page).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const elections = data?.data ?? []
  const meta      = data?.meta?.pagination ?? {}

  // Determine where "dashboard" takes a logged-in user
  function dashboardPath() {
    if (!user) return null
    if ((user.roles ?? []).includes('super_admin')) return '/admin/dashboard'
    if ((user.roles ?? []).some((r) => ['voter', 'candidate'].includes(r))) return '/voter/dashboard'
    return '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
      {/* Top bar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary tracking-tight">DEMS</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Button size="sm" variant="outline" onClick={() => navigate(dashboardPath())}>
                <LayoutDashboard size={14} className="mr-1.5" /> ড্যাশবোর্ড
              </Button>
            ) : (
              <>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ArrowLeft size={14} /> হোমে ফিরুন
                </Link>
                <Link to="/login">
                  <Button size="sm" variant="outline">লগইন</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-3">
              <Trophy size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold">নির্বাচনী ফলাফল</h1>
          <p className="text-indigo-200 text-sm">প্রকাশিত নির্বাচনের চূড়ান্ত ফলাফলসমূহ</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p>এখনো কোনো ফলাফল প্রকাশিত হয়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {elections.map((el) => (
              <ElectionCard key={el.id} election={el} />
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              পূর্ববর্তী
            </Button>
            <span className="text-muted-foreground">
              পৃষ্ঠা {meta.current_page} / {meta.last_page}
            </span>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>
              পরবর্তী
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ElectionCard({ election }) {
  const turnout = election.turnout_pct ?? 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border hover:shadow-md transition-shadow flex flex-col">
      {/* Card header */}
      <div className="p-5 flex-1 space-y-3">
        <div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide truncate">
            {election.organization}
          </p>
          <h2 className="font-bold text-base mt-0.5 leading-snug">{election.name}</h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays size={12} />
          {new Date(election.election_date).toLocaleDateString('bn-BD', { dateStyle: 'medium' })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatPill icon={<BarChart2 size={12} />} label="পদ" value={election.posts_count} />
          <StatPill icon={<Users size={12} />}     label="ভোটার" value={election.voters_count} />
          <StatPill icon={<Trophy size={12} />}    label="উপস্থিতি" value={`${turnout}%`} highlight={turnout >= 50} />
        </div>

        {/* Turnout bar */}
        <div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${Math.min(turnout, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link to={`/results/${election.id}`}>
          <Button className="w-full gap-2" size="sm">
            ফলাফল দেখুন <ChevronRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function StatPill({ icon, label, value, highlight }) {
  return (
    <div className="bg-muted/50 rounded-lg px-2 py-1.5 text-center">
      <div className={`text-sm font-bold ${highlight ? 'text-green-600 dark:text-green-400' : ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
        {icon} {label}
      </div>
    </div>
  )
}
