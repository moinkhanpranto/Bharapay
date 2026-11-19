'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/client'

/**
 * Share uses the phone's native share sheet (WhatsApp, Messenger, IMO…).
 * The shared link only opens for the landlord or that tenant — RLS protects it.
 */
export function ReceiptActions({ receiptNo }: { receiptNo: string }) {
  const { t } = useI18n()

  async function share() {
    const data = { title: `${t.payments.receipt} ${receiptNo}`, url: window.location.href }
    if (navigator.share) {
      await navigator.share(data).catch(() => {})
    } else {
      await navigator.clipboard.writeText(data.url)
    }
  }

  return (
    <div className="no-print mt-4 grid grid-cols-2 gap-3">
      <Button variant="ghost" onClick={share}>
        {t.payments.share}
      </Button>
      <Button onClick={() => window.print()}>{t.payments.print}</Button>
    </div>
  )
}
