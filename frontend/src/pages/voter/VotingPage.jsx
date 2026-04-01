import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getElection, getVotingStatus, getElectionPosts, getPostCandidates, castVote,
} from '@/api/votes'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, Loader2, Search, User, List, X } from 'lucide-react'

const STEP_INSTRUCTIONS = 'instructions'
const STEP_BALLOT       = 'ballot'
const STEP_REVIEW       = 'review'
const STEP_CONFIRMED    = 'confirmed'

export default function VotingPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { t }    = useTranslation()
  const [step,   setStep]   = useState(STEP_INSTRUCTIONS)
  const [ballot, setBallot] = useState({})

  const { data: election, isLoading: loadingElection } = useQuery({
    queryKey: ['election', id],
    queryFn:  () => getElection(id).then((r) => r.data.data),
    refetchInterval: (query) =>
      ['scheduled', 'active'].includes(query.state.data?.status) ? 10_000 : false,
  })

  const { data: voteStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['voting-status', id],
    queryFn:  () => getVotingStatus(id).then((r) => r.data.data),
    staleTime: 0,
    retry: false,
  })

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['voting-posts', id],
    queryFn:  async () => {
      const postsRes = await getElectionPosts(id)
      const postList = postsRes.data.data ?? []
      const withCandidates = await Promise.all(
        postList.map(async (post) => {
          const candRes = await getPostCandidates(id, post.id)
          return { ...post, candidates: candRes.data.data ?? [] }
        })
      )
      return withCandidates
    },
    enabled: step === STEP_BALLOT || step === STEP_REVIEW,
  })

  const queryClient = useQueryClient()

  const submitMutation = useMutation({
    mutationFn: () =>
      castVote(id, Object.entries(ballot).map(([postId, sel]) => ({
        post_id:      parseInt(postId),
        candidate_id: sel.candidateId,
      }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting-status', id] })
      queryClient.invalidateQueries({ queryKey: ['my-elections'] })
      setStep(STEP_CONFIRMED)
    },
  })

  if (loadingElection || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> {t('common.loading')}
      </div>
    )
  }

  if (!election) {
    return <p className="text-sm text-muted-foreground">{t('election.not_found')}</p>
  }

  if (voteStatus?.has_voted && step !== STEP_CONFIRMED) {
    return (
      <AlreadyVotedScreen
        election={election}
        votedAt={voteStatus.voted_at}
        onBack={() => navigate('/voter/dashboard')}
      />
    )
  }

  if (election.status !== 'active' && step !== STEP_CONFIRMED) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{election.name}</h1>
        <p className="text-sm text-muted-foreground">
          {t('voting.not_active_status')} <strong>{election.status}</strong>
        </p>
        <Button variant="outline" onClick={() => navigate('/voter/dashboard')}>
          <ChevronLeft size={14} className="mr-1" /> {t('voting.back_to_dashboard')}
        </Button>
      </div>
    )
  }

  if (step === STEP_CONFIRMED) {
    return <VoteConfirmedScreen election={election} ballot={ballot} posts={posts} onBack={() => navigate('/voter/dashboard')} />
  }

  if (step === STEP_INSTRUCTIONS) {
    return (
      <InstructionsScreen
        election={election}
        onProceed={() => setStep(STEP_BALLOT)}
        onBack={() => navigate('/voter/dashboard')}
      />
    )
  }

  if (step === STEP_BALLOT) {
    return (
      <BallotScreen
        election={election}
        posts={posts}
        loading={loadingPosts}
        ballot={ballot}
        setBallot={setBallot}
        onBack={() => setStep(STEP_INSTRUCTIONS)}
        onReview={() => setStep(STEP_REVIEW)}
      />
    )
  }

  if (step === STEP_REVIEW) {
    return (
      <ReviewScreen
        election={election}
        posts={posts}
        ballot={ballot}
        onBack={() => setStep(STEP_BALLOT)}
        onSubmit={() => submitMutation.mutate()}
        submitting={submitMutation.isPending}
        error={submitMutation.error?.response?.data?.message}
      />
    )
  }

  return null
}

