import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getResults, exportResultsPdf, exportResultsExcel } from '@/api/results'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Trophy, ChevronLeft, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']

export default function ResultsPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { t }       = useTranslation()
  const superAdmin  = useAuthStore(isSuperAdmin)
  const canExport   = useAuthStore(hasPermission('export-results'))
  const isAdmin     = superAdmin || canExport

  const { data, isLoading, error } = useQuery({
    queryKey: ['results', id],
    queryFn:  () => getResults(id).then((r) => r.data.data),
    retry: false,
  })

  async function handleExport(type) {
    try {
      const res  = type === 'pdf' ? await exportResultsPdf(id) : await exportResultsExcel(id)
      const ext  = type === 'pdf' ? 'pdf' : 'xlsx'
      const mime = type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `election-results-${id}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (_) {
      alert(t('results.export_failed'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> {t('common.loading')}
      </div>
    )
  }

  if (error) {
    const status = error.response?.status
    if (status === 403) {
      return (
        <div className="w-full max-w-lg mx-auto py-12 text-center space-y-3 px-4 sm:px-0">
          <p className="text-sm text-muted-foreground">{t('results.not_published')}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} className="mr-1" /> {t('common.back')}
          </Button>
        </div>
      )
    }
    return <p className="text-sm text-destructive py-4">{t('results.failed')}</p>
  }

  if (!data) return null

  const { election, turnout, posts } = data

  if (!election.is_result_published && !isAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 text-center space-y-3 px-4 sm:px-0">
        <p className="text-sm text-muted-foreground">{t('results.not_published')}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} className="mr-1" /> {t('common.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ChevronLeft size={14} /> {t('common.back')}
          </button>
          <h1 className="text-2xl font-bold">{election.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {election.organization} ·{' '}
            {new Date(election.election_date).toLocaleDateString('bn-BD', { dateStyle: 'long' })}
            {election.completed_at && (
              <> · {t('results.completed_on')} {new Date(election.completed_at).toLocaleDateString('bn-BD', { dateStyle: 'medium' })}</>
            )}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText size={14} className="mr-1.5" /> {t('results.export_pdf')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <FileSpreadsheet size={14} className="mr-1.5" /> {t('results.export_excel')}
            </Button>
          </div>
        )}
      </div>

      {/* Turnout summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('results.total_voters')} value={turnout.total_voters} />
        <StatCard label={t('results.votes_cast')}   value={turnout.voted_count} />
        <StatCard
          label={t('results.turnout')}
          value={`${turnout.turnout_pct}%`}
          highlight={turnout.turnout_pct >= 50}
        />
      </div>

      {/* Per-post results */}
      {posts.map((post) => (
        <PostResultCard key={post.id} post={post} t={t} />
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, highlight }) {
  return (
    <div className="border rounded-xl p-4 bg-card text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-green-600' : ''}`}>{value}</p>
    </div>
  )
}

// ─── Per-post result card ─────────────────────────────────────────────────────
function PostResultCard({ post, t }) {
  const { title, candidates, winners, total_votes } = post

  const barData = candidates.map((c) => ({
    name:  c.user.name,
    votes: c.vote_count,
  }))

  const pieData = candidates
    .filter((c) => c.vote_count > 0)
    .map((c) => ({
      name:  c.user.name,
      value: c.vote_count,
    }))

  const winnerIds = new Set(winners.map((w) => w.id))

  return (
    <div className="border rounded-xl overflow-hidden bg-card space-y-0">
      {/* Post header */}
      <div className="bg-muted/40 px-5 py-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {t('results.votes_cast_n', { count: total_votes })}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Winner cards */}
        {winners.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {winners.map((w, i) => (
              <div
                key={w.id}
                className="flex items-center gap-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg px-4 py-3 min-w-48"
              >
                <Trophy size={16} className="text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{w.user.name}</p>
                  {w.user.designation && (
                    <p className="text-xs text-muted-foreground truncate">{w.user.designation}</p>
                  )}
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {w.vote_count} {t('results.votes')}{total_votes > 0 ? ` · ${pct(w.vote_count, total_votes)}%` : ''}
                  </p>
                </div>
                {post.max_votes > 1 && (
                  <Badge variant="secondary" className="ml-auto shrink-0 text-xs">#{i + 1}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Candidate table */}
        <div className="border rounded-lg overflow-x-auto text-sm">
          <table className="w-full min-w-[500px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">{t('results.candidate')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('results.votes')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('results.share')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">
                    <p className="font-medium">{c.user.name}</p>
                    {c.user.designation && (
                      <p className="text-xs text-muted-foreground">{c.user.designation}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.vote_count}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {total_votes > 0 ? `${pct(c.vote_count, total_votes)}%` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {winnerIds.has(c.id) && (
                      <Badge variant="success" className="text-xs">{t('results.winner')}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts */}
        {candidates.length > 0 && total_votes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Bar chart */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('results.votes_per_candidate')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={winnerIds.has(candidates[i]?.id) ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('results.vote_share')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function pct(votes, total) {
  return total > 0 ? ((votes / total) * 100).toFixed(1) : '0.0'
}
