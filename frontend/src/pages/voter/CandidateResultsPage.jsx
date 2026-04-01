import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMyCandidateResults } from '@/api/results'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Loader2, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function CandidateResultsPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { t }    = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-candidate-results', id],
    queryFn:  () => getMyCandidateResults(id).then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> {t('common.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 text-center space-y-4 px-4 sm:px-0">
        <p className="text-muted-foreground text-sm">
          {error.response?.data?.message ?? t('results.not_published')}
        </p>
        <Button variant="outline" onClick={() => navigate('/voter/dashboard')}>
          <ChevronLeft size={14} className="mr-1" /> {t('results.back_to_dashboard')}
        </Button>
      </div>
    )
  }

  const posts = data?.posts ?? []

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-4 px-4 sm:px-0">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/voter/dashboard')}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ChevronLeft size={14} /> {t('nav.dashboard')}
        </button>
        <div className="flex items-center gap-3">
          <Trophy size={22} className="text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">{t('results.my_results_title')}</h1>
            <p className="text-sm text-muted-foreground">{data?.election?.name}</p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {t('results.not_candidate')}
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostResultCard key={post.post_id} post={post} t={t} />
          ))}
        </div>
      )}

      <Button variant="outline" onClick={() => navigate('/voter/dashboard')} className="w-full">
        <ChevronLeft size={14} className="mr-1" /> {t('results.back_to_dashboard')}
      </Button>
    </div>
  )
}

function PostResultCard({ post, t }) {
  const chartData = [
    { name: t('results.your_votes_label'), votes: post.votes_received, fill: 'hsl(var(--primary))' },
    {
      name: t('results.others_label'),
      votes: Math.max(0, post.total_votes_cast - post.votes_received),
      fill: 'hsl(var(--muted))',
    },
  ]

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Post header */}
      <div className="bg-muted/40 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold">{post.post_title}</p>
          <p className="text-xs text-muted-foreground">{t('results.post_name_label')}</p>
        </div>
        <Badge variant={post.percentage >= 50 ? 'success' : 'secondary'}>
          {post.percentage}%
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{post.votes_received}</p>
            <p className="text-xs text-muted-foreground">{t('results.votes_received')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{post.total_votes_cast}</p>
            <p className="text-xs text-muted-foreground">{t('results.total_votes')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{post.percentage}%</p>
            <p className="text-xs text-muted-foreground">{t('results.your_share')}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{t('results.vote_rate_label')}</span>
            <span>{post.percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${post.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
