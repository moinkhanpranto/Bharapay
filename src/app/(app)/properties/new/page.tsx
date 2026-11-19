import type { Metadata } from 'next'
import { BackLink } from '@/components/layout/back-link'
import { Card, PageHeader } from '@/components/ui/card'
import { requireLandlord } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'
import { PropertyForm } from './property-form'

export const metadata: Metadata = { title: 'Add property' }

export default async function NewPropertyPage() {
  await requireLandlord()
  const t = await getT()
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t.properties.add} back={<BackLink href="/properties" label={t.common.back} />} />
      <Card>
        <PropertyForm />
      </Card>
    </div>
  )
}
