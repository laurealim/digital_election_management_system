import { useState } from 'react'
import { Link } from 'react-router-dom'
import { trackNomination, getNominationPdfUrl } from '@/api/nominations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Download, Search } from 'lucide-react'
import PublicNavbar from '@/components/public/PublicNavbar'

const STATUS_CONFIG = {
  pending:  { label: 'অপেক্ষমাণ',                variant: 'warning',     desc: 'আপনার আবেদন নির্বাচন কমিশন কর্তৃক পর্যালোচনার অপেক্ষায় রয়েছে।' },
  verified: { label: 'যাচাইকৃত (পেমেন্ট বাকি)',  variant: 'info',        desc: 'আপনার আবেদন যাচাই করা হয়েছে। নির্ধারিত ফি পরিশোধ করুন।' },
  rejected: { label: 'প্রত্যাখ্যাত',              variant: 'destructive', desc: 'আপনার আবেদন প্রত্যাখ্যাত হয়েছে।' },
  accepted: { label: 'গৃহীত',                     variant: 'success',     desc: 'অভিনন্দন! আপনার মনোনয়ন চূড়ান্তভাবে গৃহীত হয়েছে।' },
}

export default function NominationTrackPage() {
  const [mode,   setMode]   = useState('token') // 'token' | 'email'
  const [token,  setToken]  = useState('')
  const [email,  setEmail]  = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const params = mode === 'token' ? { token } : { email, mobile }
      const res = await trackNomination(params)
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'আবেদন পাওয়া যায়নি।')
    } finally {
      setLoading(false)
    }
  }

  const statusCfg = result ? (STATUS_CONFIG[result.status] ?? { label: result.status, variant: 'secondary', desc: '' }) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link to="/nominations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> মনোনয়ন পোর্টাল
        </Link>

        <div className="bg-white rounded-xl border shadow-sm p-6 mb-5">
          <h1 className="text-xl font-bold mb-1">আবেদনের অবস্থা জানুন</h1>
          <p className="text-muted-foreground text-sm mb-5">টোকেন নম্বর অথবা ইমেইল ও মোবাইল দিয়ে খুঁজুন।</p>

          {/* Toggle */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setMode('token')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${mode === 'token' ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
            >
              টোকেন নম্বর
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${mode === 'email' ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
            >
              ইমেইল ও মোবাইল
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            {mode === 'token' ? (
              <div className="space-y-1.5">
                <Label htmlFor="token">টোকেন নম্বর *</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  required
                  placeholder="যেমন: A3F7B2C1"
                  maxLength={8}
                  className="font-mono tracking-widest uppercase"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email">ইমেইল *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">মোবাইল নম্বর *</Label>
                  <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                </div>
              </>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              <Search size={15} className="mr-2" />
              {loading ? 'খোঁজা হচ্ছে...' : 'খুঁজুন'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Result card */}
        {result && statusCfg && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">টোকেন নম্বর</p>
                <p className="text-2xl font-bold tracking-widest text-[#1a4f8a] font-mono">{result.token_number}</p>
              </div>
              <Badge variant={statusCfg.variant} className="text-sm px-3 py-1">{statusCfg.label}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">{statusCfg.desc}</p>

            <div className="border rounded-lg divide-y text-sm">
              <Row label="নাম"            value={result.name} />
              <Row label="নির্বাচন"       value={result.election?.name} />
              <Row label="আবেদনকৃত পদ"   value={result.posts?.map((p) => p.title).join(', ') || '—'} />
              <Row label="পেমেন্ট"        value={result.payment_status ? '✓ পরিশোধিত' : '✗ বাকি আছে'} />
              {result.rejection_reason && (
                <Row label="প্রত্যাখ্যানের কারণ" value={result.rejection_reason} className="text-destructive" />
              )}
            </div>

            {/* Status timeline */}
            {result.status_logs?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">অবস্থার ইতিহাস</p>
                <div className="space-y-2">
                  {result.status_logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-[#1a4f8a] mt-1 flex-shrink-0" />
                      <span>{log.to_status} — {new Date(log.created_at).toLocaleString('bn-BD')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <a href={getNominationPdfUrl(result.token_number)} target="_blank" rel="noreferrer">
                <Download size={15} className="mr-2" />
                মনোনয়নপত্র ডাউনলোড করুন (PDF)
              </a>
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function Row({ label, value, className }) {
  return (
    <div className="flex px-3 py-2 gap-2">
      <span className="text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className={`font-medium ${className ?? ''}`}>{value}</span>
    </div>
  )
}