import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { BarChart2, Globe, GlobeLock, Loader2 } from 'lucide-react'
import useBasePath from '@/hooks/useBasePath'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'
import { togglePublicResult } from '@/api/elections'

export default function ResultsTab({ election }) {
  const navigate     = useNavigate()
  const basePath     = useBasePath()
  const queryClient  = useQueryClient()
  const { t }        = useTranslation()
  const superAdmin   = useAuthStore(isSuperAdmin)
  const canEditElec  = useAuthStore(hasPermission('edit-elections'))
  const canToggle    = superAdmin || canEditElec

  const toggleMutation = useMutation({
    mutationFn: () => togglePublicResult(election.id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['election', String(election.id)] }),
  })

  if (!['completed', 'active'].includes(election.status)) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        {t('results.available_when_completed')}
      </div>
    )
  }

  return (
    <div className="space-y-5 py-2">
      {/* Participant visibility row */}
      <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-card">
        <div>
          <p className="text-sm font-medium">{t('results.participant_results')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {election.is_result_published
              ? t('results.visible_to_participants')
              : t('results.not_published_to_participants')}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
          ${election.is_result_published
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-muted text-muted-foreground border-border'}`}>
          {election.is_result_published ? t('results.published') : t('results.unpublished')}
        </span>
      </div>

      {/* Public visibility toggle — only for org_admin / election_admin / super_admin */}
      {canToggle && (
        <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-card">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-1.5 rounded-lg ${election.is_public_result ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
              {election.is_public_result ? <Globe size={15} /> : <GlobeLock size={15} />}
            </div>
            <div>
              <p className="text-sm font-medium">{t('results.public_results_page')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {election.is_public_result
                  ? t('results.public_visible')
                  : t('results.public_hidden')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={election.is_public_result ? 'destructive' : 'outline'}
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="shrink-0 ml-3"
          >
            {toggleMutation.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : election.is_public_result ? t('results.make_private') : t('results.publish_publicly')}
          </Button>
        </div>
      )}

      <Button onClick={() => navigate(`${basePath}/elections/${election.id}/results`)}>
        <BarChart2 size={14} className="mr-1.5" /> {t('results.view_full_results')}
      </Button>
    </div>
  )
}
