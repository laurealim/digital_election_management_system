import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getVoters, addVoter, updateVoter, deleteVoter,
  resendInvitation, importVoters, copyVotersFrom, exportVoters, sendBulkInvitations,
} from '@/api/voters'
import { getElections } from '@/api/elections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Upload, Trash2, Mail, X, Copy, Pencil, Download, Send, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import useAuthStore, { isSuperAdmin, hasPermission } from '@/store/authStore'

function MailStatusBadge({ status, sentAt }) {
  if (status === 'sent') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
        title={sentAt ? `পাঠানো হয়েছে: ${new Date(sentAt).toLocaleString('bn-BD')}` : undefined}
      >
        <CheckCircle2 size={11} /> সফল
      </span>
    )
  }
  if (status === 'bounced') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full"
        title="ইমেইল বাউন্স হয়েছে — ঠিকানাটি সঠিক কিনা যাচাই করুন">
        <XCircle size={11} /> বাউন্স
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
        title="SMTP পর্যায়ে ব্যর্থ — পুনরায় চেষ্টা করুন">
        <XCircle size={11} /> ব্যর্থ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock size={11} /> পাঠানো হয়নি
    </span>
  )
}

const canEdit = (election) => ['draft', 'scheduled'].includes(election.status)

export default function VotersTab({ election }) {
  const queryClient = useQueryClient()
  const { t }       = useTranslation()
  const qKey        = ['voters', election.id]
  const editable    = canEdit(election)

  const superAdmin    = useAuthStore(isSuperAdmin)
  const canManage     = superAdmin || useAuthStore(hasPermission('manage-voters'))
  const canDelete     = superAdmin || useAuthStore(hasPermission('delete-voters'))

  const [search,        setSearch]        = useState('')
  const [page,          setPage]          = useState(1)
  const [showAdd,       setShowAdd]       = useState(false)
  const [showCopy,      setShowCopy]      = useState(false)
  const [editVoter,     setEditVoter]     = useState(null)
  const [importResult,  setImportResult]  = useState(null)
  const [exporting,     setExporting]     = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkSuccess,   setBulkSuccess]   = useState(null)
  const fileRef = useRef()

  const { data, isLoading } = useQuery({
    queryKey: [...qKey, search, page],
    queryFn:  () => getVoters(election.id, { search, page, per_page: 50 }).then((r) => r.data),
    keepPreviousData: true,
  })

  const removeMutation = useMutation({
    mutationFn: (voterId) => deleteVoter(election.id, voterId),
    onSuccess:  () => queryClient.invalidateQueries(qKey),
  })

  const resendMutation = useMutation({
    mutationFn: (voterId) => resendInvitation(election.id, voterId),
    onSettled: () => queryClient.invalidateQueries(qKey),
  })

  const copyMutation = useMutation({
    mutationFn: (sourceId) => copyVotersFrom(election.id, sourceId),
    onSuccess:  (res) => {
      queryClient.invalidateQueries(qKey)
      setShowCopy(false)
      const d = res.data.data
      alert(`${d.copied} জন কপি হয়েছে, ${d.skipped} জন বাদ পড়েছে।`)
    },
    onError: (err) => alert(err.response?.data?.message || t('common.error_generic')),
  })

  const importMutation = useMutation({
    mutationFn: (file) => importVoters(election.id, file),
    onSuccess:  (res) => {
      setImportResult(res.data.data)
      queryClient.invalidateQueries(qKey)
    },
    onError: (err) => {
      const resp = err.response?.data
      if (resp?.errors && Array.isArray(resp.errors)) {
        setImportResult({ imported: 0, errors: resp.errors })
      } else {
        setImportResult({ imported: 0, errors: [{ row: '—', email: '—', errors: [resp?.message || t('common.error_generic')] }] })
      }
    },
  })

  const sendBulkMutation = useMutation({
    mutationFn: (voterIds) => sendBulkInvitations(election.id, voterIds),
    onSuccess: (res) => {
      const { sent = 0, failed = 0 } = res.data.data ?? {}
      setShowBulkModal(false)
      setSelectedIds(new Set())
      queryClient.invalidateQueries(qKey)
      const msg = failed > 0
        ? `${sent} জনকে সফলভাবে পাঠানো হয়েছে, ${failed} জনের ক্ষেত্রে ব্যর্থ হয়েছে।`
        : t('voter.bulk_email_sent', { count: sent })
      setBulkSuccess(msg)
      setTimeout(() => setBulkSuccess(null), 6000)
    },
    onError: (err) => alert(err.response?.data?.message || t('common.error_generic')),
  })

  const voters    = data?.data ?? []
  const voterMeta = data?.meta?.pagination ?? {}

  // Checkbox selection helpers
  const pageVoterIds   = voters.map((v) => v.id)
  const allPageSelected = pageVoterIds.length > 0 && pageVoterIds.every((id) => selectedIds.has(id))
  const somePageSelected = pageVoterIds.some((id) => selectedIds.has(id))

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageVoterIds.forEach((id) => next.delete(id))
      } else {
        pageVoterIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImportResult(null)
      importMutation.mutate(file)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={t('voter.search_voters')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-52"
        />

        {editable && canManage && (
          <>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              <UserPlus size={14} className="mr-1" /> {t('voter.add_voter')}
            </Button>

            <Button
              size="sm" variant="outline"
              disabled={importMutation.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} className="mr-1" />
              {importMutation.isPending ? t('voter.importing') : t('voter.import_excel')}
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

            <Button size="sm" variant="outline" onClick={() => setShowCopy(true)}>
              <Copy size={14} className="mr-1" /> {t('voter.copy_from_election')}
            </Button>
          </>
        )}

        {/* Bulk invitation email button — always visible */}
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
          onClick={() => setShowBulkModal(true)}
          disabled={voters.length === 0}
        >
          <Send size={14} className="mr-1" />
          {selectedIds.size > 0
            ? t('voter.send_invitations_n', { count: selectedIds.size })
            : t('voter.send_invitations')}
        </Button>

        <Button
          size="sm" variant="outline"
          disabled={exporting || voters.length === 0}
          onClick={async () => {
            setExporting(true)
            try {
              const res = await exportVoters(election.id)
              const url = window.URL.createObjectURL(new Blob([res.data]))
              const a   = document.createElement('a')
              a.href     = url
              a.download = `voters-${election.id}.xlsx`
              a.click()
              window.URL.revokeObjectURL(url)
            } catch { /* ignore */ }
            setExporting(false)
          }}
        >
          <Download size={14} className="mr-1" />
          {exporting ? t('voter.exporting') : t('voter.export_excel')}
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {t('voter.total_voters')}: {voterMeta.total ?? voters.length}
          {selectedIds.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              ({selectedIds.size} {t('voter.selected')})
            </span>
          )}
        </span>
      </div>

      {/* Bulk send success banner */}
      {bulkSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
          <span>{bulkSuccess}</span>
          <button onClick={() => setBulkSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="border rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {t('voter.import_complete', { count: importResult.imported })}
            </span>
            <button onClick={() => setImportResult(null)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          {importResult.errors?.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t('voter.rows_skipped', { count: importResult.errors.length })}
              </p>
              <div className="max-h-40 overflow-y-auto border rounded text-xs">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">{t('voter.row')}</th>
                      <th className="text-left px-3 py-1.5 font-medium">{t('auth.email')}</th>
                      <th className="text-left px-3 py-1.5 font-medium">{t('voter.reason')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{e.row}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{e.email}</td>
                        <td className="px-3 py-1.5 text-destructive">{e.errors?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voter table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => { if (el) el.indeterminate = !allPageSelected && somePageSelected }}
                    onChange={toggleSelectAll}
                    className="rounded border-border cursor-pointer w-4 h-4"
                    title={t('voter.select_all')}
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">{t('common.name')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('auth.email')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.mobile')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.office')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.designation')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('voter.voted')}</th>
                <th className="text-left px-4 py-3 font-medium">ইমেইল অবস্থা</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {voters.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {t('voter.no_voters')}
                  </td>
                </tr>
              )}
              {voters.map((v) => (
                <tr
                  key={v.id}
                  className={`border-t hover:bg-muted/30 transition-colors ${selectedIds.has(v.id) ? 'bg-blue-50/60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(v.id)}
                      onChange={() => toggleSelectOne(v.id)}
                      className="rounded border-border cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{v.user?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.user?.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.user?.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.user?.office_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.user?.designation ?? '—'}</td>
                  <td className="px-4 py-3">
                    {v.has_voted
                      ? <Badge variant="success">{t('voter.voted')}</Badge>
                      : <Badge variant="secondary">{t('voter.pending')}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <MailStatusBadge status={v.invitation_status} sentAt={v.invitation_sent_at} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {canManage && (
                        <Button variant="ghost" size="icon" title={t('common.edit')} onClick={() => setEditVoter(v)}>
                          <Pencil size={14} />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost" size="icon" title={t('voter.resend_invitation')}
                          disabled={resendMutation.isPending}
                          onClick={() => resendMutation.mutate(v.id)}
                        >
                          <Mail size={14} />
                        </Button>
                      )}
                      {editable && canDelete && (
                        <Button
                          variant="ghost" size="icon" title={t('voter.remove_voter')}
                          className="text-destructive hover:text-destructive"
                          disabled={removeMutation.isPending}
                          onClick={() => window.confirm(t('voter.remove_confirm', { name: v.user?.name })) && removeMutation.mutate(v.id)}
                        >
                          <Trash2 size={14} />
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

      {showAdd && (
        <AddVoterModal
          election={election}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { queryClient.invalidateQueries(qKey); setShowAdd(false) }}
        />
      )}

      {editVoter && (
        <EditVoterModal
          election={election}
          voter={editVoter}
          onClose={() => setEditVoter(null)}
          onSuccess={() => { queryClient.invalidateQueries(qKey); setEditVoter(null) }}
        />
      )}

      {showCopy && (
        <CopyFromModal
          election={election}
          onClose={() => setShowCopy(false)}
          onCopy={(sourceId) => copyMutation.mutate(sourceId)}
          copying={copyMutation.isPending}
        />
      )}

      {showBulkModal && (
        <BulkEmailModal
          selectedCount={selectedIds.size}
          totalVoters={voterMeta.total ?? voters.length}
          isPending={sendBulkMutation.isPending}
          onClose={() => setShowBulkModal(false)}
          onConfirm={() => sendBulkMutation.mutate(selectedIds.size > 0 ? Array.from(selectedIds) : [])}
        />
      )}
    </div>
  )
}

function BulkEmailModal({ selectedCount, totalVoters, isPending, onClose, onConfirm }) {
  const { t } = useTranslation()
  const isAll = selectedCount === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Colored header strip */}
        <div className={`px-6 pt-6 pb-5 ${isAll ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${isAll ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {isAll ? <Users size={22} /> : <Send size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold leading-snug">
                {isAll ? t('voter.bulk_email_title_all') : t('voter.bulk_email_title_selected')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {isAll
                  ? t('voter.bulk_email_desc_all', { total: totalVoters })
                  : t('voter.bulk_email_desc_selected', { count: selectedCount })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
              disabled={isPending}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Recipient summary */}
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium border ${
            isAll
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <Mail size={16} className="shrink-0" />
            <span>
              {isAll
                ? `সকল ${totalVoters} জন ভোটার`
                : `${selectedCount} জন নির্বাচিত ভোটার`}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            প্রতিটি ভোটার একটি আমন্ত্রণ ইমেইল পাবেন যেখানে পাসওয়ার্ড সেটআপ করার লিঙ্ক থাকবে।
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              className={`flex-1 gap-2 ${isAll ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  {t('voter.sending_invitations')}
                </>
              ) : (
                <>
                  <Send size={14} />
                  {t('voter.send_btn')}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddVoterModal({ election, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [form, setForm]     = useState({ name: '', email: '', mobile: '', office_name: '', designation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await addVoter(election.id, form)
      onSuccess()
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ general: [err.response?.data?.message || t('voter.failed_add')] })
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
          <h2 className="text-lg font-semibold">{t('voter.add_voter_title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        {errors.general && <Alert variant="destructive"><AlertDescription>{errors.general[0]}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="v_name">{t('voter.full_name')} *</Label>
            <Input id="v_name" value={form.name} onChange={set('name')} required />
            <FieldError name="name" />
          </div>
          <div>
            <Label htmlFor="v_email">{t('auth.email')} *</Label>
            <Input id="v_email" type="email" value={form.email} onChange={set('email')} required />
            <FieldError name="email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="v_mobile">{t('voter.mobile')}</Label>
              <Input id="v_mobile" value={form.mobile} onChange={set('mobile')} />
            </div>
            <div>
              <Label htmlFor="v_designation">{t('voter.designation')}</Label>
              <Input id="v_designation" value={form.designation} onChange={set('designation')} />
            </div>
          </div>
          <div>
            <Label htmlFor="v_office">{t('voter.office_unit')}</Label>
            <Input id="v_office" value={form.office_name} onChange={set('office_name')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('voter.adding') : t('voter.add_voter')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditVoterModal({ election, voter, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name:        voter.user?.name        || '',
    mobile:      voter.user?.mobile      || '',
    office_name: voter.user?.office_name || '',
    designation: voter.user?.designation || '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await updateVoter(election.id, voter.id, form)
      onSuccess()
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ general: [err.response?.data?.message || t('voter.failed_update')] })
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
          <h2 className="text-lg font-semibold">{t('voter.edit_voter_title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        {errors.general && <Alert variant="destructive"><AlertDescription>{errors.general[0]}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="ev_name">{t('voter.full_name')} *</Label>
            <Input id="ev_name" value={form.name} onChange={set('name')} required />
            <FieldError name="name" />
          </div>
          <div>
            <Label htmlFor="ev_email">{t('auth.email')}</Label>
            <Input id="ev_email" type="email" value={voter.user?.email ?? ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">{t('voter.email_cannot_change')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev_mobile">{t('voter.mobile')}</Label>
              <Input id="ev_mobile" value={form.mobile} onChange={set('mobile')} />
              <FieldError name="mobile" />
            </div>
            <div>
              <Label htmlFor="ev_designation">{t('voter.designation')}</Label>
              <Input id="ev_designation" value={form.designation} onChange={set('designation')} />
              <FieldError name="designation" />
            </div>
          </div>
          <div>
            <Label htmlFor="ev_office">{t('voter.office_unit')}</Label>
            <Input id="ev_office" value={form.office_name} onChange={set('office_name')} />
            <FieldError name="office_name" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CopyFromModal({ election, onClose, onCopy, copying }) {
  const { t }                     = useTranslation()
  const [selectedId, setSelectedId] = useState('')

  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['elections-for-copy'],
    queryFn:  () => getElections({ per_page: 100 }).then((r) =>
      (r.data.data ?? []).filter((e) => e.id !== election.id)
    ),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('voter.copy_voters_title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <p className="text-sm text-muted-foreground">{t('voter.copy_voters_desc')}</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('voter.loading_elections')}</p>
        ) : elections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('voter.no_other_elections')}</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg divide-y text-sm">
            {elections.map((e) => (
              <label
                key={e.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 ${
                  selectedId === String(e.id) ? 'bg-primary/5' : ''
                }`}
              >
                <input
                  type="radio"
                  name="source_election"
                  value={e.id}
                  checked={selectedId === String(e.id)}
                  onChange={() => setSelectedId(String(e.id))}
                  className="accent-primary"
                />
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.election_date} · {e.status}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button className="flex-1" disabled={!selectedId || copying} onClick={() => onCopy(selectedId)}>
            {copying ? t('voter.copying') : t('voter.copy_voters_btn')}
          </Button>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </div>
    </div>
  )
}
