import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRolesAndPermissions, updateRolePermissions,
  getVotersWithRoles, syncUserRoles,
  getOrganizationsList, getElectionsList,
  getStaffUsers, updateStaffRole,
} from '@/api/roles'
import useAuthStore, { isSuperAdmin } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, Briefcase, CheckSquare, Square, Loader2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  super_admin:     { bn: 'সুপার অ্যাডমিন',        color: 'bg-red-100 text-red-700' },
  org_admin:       { bn: 'সংগঠন অ্যাডমিন',        color: 'bg-orange-100 text-orange-700' },
  org_user:        { bn: 'সংগঠন ব্যবহারকারী',     color: 'bg-yellow-100 text-yellow-700' },
  election_admin:  { bn: 'নির্বাচন অ্যাডমিন',      color: 'bg-green-100 text-green-700' },
  election_user:   { bn: 'নির্বাচন ব্যবহারকারী',   color: 'bg-teal-100 text-teal-700' },
  voter:           { bn: 'ভোটার',                 color: 'bg-blue-100 text-blue-700' },
  candidate:       { bn: 'প্রার্থী',               color: 'bg-purple-100 text-purple-700' },
  moderator:       { bn: 'মডারেটর',                 color: 'bg-violet-100 text-violet-700' },
}

const PERM_LABELS = {
  'manage-organizations':      'সংগঠন পরিচালনা',
  'view-organizations':        'সংগঠন দেখুন',
  'create-elections':          'নির্বাচন তৈরি',
  'edit-elections':            'নির্বাচন সম্পাদনা',
  'delete-elections':          'নির্বাচন মুছুন',
  'view-elections':            'নির্বাচন দেখুন',
  'manage-voters':             'ভোটার পরিচালনা',
  'delete-voters':             'ভোটার মুছুন',
  'view-voters':               'ভোটার দেখুন',
  'manage-candidates':         'প্রার্থী পরিচালনা',
  'manage-posts':              'পদ পরিচালনা',
  'cast-vote':                 'ভোট প্রদান',
  'view-voting-status':        'ভোটের অবস্থা',
  'view-results':              'ফলাফল দেখুন',
  'export-results':            'ফলাফল রপ্তানি',
  'view-detailed-reports':     'বিস্তারিত রিপোর্ট',
  'view-own-candidate-results':'নিজের ভোট ফলাফল',
  'view-audit-logs':           'অডিট লগ',
  'manage-system':             'সিস্টেম পরিচালনা',
  'send-reset-password':       'পাসওয়ার্ড রিসেট',
  'manage-roles':              'ভূমিকা পরিচালনা',
}

export default function RolesPage() {
  const qc   = useQueryClient()
  const superAdmin = useAuthStore(isSuperAdmin)
  const [tab, setTab] = useState(superAdmin ? 'permissions' : 'voters')

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => getRolesAndPermissions().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> লোড হচ্ছে…
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold">ভূমিকা ও অনুমতি</h1>
          <p className="text-sm text-muted-foreground">ভূমিকা ও অনুমতি ব্যবস্থাপনা</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {superAdmin && (
          <TabBtn id="permissions" active={tab} onClick={setTab} icon={ShieldCheck} label="অনুমতি ম্যাট্রিক্স" />
        )}
        <TabBtn id="voters" active={tab} onClick={setTab} icon={Users} label="ভোটার ভূমিকা ব্যবস্থাপনা" />
        {superAdmin && (
          <TabBtn id="staff" active={tab} onClick={setTab} icon={Briefcase} label="স্টাফ ভূমিকা ব্যবস্থাপনা" />
        )}
      </div>

      {tab === 'permissions' && superAdmin && (
        <PermissionsMatrix
          roles={data.roles}
          permissions={data.permissions}
          onSaved={() => qc.invalidateQueries({ queryKey: ['roles'] })}
        />
      )}
      {tab === 'voters' && <VotersTab isSuperAdmin={superAdmin} />}
      {tab === 'staff'  && superAdmin && <StaffTab />}
    </div>
  )
}

