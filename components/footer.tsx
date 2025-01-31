"use client"

import { Github, Twitter, Globe, Chrome, MonitorSmartphone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/use-translations'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useI18n()

  return (
    <footer className="w-full border-t py-4 md:py-6">
      <div className="container px-4 mx-auto flex flex-col items-center gap-3 md:gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-full bg-background shadow-sm">
              <Chrome className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div className="p-1.5 rounded-full bg-background shadow-sm">
              <MonitorSmartphone className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('landing.footer.browsers')}
            </p>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center space-x-1.5 text-primary">
            <Lock className="h-3.5 w-3.5" />
            <p className="text-xs" suppressHydrationWarning>
              {t('landing.footer.privacy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:h-10 md:w-10">
            <a
              href="https://github.com/321208008"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4 md:h-5 md:w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:h-10 md:w-10">
            <a
              href="https://twitter.com/zyailive"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4 md:h-5 md:w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:h-10 md:w-10">
            <a
              href="https://itusi.cn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
            >
              <Globe className="h-4 w-4 md:h-5 md:w-5" />
            </a>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground" suppressHydrationWarning>
          © {currentYear} {t('appName')}. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 