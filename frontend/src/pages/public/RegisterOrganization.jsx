import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerOrganization } from '@/api/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Mail } from 'lucide-react'

const ORG_TYPES = [
  { value: 'govt',        label: 'সরকারি দপ্তর (Government Office)' },
  { value: 'private',     label: 'বেসরকারি প্রতিষ্ঠান (Private Company)' },
  { value: 'association', label: 'সমিতি / সংগঠন (Association)' },
  { value: 'cooperative', label: 'সমবায় সমিতি (Cooperative)' },
  { value: 'ngo',         label: 'এনজিও / অলাভজনক (NGO / Non-profit)' },
  { value: 'education',   label: 'শিক্ষা প্রতিষ্ঠান (Educational Institution)' },
]

export default function RegisterOrganization() {
  const [form, setForm] = useState({
    org_name: '', org_type: '', org_email: '', org_phone: '', org_address: '',
    admin_name: '', admin_email: '', admin_mobile: '', admin_designation: '',
  })
  const [errors,     setErrors]     = useState({})
  const [adminEmail, setAdminEmail] = useState('')
  const [loading,    setLoading]    = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined, general: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      await registerOrganization({
        name:              form.org_name,
        type:              form.org_type,
        email:             form.org_email,
        phone:             form.org_phone,
        address:           form.org_address,
        admin_name:        form.admin_name,
        admin_email:       form.admin_email,
        admin_mobile:      form.admin_mobile,
        admin_designation: form.admin_designation,
      })
      setAdminEmail(form.admin_email)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        setErrors({ general: [err.response?.data?.message || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'] })
      }
    } finally {
      setLoading(false)
    }
  }

  function FieldError({ name }) {
    return errors[name]
      ? <p className="text-xs text-destructive mt-1">{errors[name][0]}</p>
      : null
  }

  if (adminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-950 rounded-full p-4">
                <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold">নিবন্ধন সফল হয়েছে!</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>আপনার সংগঠন নিবন্ধন সম্পন্ন হয়েছে।</p>
              <div className="flex items-center justify-center gap-2 bg-muted rounded-lg px-4 py-3 mt-2">
                <Mail size={16} className="text-primary shrink-0" />
                <span>
                  <strong className="text-foreground">{adminEmail}</strong> ঠিকানায় পাসওয়ার্ড সেটআপের লিঙ্ক পাঠানো হয়েছে।
                </span>
              </div>
              <p className="pt-1">
                ইমেইল চেক করুন এবং লিঙ্কে ক্লিক করে আপনার অ্যাকাউন্ট সক্রিয় করুন।
                <br />
                <span className="text-xs">(ইনবক্সে না পেলে স্প্যাম ফোল্ডার দেখুন।)</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Link to="/login" className="text-sm text-primary hover:underline">
              লগইন পেজে যান
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">সংগঠন নিবন্ধন</CardTitle>
          <CardDescription>
            নিবন্ধনের পরে অ্যাডমিনের ইমেইলে পাসওয়ার্ড সেটআপের লিঙ্ক পাঠানো হবে।
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general[0]}</AlertDescription>
              </Alert>
            )}

            {/* Organization section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                সংগঠনের তথ্য
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="org_name">সংগঠনের নাম *</Label>
                  <Input id="org_name" value={form.org_name} onChange={set('org_name')} required />
                  <FieldError name="name" />
                </div>

                <div>
                  <Label htmlFor="org_type">ধরন *</Label>
                  <select
                    id="org_type"
                    value={form.org_type}
                    onChange={set('org_type')}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">ধরন বেছে নিন…</option>
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <FieldError name="type" />
                </div>

                <div>
                  <Label htmlFor="org_email">সংগঠনের ইমেইল *</Label>
                  <Input id="org_email" type="email" value={form.org_email} onChange={set('org_email')} required />
                  <FieldError name="email" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="org_phone">ফোন নম্বর</Label>
                    <Input id="org_phone" value={form.org_phone} onChange={set('org_phone')} />
                    <FieldError name="phone" />
                  </div>
                  <div>
                    <Label htmlFor="org_address">ঠিকানা</Label>
                    <Input id="org_address" value={form.org_address} onChange={set('org_address')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                অ্যাডমিন অ্যাকাউন্ট
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="admin_name">পূর্ণ নাম *</Label>
                  <Input id="admin_name" value={form.admin_name} onChange={set('admin_name')} required />
                  <FieldError name="admin_name" />
                </div>

                <div>
                  <Label htmlFor="admin_email">ইমেইল * <span className="text-xs text-muted-foreground">(পাসওয়ার্ড সেটআপ লিঙ্ক এখানে যাবে)</span></Label>
                  <Input id="admin_email" type="email" value={form.admin_email} onChange={set('admin_email')} required />
                  <FieldError name="admin_email" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="admin_mobile">মোবাইল</Label>
                    <Input id="admin_mobile" value={form.admin_mobile} onChange={set('admin_mobile')} />
                  </div>
                  <div>
                    <Label htmlFor="admin_designation">পদবি</Label>
                    <Input id="admin_designation" value={form.admin_designation} onChange={set('admin_designation')} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'নিবন্ধন হচ্ছে…' : 'সংগঠন নিবন্ধন করুন'}
            </Button>
            <Link to="/login" className="text-xs text-muted-foreground hover:underline">
              ইতোমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
