import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPendingOtpEmail } from '@/features/auth/actions'
import { format } from '@/lib/i18n/config'
import { getT } from '@/lib/i18n/server'
import { VerifyForm } from './verify-form'

export const metadata: Metadata = { title: 'Verify' }

export default async function VerifyPage() {
  const [t, maskedEmail] = await Promise.all([getT(), getPendingOtpEmail()])
  if (!maskedEmail) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.checkEmail}</h1>
        <p className="mt-1 text-ink-muted">{format(t.auth.codeSentTo, { email: maskedEmail })}</p>
      </div>
      <VerifyForm />
    </div>
  )
}
