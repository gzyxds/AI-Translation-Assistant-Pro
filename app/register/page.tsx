"use client";

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/use-translations'
import { useSession, signIn } from 'next-auth/react'
import { Github } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const callbackUrl = searchParams.get('returnUrl') || searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (session) {
      router.push(callbackUrl)
    }
  }, [session, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!email || !password || !confirmPassword) {
        throw new Error(t('auth.register.error.required'))
      }

      if (password !== confirmPassword) {
        throw new Error(t('auth.register.error.passwordMismatch'))
      }

      console.log('Attempting to register, callbackUrl:', callbackUrl)

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('auth.register.error.emailExists'))
      }

      toast.success(t('auth.register.success'))
      
      console.log('Registration successful, attempting to sign in')
      
      await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl,
      })

      // 由于设置了 redirect: true，下面的代码不会执行
      console.log('Sign in after registration successful')
    } catch (error: any) {
      console.error('Registration/sign in error:', error)
      toast.error(error.message || t('auth.register.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    try {
      console.log('Attempting GitHub login from register page, callbackUrl:', callbackUrl)
      await signIn('github', { 
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error('GitHub login error:', error)
      toast.error(t('auth.signIn.error'))
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      console.log('Attempting Google login from register page, callbackUrl:', callbackUrl)
      await signIn('google', { 
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error('Google login error:', error)
      toast.error(t('auth.signIn.error'))
    }
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto max-w-[350px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold" suppressHydrationWarning>
            {t('auth.register.title')}
          </h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t('auth.register.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            <Github className="mr-2 h-4 w-4" />
            <span suppressHydrationWarning>{t('auth.register.github')}</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            <span suppressHydrationWarning>{t('auth.register.google')}</span>
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground" suppressHydrationWarning>
              {t('auth.register.or')}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" suppressHydrationWarning>
              {t('auth.register.email')}
            </Label>
            <Input
              id="email"
              placeholder={t('auth.register.emailPlaceholder')}
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" suppressHydrationWarning>
              {t('auth.register.password')}
            </Label>
            <Input
              id="password"
              placeholder={t('auth.register.passwordPlaceholder')}
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" suppressHydrationWarning>
              {t('auth.register.confirmPassword')}
            </Label>
            <Input
              id="confirmPassword"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            <span suppressHydrationWarning>
              {loading ? t('auth.register.loading') : t('auth.register.button')}
            </span>
          </Button>
        </form>
        <div className="text-center text-sm">
          <span suppressHydrationWarning>{t('auth.register.hasAccount')}</span>{' '}
          <Link className="underline" href="/login">
            <span suppressHydrationWarning>{t('auth.signIn')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
} 