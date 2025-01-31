import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/use-translations"

interface SubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('auth.profile.subscription.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('auth.profile.subscription.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            {t('auth.profile.subscription.dialog.benefits.title')}
            <ul className="list-disc list-inside mt-2">
              <li>{t('auth.profile.subscription.dialog.benefits.imageQuota')}</li>
              <li>{t('auth.profile.subscription.dialog.benefits.pdfQuota')}</li>
              <li>{t('auth.profile.subscription.dialog.benefits.speechQuota')}</li>
              <li>{t('auth.profile.subscription.dialog.benefits.videoQuota')}</li>
              <li>{t('auth.profile.subscription.dialog.benefits.priority')}</li>
            </ul>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('auth.profile.subscription.dialog.buttons.cancel')}
            </Button>
            <Button onClick={() => router.push('/pricing')}>
              {t('auth.profile.subscription.dialog.buttons.viewPlans')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 