import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getVoters, toggleModerator } from '@/api/voters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldOff, Search, Loader2 } from 'lucide-react'

export default function ModeratorsTab({ election }) {
  const queryClient = useQueryClient()
  const { t }       = useTranslation()
  const qKey        = ['voters', election.id]

  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [togglingId, setTogglingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: [...qKey, search, page],
    queryFn:  () => getVoters(election.id, { search, page, per_page: 50 }).then((r) => r.data),
    keepPreviousData: true,
  })

  const toggleMutation = useMutation({
    mutationFn: (voterId) => toggleModerator(election.id, voterId),
    onSuccess: () => {
      queryClient.invalidateQueries(qKey)
      setTogglingId(null)
    },
    onError: () => setTogglingId(null),
  })

  const voters    = data?.data ?? []
  const voterMeta = data?.meta?.pagination ?? {}

  function isModerator(voter) {
    return voter.user?.roles?.some((r) => r.name === 'moderator') ?? false
  }

  function handleToggle(voter) {
    setTogglingId(voter.id)
    toggleMutation.mutate(voter.id)
  }

  const moderatorCount = voters.filter(isModerator).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('voter.search_voters')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-64 pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {t('voter.total_voters')}: {voterMeta.total ?? voters.length}
          {moderatorCount > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({moderatorCount} {t('moderator_tab.moderators')})
            </span>
          )}
        </span>
      </div>

      {/* Voter table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('common.name')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('auth.email')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.mobile')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.designation')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {voters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {t('voter.no_voters')}
                  </td>
                </tr>
              )}
              {voters.map((v) => {
                const mod = isModerator(v)
                const isToggling = togglingId === v.id
                return (
                  <tr
                    key={v.id}
                    className={`border-t hover:bg-muted/30 transition-colors ${mod ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{v.user?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.user?.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.user?.mobile ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.user?.designation ?? '—'}</td>
                    <td className="px-4 py-3">
                      {mod ? (
                        <Badge variant="default" className="gap-1">
                          <Shield size={12} />
                          {t('moderator_tab.moderator')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t('moderator_tab.voter_only')}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={mod ? 'destructive' : 'default'}
                        disabled={isToggling}
                        onClick={() => handleToggle(v)}
                        className="gap-1.5"
                      >
                        {isToggling ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : mod ? (
                          <ShieldOff size={14} />
                        ) : (
                          <Shield size={14} />
                        )}
                        {mod ? t('moderator_tab.unassign') : t('moderator_tab.assign')}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {voterMeta.last_page > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common.page')} {voterMeta.current_page} {t('common.of')} {voterMeta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= voterMeta.last_page} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
