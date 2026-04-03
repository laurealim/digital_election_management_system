import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicVoterList, getPublicVoterListByElection } from '@/api/publicResults'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowLeft, LayoutDashboard, Search, X, Vote, ChevronRight, CalendarDays } from 'lucide-react'

export default function PublicVoterListPage() {
  const { user }   = useAuthStore()
  const navigate    = useNavigate()
  const [selectedElection, setSelectedElection] = useState(null)
  const [search, setSearch] = useState('')

  // Fetch list of elections with public voter list
  const { data: electionsData, isLoading: electionsLoading } = useQuery({
    queryKey: ['public-voter-list-elections'],
    queryFn:  () => getPublicVoterList().then((r) => r.data.data ?? []),
    staleTime: 5 * 60 * 1000,
  })

  const elections = electionsData ?? []

  // Auto-select if only one election
  const electionId = selectedElection ?? (elections.length === 1 ? elections[0].id : null)

  // Fetch voter list for selected election
  const { data: voterData, isLoading: votersLoading } = useQuery({
    queryKey: ['public-voter-list', electionId],
    queryFn:  () => getPublicVoterListByElection(electionId).then((r) => r.data.data),
    enabled:  !!electionId,
    staleTime: 5 * 60 * 1000,
  })

  function dashboardPath() {
    if (!user) return null
    if ((user.roles ?? []).includes('super_admin')) return '/admin/dashboard'
    if ((user.roles ?? []).some((r) => ['voter', 'candidate'].includes(r))) return '/voter/dashboard'
    return '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950">
      {/* Top bar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary tracking-tight">DEMS</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Button size="sm" variant="outline" onClick={() => navigate(dashboardPath())}>
                <LayoutDashboard size={14} className="mr-1.5" /> ড্যাশবোর্ড
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="outline">লগইন</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> হোম পেজে ফিরুন
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300 mb-4">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">সদস্য তালিকা</h1>
          <p className="text-muted-foreground mt-2">নির্বাচনের ভোটার তালিকা পদবি অনুযায়ী</p>
        </div>

        {/* Election selector (if multiple) */}
        {!electionsLoading && elections.length > 1 && !electionId && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {elections.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedElection(e.id)}
                className="bg-card border rounded-xl p-5 text-left hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{e.organization}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {e.election_date}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {e.voters_count} জন সদস্য</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {(electionsLoading || votersLoading) && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!electionsLoading && elections.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">কোনো সদস্য তালিকা প্রকাশিত হয়নি</p>
          </div>
        )}

        {/* Voter list with designation tabs */}
        {voterData && <VoterListTabs data={voterData} search={search} setSearch={setSearch} />}

        {/* Back button if navigated into an election */}
        {selectedElection && elections.length > 1 && (
          <div className="mt-6">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedElection(null); setSearch('') }}>
              <ArrowLeft size={14} className="mr-1" /> অন্য নির্বাচন দেখুন
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Voter List with Designation Tabs ──────────────────────────────────────────
function VoterListTabs({ data, search, setSearch }) {
  const [activeTab, setActiveTab] = useState(0)
  const designations = data.designations ?? []

  if (designations.length === 0) {
    return (
      <div className="text-center py-16">
        <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">এই নির্বাচনে কোনো সদস্য নেই</p>
      </div>
    )
  }

  const currentGroup = designations[activeTab]
  const q = search.toLowerCase().trim()
  const filteredVoters = currentGroup
    ? currentGroup.voters.filter((v) => {
        if (!q) return true
        return (
          v.name?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.mobile?.toLowerCase().includes(q) ||
          v.office_name?.toLowerCase().includes(q)
        )
      })
    : []

  return (
    <div>
      {/* Election info header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{data.election.name}</h2>
          <p className="text-sm text-muted-foreground">{data.election.organization}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users size={14} className="mr-1" /> মোট {data.total_voters} জন
        </Badge>
      </div>

      {/* Designation tabs */}
      <div className="border-b mb-4 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {designations.map((d, i) => (
            <button
              key={d.designation}
              onClick={() => { setActiveTab(i); setSearch('') }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${i === activeTab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
            >
              {d.designation}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                ${i === activeTab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {d.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search within tab */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম, মোবাইল বা অফিস দিয়ে খুঁজুন…"
          className="w-full h-10 pl-9 pr-8 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Voter table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">ক্রম</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">নাম</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">ইমেইল</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">অফিস/কর্মস্থল</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">মোবাইল</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.map((v, i) => (
                <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.office_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.mobile || '—'}</td>
                </tr>
              ))}
              {filteredVoters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    কোনো সদস্য পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-right">
        {currentGroup.designation} — মোট {filteredVoters.length} জন
        {q && ` (ফিল্টারকৃত)`}
      </p>
    </div>
  )
}
