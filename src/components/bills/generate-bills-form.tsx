'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { SubmitButton } from '@/components/ui/submit-button'
import { generateBills } from '@/features/bills/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function GenerateBillsForm({ period, variant = 'primary' }: { period: string; variant?: 'primary' | 'secondary' }) {
  const { t } = useI18n()
  const [state, action] = useActionState(generateBills, initialState)
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="period" value={period} />
      <SubmitButton variant={variant} pendingText={t.common.loading}>
        {t.dashboard.generateBills}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}