// ─── Instructions ─────────────────────────────────────────────────────────────
function InstructionsScreen({ election, onProceed, onBack }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold">{election.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('voting.instructions_title')}</p>
      </div>

      <div className="border rounded-xl p-5 space-y-3 bg-card">
        <h2 className="font-semibold">{t('voting.instructions')}</h2>
        <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
          <li>{t('voting.instruction_1')}</li>
          <li>{t('voting.instruction_2')}</li>
          <li><strong className="text-foreground">{t('voting.vote_final')}</strong> {t('voting.instruction_3')}</li>
          <li>{t('voting.instruction_4')}</li>
          <li>{t('voting.instruction_5')}</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button onClick={onProceed} className="flex-1">
          {t('voting.proceed_to_ballot')}
        </Button>
        <Button variant="outline" onClick={onBack}>{t('common.cancel')}</Button>
      </div>
    </div>
  )
}

// ─── Ballot ───────────────────────────────────────────────────────────────────
export function BallotScreen({ election, posts, loading, ballot, setBallot, onBack, onReview }) {
  const { t }                     = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const [showCandidateList, setShowCandidateList] = useState(false)

  const allAnswered   = posts.length > 0 && posts.every((p) => ballot[p.id])
  const answeredCount = posts.filter((p) => ballot[p.id]).length
  const progressPct   = posts.length ? (answeredCount / posts.length) * 100 : 0
  const currentPost   = posts[activeTab]

  function selectCandidate(post, candidate) {
    setBallot((prev) => ({
      ...prev,
      [post.id]: {
        candidateId:   candidate.id,
        candidateName: candidate.user?.name ?? '—',
        postTitle:     post.title,
      },
    }))
    // Auto-advance to the next unselected post after a brief feedback delay
    const nextIdx = posts.findIndex((p, i) => i > activeTab && !ballot[p.id])
    if (nextIdx !== -1) {
      setTimeout(() => setActiveTab(nextIdx), 380)
    }
  }

  return (
    <div className="flex gap-5 items-start">
      {/* ── Main ballot column ── */}
      <div className="flex-1 min-w-0 space-y-5">
      {/* Header + progress */}
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> {t('voting.instructions')}
        </button>
        <h1 className="text-2xl font-bold">{election.name}</h1>

        {!loading && posts.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {answeredCount} / {posts.length} {t('voting.posts_done')}
            </span>
          </div>
        )}
      </div>

      {/* Post tabs */}
      {!loading && posts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          {posts.map((post, i) => {
            const isDone   = !!ballot[post.id]
            const isActive = activeTab === i
            return (
              <button
                key={post.id}
                onClick={() => setActiveTab(i)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                  ${isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]'
                    : isDone
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
                  }`}
              >
                {isDone
                  ? <CheckCircle2 size={13} className={isActive ? 'text-primary-foreground' : 'text-green-600'} />
                  : <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0
                      ${isActive ? 'border-primary-foreground' : 'border-muted-foreground/40'}`}>{i + 1}</span>
                }
                <span className="max-w-[140px] truncate">{post.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Ballot content for active tab */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-14">
          <Loader2 size={16} className="animate-spin" /> {t('common.loading')}
        </div>
      ) : currentPost ? (
        <PostBallotSection
          key={currentPost.id}
          post={currentPost}
          selected={ballot[currentPost.id]?.candidateId}
          selectedElsewhere={new Set(
            Object.entries(ballot)
              .filter(([pid]) => Number(pid) !== currentPost.id)
              .map(([, sel]) => sel.candidateId)
          )}
          onSelect={(cand) => selectCandidate(currentPost, cand)}
        />
      ) : null}

      {/* Navigation footer */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab((i) => Math.max(0, i - 1))}
          disabled={activeTab === 0}
          className="px-3"
        >
          <ChevronLeft size={14} />
        </Button>
        {activeTab < posts.length - 1 ? (
          <Button className="flex-1" onClick={() => setActiveTab((i) => i + 1)}>
            {t('voting.next_post')} <ChevronRight size={14} className="ml-1.5" />
          </Button>
        ) : (
          <Button onClick={onReview} disabled={!allAnswered} className="flex-1">
            {t('voting.review_selections')}
          </Button>
        )}
      </div>

      {!allAnswered && posts.length > 0 && (
        <p className="text-xs text-amber-600 -mt-2">
          {t('voting.positions_remaining', { count: posts.filter((p) => !ballot[p.id]).length })}
        </p>
      )}
      </div>

      {/* ── Candidate List Toggle (mobile) ── */}
      {!loading && posts.length > 0 && (
        <button
          onClick={() => setShowCandidateList(true)}
          className="lg:hidden fixed bottom-4 right-4 z-30 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
          title={t('voting.candidate_list')}
        >
          <List size={20} />
        </button>
      )}

      {/* ── Candidate List Sidebar (desktop) ── */}
      {!loading && posts.length > 0 && (
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-4 self-start">
          <CandidateListPanel posts={posts} ballot={ballot} />
        </div>
      )}

      {/* ── Candidate List Drawer (mobile) ── */}
      {showCandidateList && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCandidateList(false)} />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-background shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-semibold text-sm">{t('voting.candidate_list')}</h3>
              <button onClick={() => setShowCandidateList(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <CandidateListPanel posts={posts} ballot={ballot} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Candidate List Panel ─────────────────────────────────────────────────────
function CandidateListPanel({ posts, ballot }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const q = search.toLowerCase().trim()

  // Deduplicate candidates across all posts by user id
  const seen = new Set()
  const allCandidates = posts.flatMap((post) =>
    (post.candidates ?? []).filter((cand) => {
      const uid = cand.user?.id ?? cand.id
      if (seen.has(uid)) return false
      seen.add(uid)
      return true
    })
  )

  const filtered = allCandidates.filter((cand) => {
    if (!q) return true
    return (
      cand.user?.name?.toLowerCase().includes(q) ||
      cand.user?.email?.toLowerCase().includes(q)
    )
  })

  // Build a set of selected candidate ids across all posts
  const selectedIds = new Set(Object.values(ballot).map((b) => b.candidateId))

  return (
    <div className="space-y-1 p-3">
      <h3 className="font-semibold text-sm mb-2 hidden lg:block">{t('voting.candidate_list')}</h3>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('voting.search_candidate')}
          className="w-full h-8 pl-8 pr-7 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {filtered.length === 0 && q && (
        <p className="text-xs text-muted-foreground text-center py-3">{t('common.no_results')}</p>
      )}
      <div className="border rounded-lg overflow-hidden divide-y">
        {filtered.map((cand) => {
          const isSelected = selectedIds.has(cand.id)
          return (
            <div
              key={cand.id}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                isSelected ? 'bg-green-50 border-l-2 border-l-green-500' : ''
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isSelected ? 'bg-green-600 text-white' : 'bg-primary/10 text-primary'
              }`}>
                {cand.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium truncate ${isSelected ? 'text-green-700' : ''}`}>
                  {cand.user?.name}
                </p>
                {(cand.user?.designation || cand.user?.office_name) && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {[cand.user?.designation, cand.user?.office_name].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {isSelected && <CheckCircle2 size={12} className="text-green-600 shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Post Ballot Section ──────────────────────────────────────────────────────
function PostBallotSection({ post, selected, selectedElsewhere, onSelect }) {
  const { t }                       = useTranslation()
  const [open,   setOpen]           = useState(false)
  const [search, setSearch]         = useState('')
  const dropdownRef                 = useRef(null)

  const selectedCand = post.candidates?.find((c) => c.id === selected)

  const filtered = (post.candidates ?? []).filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.designation?.toLowerCase().includes(q) ||
      c.user?.office_name?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function pick(cand) {
    onSelect(cand)
    setOpen(false)
    setSearch('')
  }

  const isEmpty = (post.candidates?.length ?? 0) === 0

  return (
    <div className="border rounded-xl bg-card shadow-sm">
      {/* Post header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b flex items-center justify-between rounded-t-xl">
        <div>
          <p className="font-bold text-base">{post.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {post.candidates?.length ?? 0} জন প্রার্থী &middot; একজনকে ভোট দিন
          </p>
        </div>
        {selected
          ? <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
              <CheckCircle2 size={12} /> নির্বাচিত
            </div>
          : <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">{t('voting.select_badge')}</span>
        }
      </div>

      {/* Dropdown trigger + panel */}
      <div className="px-5 py-4" ref={dropdownRef}>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">{t('voting.no_candidates_for_post')}</p>
        ) : (
          <div className="relative">
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                ${selected
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : open
                  ? 'border-primary/60 bg-muted/20'
                  : 'border-dashed border-muted-foreground/40 hover:border-primary/60 hover:bg-muted/30'}
              `}
            >
              {selectedCand ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                    {selectedCand.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-green-700">{selectedCand.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[selectedCand.user?.designation, selectedCand.user?.office_name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <CheckCircle2 size={15} className="text-green-600 shrink-0 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground flex-1">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <span className="text-sm">{t('voting.select_prompt')}</span>
                </div>
              )}
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown panel */}
            {open && (
              <div className="absolute z-30 mt-2 w-full bg-card border rounded-xl shadow-xl overflow-hidden">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder={t('voting.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground text-center">{t('voting.no_results')}</p>
                  ) : (
                    filtered.map((cand) => {
                      const isSelected = cand.id === selected
                      const isDisabled = !isSelected && selectedElsewhere.has(cand.id)
                      return (
                        <button
                          key={cand.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => !isDisabled && pick(cand)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-0
                            ${isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : ''}
                            ${isDisabled ? 'opacity-40 cursor-not-allowed' : isSelected ? '' : 'hover:bg-muted/40'}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                            ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                            {cand.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : ''}`}>
                              {cand.user?.name}
                            </p>
                            {(cand.user?.designation || cand.user?.office_name) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {[cand.user?.designation, cand.user?.office_name].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {isDisabled && (
                              <p className="text-xs text-amber-600 mt-0.5">{t('voting.selected_elsewhere')}</p>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Review ───────────────────────────────────────────────────────────────────
function ReviewScreen({ election, posts, ballot, onBack, onSubmit, submitting, error }) {
  const { t } = useTranslation()
  return (
    <div className="w-full max-w-lg mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> {t('voting.edit_ballot')}
        </button>
        <h1 className="text-2xl font-bold">{t('voting.review_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('voting.review_desc')}</p>
      </div>

      <div className="border rounded-xl divide-y overflow-hidden bg-card">
        {posts.map((post) => {
          const sel = ballot[post.id]
          return (
            <div key={post.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{post.title}</p>
                <p className="font-medium mt-0.5">{sel?.candidateName ?? '—'}</p>
              </div>
              <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-1" />
            </div>
          )
        })}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button onClick={onSubmit} disabled={submitting} className="flex-1">
          {submitting
            ? <><Loader2 size={14} className="animate-spin mr-2" /> {t('voting.submitting')}</>
            : t('voting.confirm_submit')}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={submitting}>{t('common.back')}</Button>
      </div>
    </div>
  )
}

// ─── Vote Confirmed ───────────────────────────────────────────────────────────
function VoteConfirmedScreen({ election, ballot, posts, onBack }) {
  const { t } = useTranslation()
  return (
    <div className="w-full max-w-lg mx-auto text-center space-y-6 py-8 px-4 sm:px-0">
      <CheckCircle2 size={56} className="mx-auto text-green-600" />
      <div>
        <h1 className="text-2xl font-bold">{t('voting.vote_submitted')}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t('voting.vote_for', { name: election.name })}
        </p>
      </div>

      {posts.length > 0 && (
        <div className="border rounded-xl divide-y overflow-hidden bg-card text-left">
          {posts.map((post) => {
            const sel = ballot[post.id]
            return (
              <div key={post.id} className="px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{post.title}</p>
                <p className="font-medium mt-0.5">{sel?.candidateName ?? '—'}</p>
              </div>
            )
          })}
        </div>
      )}

      <Button onClick={onBack} className="w-full">{t('voting.back_to_dashboard')}</Button>
    </div>
  )
}

// ─── Already Voted ────────────────────────────────────────────────────────────
function AlreadyVotedScreen({ election, votedAt, onBack }) {
  const { t } = useTranslation()
  return (
    <div className="w-full max-w-lg mx-auto text-center space-y-5 py-8 px-4 sm:px-0">
      <CheckCircle2 size={48} className="mx-auto text-green-600" />
      <div>
        <h1 className="text-xl font-bold">{t('voting.already_voted_title')}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t('voting.already_voted_desc', {
            name: election.name,
            date: votedAt
              ? new Date(votedAt).toLocaleString('bn-BD', { dateStyle: 'long', timeStyle: 'short' })
              : t('voting.already_voted_prev'),
          })}
        </p>
      </div>
      <Button variant="outline" onClick={onBack}>
        <ChevronLeft size={14} className="mr-1" /> {t('voting.back_to_dashboard')}
      </Button>
    </div>
  )
}
