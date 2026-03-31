import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicElectionResult } from '@/api/publicResults'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users, CheckCircle2, BarChart2, Loader2 } from 'lucide-react'

const COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-sky-500 to-sky-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-teal-500 to-teal-600',
  'from-fuchsia-500 to-fuchsia-600',
]

const BAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500',   'bg-teal-500', 'bg-fuchsia-500',
]

export default function PublicElectionResultPage() {
  const { id } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-result', id],
    queryFn:  () => getPublicElectionResult(id).then((r) => r.data.data),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <p className="text-muted-foreground">ফলাফল পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।</p>
        <Link to="/results" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={13} /> সকল ফলাফলে ফিরুন
        </Link>
      </div>
    )
  }

  const { election, turnout, posts } = data

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top nav */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/results"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft size={14} /> সকল ফলাফল
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-sm font-medium truncate">{election.name}</span>
        </div>
      </header>

      {/* Election hero */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">{election.organization}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{election.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-200">
            <span>
              {new Date(election.election_date).toLocaleDateString('bn-BD', { dateStyle: 'long' })}
            </span>
            {election.completed_at && (
              <>
                <span className="opacity-40">·</span>
                <span>
                  সম্পন্ন: {new Date(election.completed_at).toLocaleDateString('bn-BD', { dateStyle: 'medium' })}
                </span>
              </>
            )}
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
              ফলাফল প্রকাশিত
            </Badge>
          </div>
        </div>
      </div>

      {/* Turnout stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-5">
        <div className="grid grid-cols-3 gap-4">
          <TurnoutCard
            icon={<Users size={18} />}
            label="মোট ভোটার"
            value={turnout.total_voters}
            color="bg-white dark:bg-slate-800"
          />
          <TurnoutCard
            icon={<CheckCircle2 size={18} />}
            label="ভোট প্রদান"
            value={turnout.voted_count}
            color="bg-white dark:bg-slate-800"
          />
          <TurnoutCard
            icon={<BarChart2 size={18} />}
            label="ভোটার উপস্থিতি"
            value={`${turnout.turnout_pct}%`}
            color="bg-white dark:bg-slate-800"
            highlight
            sub={
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${Math.min(turnout.turnout_pct, 100)}%` }}
                />
              </div>
            }
          />
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {posts.map((post, pi) => (
          <PostResultSection key={post.id} post={post} index={pi} />
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-6 mt-4">
        <p className="text-center text-xs text-muted-foreground">
          DEMS — Digital Election Management System
        </p>
      </footer>
    </div>
  )
}

// ─── Turnout stat card ────────────────────────────────────────────────────────
function TurnoutCard({ icon, label, value, color, highlight, sub }) {
  return (
    <div className={`${color} rounded-xl shadow-sm border px-4 py-4`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
        {icon} {label}
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
        {value}
      </p>
      {sub}
    </div>
  )
}

// ─── Per-post results section ─────────────────────────────────────────────────
function PostResultSection({ post, index }) {
  const { title, candidates, winners, total_votes, max_votes } = post
  const winnerIds  = new Set(winners.map((w) => w.id))
  const maxVoteInPost = candidates[0]?.vote_count ?? 1

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden">
      {/* Post header */}
      <div className={`bg-gradient-to-r ${COLORS[index % COLORS.length]} px-6 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">পদ</p>
          <h2 className="text-white font-bold text-lg">{title}</h2>
        </div>
        <div className="text-right text-white/80 text-sm">
          <p className="text-2xl font-bold text-white">{total_votes}</p>
          <p className="text-xs">মোট ভোট</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Winner(s) */}
        {winners.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Trophy size={13} /> বিজয়ী
            </p>
            <div className="flex flex-wrap gap-3">
              {winners.map((w, i) => (
                <WinnerCard key={w.id} winner={w} rank={i + 1} showRank={max_votes > 1} total={total_votes} />
              ))}
            </div>
          </div>
        )}

        {/* Candidates */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            প্রার্থীদের ভোট
          </p>
          <div className="space-y-3">
            {candidates.map((c, ci) => (
              <CandidateBar
                key={c.id}
                candidate={c}
                isWinner={winnerIds.has(c.id)}
                total={total_votes}
                maxVote={maxVoteInPost}
                colorClass={BAR_COLORS[ci % BAR_COLORS.length]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Winner card ──────────────────────────────────────────────────────────────
function WinnerCard({ winner, rank, showRank, total }) {
  const pct = total > 0 ? ((winner.vote_count / total) * 100).toFixed(1) : '0'
  return (
    <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 min-w-56 max-w-xs">
      <div className="bg-amber-400 dark:bg-amber-500 text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0 font-bold text-sm">
        {showRank ? `#${rank}` : <Trophy size={16} />}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{winner.user.name}</p>
        {winner.user.designation && (
          <p className="text-xs text-muted-foreground truncate">{winner.user.designation}</p>
        )}
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
          {winner.vote_count} ভোট · {pct}%
        </p>
      </div>
    </div>
  )
}

// ─── Candidate bar row ────────────────────────────────────────────────────────
function CandidateBar({ candidate, isWinner, total, maxVote, colorClass }) {
  const pct      = total > 0 ? ((candidate.vote_count / total) * 100).toFixed(1) : 0
  const barWidth = maxVote > 0 ? (candidate.vote_count / maxVote) * 100 : 0
  const initials = candidate.user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isWinner ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-muted/40'}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isWinner ? 'bg-amber-400' : 'bg-slate-400 dark:bg-slate-600'}`}>
        {initials}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-medium truncate">{candidate.user.name}</p>
            {candidate.user.designation && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                · {candidate.user.designation}
              </p>
            )}
            {isWinner && (
              <Trophy size={12} className="text-amber-500 shrink-0" />
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <span className="text-sm font-bold tabular-nums">{candidate.vote_count}</span>
            <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-amber-400' : colorClass}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  )
}
