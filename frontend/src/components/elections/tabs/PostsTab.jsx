import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getPosts, createPost, updatePost, deletePost,
  getCandidates, addCandidate, removeCandidate,
} from '@/api/posts'
import { getVoters } from '@/api/voters'
import { getAcceptedNomineesForPost } from '@/api/nominations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Pencil, Trash2, UserPlus, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'

// 'published' is also editable for nominated-mode elections (nomination phase)
const canEdit = (election) =>
  ['draft', 'scheduled'].includes(election.status) ||
  (election.status === 'published' && election.candidate_mode === 'nominated')

export default function PostsTab({ election }) {
  const queryClient = useQueryClient()
  const { t }       = useTranslation()
  const qKey        = ['posts', election.id]
  const editable    = canEdit(election)
  const isOpen      = election.candidate_mode === 'open'

  const superAdmin      = useAuthStore(isSuperAdmin)
  const canManagePosts  = superAdmin || useAuthStore(hasPermission('manage-posts'))
  const canManageCands  = superAdmin || useAuthStore(hasPermission('manage-candidates'))

  const [showAddPost,  setShowAddPost]  = useState(false)
  const [editingPost,  setEditingPost]  = useState(null)
  const [expandedPost, setExpandedPost] = useState(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn:  () => getPosts(election.id).then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (postId) => deletePost(election.id, postId),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: qKey }),
  })

  function toggleExpand(postId) {
    setExpandedPost((prev) => (prev === postId ? null : postId))
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {posts.length} {t('post.position')}{posts.length !== 1 ? '' : ''}
          </span>
          {isOpen && (
            <Badge variant="secondary" className="text-xs">{t('post.open_mode_badge')}</Badge>
          )}
        </div>
        {editable && canManagePosts && (
          <Button size="sm" onClick={() => { setEditingPost(null); setShowAddPost(true) }}>
            <Plus size={14} className="mr-1" /> {t('post.add_position')}
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="border rounded-lg px-4 py-8 text-center text-sm text-muted-foreground">
          {t('post.no_positions')}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              election={election}
              editable={editable}
              canManagePosts={canManagePosts}
              canManageCands={canManageCands}
              isOpen={isOpen}
              expanded={expandedPost === post.id}
              onToggle={() => toggleExpand(post.id)}
              onEdit={() => { setEditingPost(post); setShowAddPost(true) }}
              onDelete={() => window.confirm(t('post.delete_confirm', { title: post.title })) && deleteMutation.mutate(post.id)}
              queryClient={queryClient}
            />
          ))}
        </div>
      )}

      {showAddPost && (
        <PostModal
          election={election}
          post={editingPost}
          onClose={() => setShowAddPost(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: qKey })
            setShowAddPost(false)
          }}
        />
      )}
    </div>
  )
}

function PostCard({ post, election, editable, canManagePosts, canManageCands, isOpen, expanded, onToggle, onEdit, onDelete, queryClient }) {
  const { t } = useTranslation()
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="font-medium truncate">{post.title}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({post.candidates_count ?? 0} {t('roles.candidate')})
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            · {t('post.max_votes', { count: post.max_votes })}
          </span>
          {expanded ? <ChevronUp size={14} className="ml-auto shrink-0" /> : <ChevronDown size={14} className="ml-auto shrink-0" />}
        </button>

        {editable && canManagePosts && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" title={t('common.edit')} onClick={onEdit}>
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost" size="icon" title={t('common.delete')}
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <CandidatesPanel
          election={election}
          post={post}
          editable={editable}
          canManageCands={canManageCands}
          isOpen={isOpen}
          queryClient={queryClient}
        />
      )}
    </div>
  )
}

