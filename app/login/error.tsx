'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/use-translations';

export default function ErrorPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'AccessDenied') {
      toast.error(t('auth.error.accessDenied'));
    } else if (error) {
      toast.error(t('auth.error.default'));
    }
  }, [error, t]);

  return null;
} 