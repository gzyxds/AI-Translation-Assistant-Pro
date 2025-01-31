"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/use-translations"

type Translations = {
  tabs?: Record<string, string>
  buttons?: Record<string, string>
  uploadImage?: string
  uploadAudio?: string
  uploadVideo?: string
  pricing: {
    title: string
    subtitle: string
    tiers: Record<string, any>
    features: Record<string, string>
    faq: Record<string, any>
  }
  auth: Record<string, any>
  error: Record<string, string>
  loading?: string
  [key: string]: any
}

type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  translations: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { setLanguage: setI18nLanguage, language: i18nLanguage, translations: rawTranslations } = useI18n()
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("language") || i18nLanguage
    }
    return i18nLanguage
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLanguageState(i18nLanguage)
    setMounted(true)
  }, [i18nLanguage])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    setI18nLanguage(lang)
    localStorage.setItem("language", lang)
  }

  if (!mounted) {
    return null
  }

  const translations = rawTranslations as Translations

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
} 