import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMyElections } from '@/api/votes'
import { Badge } from '@/components/ui/badge'
import CountdownTimer from '@/components/voter/CountdownTimer'
import useAuthStore from '@/store/authStore'
import { Vote, Clock, CheckCircle2, XCircle, Trophy, CalendarDays, Timer } from 'lucide-react'
import { useState, useEffect } from 'react'

const STATUS_CONFIG = {
  draft:      { label: 'Draft',     variant: 'secondary', accent: 'border-l-gray-400',   iconBg: 'bg-gray-100 dark:bg-gray-800',     iconColor: 'text-gray-500' },
  scheduled:  { label: 'Scheduled', variant: 'warning',   accent: 'border-l-amber-400',  iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  active:     { label: 'Active',    variant: 'success',   accent: 'border-l-green-500',  iconBg: 'bg-green-50 dark:bg-green-950/40', iconColor: 'text-green-500' },
  completed:  { label: 'Completed', variant: 'secondary', accent: 'border-l-blue-400',   iconBg: 'bg-blue-50 dark:bg-blue-950/40',   iconColor: 'text-blue-500' },
  cancelled:  { label: 'Cancelled', variant: 'destructive', accent: 'border-l-red-400',  iconBg: 'bg-red-50 dark:bg-red-950/40',     iconColor: 'text-red-500' },
}

// election_date comes as UTC ISO (e.g. "2026-03-29T18:00:00.000000Z" which is 2026-03-30 in UTC+6)
// voting times are stored in Asia/Dhaka (UTC+6), so extract the date in that timezone
function electionDateLocal(election) {
  const dt = new Date(election.election_date)
  // Format as YYYY-MM-DD in Asia/Dhaka timezone
  return dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) // en-CA gives YYYY-MM-DD
}

function votingStartsAt(election) {
  const dateStr = electionDateLocal(election)
  return new Date(`${dateStr}T${election.voting_start_time}+06:00`)
}

function votingEndsAt(election) {
  const dateStr = electionDateLocal(election)
  return new Date(`${dateStr}T${election.voting_end_time}+06:00`)
}

export default function VoterDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-elections'],
    queryFn:  () => getMyElections({ per_page: 50 }).then((r) => r.data.data ?? []),
    refetchInterval: (query) => {
      const list = query.state.data ?? []
      return list.some((e) => ['scheduled', 'active'].includes(e.status)) ? 15_000 : false
    },
  })

  const elections = data ?? []

  const active    = elections.filter((e) => e.status === 'active')
  const scheduled = elections.filter((e) => e.status === 'scheduled')
  const past      = elections.filter((e) => ['completed', 'cancelled'].includes(e.status))

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading your elections…</p>

  if (elections.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Vote size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">You have not been enrolled in any elections yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">My Elections</h1>

      {active.length > 0 && (
        <Section title="Active — Vote Now" icon={<Vote size={16} className="text-green-600" />}>
          {active.map((e) => <ElectionCard key={e.id} election={e} />)}
        </Section>
      )}

      {scheduled.length > 0 && (
        <Section title="Upcoming" icon={<Clock size={16} className="text-amber-500" />}>
          {scheduled.map((e) => <ElectionCard key={e.id} election={e} />)}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past Elections" icon={<CheckCircle2 size={16} className="text-muted-foreground" />}>
          {past.map((e) => <ElectionCard key={e.id} election={e} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function StatusIcon({ status, cfg }) {
  const icons = {
    scheduled: <Clock size={18} />,
    active:    <Vote size={18} />,
    completed: <CheckCircle2 size={18} />,
    cancelled: <XCircle size={18} />,
  }
  return (
    <div className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-xl ${cfg.iconBg} ${cfg.iconColor} shrink-0`}>
      {icons[status] ?? <Clock size={18} />}
    </div>
  )
}

function ElectionCard({ election }) {
  const cfg        = STATUS_CONFIG[election.status] ?? STATUS_CONFIG.draft
  const isActive   = election.status === 'active'
  const isCandidate = useAuthStore((s) => (s.user?.roles ?? []).includes('candidate'))
  const startDt    = votingStartsAt(election)
  const endDt      = votingEndsAt(election)

  // Three phases: before start, during voting, after end
  const [started, setStarted] = useState(() => Date.now() >= startDt.getTime())
  const [ended, setEnded]     = useState(() => Date.now() >= endDt.getTime())

  // Auto-transition to ended when voting time passes (only schedule timer, no sync setState)
  useEffect(() => {
    if (!started || ended) return
    const remaining = endDt.getTime() - Date.now()
    if (remaining <= 0) return // already ended — initializer handled it
    const id = setTimeout(() => setEnded(true), remaining)
    return () => clearTimeout(id)
  }, [started, ended]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasVoted = !!election.has_voted

  // Determine if "Vote Now" button should show
  const canVote = !hasVoted && (isActive || (election.status === 'scheduled' && started && !ended))

  return (
    <div className={`group relative bg-card border border-l-4 ${cfg.accent} rounded-xl overflow-hidden hover:shadow-md transition-all duration-200`}>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
        <StatusIcon status={election.status} cfg={cfg} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base truncate">{election.name}</span>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="opacity-60" />
              {new Date(election.election_date).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'Asia/Dhaka' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer size={13} className="opacity-60" />
              {election.voting_start_time?.slice(0, 5)} – {election.voting_end_time?.slice(0, 5)}
            </span>
          </div>

          {(election.status === 'scheduled' || election.status === 'active') && started && ended && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <XCircle size={12} />
              ভোটগ্রহণ শেষ হয়েছে
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-row sm:flex-col gap-2 items-start sm:items-end flex-wrap">
          {hasVoted && (election.status === 'active' || election.status === 'scheduled') && (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
              <CheckCircle2 size={14} /> ভোট দেওয়া হয়েছে
            </span>
          )}
          {canVote && !ended && (
            <Link
              to={`/voter/elections/${election.id}/vote`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-110 transition-all duration-150"
            >
              <Vote size={14} /> এখন ভোট দিন
            </Link>
          )}
          {election.status === 'completed' && (
            <Link
              to={`/voter/elections/${election.id}/results`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              ফলাফল দেখুন
            </Link>
          )}
          {election.status === 'completed' && isCandidate && (
            <Link
              to={`/voter/elections/${election.id}/my-results`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <Trophy size={13} /> আমার ফলাফল
            </Link>
          )}
        </div>
      </div>

      {/* Countdown section — full width below the card content */}
      {election.status === 'scheduled' && !started && (
        <div className="border-t border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-950/20 dark:via-transparent px-4 sm:px-5 py-3">
          <CountdownTimer targetDate={startDt} onExpire={() => setStarted(true)} />
        </div>
      )}
    </div>
  )
}
