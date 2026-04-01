import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { queryClient } from '@/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const { t }    = useTranslation()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await login(email, password)
      const { user, token } = data.data
      queryClient.clear()
      setAuth(user, token)

      const roles     = user.roles ?? []
      const mgmtRoles = ['org_admin', 'org_user', 'election_admin', 'election_user', 'moderator']
      if (roles.includes('super_admin'))                    navigate('/admin/dashboard', { replace: true })
      else if (roles.some((r) => mgmtRoles.includes(r)))   navigate('/dashboard', { replace: true })
      else                                                  navigate('/voter/dashboard', { replace: true })
    } catch (err) {
      if (err.response?.data?.data?.requires_setup) {
        setError(t('auth.not_activated'))
      } else {
        setError(err.response?.data?.message || t('auth.login_failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('auth.login_title')}</CardTitle>
          <CardDescription>{t('auth.login_desc')}</CardDescription>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  {t('auth.forgot_password')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t('auth.register_org')}{' '}
              <Link to="/register" className="text-primary hover:underline">{t('auth.register_here')}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
