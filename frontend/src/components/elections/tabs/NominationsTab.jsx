import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getElectionNominations,
  verifyNomination,
  rejectNomination,
  markNominationPaid,
  acceptNomination,
  getNominationPdfUrl,
} from '@/api/nominations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Download, CheckCircle, XCircle, CreditCard, ThumbsUp } from 'lucide-react'

const STATUS_FILTER_TABS = [
  { key: '',          label: 'সব' },
  { key: 'pending',   label: 'অপেক্ষমাণ' },
  { key: 'verified',  label: 'যাচাইকৃত' },
  { key: 'rejected',  label: 'প্রত্যাখ্যাত' },
  { key: 'accepted',  label: 'গৃহীত' },
]

const STATUS_VARIANT = {
  pending:  'warning',
  verified: 'info',
  rejected: 'destructive',
  accepted: 'success',
}

const STATUS_LABEL = {
  pending:  'অপেক্ষমাণ',
  verified: 'যাচাইকৃত',
  rejected: 'প্রত্যাখ্যাত',
  accepted: 'গৃহীত',
}

export default function NominationsTab({ election }) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [rejectModal, setRejectModal] = useState(null) // nomination object
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState(null)

  const queryKey = ['nominations', election.id, statusFilter, search]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getElectionNominations(election.id, { status: statusFilter || undefined, search: search || undefined, per_page: 50 })
      .then((r) => r.data.data),
  })

  const nominations = data ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['nominations', election.id] })
  }

  const verifyMut   = useMutation({ mutationFn: (id) => verifyNomination(election.id, id),   onSuccess: invalidate })
  const markPaidMut = useMutation({ mutationFn: (id) => markNominationPaid(election.id, id), onSuccess: invalidate })
  const acceptMut   = useMutation({ mutationFn: (id) => acceptNomination(election.id, id),   onSuccess: invalidate })
  const rejectMut   = useMutation({
    mutationFn: ({ id, reason }) => rejectNomination(election.id, id, { rejection_reason: reason }),
    onSuccess: () => { invalidate(); setRejectModal(null); setRejectReason('') },
    onError: (err) => setActionError(err.response?.data?.message || 'একটি সমস্যা হয়েছে।'),
  })

  const anyPending = verifyMut.isPending || markPaidMut.isPending || acceptMut.isPending || rejectMut.isPending

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                statusFilter === t.key
                  ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="নাম / ইমেইল / টোকেন..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">লোড হচ্ছে...</p>
      ) : nominations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">কোনো মনোনয়ন পাওয়া যায়নি।</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50">
              <tr>
                {['টোকেন', 'নাম', 'ইমেইল', 'পদ', 'পেমেন্ট', 'অবস্থা', 'পদক্ষেপ'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {nominations.map((nom) => (
                <tr key={nom.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-[#1a4f8a]">{nom.token_number}</td>
                  <td className="px-3 py-2.5 font-medium">{nom.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{nom.email}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {nom.posts?.map((p) => p.title).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {nom.payment_status
                      ? <span className="text-green-600 font-medium">✓ পরিশোধিত</span>
                      : <span className="text-muted-foreground">✗ বাকি</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={STATUS_VARIANT[nom.status] ?? 'secondary'} className="text-xs">
                      {STATUS_LABEL[nom.status] ?? nom.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Verify */}
                      {nom.status === 'pending' && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                          disabled={anyPending}
                          onClick={() => { setActionError(null); verifyMut.mutate(nom.id) }}
                          title="যাচাই করুন"
                        >
                          <CheckCircle size={13} className="mr-1" /> যাচাই
                        </Button>
                      )}

                      {/* Mark paid */}
                      {nom.status === 'verified' && !nom.payment_status && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 px-2 text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
                          disabled={anyPending}
                          onClick={() => { setActionError(null); markPaidMut.mutate(nom.id) }}
                          title="পেমেন্ট নিশ্চিত করুন"
                        >
                          <CreditCard size={13} className="mr-1" /> পেমেন্ট
                        </Button>
                      )}

                      {/* Accept */}
                      {nom.status === 'verified' && nom.payment_status && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          disabled={anyPending}
                          onClick={() => { setActionError(null); acceptMut.mutate(nom.id) }}
                          title="মনোনয়ন গ্রহণ করুন"
                        >
                          <ThumbsUp size={13} className="mr-1" /> গ্রহণ
                        </Button>
                      )}

                      {/* Reject */}
                      {['pending', 'verified'].includes(nom.status) && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          disabled={anyPending}
                          onClick={() => { setActionError(null); setRejectModal(nom); setRejectReason('') }}
                          title="প্রত্যাখ্যান করুন"
                        >
                          <XCircle size={13} className="mr-1" /> প্রত্যাখ্যান
                        </Button>
                      )}

                      {/* PDF */}
                      <a
                        href={getNominationPdfUrl(nom.token_number)}
                        target="_blank"
                        rel="noreferrer"
                        title="PDF ডাউনলোড"
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Download size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg">মনোনয়ন প্রত্যাখ্যান করুন</h3>
            <p className="text-sm text-muted-foreground">
              <strong>{rejectModal.name}</strong> ({rejectModal.token_number}) — প্রত্যাখ্যানের কারণ লিখুন।
            </p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder="প্রত্যাখ্যানের কারণ বিস্তারিত লিখুন..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectModal(null)}>বাতিল</Button>
              <Button
                variant="destructive"
                disabled={rejectReason.trim().length < 5 || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectModal.id, reason: rejectReason })}
              >
                {rejectMut.isPending ? 'জমা হচ্ছে...' : 'প্রত্যাখ্যান নিশ্চিত করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}