function TabBtn({ id, active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active === id
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

// ─── Permissions Matrix ───────────────────────────────────────────────────────
function PermissionsMatrix({ roles, permissions, onSaved }) {
  const [editingRole, setEditingRole] = useState(null)
  const [draft, setDraft]             = useState([])

  const mutation = useMutation({
    mutationFn: ({ roleId, perms }) => updateRolePermissions(roleId, perms),
    onSuccess: () => { setEditingRole(null); onSaved() },
  })

  function startEdit(role) {
    setEditingRole(role.id)
    setDraft([...role.permissions])
  }

  function toggle(perm) {
    setDraft((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])
  }

  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const cfg      = ROLE_LABELS[role.name] ?? { bn: role.name, color: 'bg-gray-100 text-gray-700' }
        const isEditing = editingRole === role.id
        const isSuper   = role.name === 'super_admin'

        return (
          <div key={role.id} className="border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-muted/40">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{role.name}</span>
                <span className="font-medium">{cfg.bn}</span>
                {isSuper && <span className="text-xs text-muted-foreground">(সকল অনুমতি — পরিবর্তনযোগ্য নয়)</span>}
              </div>
              {!isSuper && !isEditing && (
                <Button size="sm" variant="outline" onClick={() => startEdit(role)}>অনুমতি সম্পাদনা</Button>
              )}
              {!isSuper && isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ roleId: role.id, perms: draft })}>
                    {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'সংরক্ষণ'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>বাতিল</Button>
                </div>
              )}
            </div>

            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {permissions.map((perm) => {
                const active = isEditing ? draft.includes(perm) : role.permissions.includes(perm)
                const label  = PERM_LABELS[perm] ?? perm
                return (
                  <label key={perm} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-colors
                    ${isEditing ? 'cursor-pointer hover:bg-muted/60' : 'cursor-default'}
                    ${active ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}
                  >
                    <input type="checkbox" className="hidden" checked={active}
                      disabled={!isEditing} onChange={() => isEditing && toggle(perm)} />
                    {active ? <CheckSquare size={14} className="shrink-0" /> : <Square size={14} className="shrink-0" />}
                    {label}
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Voters Tab ───────────────────────────────────────────────────────────────
function VotersTab({ isSuperAdmin }) {
  const [orgId,      setOrgId]      = useState('')
  const [electionId, setElectionId] = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [orgId, electionId, search])
  // Reset election when org changes
  useEffect(() => { setElectionId('') }, [orgId])

  // Organizations dropdown (super_admin only)
  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs-list'],
    queryFn:  () => getOrganizationsList().then((r) => r.data.data ?? []),
    enabled:  isSuperAdmin,
  })

  // Elections dropdown — depends on selected org (or all for org_admin)
  const { data: elections = [] } = useQuery({
    queryKey: ['elections-list', orgId],
    queryFn:  () => getElectionsList(orgId || null).then((r) => r.data.data ?? []),
    enabled:  isSuperAdmin ? !!orgId : true,
  })

  // Voters list — only fetch when an election is selected
  const { data: votersPage, isLoading: loadingVoters } = useQuery({
    queryKey: ['admin-voters', electionId, search, page],
    queryFn:  () => getVotersWithRoles({
      election_id:     electionId,
      organization_id: orgId || undefined,
      search:          search || undefined,
      per_page:        20,
      page,
    }).then((r) => r.data),
    enabled: !!electionId,
    placeholderData: (prev) => prev,
  })

  const voters   = votersPage?.data ?? []
  const meta     = votersPage?.meta ?? {}
  const lastPage = meta.last_page ?? 1

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        {isSuperAdmin && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">সংগঠন</label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-background min-w-44"
            >
              <option value="">সংগঠন বাছাই করুন</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">নির্বাচন</label>
          <select
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            disabled={isSuperAdmin && !orgId}
            className="border rounded-lg px-3 py-2 text-sm bg-background min-w-56 disabled:opacity-50"
          >
            <option value="">নির্বাচন বাছাই করুন</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {electionId && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">অনুসন্ধান</label>
            <input
              type="text"
              placeholder="নাম বা ইমেইল…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-background w-52"
            />
          </div>
        )}
      </div>

      {/* Prompt when no election selected */}
      {!electionId && (
        <div className="border rounded-xl py-12 text-center text-sm text-muted-foreground">
          {isSuperAdmin
            ? 'প্রথমে একটি সংগঠন, তারপর নির্বাচন বাছাই করুন'
            : 'একটি নির্বাচন বাছাই করুন'}
        </div>
      )}

      {/* Voters table */}
      {electionId && (
        <>
          {loadingVoters ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে…
            </div>
          ) : (
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">ইমেইল</th>
                    <th className="px-4 py-3 font-medium">পদবি / অফিস</th>
                    <th className="px-4 py-3 font-medium">ভোটের অবস্থা</th>
                    <th className="px-4 py-3 font-medium">ভূমিকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {voters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        কোনো ভোটার পাওয়া যায়নি
                      </td>
                    </tr>
                  )}
                  {voters.map((v) => (
                    <VoterRow key={v.voter_id} voter={v} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                পৃষ্ঠা {meta.current_page} / {lastPage} · মোট {meta.total} জন
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="px-2">{page}</span>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Single voter row with inline role checkboxes ─────────────────────────────
function VoterRow({ voter }) {
  const qc = useQueryClient()
  const [localRoles, setLocalRoles] = useState(() => voter.roles ?? [])

  // Keep in sync if parent data refreshes
  useEffect(() => { setLocalRoles(voter.roles ?? []) }, [voter.roles])

  const mutation = useMutation({
    mutationFn: (roles) => syncUserRoles(voter.user_id, roles),
    onSuccess: (res) => {
      setLocalRoles(res.data.data.roles ?? [])
      qc.invalidateQueries({ queryKey: ['admin-voters'] })
    },
  })

  function toggleRole(role) {
    const next = localRoles.includes(role)
      ? localRoles.filter((r) => r !== role)
      : [...localRoles, role]
    // voter is always required; can't uncheck it
    if (!next.includes('voter')) return
    setLocalRoles(next) // optimistic
    mutation.mutate(next)
  }

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-3 font-medium">{voter.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{voter.email}</td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {voter.designation && <span>{voter.designation}</span>}
        {voter.office_name && <span className="block text-muted-foreground/70">{voter.office_name}</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          voter.has_voted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {voter.has_voted ? 'ভোট দিয়েছেন' : 'অপেক্ষমাণ'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {['voter', 'candidate'].map((r) => {
            const cfg     = ROLE_LABELS[r]
            const checked = localRoles.includes(r)
            const disabled = r === 'voter' // voter role is mandatory

            return (
              <label
                key={r}
                className={`flex items-center gap-1.5 text-xs cursor-pointer select-none
                  ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  ${mutation.isPending ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || mutation.isPending}
                  onChange={() => !disabled && toggleRole(r)}
                  className="rounded"
                />
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.bn}</span>
              </label>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────
const STAFF_ROLES = ['org_admin', 'org_user', 'election_admin', 'election_user', 'moderator']

function StaffTab() {
  const qc = useQueryClient()
  const [orgId,  setOrgId]  = useState('')
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
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
    queryKey: ['staff-roles', debouncedSearch, orgId, page],
    queryFn:  () => getStaffUsers({
      search:          debouncedSearch || undefined,
      organization_id: orgId || undefined,
      page,
      per_page: 20,
    }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const users    = data?.data ?? []
  const meta     = data?.meta?.pagination ?? {}
  const lastPage = meta.last_page ?? 1

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">সংগঠন</label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background min-w-44"
          >
            <option value="">সকল সংগঠন</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">অনুসন্ধান</label>
          <input
            type="text"
            placeholder="নাম বা ইমেইল…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background w-52"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground text-left">
              <th className="px-4 py-3 font-medium">নাম</th>
              <th className="px-4 py-3 font-medium">ইমেইল</th>
              <th className="px-4 py-3 font-medium">সংগঠন</th>
              <th className="px-4 py-3 font-medium">বর্তমান ভূমিকা</th>
              <th className="px-4 py-3 font-medium">ভূমিকা পরিবর্তন</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin inline mr-2" />লোড হচ্ছে…
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                কোনো স্টাফ ব্যবহারকারী পাওয়া যায়নি
              </td></tr>
            ) : users.map((user) => (
              <StaffRow
                key={user.id}
                user={user}
                onUpdated={() => qc.invalidateQueries({ queryKey: ['staff-roles'] })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  )
}

function StaffRow({ user, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const userRoles = (user.roles ?? []).filter((r) => STAFF_ROLES.includes(r))
  const [newRoles, setNewRoles] = useState(userRoles)

  useEffect(() => {
    if (!editing) setNewRoles((user.roles ?? []).filter((r) => STAFF_ROLES.includes(r)))
  }, [user.roles, editing])

  const mutation = useMutation({
    mutationFn: () => updateStaffRole(user.id, newRoles),
    onSuccess: () => { setEditing(false); onUpdated() },
  })

  function toggleRole(role) {
    setNewRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-3 font-medium">{user.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3 text-muted-foreground text-xs">{user.organization ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {userRoles.length === 0
            ? <span className="text-xs text-muted-foreground">—</span>
            : userRoles.map((r) => {
                const cfg = ROLE_LABELS[r] ?? { bn: r, color: 'bg-gray-100 text-gray-700' }
                return (
                  <span key={r} className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                    {cfg.bn}
                  </span>
                )
              })}
        </div>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              {STAFF_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newRoles.includes(r)}
                    onChange={() => toggleRole(r)}
                    className="rounded"
                  />
                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                    ROLE_LABELS[r]?.color ?? 'bg-gray-100 text-gray-700'
                  }`}>{ROLE_LABELS[r]?.bn ?? r}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || newRoles.length === 0}
                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                title="সংরক্ষণ"
              >
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button onClick={() => { setEditing(false); setNewRoles(userRoles) }}
                className="text-muted-foreground hover:text-foreground" title="বাতিল">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            ভূমিকা পরিবর্তন
          </Button>
        )}
      </td>
    </tr>
  )
}
