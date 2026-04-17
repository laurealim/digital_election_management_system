import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishedElections, submitNomination, getNominationPdfUrl, getDesignations } from '@/api/nominations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Download, CheckCircle } from 'lucide-react'
import PublicNavbar from '@/components/public/PublicNavbar'

export default function NominationApplyPage() {
  const { electionId } = useParams()

  const { data: electionData, isLoading } = useQuery({
    queryKey: ['public-election', electionId],
    queryFn:  () => getPublishedElections({ per_page: 100 }).then((r) =>
      r.data.data.find((e) => String(e.id) === String(electionId))
    ),
  })

  const { data: designationsData } = useQuery({
    queryKey: ['public-designations'],
    queryFn:  () => getDesignations().then((r) => r.data.data),
    staleTime: Infinity,
  })

  const election = electionData

  const [form, setForm] = useState({
    name: '',
    father_name: '',
    mother_name: '',
    nid: '',
    designation: '',
    address: '',
    email: '',
    mobile: '',
    organization_name: '',
    post_ids: [],
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  function togglePost(postId) {
    const isSingle = !election?.allow_multi_post
    setForm((f) => {
      if (isSingle) return { ...f, post_ids: [postId] }
      const has = f.post_ids.includes(postId)
      return { ...f, post_ids: has ? f.post_ids.filter((id) => id !== postId) : [...f.post_ids, postId] }
    })
    setErrors((er) => ({ ...er, post_ids: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    if (form.post_ids.length === 0) {
      setErrors({ post_ids: ['অন্তত একটি পদ নির্বাচন করুন।'] })
      return
    }
    setLoading(true)
    try {
      const res = await submitNomination({ ...form, election_id: electionId })
      setResult(res.data.data)
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors ?? {}
        if (Object.keys(errs).length > 0) {
          setErrors(errs)
        } else {
          setErrors({ general: [err.response.data.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।'] })
        }
      } else {
        setErrors({ general: [err.response?.data?.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।'] })
      }
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <><PublicNavbar /><div className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</div></>

  if (!election) return (
    <>
      <PublicNavbar />
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">নির্বাচনটি পাওয়া যায়নি বা মনোনয়ন গ্রহণ বন্ধ।</p>
        <Link to="/nominations" className="text-primary underline text-sm">মনোনয়ন পোর্টালে ফিরুন</Link>
      </div>
    </>
  )

  // ── Success state ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavbar />
        <div className="flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
            <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">মনোনয়নপত্র সফলভাবে জমা হয়েছে!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              আপনার আবেদনটি নির্বাচন কমিশন কর্তৃক পর্যালোচনা করা হবে।
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">আপনার টোকেন নম্বর</p>
              <p className="text-3xl font-bold tracking-widest text-[#1a4f8a]">{result.token_number}</p>
              <p className="text-xs text-muted-foreground mt-2">এই নম্বরটি সংরক্ষণ করুন। আবেদনের অবস্থা জানতে প্রয়োজন হবে।</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <a href={getNominationPdfUrl(result.token_number)} target="_blank" rel="noreferrer">
                  <Download size={15} className="mr-2" />
                  মনোনয়নপত্র ডাউনলোড করুন (PDF)
                </a>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/nominations/track">আবেদনের অবস্থা জানুন</Link>
              </Button>
              <Link to="/nominations" className="text-xs text-muted-foreground hover:text-foreground">
                মনোনয়ন পোর্টালে ফিরুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isSingle = !election.allow_multi_post

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Link to="/nominations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft size={14} /> মনোনয়ন পোর্টাল
          </Link>

          <div className="bg-[#1a4f8a] text-white rounded-t-xl p-5">
            <h1 className="text-xl font-bold">{election.name}</h1>
            <p className="text-blue-200 text-sm mt-1">{election.organization?.name}</p>
          </div>

          <div className="bg-white rounded-b-xl border border-t-0 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-1">মনোনয়নপত্র পূরণ করুন</h2>
            <p className="text-xs text-muted-foreground mb-5">(<span className="text-destructive">*</span>) চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে।</p>

            {errors.general && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errors.general[0]}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Section: Personal Info ── */}
              <div className="text-xs font-semibold text-[#1a4f8a] uppercase tracking-wide pt-1 border-b pb-1">
                ব্যক্তিগত তথ্য
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">প্রার্থীর নাম <span className="text-destructive">*</span></Label>
                <Input id="name" value={form.name} onChange={set('name')} required placeholder="আপনার পূর্ণ নাম (বাংলায়)" />
                {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="father_name">পিতার নাম <span className="text-destructive">*</span></Label>
                  <Input id="father_name" value={form.father_name} onChange={set('father_name')} required placeholder="পিতার পূর্ণ নাম" />
                  {errors.father_name && <p className="text-xs text-destructive">{errors.father_name[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mother_name">মাতার নাম</Label>
                  <Input id="mother_name" value={form.mother_name} onChange={set('mother_name')} placeholder="মাতার পূর্ণ নাম" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nid">জাতীয় পরিচয়পত্র</Label>
                  <Input
                    id="nid"
                    value={form.nid}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      setForm((f) => ({ ...f, nid: v }))
                      setErrors((er) => ({ ...er, nid: undefined }))
                    }}
                    placeholder="১০, ১৩ বা ১৭ সংখ্যার NID"
                    maxLength={17}
                  />
                  {errors.nid && <p className="text-xs text-destructive">{errors.nid[0]}</p>}
                  {form.nid && ![10, 13, 17].includes(form.nid.length) && (
                    <p className="text-xs text-amber-600">NID নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে।</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designation">পদবি / পদমর্যাদা</Label>
                  <select
                    id="designation"
                    value={form.designation}
                    onChange={set('designation')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">— নির্বাচন করুন —</option>
                    {designationsData && Object.entries(designationsData).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {errors.designation && <p className="text-xs text-destructive">{errors.designation[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">স্থায়ী ঠিকানা</Label>
                <Input id="address" value={form.address} onChange={set('address')} placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা" />
              </div>

              {/* ── Section: Contact Info ── */}
              <div className="text-xs font-semibold text-[#1a4f8a] uppercase tracking-wide pt-1 border-b pb-1">
                যোগাযোগের তথ্য
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">মোবাইল নম্বর <span className="text-destructive">*</span></Label>
                  <Input id="mobile" value={form.mobile} onChange={set('mobile')} required placeholder="01XXXXXXXXX" />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">ইমেইল <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" value={form.email} onChange={set('email')} required placeholder="example@email.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organization_name">প্রতিষ্ঠান / কার্যালয়</Label>
                <Input id="organization_name" value={form.organization_name} onChange={set('organization_name')} placeholder="আপনার কর্মস্থলের নাম" />
              </div>

              {/* ── Section: Posts ── */}
              <div className="text-xs font-semibold text-[#1a4f8a] uppercase tracking-wide pt-1 border-b pb-1">
                প্রার্থিতার পদ
              </div>

              <div className="space-y-2">
                <Label>পদ নির্বাচন করুন {isSingle ? '(একটি মাত্র)' : '(একাধিক নির্বাচন করা যাবে)'} <span className="text-destructive">*</span></Label>
                {election.posts?.length > 0 ? (
                  <div className="space-y-2">
                    {election.posts.map((post) => {
                      const checked = form.post_ids.includes(post.id)
                      return (
                        <label key={post.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type={isSingle ? 'radio' : 'checkbox'}
                            name="post"
                            checked={checked}
                            onChange={() => togglePost(post.id)}
                            className="accent-[#1a4f8a]"
                          />
                          <span className="text-sm font-medium">{post.title}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">কোনো পদ পাওয়া যায়নি।</p>
                )}
                {errors.post_ids && <p className="text-xs text-destructive">{errors.post_ids[0]}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading ? 'জমা হচ্ছে...' : 'মনোনয়নপত্র জমা দিন'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}