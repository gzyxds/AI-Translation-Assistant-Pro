"use client"

import { MoonIcon, SunIcon, Languages } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/use-translations"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function Header() {
  const { t, setLanguage } = useI18n()
  const { setTheme } = useTheme()
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      toast.success(t('auth.signOut.success'))
      router.push('/login')
    } catch (error) {
      toast.error(t('auth.signOut.error'))
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/logo.svg"
              alt="AI Translation Assistant"
              width={32}
              height={32}
              className={cn(
                "w-8 h-8",
                "group-hover:scale-110 transition-transform duration-300"
              )}
              priority
            />
            <span 
              suppressHydrationWarning 
              className={cn(
                "font-semibold text-lg hidden sm:inline-block opacity-0 animate-fadeIn",
                "bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary bg-[200%_auto] animate-gradient",
                "group-hover:bg-[100%_auto] transition-[background-position] duration-300"
              )}
            >
              {t('appName')}
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 space-x-12">
          <Link href="/" className="text-base font-medium hover:text-primary transition-colors">
            {t('nav.home')}
          </Link>
          <Link href="/translate" className="text-base font-medium hover:text-primary transition-colors">
            {t('nav.features')}
          </Link>
          <Link href="/pricing" className="text-base font-medium hover:text-primary transition-colors">
            {t('nav.pricing')}
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only" suppressHydrationWarning>{t('switchLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('zh')}>
                <span suppressHydrationWarning>{t('languages.chinese')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                <span suppressHydrationWarning>{t('languages.english')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only" suppressHydrationWarning>{t('toggleTheme')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <span suppressHydrationWarning>{t('theme.light')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <span suppressHydrationWarning>{t('theme.dark')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <span suppressHydrationWarning>{t('theme.system')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session.user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="text-sm font-medium">
                    {session.user.email}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <span suppressHydrationWarning>{t('auth.profileButton')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <span suppressHydrationWarning>{t('auth.signOut.action')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => {
                const returnUrl = window.location.pathname
                router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
              }}>
                <span suppressHydrationWarning>{t('auth.signIn')}</span>
              </Button>
              <Button variant="default" onClick={() => {
                const returnUrl = window.location.pathname
                router.push(`/register?returnUrl=${encodeURIComponent(returnUrl)}`)
              }}>
                <span suppressHydrationWarning>{t('auth.signUp')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}