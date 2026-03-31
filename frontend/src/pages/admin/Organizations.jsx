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
  govt: 'Government', private: 'Private', association: 'Association',
  cooperative: 'Cooperative',
}

const ORG_TYPES = [
  { value: 'govt',        label: 'Government' },
  { value: 'private',     label: 'Private' },
  { value: 'association', label: 'Association' },
  { value: 'cooperative', label: 'Cooperative' },
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
    onSuccess:  () => queryClient.invalidateQueries(['admin-organizations']),
  })

  const orgs  = data?.data ?? []
  const meta  = data?.meta?.pagination ?? {}

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1.5" /> New Organization
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Organization</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Users</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No organizations found.
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
                      {org.is_active ? 'Deactivate' : 'Activate'}
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
            Previous
          </Button>
          <span className="text-muted-foreground">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {showCreate && (
        <CreateOrganizationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            queryClient.invalidateQueries(['admin-organizations'])
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ org }) {
  if (!org.email_verified_at) return <Badge variant="warning">Unverified</Badge>
  if (!org.is_active)         return <Badge variant="destructive">Inactive</Badge>
  return <Badge variant="success">Active</Badge>
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
        setErrors({ general: [err.response?.data?.message || 'Failed to create organization.'] })
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
        className="bg-card border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">New Organization</h2>
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

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Organization Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Organization Name *</Label>
              <Input value={form.name} onChange={set('name')} />
              <FieldError name="name" />
            </div>
            <div>
              <Label>Type *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Organization Email *</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
              <FieldError name="email" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={set('phone')} />
              <FieldError name="phone" />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={set('address')} />
            <FieldError name="address" />
          </div>

          <hr className="my-2" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Admin Account</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Admin Name *</Label>
              <Input value={form.admin_name} onChange={set('admin_name')} />
              <FieldError name="admin_name" />
            </div>
            <div>
              <Label>Admin Email *</Label>
              <Input type="email" value={form.admin_email} onChange={set('admin_email')} />
              <FieldError name="admin_email" />
            </div>
          </div>

          <div>
            <Label>Admin Password *</Label>
            <Input type="password" value={form.admin_password} onChange={set('admin_password')} />
            <FieldError name="admin_password" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
