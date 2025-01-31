import { useState } from 'react'
import { useI18n } from '@/lib/i18n/use-translations'

type UsageType = 'text' | 'image' | 'pdf' | 'speech' | 'video'

interface UseQuotaOptions {
  onError?: (error: string) => void
  onSuccess?: (remaining: number) => void
}

export function useQuota(options: UseQuotaOptions = {}) {
  const [isChecking, setIsChecking] = useState(false)
  const { t } = useI18n()

  const checkAndRecord = async (type: UsageType) => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/user/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ? t(data.error) : t('quota.errors.checkFailed'))
      }

      options.onSuccess?.(data.remaining)
      return true
    } catch (error) {
      const message = error instanceof Error ? 
        (error.message.startsWith('quota.') ? t(error.message) : error.message) : 
        t('quota.errors.checkFailed')
      options.onError?.(message)
      return false
    } finally {
      setIsChecking(false)
    }
  }

  return {
    isChecking,
    checkAndRecord,
  }
} 