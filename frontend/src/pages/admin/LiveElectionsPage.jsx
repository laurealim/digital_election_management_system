import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminLiveElections, toggleLiveDisplay, updateLiveRefreshInterval } from '@/api/liveElections'
import { Loader2, Radio, Eye, EyeOff, Timer, Users, Vote, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function LiveElectionsPage() {
  const queryClient = useQueryClient()
  const [interval, setInterval_] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-live-elections'],
    queryFn: () => getAdminLiveElections().then((r) => r.data.data),
    onSuccess: (d) => {
      if (d?.refresh_interval && !interval) setInterval_(String(d.refresh_interval))
    },
  })

  // Set interval from data once loaded
  if (data?.refresh_interval && !interval) {
    setInterval_(String(data.refresh_interval))
  }

  const toggleMutation = useMutation({
    mutationFn: (electionId) => toggleLiveDisplay(electionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-live-elections'] }),
  })

  const intervalMutation = useMutation({
    mutationFn: (val) => updateLiveRefreshInterval(val),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-live-elections'] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> লোড হচ্ছে...
      </div>
    )
  }

  const elections = data?.elections ?? []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio size={24} className="text-primary" />
            লাইভ নির্বাচন প্রদর্শন
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ল্যান্ডিং পেজে কোন নির্বাচনের লাইভ ভোটদান স্ট্যাটাস দেখানো হবে তা নির্ধারণ করুন
          </p>
        </div>
      </div>

      {/* Refresh Interval Setting */}
      <div className="border rounded-xl p-5 bg-card space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Timer size={16} className="text-primary" />
          রিফ্রেশ ইন্টারভাল (সেকেন্ড)
        </h2>
        <p className="text-xs text-muted-foreground">
          ল্যান্ডিং পেজে লাইভ স্ট্যাটাস কত সেকেন্ড পর পর আপডেট হবে (৫ – ৩০০ সেকেন্ড)
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={5}
            max={300}
            value={interval}
            onChange={(e) => setInterval_(e.target.value)}
            className="h-10 w-28 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            disabled={intervalMutation.isPending || !interval}
            onClick={() => intervalMutation.mutate(Number(interval))}
          >
            {intervalMutation.isPending ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : (
              <CheckCircle2 size={14} className="mr-1" />
            )}
            সংরক্ষণ করুন
          </Button>
          {intervalMutation.isSuccess && (
            <span className="text-xs text-green-600">সংরক্ষিত হয়েছে!</span>
          )}
        </div>
      </div>

      {/* Elections List */}
      {elections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Vote size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">কোনো সক্রিয় বা নির্ধারিত নির্বাচন নেই</p>
          <p className="text-sm mt-1">নির্বাচন সক্রিয় হলে এখানে দেখা যাবে</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="px-5 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold text-sm">সক্রিয় ও নির্ধারিত নির্বাচন</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-left">
                  <th className="px-5 py-3 font-medium">নির্বাচন</th>
                  <th className="px-5 py-3 font-medium">সংগঠন</th>
                  <th className="px-5 py-3 font-medium">তারিখ</th>
                  <th className="px-5 py-3 font-medium">স্ট্যাটাস</th>
                  <th className="px-5 py-3 font-medium text-center">ভোটার</th>
                  <th className="px-5 py-3 font-medium text-center">ভোট দিয়েছেন</th>
                  <th className="px-5 py-3 font-medium text-center">লাইভ প্রদর্শন</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((el) => (
                  <tr key={el.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-5 py-3 font-medium">{el.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{el.organization?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{el.election_date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          el.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {el.status === 'active' ? 'সক্রিয়' : 'নির্ধারিত'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} className="text-muted-foreground" /> {el.total_voters}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Vote size={14} className="text-muted-foreground" /> {el.total_voted}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Button
                        size="sm"
                        variant={el.is_live_display ? 'default' : 'outline'}
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(el.id)}
                        className="gap-1.5"
                      >
                        {el.is_live_display ? (
                          <>
                            <Eye size={14} /> চালু
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} /> বন্ধ
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
