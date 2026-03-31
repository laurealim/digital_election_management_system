import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setupPassword, resetPassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PasswordForm({ type }) {
  const navigate       = useNavigate()
  const { t }          = useTranslation()
  const [params]       = useSearchParams()
  const token          = params.get('token') || ''
  const email          = params.get('email') || ''

  const isSetup = type === 'setup'
  const title   = isSetup ? t('auth.setup_title') : t('auth.reset_title')
  const desc    = isSetup ? t('auth.setup_desc')  : t('auth.reset_desc')

  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError(t('auth.passwords_no_match'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.password_too_short'))
      return
    }

    setLoading(true)

    try {
      const fn = isSetup ? setupPassword : resetPassword
      await fn({ token, email, password, password_confirmation: passwordConfirm })
      navigate('/login', {
        replace: true,
        state: { message: isSetup ? t('auth.account_activated') : t('auth.password_reset_done') },
      })
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        setError(Object.values(errors).flat().join(' '))
      } else {
        setError(err.response?.data?.message || t('common.error_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{t('auth.invalid_token')}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              {t('auth.request_new_link')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.new_password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_min')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">{t('auth.confirm_password')}</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.saving') : isSetup ? t('auth.activate_account') : t('auth.reset_password')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
