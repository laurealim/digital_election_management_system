import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getElection, createElection, updateElection } from '@/api/elections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import useBasePath from '@/hooks/useBasePath'

function minStartDatetime() {
  const ms  = Date.now() + 24 * 60 * 60 * 1000
  const min = new Date(ms)
  min.setMinutes(Math.ceil(min.getMinutes() / 15) * 15, 0, 0)
  return min
}

function toLocalDateStr(date) {
  return date.toLocaleDateString('en-CA')
}

function toTimeStr(date) {
  return date.toTimeString().slice(0, 5)
}

export default function ElectionForm() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const basePath    = useBasePath()
  const queryClient = useQueryClient()
  const { t }       = useTranslation()
  const isEdit      = !!id

  const minDt = minStartDatetime()

  const [form, setForm] = useState({
    name:              '',
    description:       '',
    election_date:     toLocalDateStr(minDt),
    voting_start_time: toTimeStr(minDt),
    voting_end_time:   toTimeStr(new Date(minDt.getTime() + 7 * 60 * 60 * 1000)),
    candidate_mode:    'selected',
    allow_multi_post:  false,
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const { data: existing } = useQuery({
    queryKey: ['election', id],
    queryFn:  () => getElection(id).then((r) => r.data.data),
    enabled:  isEdit,
  })

  useEffect(() => {
    if (existing) {
      const dateStr = new Date(existing.election_date)
        .toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })

      setForm({
        name:              existing.name,
        description:       existing.description ?? '',
        election_date:     dateStr,
        voting_start_time: existing.voting_start_time?.slice(0, 5) ?? '',
        voting_end_time:   existing.voting_end_time?.slice(0, 5) ?? '',
        candidate_mode:    existing.candidate_mode,
        allow_multi_post:  existing.allow_multi_post,
      })
    }
  }, [existing])

  function set(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  function validate() {
    const start = new Date(`${form.election_date}T${form.voting_start_time}:00`)
    if (start < minDt) {
      setErrors({ voting_start_time: [t('election.voting_start') + ' কমপক্ষে ২৪ ঘণ্টা পরে হতে হবে।'] })
      return false
    }
    const end = new Date(`${form.election_date}T${form.voting_end_time}:00`)
    if (end <= start) {
      setErrors({ voting_end_time: [t('election.voting_end') + ' শুরুর সময়ের পরে হতে হবে।'] })
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    // if (!validate()) return

    setLoading(true)
    try {
      if (isEdit) {
        await updateElection(id, form)
      } else {
        await createElection(form)
      }
      queryClient.invalidateQueries({ queryKey: ['elections'] })
      navigate(`${basePath}/elections`)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrors({ general: [err.response?.data?.message || t('common.error_generic')] })
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

  return (
    <div className="p-4 sm:p-6 w-full max-w-3xl">
      <div className="mb-6">
        <Link to={`${basePath}/elections`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> {t('election.back_to_elections')}
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {isEdit ? t('election.edit') : t('election.new')}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            {errors.general && (
              <Alert variant="destructive"><AlertDescription>{errors.general[0]}</AlertDescription></Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t('election.name_label')} *</Label>
              <Input id="name" value={form.name} onChange={set('name')} required />
              <FieldError name="name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('election.description')}</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="election_date">
                {t('election.election_date')} * <span className="text-xs text-muted-foreground">({t('election.gmt6')})</span>
              </Label>
              <Input
                id="election_date"
                type="date"
                value={form.election_date}
                onChange={set('election_date')}
                required
              />
              <FieldError name="election_date" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voting_start_time">{t('election.voting_start')} *</Label>
                <Input
                  id="voting_start_time"
                  type="time"
                  value={form.voting_start_time}
                  onChange={set('voting_start_time')}
                  required
                />
                <FieldError name="voting_start_time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voting_end_time">{t('election.voting_end')} *</Label>
                <Input
                  id="voting_end_time"
                  type="time"
                  value={form.voting_end_time}
                  onChange={set('voting_end_time')}
                  required
                />
                <FieldError name="voting_end_time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('election.candidate_mode_label')}</Label>
              <div className="flex gap-4">
                {[
                  { value: 'selected', label: t('election.candidate_mode_selected') },
                  { value: 'open',     label: t('election.candidate_mode_open') },
                ].map((mode) => (
                  <label key={mode.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="candidate_mode"
                      value={mode.value}
                      checked={form.candidate_mode === mode.value}
                      onChange={set('candidate_mode')}
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.allow_multi_post}
                onChange={set('allow_multi_post')}
                className="rounded"
              />
              {t('election.multi_post_label')}
            </label>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : isEdit ? t('common.save') : t('election.create')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`${basePath}/elections`)}>
              {t('common.cancel')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
