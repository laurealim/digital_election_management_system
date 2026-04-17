import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrganizations, toggleOrganizationStatus, createAdminOrganization } from '@/api/organizations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X } from 'lucide-react'

const TYPE_LABELS = {
  govt: 'সরকারি', private: 'বেসরকারি', association: 'সমিতি',
  cooperative: 'সমবায়',
}

const ORG_TYPES = [
  { value: 'govt',        label: 'সরকারি' },
  { value: 'private',     label: 'বেসরকারি' },
  { value: 'association', label: 'সমিতি' },
  { value: 'cooperative', label: 'সমবায়' },
]

export default function Organizations() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-organizations', search, page],
    queryFn:  () => getAdminOrganizations({ search, page, per_page: 15 })
      .then((r) => r.data),
    keepPreviousData: true,
  })

  const toggle = useMutation({
    mutationFn: (id) => toggleOrganizationStatus(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin-organizations'] }),
  })

  const orgs  = data?.data ?? []
  const meta  = data?.meta?.pagination ?? {}

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">সংগঠনসমূহ</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1.5" /> নতুন সংগঠন
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">লোড হচ্ছে…</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">সংগঠন</th>
                <th className="text-left px-4 py-3 font-medium">ধরন</th>
                <th className="text-left px-4 py-3 font-medium">ইমেইল</th>
                <th className="text-left px-4 py-3 font-medium">ব্যবহারকারী</th>
                <th className="text-left px-4 py-3 font-medium">অবস্থা</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    কোনো সংগঠন পাওয়া যায়নি।
                  </td>
                </tr>
              )}
              {orgs.map((org) => (
                <tr key={org.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[org.type] ?? org.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.email}</td>
                  <td className="px-4 py-3">{org.users_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge org={org} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(org.id)}
                    >
                      {org.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            পূর্ববর্তী
          </Button>
          <span className="text-muted-foreground">পৃষ্ঠা {meta.current_page} / {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>
            পরবর্তী
          </Button>
        </div>
      )}

      {showCreate && (
        <CreateOrganizationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ org }) {
  if (!org.email_verified_at) return <Badge variant="warning">অযাচাইকৃত</Badge>
  if (!org.is_active)         return <Badge variant="destructive">নিষ্ক্রিয়</Badge>
  return <Badge variant="success">সক্রিয়</Badge>
}

function CreateOrganizationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', type: 'govt', email: '', phone: '', address: '',
    admin_name: '', admin_email: '', admin_password: '',
  })
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (data) => createAdminOrganization(data),
    onSuccess: () => onCreated(),
    onError: (err) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrors({ general: [err.response?.data?.message || 'সংগঠন তৈরি করতে ব্যর্থ।'] })
      }
    },
  })

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    mutation.mutate(form)
  }

  function FieldError({ name }) {
    return errors[name]
      ? <p className="text-xs text-destructive mt-1">{errors[name][0]}</p>
      : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">নতুন সংগঠন</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general[0]}</AlertDescription>
            </Alert>
          )}

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">সংগঠনের তথ্য</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>সংগঠনের নাম *</Label>
              <Input value={form.name} onChange={set('name')} />
              <FieldError name="name" />
            </div>
            <div>
              <Label>ধরন *</Label>
              <select
                value={form.type}
                onChange={set('type')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <FieldError name="type" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>সংগঠনের ইমেইল *</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
              <FieldError name="email" />
            </div>
            <div>
              <Label>ফোন *</Label>
              <Input value={form.phone} onChange={set('phone')} />
              <FieldError name="phone" />
            </div>
          </div>

          <div>
            <Label>ঠিকানা</Label>
            <Input value={form.address} onChange={set('address')} />
            <FieldError name="address" />
          </div>

          <hr className="my-2" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">অ্যাডমিন অ্যাকাউন্ট</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>অ্যাডমিনের নাম *</Label>
              <Input value={form.admin_name} onChange={set('admin_name')} />
              <FieldError name="admin_name" />
            </div>
            <div>
              <Label>অ্যাডমিনের ইমেইল *</Label>
              <Input type="email" value={form.admin_email} onChange={set('admin_email')} />
              <FieldError name="admin_email" />
            </div>
          </div>

          <div>
            <Label>অ্যাডমিনের পাসওয়ার্ড *</Label>
            <Input type="password" value={form.admin_password} onChange={set('admin_password')} />
            <FieldError name="admin_password" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'তৈরি হচ্ছে…' : 'সংগঠন তৈরি করুন'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
