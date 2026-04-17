import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishedElections } from '@/api/nominations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, CalendarDays, FileText, ClipboardCheck } from 'lucide-react'
import PublicNavbar from '@/components/public/PublicNavbar'

export default function NominationsPortalPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['public-elections', search],
    queryFn:  () => getPublishedElections({ search, per_page: 12 }).then((r) => r.data),
    staleTime: 30_000,
  })

  const elections = data?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      {/* Header */}
      <div className="bg-[#1a4f8a] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">মনোনয়ন পোর্টাল</h1>
          <p className="text-blue-200 text-sm">নির্বাচনে অংশগ্রহণের জন্য মনোনয়নপত্র জমা দিন</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button
              variant="outline"
              className="bg-white text-[#1a4f8a] border-white hover:bg-blue-50"
              onClick={() => navigate('/nominations/track')}
            >
              <ClipboardCheck size={16} className="mr-2" />
              আবেদনের অবস্থা জানুন
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="নির্বাচন খুঁজুন..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Elections list */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">লোড হচ্ছে...</p>
        ) : elections.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground">কোনো মনোনয়ন গ্রহণকারী নির্বাচন পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {elections.map((election) => (
              <div key={election.id} className="bg-white rounded-lg border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="success" className="text-xs">মনোনয়ন চলছে</Badge>
                  </div>
                  <h2 className="font-semibold text-lg">{election.name}</h2>
                  <p className="text-sm text-muted-foreground">{election.organization?.name}</p>
                  {election.election_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarDays size={12} />
                      নির্বাচনের তারিখ: {election.election_date}
                    </p>
                  )}
                  {election.posts?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      পদসমূহ: {election.posts.map((p) => p.title).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Button asChild>
                    <Link to={`/nominations/${election.id}/apply`}>
                      মনোনয়নপত্র জমা দিন
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}