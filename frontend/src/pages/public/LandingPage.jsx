import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicFocalPoints } from '@/api/publicResults'
import { Vote, Shield, Users, BarChart2, CheckCircle2, Globe, ArrowRight, Building2, Zap, Lock, Phone, Headset, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Vote size={28} className="text-primary" />,
    title: 'নিরাপদ ভোটদান',
    subtitle: 'Secure Voting',
    desc: 'HMAC হ্যাশ ও ডাটাবেজ লক দিয়ে প্রতিটি ভোট সুরক্ষিত। দ্বৈত ভোট শূন্য।',
  },
  {
    icon: <Shield size={28} className="text-primary" />,
    title: 'ভূমিকা নিয়ন্ত্রণ',
    subtitle: 'Role-Based Access',
    desc: '৭টি ভূমিকা — সুপার অ্যাডমিন থেকে ভোটার পর্যন্ত — সঠিক অনুমতি নিয়ে।',
  },
  {
    icon: <Users size={28} className="text-primary" />,
    title: 'ভোটার ব্যবস্থাপনা',
    subtitle: 'Voter Management',
    desc: 'এক্সেল থেকে বাল্ক আমদানি, ইমেইল আমন্ত্রণ, এবং রিয়েলটাইম স্ট্যাটাস।',
  },
  {
    icon: <BarChart2 size={28} className="text-primary" />,
    title: 'তাৎক্ষণিক ফলাফল',
    subtitle: 'Instant Results',
    desc: 'ভোট শেষ হওয়ার সাথে সাথে চার্ট ও রিপোর্ট স্বয়ংক্রিয়ভাবে প্রকাশিত হয়।',
  },
  {
    icon: <Globe size={28} className="text-primary" />,
    title: 'মাল্টি-টেন্যান্ট',
    subtitle: 'Multi-Tenant SaaS',
    desc: 'একাধিক প্রতিষ্ঠান আলাদাভাবে পরিচালনা করুন একটি প্ল্যাটফর্মে।',
  },
  {
    icon: <Zap size={28} className="text-primary" />,
    title: 'স্বয়ংক্রিয় শিডিউল',
    subtitle: 'Auto-Scheduled',
    desc: 'নির্ধারিত সময়ে নির্বাচন স্বয়ংক্রিয়ভাবে শুরু ও বন্ধ হয়।',
  },
]

const ROLES = [
  { name: 'সুপার অ্যাডমিন', en: 'Super Admin', desc: 'সকল কিছুর পূর্ণ নিয়ন্ত্রণ', color: 'bg-red-100 text-red-700' },
  { name: 'সংগঠন অ্যাডমিন', en: 'Org Admin', desc: 'সংগঠনের সব কার্যক্রম পরিচালনা', color: 'bg-orange-100 text-orange-700' },
  { name: 'সংগঠন ব্যবহারকারী', en: 'Org User', desc: 'নির্বাচন তৈরি ও সম্পাদনা, ভোটার আমদানি', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'নির্বাচন অ্যাডমিন', en: 'Election Admin', desc: 'ভোটার, প্রার্থী ও পদ পরিচালনা', color: 'bg-green-100 text-green-700' },
  { name: 'নির্বাচন ব্যবহারকারী', en: 'Election User', desc: 'ভোটার ব্যবস্থাপনা ও ফলাফল দেখা', color: 'bg-teal-100 text-teal-700' },
  { name: 'ভোটার', en: 'Voter', desc: 'ভোট প্রদান এবং ফলাফল দেখা', color: 'bg-blue-100 text-blue-700' },
  { name: 'প্রার্থী', en: 'Candidate', desc: 'ভোট প্রদান ও নিজের ভোট ফলাফল', color: 'bg-purple-100 text-purple-700' },
]

