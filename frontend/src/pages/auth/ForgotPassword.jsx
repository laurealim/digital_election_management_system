import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgotPassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPassword() {
  const { t }                     = useTranslation()
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { data } = await forgotPassword(email)
      setMessage(data.message || t('auth.reset_link_sent'))
    } catch (err) {
      setError(err.response?.data?.message || t('common.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">{t('auth.forgot_title')}</CardTitle>
          <CardDescription>{t('auth.forgot_desc')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error   && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !!message}>
              {loading ? t('auth.sending') : t('auth.send_reset')}
            </Button>
            <Link to="/login" className="text-xs text-primary hover:underline">
              {t('auth.back_to_login')}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
