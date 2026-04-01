import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  getModeratorElections,
  getModeratorVoters,
  updateModeratorVoter,
  generateResetLink,
} from '@/api/moderatorReset'
import {
  KeyRound,
  Search,
  ChevronDown,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Check,
  X,
  Copy,
  Link,
  Loader2,
} from 'lucide-react'

export default function ResetPasswordPage() {
  const { t } = useTranslation()

  const [selectedElectionId, setSelectedElectionId] = useState('')
  const [voterSearch, setVoterSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedVoter, setSelectedVoter] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [linkModal, setLinkModal] = useState({ open: false, link: '', name: '', email: '' })
  const [copied, setCopied] = useState(false)

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: elections = [], isLoading: electionsLoading } = useQuery({
    queryKey: ['moderator-elections'],
    queryFn: () => getModeratorElections().then((r) => r.data.data),
  })

  // Auto-select when only one election (voter-moderator case)
  useEffect(() => {
    if (elections.length === 1 && !selectedElectionId) {
      setSelectedElectionId(String(elections[0].id))
    }
  }, [elections, selectedElectionId])

  const { data: voters = [], isLoading: votersLoading } = useQuery({
    queryKey: ['moderator-voters', selectedElectionId],
    queryFn: () => getModeratorVoters(selectedElectionId).then((r) => r.data.data),
    enabled: !!selectedElectionId,
  })

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ voterId, data }) => updateModeratorVoter(voterId, data),
    onSuccess: (res) => {
      const updated = res.data.data
      setSelectedVoter(updated)
      setEditMode(false)
    },
  })

  const resetLinkMutation = useMutation({
    mutationFn: (voterId) => generateResetLink(voterId),
    onSuccess: (res) => {
      const { reset_link, voter_name, voter_email } = res.data.data
      setLinkModal({ open: true, link: reset_link, name: voter_name, email: voter_email })
    },
  })

  // ─── Filtered voters for dropdown ───────────────────────────────────────────
  const filteredVoters = useMemo(() => {
    if (!voterSearch.trim()) return voters
    const q = voterSearch.toLowerCase()
    return voters.filter((v) => {
      const u = v.user
      return (
        u?.name?.toLowerCase().includes(q) ||
        u?.email?.toLowerCase().includes(q) ||
        u?.mobile?.toLowerCase().includes(q)
      )
    })
  }, [voters, voterSearch])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleElectionChange(e) {
    setSelectedElectionId(e.target.value)
    setSelectedVoter(null)
    setEditMode(false)
    setVoterSearch('')
  }

  function handleSelectVoter(voter) {
    setSelectedVoter(voter)
    setVoterSearch('')
    setShowDropdown(false)
    setEditMode(false)
  }

  function startEdit() {
    const u = selectedVoter.user
    setEditForm({
      name: u.name || '',
      mobile: u.mobile || '',
      office_name: u.office_name || '',
      designation: u.designation || '',
    })
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
  }

  function saveEdit() {
    updateMutation.mutate({ voterId: selectedVoter.id, data: editForm })
  }

  function handleGenerateLink() {
    resetLinkMutation.mutate(selectedVoter.id)
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(linkModal.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = linkModal.link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function closeModal() {
    setLinkModal({ open: false, link: '', name: '', email: '' })
    setCopied(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">{t('moderator.reset_password')}</h1>
      </div>

      {/* Step 1: Select Election */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('moderator.select_election')}</CardTitle>
        </CardHeader>
        <CardContent>
          {electionsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedElectionId}
                onChange={handleElectionChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none pr-8"
              >
                <option value="">{t('moderator.choose_election')}</option>
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.name} {el.organization ? `(${el.organization.name})` : ''} — {el.status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Search and Select Voter */}
      {selectedElectionId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('moderator.select_voter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={voterSearch}
                  onChange={(e) => {
                    setVoterSearch(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={t('moderator.search_voter_placeholder')}
                  className="pl-9"
                />
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-y-auto">
                  {votersLoading ? (
                    <div className="p-3 flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </div>
                  ) : filteredVoters.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      {t('moderator.no_voters_found')}
                    </div>
                  ) : (
                    filteredVoters.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVoter(v)}
                        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                      >
                        <span className="font-medium text-sm">{v.user?.name}</span>
                        <span className="text-xs text-muted-foreground">{v.user?.email}</span>
                        {v.user?.mobile && (
                          <span className="text-xs text-muted-foreground">{v.user.mobile}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected voter badge */}
            {selectedVoter && !showDropdown && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  {selectedVoter.user?.name} — {selectedVoter.user?.email}
                </Badge>
                <button
                  onClick={() => {
                    setSelectedVoter(null)
                    setEditMode(false)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Voter Info + Inline Edit + Generate Link */}
      {selectedVoter && (
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">{t('moderator.voter_info')}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {!editMode && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  {t('common.edit')}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleGenerateLink}
                disabled={resetLinkMutation.isPending}
              >
                {resetLinkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Link className="h-4 w-4 mr-1" />
                )}
                {t('moderator.generate_reset_link')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              /* ── Edit Mode ─── */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('common.name')}</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('common.email')}</Label>
                    <Input value={selectedVoter.user?.email} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>{t('voter.mobile')}</Label>
                    <Input
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('voter.office')}</Label>
                    <Input
                      value={editForm.office_name}
                      onChange={(e) => setEditForm({ ...editForm, office_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('voter.designation')}</Label>
                    <Input
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {t('common.save')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    {t('common.cancel')}
                  </Button>
                </div>
                {updateMutation.isError && (
                  <p className="text-sm text-destructive">
                    {updateMutation.error?.response?.data?.message || t('common.error')}
                  </p>
                )}
              </div>
            ) : (
              /* ── View Mode ─── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={User} label={t('common.name')} value={selectedVoter.user?.name} />
                <InfoRow icon={Mail} label={t('common.email')} value={selectedVoter.user?.email} />
                <InfoRow icon={Phone} label={t('voter.mobile')} value={selectedVoter.user?.mobile} />
                <InfoRow icon={Building2} label={t('voter.office')} value={selectedVoter.user?.office_name} />
                <InfoRow icon={Briefcase} label={t('voter.designation')} value={selectedVoter.user?.designation} />
                <InfoRow
                  icon={Check}
                  label={t('voter.voted')}
                  value={
                    <Badge variant={selectedVoter.has_voted ? 'success' : 'outline'}>
                      {selectedVoter.has_voted ? t('common.yes') : t('common.no')}
                    </Badge>
                  }
                />
              </div>
            )}

            {resetLinkMutation.isError && (
              <p className="text-sm text-destructive mt-3">
                {resetLinkMutation.error?.response?.data?.message || t('common.error')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reset Link Modal ─── */}
      {linkModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 sm:mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-primary/5 border-b px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('moderator.reset_link_generated')}</h2>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">{t('moderator.link_for_voter')}</p>
                <p className="font-medium">{linkModal.name}</p>
                <p className="text-sm text-muted-foreground">{linkModal.email}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('moderator.reset_link_label')}</Label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm break-all select-all overflow-auto max-h-24">
                    {linkModal.link}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="shrink-0 self-start"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                {t('moderator.link_warning')}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-5 sm:px-6 py-4 flex justify-end">
              <Button variant="outline" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away handler for dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value || '—'}</div>
      </div>
    </div>
  )
}
