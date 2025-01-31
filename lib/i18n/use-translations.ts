"use client"

import { create } from 'zustand'
import zhTranslations from './locales/zh.json'
import enTranslations from './locales/en.json'

type I18nStore = {
  language: string
  translations: Record<string, any>
  setLanguage: (lang: string) => void
  t: (key: string, params?: Record<string, any>) => string
}

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'zh'
  return localStorage.getItem('language') || 
         (navigator.language.startsWith('zh') ? 'zh' : 'en')
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: getInitialLanguage(),
  translations: getInitialLanguage() === 'zh' ? zhTranslations : enTranslations,
  setLanguage: (lang: string) => {
    const translations = lang === 'zh' ? zhTranslations : enTranslations
    localStorage.setItem('language', lang)
    set({ language: lang, translations })
  },
  t: (key: string, params?: Record<string, any>) => {
    const { translations } = get()
    const keys = key.split('.')
    let value: any = translations
    
    // 遍历键路径获取翻译值
    for (const k of keys) {
      value = value?.[k]
      // 如果在任何层级找不到值，返回键名
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    // 确保返回字符串并替换参数
    if (typeof value === 'string' && params) {
      return value.replace(/\{([^}]+)\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match
      })
    }
    
    return typeof value === 'string' ? value : key
  }
}))