import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStaffUsers, createStaffUser, updateStaffUser, updateStaffRole, toggleUserStatus, resendSetupEmail, generateUserResetLink, getAssignedElections, syncAssignedElections } from '@/api/adminUsers'
import { getOrganizationsList, getElectionsList } from '@/api/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  UserPlus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, X, Check, Mail, Send, CheckCircle2, XCircle, Clock, CalendarDays,
  KeyRound, Copy, CopyCheck,
} from 'lucide-react'

function MailStatusBadge({ status }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
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

// ─── Constants ────────────────────────────────────────────────────────────────
const STAFF_ROLES = ['super_admin', 'org_admin', 'org_user', 'election_admin', 'election_user', 'moderator']

const ROLE_META = {
  super_admin:    { bn: 'সুপার অ্যাডমিন',        color: 'bg-red-100 text-red-700 border-red-200' },
  org_admin:      { bn: 'সংগঠন অ্যাডমিন',        color: 'bg-orange-100 text-orange-700 border-orange-200' },
  org_user:       { bn: 'সংগঠন ব্যবহারকারী',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  election_admin: { bn: 'নির্বাচন অ্যাডমিন',      color: 'bg-green-100 text-green-700 border-green-200' },
  election_user:  { bn: 'নির্বাচন ব্যবহারকারী',   color: 'bg-teal-100 text-teal-700 border-teal-200' },
  moderator:      { bn: 'মডারেটর',                 color: 'bg-violet-100 text-violet-700 border-violet-200' },
}

function RoleBadges({ roles = [] }) {
  const staffRoles = (roles ?? []).filter((r) => STAFF_ROLES.includes(r))
  if (!staffRoles.length) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {staffRoles.map((r) => {
        const m = ROLE_META[r] ?? { bn: r, color: 'bg-gray-100 text-gray-700 border-gray-200' }
        return (
          <span key={r} className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${m.color}`}>
            {m.bn}
          </span>
        )
      })}
    </div>
  )
}

function RoleCheckboxes({ selected, onChange, className = '' }) {
  function toggle(role) {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role))
    } else {
      onChange([...selected, role])
    }
  }
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {STAFF_ROLES.map((r) => (
        <label key={r} className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(r)}
            onChange={() => toggle(r)}
            className="rounded"
          />
          {ROLE_META[r]?.bn ?? r}
        </label>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient()
  const [search,     setSearch]     = useState('')
  const [orgId,      setOrgId]      = useState('')
  const [page,       setPage]       = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, orgId])

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs-list'],
    queryFn:  () => getOrganizationsList().then((r) => r.data.data ?? []),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['staff-users', debouncedSearch, orgId, page],
    queryFn:  () => getStaffUsers({
      search:          debouncedSearch || undefined,
      organization_id: orgId || undefined,
      page,
      per_page:        20,
    }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const users    = data?.data ?? []
  const meta     = data?.meta?.pagination ?? {}
  const lastPage = meta.last_page ?? 1

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ব্যবহারকারী ব্যবস্থাপনা</h1>
          <p className="text-sm text-muted-foreground mt-0.5">স্টাফ ব্যবহারকারী ব্যবস্থাপনা</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <UserPlus size={16} /> নতুন ব্যবহারকারী
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">সংগঠন</label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background min-w-48"
          >
            <option value="">সকল সংগঠন</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">অনুসন্ধান</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="নাম বা ইমেইল…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-56"
            />
          </div>
        </div>

        {(search || orgId) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setOrgId('') }}>
            <X size={14} className="mr-1" /> ফিল্টার সাফ
          </Button>
        )}
      </div>

      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground text-left">
              <th className="px-4 py-3 font-medium">নাম</th>
              <th className="px-4 py-3 font-medium">ইমেইল</th>
              <th className="px-4 py-3 font-medium">মোবাইল</th>
              <th className="px-4 py-3 font-medium">সংগঠন</th>
              <th className="px-4 py-3 font-medium">পদবি</th>
              <th className="px-4 py-3 font-medium">ভূমিকা</th>
              <th className="px-4 py-3 font-medium">অবস্থা</th>
              <th className="px-4 py-3 font-medium">ইমেইল অবস্থা</th>
              <th className="px-4 py-3 font-medium">ক্রিয়া</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center">
                  <Loader2 size={18} className="animate-spin inline mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">লোড হচ্ছে…</span>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  কোনো ব্যবহারকারী পাওয়া যায়নি
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  orgs={orgs}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ['staff-users'] })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            পৃষ্ঠা {meta.current_page} / {lastPage} · মোট {meta.total} জন
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          orgs={orgs}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            qc.invalidateQueries({ queryKey: ['staff-users'] })
          }}
        />
      )}
    </div>
  )
}

// ─── User Row with inline editing ─────────────────────────────────────────────
function UserRow({ user, orgs, onUpdated }) {
  const [editing,     setEditing]     = useState(false)
  const [confirm,     setConfirm]     = useState(false)
  const [emailStatus, setEmailStatus] = useState(user.setup_email_status ?? null)
  const [showAssignElections, setShowAssignElections] = useState(false)
  const [showResetLink,       setShowResetLink]       = useState(false)

  const userRoles = user.roles ?? []
  const isModerator = userRoles.includes('moderator')

  const [draft, setDraft] = useState({
    name:            user.name ?? '',
    mobile:          user.mobile ?? '',
    designation:     user.designation ?? '',
    organization_id: user.org_id ?? '',
    roles:           userRoles,
  })

  useEffect(() => {
    if (!editing) {
      setDraft({
        name:            user.name ?? '',
        mobile:          user.mobile ?? '',
        designation:     user.designation ?? '',
        organization_id: user.org_id ?? '',
        roles:           user.roles ?? [],
      })
      setEmailStatus(user.setup_email_status ?? null)
    }
  }, [user, editing])

  function cancelEdit() {
    setDraft({
      name:            user.name ?? '',
      mobile:          user.mobile ?? '',
      designation:     user.designation ?? '',
      organization_id: user.org_id ?? '',
      roles:           user.roles ?? [],
    })
    setEditing(false)
  }

  const rolesChanged = [...draft.roles].sort().join() !== [...(user.roles ?? [])].sort().join()

  const profileMut = useMutation({
    mutationFn: () => updateStaffUser(user.id, {
      name:            draft.name,
      mobile:          draft.mobile || null,
      designation:     draft.designation || null,
      organization_id: draft.organization_id || null,
    }),
    onSuccess: () => {
      if (rolesChanged) {
        roleMut.mutate()
      } else {
        setEditing(false)
        onUpdated()
      }
    },
  })

  const roleMut = useMutation({
    mutationFn: () => updateStaffRole(user.id, draft.roles),
    onSuccess: () => { setEditing(false); onUpdated() },
  })

  const toggleMut = useMutation({
    mutationFn: () => toggleUserStatus(user.id),
    onSuccess: () => { setConfirm(false); onUpdated() },
  })

  const resendMut = useMutation({
    mutationFn: () => resendSetupEmail(user.id),
    onSuccess:  () => { setEmailStatus('sent');   onUpdated() },
    onError:    () => { setEmailStatus('failed'); onUpdated() },
  })

  const isPending = profileMut.isPending || roleMut.isPending

  function field(key) {
    return (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))
  }

  const cellInput = 'border rounded px-2 py-1 text-xs bg-background w-full'

  return (
    <>
    <tr className={`hover:bg-muted/20 ${editing ? 'bg-primary/5' : ''}`}>
      {/* নাম */}
      <td className="px-3 py-2">
        {editing
          ? <input value={draft.name} onChange={field('name')} className={cellInput} placeholder="নাম" />
          : <p className="font-medium text-sm">{user.name}</p>}
      </td>

      {/* ইমেইল */}
      <td className="px-3 py-2 text-muted-foreground text-xs">{user.email}</td>

      {/* মোবাইল */}
      <td className="px-3 py-2">
        {editing
          ? <input value={draft.mobile} onChange={field('mobile')} className={cellInput} placeholder="মোবাইল" />
          : <span className="text-xs text-muted-foreground">{user.mobile || '—'}</span>}
      </td>

      {/* সংগঠন */}
      <td className="px-3 py-2">
        {editing
          ? (
            <select value={draft.organization_id} onChange={field('organization_id')}
              className={`${cellInput} min-w-32`}>
              <option value="">— কোনো সংগঠন নেই —</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )
          : <span className="text-xs text-muted-foreground">{user.organization ?? '—'}</span>}
      </td>

      {/* পদবি */}
      <td className="px-3 py-2">
        {editing
          ? <input value={draft.designation} onChange={field('designation')} className={cellInput} placeholder="পদবি" />
          : <span className="text-xs text-muted-foreground">{user.designation || '—'}</span>}
      </td>

      {/* ভূমিকা */}
      <td className="px-3 py-2">
        {editing
          ? (
            <RoleCheckboxes
              selected={draft.roles}
              onChange={(roles) => setDraft((d) => ({ ...d, roles }))}
            />
          )
          : <RoleBadges roles={userRoles} />}
      </td>

      {/* অবস্থা */}
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {user.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
        </span>
      </td>

      {/* ইমেইল অবস্থা */}
      <td className="px-3 py-2">
        <MailStatusBadge status={emailStatus} />
      </td>

      {/* ক্রিয়া */}
      <td className="px-3 py-2">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => profileMut.mutate()}
              disabled={isPending}
              className="text-green-600 hover:text-green-700 disabled:opacity-50"
              title="সংরক্ষণ"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={cancelEdit} disabled={isPending}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50" title="বাতিল">
              <X size={14} />
            </button>
          </div>
        ) : confirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {user.is_active ? 'নিষ্ক্রিয়?' : 'সক্রিয়?'}
            </span>
            <button onClick={() => toggleMut.mutate()} disabled={toggleMut.isPending}
              className="text-xs text-primary hover:underline disabled:opacity-50">
              {toggleMut.isPending ? '…' : 'হ্যাঁ'}
            </button>
            <button onClick={() => setConfirm(false)}
              className="text-xs text-muted-foreground hover:underline">না</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} title="সম্পাদনা"
              className="text-muted-foreground hover:text-primary transition-colors">
              <Pencil size={14} />
            </button>
            <button
              onClick={() => resendMut.mutate()}
              disabled={resendMut.isPending}
              title="সেটআপ ইমেইল পুনরায় পাঠান"
              className="text-muted-foreground hover:text-blue-600 transition-colors disabled:opacity-40"
            >
              {resendMut.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : resendMut.isSuccess
                  ? <Check size={14} className="text-green-600" />
                  : <Mail size={14} />}
            </button>
            <button
              onClick={() => setShowResetLink(true)}
              title="পাসওয়ার্ড রিসেট লিঙ্ক তৈরি করুন"
              className="text-muted-foreground hover:text-amber-600 transition-colors"
            >
              <KeyRound size={14} />
            </button>
            {isModerator && (
              <button
                onClick={() => setShowAssignElections(true)}
                title="নির্বাচন নির্ধারণ করুন"
                className="text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                <CalendarDays size={14} />
              </button>
            )}
            <button
              onClick={() => setConfirm(true)}
              title={user.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
              className={`transition-colors ${user.is_active
                ? 'text-muted-foreground hover:text-destructive'
                : 'text-muted-foreground hover:text-green-600'}`}
            >
              {user.is_active ? <Trash2 size={14} /> : <Check size={14} />}
            </button>
          </div>
        )}
      </td>
    </tr>
    {showAssignElections && (
      <tr><td colSpan={9} className="p-0">
        <AssignElectionsModal
          userId={user.id}
          userName={user.name}
          onClose={() => setShowAssignElections(false)}
          onUpdated={onUpdated}
        />
      </td></tr>
    )}
    {showResetLink && (
      <ResetLinkModal
        userId={user.id}
        userName={user.name}
        onClose={() => setShowResetLink(false)}
      />
    )}
    </>
  )
}

// ─── Reset Link Modal ─────────────────────────────────────────────────────────
function ResetLinkModal({ userId, userName, onClose }) {
  const [copied, setCopied] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-reset-link', userId],
    queryFn:  () => generateUserResetLink(userId).then((r) => r.data.data),
    staleTime: 0,
    retry: false,
  })

  function copyLink() {
    navigator.clipboard.writeText(data.reset_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-amber-500" />
            <h2 className="font-bold text-base">পাসওয়ার্ড রিসেট লিঙ্ক</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">লিঙ্ক তৈরি হচ্ছে…</span>
            </div>
          ) : isError ? (
            <div className="text-destructive text-sm text-center py-4">
              {error?.response?.data?.message || 'লিঙ্ক তৈরি করতে ব্যর্থ হয়েছে।'}
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
                <p className="text-xs text-amber-700 font-medium">ব্যবহারকারী</p>
                <p className="font-semibold text-sm">{data.user_name}</p>
                <p className="text-xs text-muted-foreground">{data.user_email}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">রিসেট লিঙ্ক (৬০ মিনিট কার্যকর)</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={data.reset_link}
                    className="flex-1 border rounded-lg px-3 py-2 text-xs bg-muted font-mono text-muted-foreground truncate"
                  />
                  <button
                    onClick={copyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      copied
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-background border-input hover:bg-muted text-foreground'
                    }`}
                  >
                    {copied
                      ? <><CopyCheck size={13} /> কপি হয়েছে</>
                      : <><Copy size={13} /> কপি করুন</>}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                এই লিঙ্কটি ব্যবহারকারীকে পাঠান। লিঙ্কটি ব্যবহার করে তিনি নতুন পাসওয়ার্ড সেট করতে পারবেন।
              </p>
            </>
          )}
        </div>

        <div className="px-6 pb-5">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">বন্ধ করুন</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Elections Modal ───────────────────────────────────────────────────
function AssignElectionsModal({ userId, userName, onClose, onUpdated }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(new Set())
  const [loaded, setLoaded]     = useState(false)

  const { data: elections = [], isLoading: electionsLoading } = useQuery({
    queryKey: ['all-elections-list'],
    queryFn:  () => getElectionsList().then((r) => r.data.data ?? []),
  })

  const { data: assigned, isLoading: assignedLoading } = useQuery({
    queryKey: ['assigned-elections', userId],
    queryFn:  () => getAssignedElections(userId).then((r) => r.data.data),
  })

  useEffect(() => {
    if (assigned && !loaded) {
      setSelected(new Set(assigned.election_ids ?? []))
      setLoaded(true)
    }
  }, [assigned, loaded])

  const syncMut = useMutation({
    mutationFn: () => syncAssignedElections(userId, [...selected]),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['assigned-elections', userId] })
      qc.invalidateQueries({ queryKey: ['staff-users'] })
      onUpdated()
      onClose()
    },
  })

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isLoading = electionsLoading || assignedLoading

  return (
    <div className="bg-muted/40 border-b px-4 py-4">
      <div className="max-w-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {userName} — নির্বাচন নির্ধারণ
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 size={14} className="animate-spin" /> লোড হচ্ছে…
          </div>
        ) : elections.length === 0 ? (
          <p className="text-sm text-muted-foreground">কোনো নির্বাচন পাওয়া যায়নি।</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-lg bg-background divide-y">
            {elections.map((el) => (
              <label key={el.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(el.id)}
                  onChange={() => toggle(el.id)}
                  className="rounded"
                />
                <span className="flex-1 truncate">{el.name}</span>
                <span className="text-xs text-muted-foreground">{el.status ?? ''}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending || isLoading}
          >
            {syncMut.isPending
              ? <><Loader2 size={14} className="animate-spin mr-1" /> সংরক্ষণ হচ্ছে…</>
              : <><Check size={14} className="mr-1" /> সংরক্ষণ ({selected.size})</>}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>বাতিল</Button>
          {syncMut.isError && (
            <span className="text-xs text-destructive">
              {syncMut.error?.response?.data?.message || 'ব্যর্থ হয়েছে'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ orgs, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', roles: ['org_admin'], organization_id: '',
    mobile: '', designation: '',
  })
  const [errors,      setErrors]      = useState({})
  const [createdUser, setCreatedUser] = useState(null)

  const mutation = useMutation({
    mutationFn: () => createStaffUser({
      name:            form.name,
      email:           form.email,
      roles:           form.roles,
      organization_id: form.organization_id || undefined,
      mobile:          form.mobile || undefined,
      designation:     form.designation || undefined,
    }),
    onSuccess: (res) => {
      setCreatedUser(res.data.data)
    },
    onError: (err) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrors({ general: [err.response?.data?.message ?? 'ব্যর্থ হয়েছে।'] })
      }
    },
  })

  const resendMut = useMutation({
    mutationFn: () => resendSetupEmail(createdUser.id),
  })

  function setField(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined, general: undefined }))
    }
  }

  // If super_admin is not in the roles, org is required
  const needsOrg = !form.roles.includes('super_admin') || form.roles.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">নতুন ব্যবহারকারী তৈরি করুন</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {createdUser ? (
            <div className="py-4 space-y-5">
              <div className="flex items-start gap-4 rounded-xl bg-green-50 border border-green-200 px-4 py-4">
                <div className="p-2 rounded-full bg-green-100 text-green-600 shrink-0">
                  <Check size={18} />
                </div>
                <div>
                  <p className="font-semibold text-green-800">ব্যবহারকারী তৈরি হয়েছে!</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    <span className="font-medium">{createdUser.name}</span> সফলভাবে যোগ করা হয়েছে।
                  </p>
                </div>
              </div>

              <div className="rounded-xl border px-4 py-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail size={15} className="text-blue-500" />
                  পাসওয়ার্ড সেটআপ ইমেইল পাঠানো হয়েছে
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <span className="text-xs text-muted-foreground">প্রাপক:</span>
                  <span className="text-sm font-mono font-medium">{createdUser.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ব্যবহারকারী ইমেইলের লিঙ্ক ব্যবহার করে তার পাসওয়ার্ড সেট করতে পারবেন।
                </p>
                <div className="flex items-center justify-between">
                  <MailStatusBadge status={createdUser?.setup_email_status ?? 'sent'} />
                  <button
                    onClick={() => resendMut.mutate()}
                    disabled={resendMut.isPending}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {resendMut.isPending ? (
                      <><Loader2 size={13} className="animate-spin" /> পাঠানো হচ্ছে…</>
                    ) : resendMut.isSuccess ? (
                      <><Check size={13} className="text-green-600" /> পুনরায় পাঠানো হয়েছে</>
                    ) : (
                      <><Send size={13} /> পুনরায় ইমেইল পাঠান</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general[0]}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label>পূর্ণ নাম *</Label>
                  <Input value={form.name} onChange={setField('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>ইমেইল * <span className="text-xs text-muted-foreground">(পাসওয়ার্ড সেটআপ লিঙ্ক এখানে যাবে)</span></Label>
                  <Input type="email" value={form.email} onChange={setField('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>ভূমিকা * <span className="text-xs text-muted-foreground">(একাধিক বেছে নিতে পারবেন)</span></Label>
                  <div className="border rounded-md px-3 py-2 bg-background">
                    <RoleCheckboxes
                      selected={form.roles}
                      onChange={(roles) => {
                        setForm((f) => ({ ...f, roles }))
                        setErrors((er) => ({ ...er, roles: undefined }))
                      }}
                    />
                  </div>
                  {errors.roles && <p className="text-xs text-destructive">{errors.roles[0]}</p>}
                  {form.roles.length === 0 && (
                    <p className="text-xs text-destructive">কমপক্ষে একটি ভূমিকা বেছে নিন</p>
                  )}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>সংগঠন {needsOrg ? '*' : ''}</Label>
                  <select
                    value={form.organization_id}
                    onChange={setField('organization_id')}
                    disabled={!needsOrg}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">বাছাই করুন…</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  {errors.organization_id && <p className="text-xs text-destructive">{errors.organization_id[0]}</p>}
                </div>

                <div className="space-y-1">
                  <Label>মোবাইল</Label>
                  <Input value={form.mobile} onChange={setField('mobile')} />
                </div>

                <div className="space-y-1">
                  <Label>পদবি</Label>
                  <Input value={form.designation} onChange={setField('designation')} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {createdUser ? (
            <Button onClick={onCreated}>বন্ধ করুন</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>বাতিল</Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || form.roles.length === 0}
              >
                {mutation.isPending
                  ? <><Loader2 size={14} className="animate-spin mr-2" />তৈরি হচ্ছে…</>
                  : 'ব্যবহারকারী তৈরি করুন'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