function CandidatesPanel({ election, post, editable, canManageCands, isOpen, queryClient }) {
  const { t }          = useTranslation()
  const isNominated    = election.candidate_mode === 'nominated'
  const cKey           = ['candidates', election.id, post.id]
  const [search, setSearch]         = useState('')
  const [showAssign, setShowAssign] = useState(false)

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: cKey,
    queryFn:  () => getCandidates(election.id, post.id).then((r) => r.data.data),
  })

  const removeMutation = useMutation({
    mutationFn: (candidateId) => removeCandidate(election.id, post.id, candidateId),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: cKey })
      queryClient.invalidateQueries({ queryKey: ['posts', election.id] })
      // refresh nominee list so removed candidate reappears in dropdown
      queryClient.invalidateQueries({ queryKey: ['accepted-nominees', election.id, post.id], refetchType: 'all' })
    },
  })

  const addMutation = useMutation({
    mutationFn: (userId) => addCandidate(election.id, post.id, { user_id: userId }),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: cKey })
      queryClient.invalidateQueries({ queryKey: ['posts', election.id] })
      queryClient.invalidateQueries({ queryKey: ['accepted-nominees', election.id, post.id], refetchType: 'all' })
      setSearch('')
    },
  })

  // ── For nominated mode: fetch only accepted nominees for this post ──────────
  const { data: acceptedNominees = [], isLoading: nomineesLoading } = useQuery({
    queryKey: ['accepted-nominees', election.id, post.id],
    queryFn:  () => getAcceptedNomineesForPost(election.id, post.id).then((r) => r.data.data),
    enabled:  showAssign && isNominated,
    staleTime: 0,
  })

  // ── For selected mode: fetch all voters ────────────────────────────────────
  const { data: allVoters = [], isLoading: votersLoading } = useQuery({
    queryKey: ['all-voters', election.id],
    queryFn:  () => getVoters(election.id, { per_page: 500 }).then((r) => r.data.data ?? []),
    enabled:  showAssign && !isOpen && !isNominated,
    staleTime: 30_000,
  })

  const assignedUserIds = new Set(candidates.map((c) => c.user?.id))

  // Filter logic differs by mode
  const dropdownItems = isNominated
    ? acceptedNominees.filter((n) => {
        if (!search) return true
        const q = search.toLowerCase()
        return n.name?.toLowerCase().includes(q) || n.email?.toLowerCase().includes(q)
      })
    : allVoters.filter((v) => {
        if (assignedUserIds.has(v.user?.id)) return false
        if (!search) return true
        const q = search.toLowerCase()
        return v.user?.name?.toLowerCase().includes(q) || v.user?.email?.toLowerCase().includes(q)
      })

  const dropdownLoading = isNominated ? nomineesLoading : votersLoading

  if (isLoading) return <div className="px-4 py-3 text-sm text-muted-foreground">{t('post.loading_candidates')}</div>

  return (
    <div className="px-4 pb-3 pt-2 space-y-2 border-t bg-background">
      {isOpen ? (
        <p className="text-xs text-muted-foreground py-1">{t('post.open_mode_info')}</p>
      ) : (
        <>
          {candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">{t('post.no_candidates')}</p>
          ) : (
            <div className="space-y-1">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/40">
                  <div className="min-w-0">
                    <span className="font-medium truncate">{c.user?.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{c.user?.email}</span>
                    {c.user?.designation && (
                      <span className="text-muted-foreground text-xs ml-2">· {c.user.designation}</span>
                    )}
                  </div>
                  {editable && canManageCands && (
                    <Button
                      variant="ghost" size="icon" title={t('post.remove_candidate')}
                      className="text-destructive hover:text-destructive shrink-0 ml-2"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(c.id)}
                    >
                      <X size={13} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {editable && canManageCands && (
            <div className="pt-1">
              {!showAssign ? (
                <Button variant="outline" size="sm" onClick={() => setShowAssign(true)}>
                  <UserPlus size={13} className="mr-1" /> {t('post.assign_candidate')}
                </Button>
              ) : (
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder={isNominated ? 'গৃহীত প্রার্থী খুঁজুন…' : t('post.search_voters_placeholder')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button variant="ghost" size="icon"
                      onClick={() => { setShowAssign(false); setSearch('') }}>
                      <X size={14} />
                    </Button>
                  </div>

                  <div className="border rounded-lg text-sm max-h-48 overflow-y-auto bg-card shadow-sm">
                    {dropdownLoading ? (
                      <p className="px-3 py-2 text-muted-foreground text-xs flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" /> {t('common.loading')}
                      </p>
                    ) : dropdownItems.length === 0 ? (
                      <p className="px-3 py-2 text-muted-foreground text-xs">
                        {search
                          ? t('post.no_match')
                          : isNominated
                            ? 'এই পদের জন্য সকল গৃহীত প্রার্থী নির্ধারিত হয়েছে।'
                            : t('post.all_assigned')}
                      </p>
                    ) : (
                      dropdownItems.map((item) => {
                        const userId   = isNominated ? item.user_id   : item.user?.id
                        const name     = isNominated ? item.name      : item.user?.name
                        const email    = isNominated ? item.email     : item.user?.email
                        const subtitle = isNominated ? null           : item.user?.designation
                        return (
                          <button
                            key={isNominated ? item.nomination_id : item.id}
                            disabled={addMutation.isPending}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between gap-2 border-b last:border-0"
                            onClick={() => addMutation.mutate(userId)}
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{name}</p>
                              {subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                              )}
                            </div>
                            <span className="text-muted-foreground text-xs shrink-0">{email}</span>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {!isNominated && (
                    <p className="text-xs text-muted-foreground">
                      {t('post.voters_available', { count: dropdownItems.length })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PostModal({ election, post, onClose, onSuccess }) {
  const { t }   = useTranslation()
  const isEdit  = !!post
  const [form, setForm] = useState({
    title:       post?.title ?? '',
    description: post?.description ?? '',
    max_votes:   post?.max_votes ?? 1,
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      if (isEdit) {
        await updatePost(election.id, post.id, form)
      } else {
        await createPost(election.id, form)
      }
      onSuccess()
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ general: [err.response?.data?.message || t('post.failed_save')] })
    } finally {
      setLoading(false)
    }
  }

  function FieldError({ name }) {
    return errors[name] ? <p className="text-xs text-destructive mt-1">{errors[name][0]}</p> : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? t('post.edit_position') : t('post.add_position')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {errors.general && (
          <Alert variant="destructive"><AlertDescription>{errors.general[0]}</AlertDescription></Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="p_title">{t('post.position_title')} *</Label>
            <Input id="p_title" value={form.title} onChange={set('title')} required />
            <FieldError name="title" />
          </div>
          <div>
            <Label htmlFor="p_desc">{t('election.description')}</Label>
            <Input id="p_desc" value={form.description} onChange={set('description')} />
            <FieldError name="description" />
          </div>
          <div className="w-32">
            <Label htmlFor="p_max">{t('post.max_winners')} *</Label>
            <Input
              id="p_max" type="number" min={1} max={100}
              value={form.max_votes} onChange={set('max_votes')} required
            />
            <FieldError name="max_votes" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.saving') : isEdit ? t('common.save') : t('post.add_position')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