const STEPS = [
  { n: '০১', title: 'সংগঠন নিবন্ধন', desc: 'আপনার প্রতিষ্ঠান নিবন্ধন করুন এবং ইমেইল যাচাই করুন।' },
  { n: '০২', title: 'নির্বাচন তৈরি', desc: 'নির্বাচনের নাম, তারিখ এবং ভোটদান সময় নির্ধারণ করুন।' },
  { n: '০৩', title: 'ভোটার যোগ করুন', desc: 'এক্সেল থেকে বাল্ক আমদানি করুন বা একে একে যোগ করুন।' },
  { n: '০৪', title: 'ভোটগ্রহণ', desc: 'নির্ধারিত সময়ে ভোটাররা নিরাপদে ভোট দেন।' },
  { n: '০৫', title: 'ফলাফল প্রকাশ', desc: 'স্বয়ংক্রিয়ভাবে ফলাফল চার্টসহ প্রকাশিত হয়।' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote size={22} className="text-primary" />
          <span className="text-xl font-bold text-primary">DEMS</span>
          <span className="hidden sm:inline text-xs text-muted-foreground ml-1">ডিজিটাল নির্বাচন ব্যবস্থাপনা</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/results" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
            ফলাফল
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">লগইন</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">নিবন্ধন করুন</Button>
          </Link>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-24 px-6 text-center">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/5" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary/5" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <Lock size={13} className="text-primary" />
            বাংলাদেশের জন্য নির্মিত নিরাপদ ডিজিটাল নির্বাচন
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            ডিজিটাল নির্বাচন{' '}
            <span className="text-primary">ব্যবস্থাপনা সিস্টেম</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            সরকারি দফতর, কোম্পানি, সমিতি ও সমবায়ের জন্য সম্পূর্ণ ডিজিটাল নির্বাচন পরিচালনার সমাধান।
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                বিনামূল্যে শুরু করুন <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">আমার অ্যাকাউন্টে প্রবেশ করুন</Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground">
            {['নিরাপদ ও এনক্রিপ্টেড', 'রিয়েলটাইম ফলাফল', 'বাংলা সমর্থন'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-primary" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">কেন DEMS বেছে নেবেন?</h2>
            <p className="text-muted-foreground mt-2">আধুনিক প্রযুক্তিতে নির্বাচন পরিচালনার সকল সুবিধা</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.subtitle} className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.subtitle}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles Section ───────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">ব্যবহারকারীর ধরন</h2>
            <p className="text-muted-foreground mt-2">৭ ধরনের ভূমিকায় সঠিক অনুমতি নিয়ন্ত্রণ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((r) => (
              <div key={r.en} className="border rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.en}</span>
                </div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">কীভাবে কাজ করে?</h2>
            <p className="text-muted-foreground mt-2">মাত্র কয়েকটি ধাপে সম্পূর্ণ নির্বাচন পরিচালনা</p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {s.n}
                </div>
                <div className="pt-1">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="ml-6 border-l-2 border-dashed border-primary/30 h-8 mt-12 absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For whom ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">কারা ব্যবহার করতে পারবেন?</h2>
          <p className="text-muted-foreground mb-10">যেকোনো প্রতিষ্ঠান যেখানে নির্বাচন বা ভোটগ্রহণ প্রয়োজন</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Building2 size={24} />, label: 'সরকারি দফতর' },
              { icon: <Users size={24} />, label: 'কর্পোরেট প্রতিষ্ঠান' },
              { icon: <Globe size={24} />, label: 'সমিতি ও সংগঠন' },
              { icon: <Vote size={24} />, label: 'সমবায় সমিতি' },
            ].map((item) => (
              <div key={item.label} className="bg-card border rounded-xl p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="font-medium text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Focal Point / Help Desk ────────────────────────────────────── */}
      <FocalPointSection />

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">আজই শুরু করুন</h2>
          <p className="opacity-90">আপনার প্রতিষ্ঠানের নির্বাচন ডিজিটাল করুন। সম্পূর্ণ বিনামূল্যে নিবন্ধন করুন।</p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              সংগঠন নিবন্ধন করুন <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Vote size={16} className="text-primary" />
          <span className="font-bold text-primary">DEMS</span>
        </div>
        <p>ডিজিটাল নির্বাচন ব্যবস্থাপনা সিস্টেম — বাংলাদেশ</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link to="/results"  className="hover:text-foreground transition-colors">ফলাফল</Link>
          <Link to="/login"    className="hover:text-foreground transition-colors">লগইন</Link>
          <Link to="/register" className="hover:text-foreground transition-colors">নিবন্ধন</Link>
        </div>
      </footer>
    </div>
  )
}

// ─── Focal Point / Help Desk Section ──────────────────────────────────────────
function FocalPointSection() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['public-focal-points'],
    queryFn:  () => getPublicFocalPoints().then((r) => r.data.data ?? []),
    staleTime: 5 * 60 * 1000,
  })

  const moderators = data ?? []
  const q = search.toLowerCase().trim()
  const filtered = moderators.filter((m) => {
    if (!q) return true
    return (
      m.name?.toLowerCase().includes(q) ||
      m.mobile?.toLowerCase().includes(q) ||
      m.organization?.toLowerCase().includes(q)
    )
  })

  if (!isLoading && moderators.length === 0) return null

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Headset size={28} />
          </div>
          <h2 className="text-3xl font-bold">ফোকাল পয়েন্ট</h2>
          <p className="text-muted-foreground mt-2">
            ভোটদানে কোনো সমস্যা হলে নিচের মডারেটরদের সাথে যোগাযোগ করুন
          </p>
        </div>

        {/* Search */}
        {moderators.length > 5 && (
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, মোবাইল বা সংগঠন দিয়ে খুঁজুন…"
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
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mod, i) => (
              <div
                key={i}
                className="bg-card border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow group"
              >
                {/* Avatar */}
                <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-sm font-bold">
                  {mod.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-sm truncate">{mod.name}</p>
                  {mod.designation && (
                    <p className="text-xs text-muted-foreground truncate">{mod.designation}</p>
                  )}
                  {mod.organization && (
                    <p className="text-xs text-muted-foreground truncate">{mod.organization}</p>
                  )}
                  {mod.mobile && (
                    <a
                      href={`tel:${mod.mobile}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
                    >
                      <Phone size={12} /> {mod.mobile}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && filtered.length === 0 && q && (
          <p className="text-center text-muted-foreground text-sm py-6">
            কোনো মডারেটর পাওয়া যায়নি।
          </p>
        )}
      </div>
    </section>
  )
}
