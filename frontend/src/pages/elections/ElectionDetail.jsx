import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getElection, updateElectionStatus, duplicateElection, deleteElection } from '@/api/elections'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Copy, Pencil, Trash2, PlayCircle, StopCircle, XCircle, CalendarClock } from 'lucide-react'
import useBasePath from '@/hooks/useBasePath'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'

import VotersTab       from '@/components/elections/tabs/VotersTab'
import PostsTab        from '@/components/elections/tabs/PostsTab'
import ResultsTab      from '@/components/elections/tabs/ResultsTab'
import ModeratorsTab   from '@/components/elections/tabs/ModeratorsTab'
import NominationsTab  from '@/components/elections/tabs/NominationsTab'

const STATUS_VARIANTS = {
  draft: 'secondary', published: 'info', scheduled: 'warning', active: 'success',
  completed: 'outline', cancelled: 'destructive',
}

const ALLOWED_TRANSITIONS = {
  draft:     ['published', 'scheduled', 'cancelled'],
  published: ['draft', 'scheduled', 'cancelled'],
  scheduled: ['draft', 'active', 'cancelled'],
  active:    ['completed', 'cancelled'],
}

export default function ElectionDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const basePath    = useBasePath()
  const queryClient = useQueryClient()
  const { t }       = useTranslation()
  const [tab, setTab] = useState('overview')
  const superAdmin      = useAuthStore(isSuperAdmin)
  const canEdit         = useAuthStore(hasPermission('edit-elections'))
  const canDelete       = useAuthStore(hasPermission('delete-elections'))
  const canCreate       = useAuthStore(hasPermission('create-elections'))
  const canManageNominations = useAuthStore(hasPermission('manage-nominations'))

  const canChangeStatus = superAdmin || canEdit

  const TABS = [
    { key: 'overview',  label: t('election.overview') },
    { key: 'voters',    label: t('election.voters') },
    { key: 'posts',     label: t('election.posts_candidates') },
    ...(superAdmin || canEdit ? [{ key: 'moderators', label: t('moderator_tab.title') }] : []),
    ...(canManageNominations ? [{ key: 'nominations', label: 'মনোনয়ন' }] : []),
    { key: 'results',   label: t('election.results') },
  ]

  const TRANSITION_CONFIG = {
    published: { label: 'মনোনয়নে প্রকাশ করুন',         icon: CalendarClock, variant: 'outline' },
    scheduled: { label: t('election.schedule'),          icon: CalendarClock, variant: 'outline' },
    draft:     { label: t('election.back_to_draft'),     icon: ArrowLeft,     variant: 'outline' },
    active:    { label: t('election.start_now'),         icon: PlayCircle,    variant: 'default'  },
    completed: { label: t('election.mark_completed'),    icon: StopCircle,    variant: 'outline' },
    cancelled: { label: t('election.cancel_election'),   icon: XCircle,       variant: 'destructive' },
  }

  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn:  () => getElection(id).then((r) => r.data.data),
    refetchInterval: (query) =>
      ['scheduled', 'active'].includes(query.state.data?.status) ? 10_000 : false,
  })

  const statusMutation = useMutation({
    mutationFn: (status) => updateElectionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election', id] })
      queryClient.invalidateQueries({ queryKey: ['elections'] })
      queryClient.invalidateQueries({ queryKey: ['my-elections'] })
    },
  })

  const dupeMutation = useMutation({
    mutationFn: () => duplicateElection(id),
    onSuccess:  (res) => {
      queryClient.invalidateQueries({ queryKey: ['elections'] })
      navigate(`${basePath}/elections/${res.data.data.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteElection(id),
    onSuccess:  () => navigate(`${basePath}/elections`, { replace: true }),
  })

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">{t('common.loading')}</div>
  if (!election) return <div className="p-6 text-destructive text-sm">{t('election.not_found')}</div>

  const transitions    = ALLOWED_TRANSITIONS[election.status] ?? []
  const isEditable     = ['draft', 'published', 'scheduled'].includes(election.status)

  const statusLabels = {
    draft: t('election.draft'), published: 'প্রকাশিত', scheduled: t('election.scheduled'),
    active: t('election.active'), completed: t('election.completed'), cancelled: t('election.cancelled'),
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <Link to={`${basePath}/elections`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft size={14} /> {t('election.elections')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{election.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{election.election_date}</span>
              <span>{election.voting_start_time?.slice(0,5)} – {election.voting_end_time?.slice(0,5)}</span>
              <Badge variant={STATUS_VARIANTS[election.status]}>
                {statusLabels[election.status] ?? election.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {canChangeStatus && transitions.map((s) => {
              const cfg  = TRANSITION_CONFIG[s]
              const Icon = cfg.icon
              return (
                <Button
                  key={s}
                  variant={cfg.variant}
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    if (s === 'cancelled' && !window.confirm(t('election.cancel_confirm'))) return
                    if (s === 'completed' && !window.confirm(t('election.complete_confirm'))) return
                    statusMutation.mutate(s)
                  }}
                >
                  <Icon size={14} className="mr-1.5" />{cfg.label}
                </Button>
              )
            })}

            {(superAdmin || canEdit) && isEditable && (
              <Button variant="outline" size="icon" asChild title={t('common.edit')}>
                <Link to={`${basePath}/elections/${id}/edit`}><Pencil size={15} /></Link>
              </Button>
            )}

            {(superAdmin || canCreate) && (
              <Button
                variant="outline" size="icon" title={t('election.duplicate')}
                disabled={dupeMutation.isPending}
                onClick={() => dupeMutation.mutate()}
              >
                <Copy size={15} />
              </Button>
            )}

            {(superAdmin || canDelete) && isEditable && (
              <Button
                variant="outline" size="icon" title={t('common.delete')}
                className="text-destructive hover:text-destructive"
                disabled={deleteMutation.isPending}
                onClick={() => window.confirm(t('election.delete_confirm')) && deleteMutation.mutate()}
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === tb.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tab === 'overview'     && <OverviewTab election={election} />}
        {tab === 'voters'       && <VotersTab election={election} />}
        {tab === 'posts'        && <PostsTab election={election} />}
        {tab === 'moderators'   && <ModeratorsTab election={election} />}
        {tab === 'nominations'  && <NominationsTab election={election} />}
        {tab === 'results'      && <ResultsTab election={election} />}
      </div>
    </div>
  )
}

function OverviewTab({ election }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
      <Row label={t('election.candidate_mode_label')} value={election.candidate_mode === 'open' ? t('election.candidate_mode_open') : t('election.candidate_mode_selected')} />
      <Row label={t('election.allow_multi_post')} value={election.allow_multi_post ? t('election.multi_post_allowed') : t('election.multi_post_not_allowed')} />
      <Row label={t('election.results_published_label')} value={election.is_result_published ? t('election.result_published') : t('election.result_not_published')} />
      {election.description && (
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('election.description')}</p>
          <p>{election.description}</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </>
  )
}
