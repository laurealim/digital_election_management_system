import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getElections, deleteElection, duplicateElection } from '@/api/elections'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Trash2, Eye, Pencil } from 'lucide-react'
import useBasePath from '@/hooks/useBasePath'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'

const STATUS_VARIANTS = {
  draft:     'secondary',
  scheduled: 'warning',
  active:    'success',
  completed: 'outline',
  cancelled: 'destructive',
}

export default function ElectionList() {
  const queryClient = useQueryClient()
  const basePath    = useBasePath()
  const { t }       = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page,   setPage]   = useState(1)

  const superAdmin   = useAuthStore(isSuperAdmin)
  const canCreate    = useAuthStore(hasPermission('create-elections'))
  const canEdit      = useAuthStore(hasPermission('edit-elections'))
  const canDelete    = useAuthStore(hasPermission('delete-elections'))
  const canDuplicate = superAdmin || canCreate

  const { data, isLoading } = useQuery({
    queryKey: ['elections', search, status, page],
    queryFn:  () => getElections({ search, status, page, per_page: 15 }).then((r) => r.data),
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      const list = query.state.data?.data ?? []
      return list.some((e) => ['scheduled', 'active'].includes(e.status)) ? 15_000 : false
    },
  })

  const remove = useMutation({
    mutationFn: (id) => deleteElection(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['elections'] }),
  })

  const dupe = useMutation({
    mutationFn: (id) => duplicateElection(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['elections'] }),
  })

  const elections = data?.data ?? []
  const meta      = data?.meta?.pagination ?? {}

  function confirmDelete(election) {
    if (window.confirm(`"${election.name}" ${t('election.delete_confirm')}`)) {
      remove.mutate(election.id)
    }
  }

  const statusLabels = {
    draft: t('election.draft'), scheduled: t('election.scheduled'),
    active: t('election.active'), completed: t('election.completed'), cancelled: t('election.cancelled'),
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('election.elections')}</h1>
        {(superAdmin || canCreate) && (
          <Button asChild>
            <Link to={`${basePath}/elections/new`}>+ {t('election.new')}</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={`${t('common.search')}…`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-48"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('election.all_statuses')}</option>
          {['draft','scheduled','active','completed','cancelled'].map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('election.title')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('election.election_date')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('election.voting_window')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {elections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {t('election.no_elections')}।{' '}
                    {(superAdmin || canCreate) && (
                      <Link to={`${basePath}/elections/new`} className="text-primary hover:underline">
                        {t('election.create_one')}
                      </Link>
                    )}{(superAdmin || canCreate) ? '।' : ''}
                  </td>
                </tr>
              )}
              {elections.map((el) => (
                <tr key={el.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`${basePath}/elections/${el.id}`} className="font-medium hover:text-primary">
                      {el.name}
                    </Link>
                    {el.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{el.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{el.election_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {el.voting_start_time} – {el.voting_end_time}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[el.status] ?? 'secondary'}>
                      {statusLabels[el.status] ?? el.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" asChild title={t('common.view')}>
                        <Link to={`${basePath}/elections/${el.id}`}><Eye size={15} /></Link>
                      </Button>
                      {(superAdmin || canEdit) && ['draft','scheduled'].includes(el.status) && (
                        <Button variant="ghost" size="icon" asChild title={t('common.edit')}>
                          <Link to={`${basePath}/elections/${el.id}/edit`}><Pencil size={15} /></Link>
                        </Button>
                      )}
                      {canDuplicate && (
                        <Button
                          variant="ghost" size="icon" title={t('election.duplicate')}
                          disabled={dupe.isPending}
                          onClick={() => dupe.mutate(el.id)}
                        >
                          <Copy size={15} />
                        </Button>
                      )}
                      {(superAdmin || canDelete) && ['draft','scheduled'].includes(el.status) && (
                        <Button
                          variant="ghost" size="icon" title={t('common.delete')}
                          className="text-destructive hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => confirmDelete(el)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-muted-foreground">
            {t('common.page')} {meta.current_page} {t('common.of')} {meta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
